#!/bin/bash

# Kajabi Theme Validation Script
# This script checks for Shopify-specific code that should not be in a Kajabi theme

echo "🔍 Kajabi Theme Validation"
echo "=========================="
echo ""

# Set the base directory
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Function to check for patterns
check_pattern() {
    local pattern=$1
    local description=$2
    local file_pattern=$3
    
    echo "Checking for: $description"
    
    # Use grep to find matches, suppress error output
    matches=$(find "$BASE_DIR" -name "$file_pattern" -type f -path "*/templates/*" -o -path "*/sections/*" -o -path "*/snippets/*" -o -path "*/layouts/*" 2>/dev/null | xargs grep -l "$pattern" 2>/dev/null || true)
    
    if [ -n "$matches" ]; then
        echo -e "${RED}❌ Found $description in:${NC}"
        echo "$matches" | while read -r file; do
            # Show relative path
            relative_path=${file#$BASE_DIR/}
            echo -e "   ${RED}$relative_path${NC}"
            # Show matching lines with context
            grep -n "$pattern" "$file" | head -3 | sed 's/^/     /'
        done
        ((ERRORS++))
        echo ""
    else
        echo -e "${GREEN}✓ No $description found${NC}"
    fi
}

# Check for Shopify-specific liquid objects
echo "1. Checking for Shopify-specific objects..."
echo "-------------------------------------------"
check_pattern "cart\.items\|cart\.total_price\|cart\.item_count" "Shopify cart objects" "*.liquid"
check_pattern "product\.variants\|variant\." "Shopify variant objects" "*.liquid"
check_pattern "\bcollections\.\|collection\." "Shopify collection objects" "*.liquid"
check_pattern "checkout\." "Shopify checkout objects" "*.liquid"
check_pattern "line_item\." "Shopify line item objects" "*.liquid"
check_pattern "\bcustomer\." "Shopify customer objects (should be 'member')" "*.liquid"

echo ""
echo "2. Checking for Shopify-specific attributes..."
echo "----------------------------------------------"
check_pattern "shopify_attributes" "shopify_attributes" "*.liquid"
check_pattern "shopify-section-" "Shopify section IDs" "*.liquid"

echo ""
echo "3. Checking for Shopify-specific filters..."
echo "-------------------------------------------"
check_pattern "money_with_currency\|money_without_currency" "Shopify money filters" "*.liquid"
check_pattern "payment_type_img_url" "Shopify payment filters" "*.liquid"

echo ""
echo "4. Checking for Shopify-specific tags..."
echo "----------------------------------------"
check_pattern "{% form 'product'\|{% form 'customer'" "Shopify form tags" "*.liquid"

echo ""
echo "5. Checking theme structure..."
echo "------------------------------"

# Check for required Kajabi directories
# NOTE: Kajabi does NOT use 'locales' directory or theme.json file
REQUIRED_DIRS=("assets" "config" "layouts" "sections" "snippets" "templates")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$BASE_DIR/$dir" ]; then
        echo -e "${RED}❌ Missing required directory: $dir${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Found directory: $dir${NC}"
    fi
done

# Check that theme.json does NOT exist (Kajabi doesn't use it)
if [ -f "$BASE_DIR/theme.json" ]; then
    echo -e "${RED}❌ Found theme.json file - Kajabi themes should NOT have this file${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No theme.json file (correct for Kajabi)${NC}"
fi

# Check that locales directory does NOT exist (Kajabi doesn't support translations)
if [ -d "$BASE_DIR/locales" ]; then
    echo -e "${RED}❌ Found locales directory - Kajabi themes should NOT have this directory${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No locales directory (correct for Kajabi)${NC}"
fi

echo ""
echo "6. Checking for proper Kajabi objects..."
echo "----------------------------------------"

# Check if using member instead of customer
member_usage=$(find "$BASE_DIR" -name "*.liquid" -type f | xargs grep -l "\bmember\." 2>/dev/null | wc -l)
if [ "$member_usage" -gt 0 ]; then
    echo -e "${GREEN}✓ Using 'member' object correctly${NC}"
else
    echo -e "${YELLOW}⚠ No 'member' object usage found (might be OK if no authentication)${NC}"
    ((WARNINGS++))
fi

echo ""
echo "7. Checking for required templates..."
echo "------------------------------------"

# Check for required Kajabi templates
REQUIRED_TEMPLATES=("404.liquid" "blog.liquid" "blog_post.liquid" "blog_search.liquid" "forgot_password.liquid" "forgot_password_edit.liquid" "index.liquid" "library.liquid" "login.liquid" "page.liquid" "thank_you.liquid")
for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ ! -f "$BASE_DIR/templates/$template" ]; then
        echo -e "${RED}❌ Missing required template: templates/$template${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Found template: $template${NC}"
    fi
