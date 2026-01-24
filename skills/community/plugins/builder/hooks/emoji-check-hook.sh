#!/bin/bash
# Emoji Enforcement Hook
#
# Checks any written/edited file for emoji characters and warns if found.
# Part of the Builder's design system enforcement (lucide-react icons only).

# Read hook input (JSON from stdin)
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check source files
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.md|*.json)
    ;;
  *)
    exit 0
    ;;
esac

# Skip node_modules and dist
if [[ "$FILE_PATH" == *"node_modules"* ]] || [[ "$FILE_PATH" == *"/dist/"* ]]; then
  exit 0
fi

# Check for emoji characters using perl-compatible regex
# Covers: emoticons, symbols, transport, flags, misc
EMOJI_PATTERN='[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{1F1E0}-\x{1F1FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}\x{FE00}-\x{FE0F}\x{1F900}-\x{1F9FF}\x{1FA00}-\x{1FA6F}\x{1FA70}-\x{1FAFF}]'

if perl -ne "exit 1 if /$EMOJI_PATTERN/" "$FILE_PATH" 2>/dev/null; then
  # No emoji found
  exit 0
else
  # Emoji found - warn but don't block
  BASENAME=$(basename "$FILE_PATH")
  echo "WARNING: Emoji character detected in $BASENAME. Use lucide-react icons instead." >&2
  echo "  File: $FILE_PATH" >&2
  echo "  Fix: Replace emoji with <IconName /> from 'lucide-react'" >&2
  exit 0
fi
