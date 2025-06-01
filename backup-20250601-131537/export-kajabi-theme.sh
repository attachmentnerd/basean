#!/bin/bash

# Kajabi Theme Export Script
# This script creates a clean export of your Kajabi theme

# Set the base directory (current directory)
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPORT_DIR="kajabi-theme-export"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# We'll set the zip name after we increment the version

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

# Fix 1: Update theme version automatically
echo "  • Updating theme version..."
SETTINGS_FILE="$BASE_DIR/$EXPORT_DIR/config/settings_schema.json"
if [ -f "$SETTINGS_FILE" ]; then
    # Get current version
    CURRENT_VERSION=$(grep -o '"theme_version"[[:space:]]*:[[:space:]]*"[^"]*"' "$SETTINGS_FILE" | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "1.0.0")
    
    # Parse version components
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
    
    # Increment patch version
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
    
    # Update version in ORIGINAL source file first
    sed -i '' "s/\"theme_version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"theme_version\": \"$NEW_VERSION\"/" "$BASE_DIR/config/settings_schema.json"
    
    # Update version in export settings file
    sed -i '' "s/\"theme_version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"theme_version\": \"$NEW_VERSION\"/" "$SETTINGS_FILE"
    echo "    ✓ Updated version from $CURRENT_VERSION to $NEW_VERSION"
    
    # Now set the zip name using the incremented version and theme name
    THEME_NAME=$(grep -o '"theme_name"[[:space:]]*:[[:space:]]*"[^"]*"' "$SETTINGS_FILE" | grep -o '"[^"]*"$' | tr -d '"' | sed 's/[^a-zA-Z0-9]/-/g')
    if [ -n "$THEME_NAME" ]; then
        ZIP_NAME="${THEME_NAME}_${NEW_VERSION}.zip"
    else
        ZIP_NAME="kajabi-theme_${NEW_VERSION}.zip"
    fi
else
    echo "    ⚠️ Warning: settings_schema.json not found"
    ZIP_NAME="kajabi-theme_${TIMESTAMP}.zip"
fi

# Fallback if ZIP_NAME wasn't set (no version found)
if [ -z "$ZIP_NAME" ]; then
    ZIP_NAME="kajabi-theme_${TIMESTAMP}.zip"
fi

# Fix 2: Replace {% render with {% include in all liquid files
echo "  • Converting render tags to include tags..."
find "$BASE_DIR/$EXPORT_DIR" -name "*.liquid" -type f -exec sed -i '' 's/{% render /{% include /g' {} \;

# Fix 3: Schema structure is now correct in source files
echo "  • Verifying schema structure..."
# No conversion needed - sections use "elements", blocks use "settings"

# Fix 4: Replace "type": "url" with "type": "action" in schemas
echo "  • Converting url types to action types..."
find "$BASE_DIR/$EXPORT_DIR/sections" -name "*.liquid" -type f -exec sed -i '' 's/"type"[[:space:]]*:[[:space:]]*"url"/"type": "action"/g' {} \;
# Also check settings_schema.json
if [ -f "$BASE_DIR/$EXPORT_DIR/config/settings_schema.json" ]; then
    sed -i '' 's/"type"[[:space:]]*:[[:space:]]*"url"/"type": "action"/g' "$BASE_DIR/$EXPORT_DIR/config/settings_schema.json"
fi

# Fix 5: Replace "type": "richtext" with "type": "rich_text"
echo "  • Converting richtext types to rich_text..."
find "$BASE_DIR/$EXPORT_DIR" -name "*.liquid" -type f -exec sed -i '' 's/"type"[[:space:]]*:[[:space:]]*"richtext"/"type": "rich_text"/g' {} \;

# Fix 6: Check for required templates
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
    if [ -n "$NEW_VERSION" ]; then
        echo "🏷️  Version: $NEW_VERSION"
    fi
    
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