#!/bin/bash
# Builder PostToolUse Hook
#
# During active builder sessions, ingests written/edited files into the
# app's RAG corpus and checks for emoji violations.

STATE_FILE=".claude/builder-session.local.md"
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Read hook input (JSON from stdin)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Read builder session state
STORE_NAME=$(grep '^rag_store:' "$STATE_FILE" | cut -d' ' -f2)
APP_ID=$(grep '^app_id:' "$STATE_FILE" | cut -d' ' -f2)
if [ -z "$STORE_NAME" ]; then
  exit 0
fi

# Only track files within the app being built
if [[ "$FILE_PATH" != *"$APP_ID"* ]]; then
  exit 0
fi

# Check for emoji violations
EMOJI_PATTERN='[\xF0-\xF4][\x80-\xBF][\x80-\xBF][\x80-\xBF]'
if grep -qP "$EMOJI_PATTERN" "$FILE_PATH" 2>/dev/null; then
  echo "WARNING: Emoji detected in $FILE_PATH. Use lucide-react icons instead." >&2
fi

# Ingest to RAG (async, don't block the build)
if [ -n "$STORE_NAME" ] && command -v curl &> /dev/null; then
  curl -s -X POST "http://localhost:3000/api/file-search/stores/${STORE_NAME}/upload" \
    -F "file=@${FILE_PATH}" \
    -F "displayName=$(basename "$FILE_PATH")-$(date +%s)" &
fi

exit 0
