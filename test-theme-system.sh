#!/bin/bash

# Test script for Kajabi theme system
set -e

echo "🧪 Kajabi Theme System Test Suite"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "Testing: $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC}"
        ((TESTS_FAILED++))
        echo "  Command: $test_command"
    fi
}

# 1. Test shared component structure
echo "1. Testing Shared Component Structure"
echo "------------------------------------"
run_test "Shared styles directory exists" "[ -d 'shared/styles' ]"
run_test "Shared snippets directory exists" "[ -d 'shared/snippets' ]"
run_test "Shared scripts directory exists" "[ -d 'shared/scripts' ]"
run_test "Shared variables file exists" "[ -f 'shared/styles/core/_shared-variables.scss' ]"
run_test "Shared button component exists" "[ -f 'shared/snippets/ui/button.liquid' ]"
echo ""

# 2. Test theme structure
echo "2. Testing Theme Structure"
echo "-------------------------"
run_test "Landing theme directory exists" "[ -d 'themes/landing' ]"
run_test "Landing theme has templates" "[ -f 'themes/landing/templates/index.liquid' ]"
run_test "Landing theme has config" "[ -f 'themes/landing/config/settings_schema.json' ]"
echo ""

# 3. Test build system
echo "3. Testing Build System"
echo "----------------------"
run_test "Build landing theme" "node build-themes.js build landing"
run_test "Built theme exists in dist" "[ -d 'dist/landing' ]"
run_test "Built theme has assets" "[ -d 'dist/landing/assets' ]"
run_test "Built theme has shared snippets" "[ -d 'dist/landing/snippets/shared' ]"
run_test "Built theme has styles.scss.liquid" "[ -f 'dist/landing/assets/styles.scss.liquid' ]"
echo ""

# 4. Test export system
echo "4. Testing Export System"
echo "-----------------------"
run_test "Create development build" "node theme-manager.js dev landing"
run_test "Dev build created" "ls exports/dev/v*-dev.* > /dev/null 2>&1"
run_test "Export with patch version" "node theme-manager.js export landing patch 'Test export'"
run_test "Release created" "[ -d 'exports/releases' ]"
run_test "Metadata file created" "ls exports/releases/v*/metadata.json > /dev/null 2>&1"
run_test "Changelog updated" "[ -f 'CHANGELOG.md' ]"
echo ""

# 5. Test validation
echo "5. Testing Theme Validation"
echo "--------------------------"
run_test "Validate built theme" "./validate-theme-build.sh landing"
echo ""

# 6. Test version management
echo "6. Testing Version Management"
echo "----------------------------"
run_test "Version config exists" "[ -f 'theme-versions.json' ]"
run_test "List versions command" "node theme-manager.js list"
echo ""

# 7. Test cleanup functions
echo "7. Testing Cleanup Functions"
echo "---------------------------"
run_test "Archive old versions" "node theme-manager.js archive 10"
run_test "Clean dev builds" "node theme-manager.js clean 0"
echo ""

# 8. Test multiple theme creation
echo "8. Testing Multiple Theme Support"
echo "--------------------------------"
# Create a minimal website theme for testing
mkdir -p themes/website/{templates,config,layouts}
cat > themes/website/config/settings_schema.json << 'EOF'
[
  {
    "name": "theme_info",
    "settings_validatable": true,
    "theme_name": "AttachmentNerd Website",
    "theme_version": "1.0.0",
    "theme_author": "AttachmentNerd"
  }
]
EOF
echo '{{ content_for_layout }}' > themes/website/layouts/theme.liquid
echo '<h1>Test</h1>' > themes/website/templates/index.liquid

run_test "Build website theme" "node build-themes.js build website"
run_test "Export website theme" "node theme-manager.js export website patch 'Initial website theme'"
echo ""

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi