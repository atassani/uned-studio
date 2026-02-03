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

AWS_PAGER=""
export AWS_PAGER
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export SCRIPT_DIR
OUT_DIR="$SCRIPT_DIR/../out"
export OUT_DIR

# Copy contents to S3 bucket
aws s3 sync "$OUT_DIR" s3://humblyproud.com/studio --delete --exclude ".DS_Store"

# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[?@=='humblyproud.com']].Id" \
  --output text --no-cli-pager)
export DISTRIBUTION_ID

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/studio/*"