done

# Check for optional but common templates
OPTIONAL_TEMPLATES=("account.liquid" "cart.liquid" "post.liquid" "product.liquid" "products.liquid" "search.liquid")
echo ""
echo "Checking optional templates..."
for template in "${OPTIONAL_TEMPLATES[@]}"; do
    if [ -f "$BASE_DIR/templates/$template" ]; then
        echo -e "${GREEN}✓ Found optional template: $template${NC}"
    fi
done

echo ""
echo "8. Checking for {% render %} usage..."
echo "------------------------------------"

# Check for {% render %} tag which should be {% include %}
render_usage=$(find "$BASE_DIR" -name "*.liquid" -type f | xargs grep -l "{% render " 2>/dev/null || true)
if [ -n "$render_usage" ]; then
    echo -e "${RED}❌ Found {% render %} tag - should use {% include %} instead in:${NC}"
    echo "$render_usage" | while read -r file; do
        relative_path=${file#$BASE_DIR/}
        echo -e "   ${RED}$relative_path${NC}"
        grep -n "{% render " "$file" | head -3 | sed 's/^/     /'
    done
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No {% render %} tags found (correctly using {% include %})${NC}"
fi

echo ""
echo "9. Checking settings_schema.json..."
echo "-----------------------------------"

# Check if settings_schema.json exists
if [ -f "$BASE_DIR/config/settings_schema.json" ]; then
    echo -e "${GREEN}✓ Found settings_schema.json${NC}"
    
    # Check for theme_info as first element
    if grep -q '"name"\s*:\s*"theme_info"' "$BASE_DIR/config/settings_schema.json"; then
        echo -e "${GREEN}✓ Found theme_info in settings${NC}"
        
        # Check for settings_validatable
        if grep -q '"settings_validatable"\s*:\s*true' "$BASE_DIR/config/settings_schema.json"; then
            echo -e "${GREEN}✓ Found settings_validatable: true${NC}"
        else
            echo -e "${RED}❌ Missing 'settings_validatable: true' in theme_info${NC}"
            ((ERRORS++))
        fi
    else
        echo -e "${RED}❌ Missing theme_info as first element in settings_schema.json${NC}"
        ((ERRORS++))
    fi
    
    # Check for "elements" instead of "settings"
    if grep -q '"settings"\s*:\s*\[' "$BASE_DIR/config/settings_schema.json"; then
        echo -e "${RED}❌ Found 'settings' array - should use 'elements' instead${NC}"
        grep -n '"settings"' "$BASE_DIR/config/settings_schema.json" | head -3 | sed 's/^/     /'
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ Not using 'settings' array (should use 'elements')${NC}"
    fi
else
    echo -e "${RED}❌ Missing config/settings_schema.json${NC}"
    ((ERRORS++))
fi

echo ""
echo "10. Checking for 'url' type in schemas..."
echo "----------------------------------------"

# Check for "type": "url" in section schemas (should be "action")
url_type_usage=$(find "$BASE_DIR/sections" -name "*.liquid" -type f | xargs grep -l '"type"\s*:\s*"url"' 2>/dev/null || true)
if [ -n "$url_type_usage" ]; then
    echo -e "${RED}❌ Found 'url' type - should use 'action' type for links in:${NC}"
    echo "$url_type_usage" | while read -r file; do
        relative_path=${file#$BASE_DIR/}
        echo -e "   ${RED}$relative_path${NC}"
        grep -n '"type"\s*:\s*"url"' "$file" | head -3 | sed 's/^/     /'
    done
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No 'url' type found in schemas (correctly using 'action' type)${NC}"
fi

echo ""
echo "11. Checking for 'richtext' vs 'rich_text'..."
echo "--------------------------------------------"

# Check for "richtext" type (should be "rich_text")
richtext_usage=$(find "$BASE_DIR" -name "*.liquid" -type f | xargs grep -l '"type"\s*:\s*"richtext"' 2>/dev/null || true)
if [ -n "$richtext_usage" ]; then
    echo -e "${RED}❌ Found 'richtext' type - should use 'rich_text' in:${NC}"
    echo "$richtext_usage" | while read -r file; do
        relative_path=${file#$BASE_DIR/}
        echo -e "   ${RED}$relative_path${NC}"
        grep -n '"type"\s*:\s*"richtext"' "$file" | head -3 | sed 's/^/     /'
    done
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No 'richtext' type found (correctly using 'rich_text')${NC}"
fi

echo ""
echo "12. Checking for required files..."
echo "----------------------------------"

# Check for settings_data.json
if [ -f "$BASE_DIR/config/settings_data.json" ]; then
    echo -e "${GREEN}✓ Found settings_data.json${NC}"
else
    echo -e "${YELLOW}⚠ Missing config/settings_data.json (may be required for default values)${NC}"
    ((WARNINGS++))
fi

# Check for styles.scss.liquid
if [ -f "$BASE_DIR/assets/styles.scss.liquid" ]; then
    echo -e "${GREEN}✓ Found styles.scss.liquid${NC}"
else
    echo -e "${YELLOW}⚠ Missing assets/styles.scss.liquid (main stylesheet may be required)${NC}"
    ((WARNINGS++))
fi

echo ""
echo "13. Checking for Shopify order objects..."
echo "-----------------------------------------"

# Check for order object usage
order_usage=$(find "$BASE_DIR" -name "*.liquid" -type f | xargs grep -l '\border\.\|orders\.\|recent_orders' 2>/dev/null || true)
if [ -n "$order_usage" ]; then
    echo -e "${RED}❌ Found Shopify order objects - should use Kajabi purchases instead in:${NC}"
    echo "$order_usage" | while read -r file; do
        relative_path=${file#$BASE_DIR/}
        echo -e "   ${RED}$relative_path${NC}"
        grep -n '\border\.\|orders\.\|recent_orders' "$file" | head -3 | sed 's/^/     /'
    done
    ((ERRORS++))
else
    echo -e "${GREEN}✓ No Shopify order objects found${NC}"
fi

echo ""
echo "14. Checking for 'url' type in all JSON files..."
echo "------------------------------------------------"

# Check for "url" type in settings_schema.json specifically
if [ -f "$BASE_DIR/config/settings_schema.json" ]; then
    url_in_settings=$(grep -n '"type"\s*:\s*"url"' "$BASE_DIR/config/settings_schema.json" 2>/dev/null || true)
    if [ -n "$url_in_settings" ]; then
        echo -e "${RED}❌ Found 'url' type in settings_schema.json - should use 'action' type:${NC}"
        echo "$url_in_settings" | head -3 | sed 's/^/     /'
        ((ERRORS++))
    else
        echo -e "${GREEN}✓ No 'url' type in settings_schema.json${NC}"
    fi
fi

# Summary
echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Theme passed all validation checks!${NC}"
    echo "Your theme is ready for Kajabi."
    exit 0
elif [ $ERRORS -eq 0 ] && [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ Theme has $WARNINGS warning(s) but no errors.${NC}"
    echo "Review the warnings above, but the theme should work."
    exit 0
else
    echo -e "${RED}❌ Theme has $ERRORS error(s) that need to be fixed.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}   Also has $WARNINGS warning(s).${NC}"
    fi
    echo ""
    echo "Please fix the errors above before uploading to Kajabi."
    exit 1
fi