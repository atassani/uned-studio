#!/usr/bin/env bash
set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO"; exit 1' ERR

# Define paths

#npm run check

# Using production environment variables
npm run build

#rm -rf "$TARGET_BASE/dist/studio"
#mkdir -p "$TARGET_DIR"

#cp -r out/* "$TARGET_DIR"

#(cd "$TARGET_BASE" && scripts/upload-humblyproud.sh)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$SCRIPT_DIR/../out"
aws s3 sync "$OUT_DIR" s3://humblyproud.com/studio --delete --exclude ".DS_Store"