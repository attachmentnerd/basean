#!/bin/bash

# Kajabi Theme Export Script
# This script creates a clean export of your Kajabi theme

# Set the base directory (current directory)
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPORT_DIR="kajabi-theme-export"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ZIP_NAME="kajabi-theme_${TIMESTAMP}.zip"

echo "🚀 Starting Kajabi Theme Export..."
echo "📁 Base directory: $BASE_DIR"

# Remove existing export directory if it exists
if [ -d "$BASE_DIR/$EXPORT_DIR" ]; then
    echo "🧹 Removing existing export directory..."
    rm -rf "$BASE_DIR/$EXPORT_DIR"
fi

# Create fresh export directory
echo "📂 Creating export directory..."
mkdir -p "$BASE_DIR/$EXPORT_DIR"

# Define required directories and files for Kajabi theme
# NOTE: Kajabi does NOT use theme.json or locales directory
THEME_ITEMS=(
    "assets"
    "config"
    "layouts"
    "sections"
    "snippets"
    "templates"
)

# Copy theme files
echo "📋 Copying theme files..."
for item in "${THEME_ITEMS[@]}"; do
    if [ -e "$BASE_DIR/$item" ]; then
        cp -r "$BASE_DIR/$item" "$BASE_DIR/$EXPORT_DIR/"
        echo "  ✓ Copied $item"
    else
        echo "  ⚠️  Warning: $item not found"
    fi
done

# Perform Kajabi-specific fixes
echo ""
echo "🔧 Applying Kajabi compatibility fixes..."

# Fix 1: Replace {% render with {% include in all liquid files
echo "  • Converting render tags to include tags..."
find "$BASE_DIR/$EXPORT_DIR" -name "*.liquid" -type f -exec sed -i '' 's/{% render /{% include /g' {} \;

# Fix 2: Ensure schema uses "elements" not "settings"
echo "  • Updating schema to use 'elements' instead of 'settings'..."
find "$BASE_DIR/$EXPORT_DIR/sections" -name "*.liquid" -type f | while read -r file; do
    # Use awk to fix schema sections
    awk '
    BEGIN { in_schema = 0 }
    /{% schema %}/ { in_schema = 1 }
    /{% endschema %}/ { in_schema = 0 }
    {
        if (in_schema && /^[[:space:]]*"settings"[[:space:]]*:/) {
            gsub(/"settings"[[:space:]]*:/, "\"elements\":")
        }
        print
    }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
done

# Fix 3: Check for required templates
echo "  • Checking required templates..."
REQUIRED_TEMPLATES=(
    "404.liquid"
    "blog.liquid"
    "blog_post.liquid"
    "blog_search.liquid"
    "forgot_password.liquid"
    "forgot_password_edit.liquid"
    "index.liquid"
    "library.liquid"
    "login.liquid"
    "page.liquid"
    "thank_you.liquid"
)

MISSING_TEMPLATES=()
for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ ! -f "$BASE_DIR/$EXPORT_DIR/templates/$template" ]; then
        MISSING_TEMPLATES+=("$template")
    fi
done

if [ ${#MISSING_TEMPLATES[@]} -gt 0 ]; then
    echo "  ⚠️  Warning: Missing required templates:"
    for template in "${MISSING_TEMPLATES[@]}"; do
        echo "    - $template"
    done
fi

# Verify all required directories exist
echo ""
echo "🔍 Verifying theme structure..."
MISSING_ITEMS=()
for item in "${THEME_ITEMS[@]}"; do
    if [ ! -e "$BASE_DIR/$EXPORT_DIR/$item" ]; then
        MISSING_ITEMS+=("$item")
    fi
done

if [ ${#MISSING_ITEMS[@]} -eq 0 ]; then
    echo "✅ All required theme directories present"
else
    echo "❌ Missing required items:"
    for item in "${MISSING_ITEMS[@]}"; do
        echo "  - $item"
    done
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Export cancelled."
        exit 1
    fi
fi

# Create zip file
echo ""
echo "📦 Creating zip file..."
cd "$BASE_DIR"
zip -r "$ZIP_NAME" "$EXPORT_DIR"/*

# Get file size
if [ -f "$ZIP_NAME" ]; then
    FILE_SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    echo ""
    echo "✅ Export complete!"
    echo "📦 Created: $ZIP_NAME ($FILE_SIZE)"
    echo "📍 Location: $BASE_DIR/$ZIP_NAME"
    
    # Option to remove export directory
    echo ""
    read -p "Remove temporary export directory? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        rm -rf "$EXPORT_DIR"
        echo "🧹 Cleaned up temporary files"
    fi
else
    echo "❌ Error: Failed to create zip file"
    exit 1
fi

echo ""
echo "🎉 Theme ready for upload to Kajabi!"
echo ""
echo "📝 Remember:"
echo "  • Kajabi does NOT use theme.json or locales"
echo "  • Use {% include %} instead of {% render %}"
echo "  • Use 'elements' in schemas, not 'settings'"
echo "  • All required templates must be present"