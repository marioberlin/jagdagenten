#!/bin/bash
# ============================================================================
# Database Migration Runner
# ============================================================================
# Automatically applies new SQL migrations that haven't been run yet.
# Uses schema_migrations table to track applied migrations.
# 
# Usage: ./run-migrations.sh [options]
#   --dry-run    Show what would be applied without running
#   --force      Re-run a specific migration (use with caution)
# ============================================================================

set -e

# Configuration
DB_CONTAINER="${DB_CONTAINER:-liquidcrypto-postgres}"
DB_USER="${DB_USER:-liquidcrypto}"
DB_NAME="${DB_NAME:-liquidcrypto}"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-/app/liquidcrypto/server/sql}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
DRY_RUN=false
FORCE_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE_VERSION="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

echo "🔄 Database Migration Runner"
echo "============================"
echo "Container: $DB_CONTAINER"
echo "Database:  $DB_NAME"
echo "Directory: $MIGRATIONS_DIR"
echo ""

# Ensure schema_migrations table exists
echo "📋 Ensuring schema_migrations table exists..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" << 'EOF'
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER
);
EOF

# Get list of already applied migrations
APPLIED=$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" -tAc \
    "SELECT version FROM schema_migrations ORDER BY version")

# Count migrations to apply
APPLIED_COUNT=0
PENDING_COUNT=0
FAILED_COUNT=0

# Process each migration file (sorted alphabetically)
for file in "$MIGRATIONS_DIR"/*.sql; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    version=$(basename "$file")
    
    # Skip the schema_migrations table itself
    if [[ "$version" == "000_schema_migrations.sql" ]]; then
        continue
    fi
    
    # Check if already applied
    if echo "$APPLIED" | grep -q "^${version}$"; then
        if [[ "$FORCE_VERSION" != "$version" ]]; then
            echo -e "${GREEN}✓${NC} $version (already applied)"
            ((APPLIED_COUNT++))
            continue
        else
            echo -e "${YELLOW}⚠${NC} Force re-running: $version"
        fi
    fi
    
    ((PENDING_COUNT++))
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}○${NC} $version (would apply)"
        continue
    fi
    
    # Apply migration
    echo -e "${YELLOW}→${NC} Applying: $version"
    START_TIME=$(date +%s%3N)
    
    if docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" < "$file" 2>&1; then
        END_TIME=$(date +%s%3N)
        DURATION=$((END_TIME - START_TIME))
        
        # Calculate checksum
        CHECKSUM=$(md5sum "$file" | cut -d' ' -f1)
        
        # Record in schema_migrations
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" "$DB_NAME" -c \
            "INSERT INTO schema_migrations (version, checksum, execution_time_ms) 
             VALUES ('$version', '$CHECKSUM', $DURATION)
             ON CONFLICT (version) DO UPDATE SET 
                applied_at = NOW(), 
                checksum = '$CHECKSUM',
                execution_time_ms = $DURATION"
        
        echo -e "${GREEN}✓${NC} $version applied (${DURATION}ms)"
    else
        echo -e "${RED}✗${NC} $version FAILED"
        ((FAILED_COUNT++))
        exit 1
    fi
done

echo ""
echo "============================"
if [ "$DRY_RUN" = true ]; then
    echo "Dry run complete. $PENDING_COUNT migration(s) would be applied."
else
    echo -e "${GREEN}✓${NC} Migration complete"
    echo "  Already applied: $APPLIED_COUNT"
    echo "  Newly applied:   $PENDING_COUNT"
    if [ $FAILED_COUNT -gt 0 ]; then
        echo -e "  ${RED}Failed: $FAILED_COUNT${NC}"
    fi
fi
