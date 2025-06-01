#!/bin/bash

# Simple Cornerstone Theme Export
THEME_NAME="Cornerstone-Site"
VERSION="1.0.0"
ZIP_NAME="${THEME_NAME}_${VERSION}.zip"

echo "🚀 Exporting ${THEME_NAME} v${VERSION}..."

# Clean up any previous exports
rm -f *.zip

# Create the zip file
zip -r "$ZIP_NAME" \
  assets \
  config \
  layouts \
  sections \
  snippets \
  templates \
  -x "*.DS_Store" \
  -x "*/.git/*" \
  -x "*/node_modules/*"

echo "✅ Export complete: $ZIP_NAME"
echo "📦 Size: $(du -h "$ZIP_NAME" | cut -f1)"