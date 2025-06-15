#!/bin/bash

# Validate built theme for Kajabi compatibility
# Usage: ./validate-theme-build.sh [theme-name]

THEME_NAME=${1:-landing}
THEME_DIR="dist/$THEME_NAME"

if [ ! -d "$THEME_DIR" ]; then
    echo "Error: Theme directory $THEME_DIR not found"
    echo "Usage: ./validate-theme-build.sh [theme-name]"
    exit 1
fi

echo "Validating $THEME_NAME theme build..."

# Run the standard Kajabi validation
./validate-kajabi-theme.sh "$THEME_DIR"

# Additional checks for shared system
echo ""
echo "Checking shared component integration..."

# Check if shared snippets are copied
if [ -d "$THEME_DIR/snippets/shared" ]; then
    echo "✓ Shared snippets found"
else
    echo "✗ Shared snippets missing"
fi

# Check if styles.scss.liquid exists
if [ -f "$THEME_DIR/assets/styles.scss.liquid" ]; then
    echo "✓ Main stylesheet found"
else
    echo "✗ Main stylesheet missing"
fi

# Check if theme.css was compiled
if [ -f "$THEME_DIR/assets/theme.css" ]; then
    echo "✓ Compiled CSS found"
else
    echo "✗ Compiled CSS missing"
fi

echo ""
echo "Theme validation complete!"