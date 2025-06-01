#!/bin/bash

# Kajabi Theme Tools - Master Script
# Validates and exports your Kajabi theme

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════╗"
echo "║     Kajabi Theme Tools v1.0       ║"
echo "╚═══════════════════════════════════╝"
echo -e "${NC}"

# Show menu
echo "What would you like to do?"
echo ""
echo "1) Validate theme only"
echo "2) Export theme (with validation)"
echo "3) Export theme (skip validation)"
echo "4) Clean up (remove export files)"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}Running theme validation...${NC}"
        echo ""
        bash "$SCRIPT_DIR/validate-kajabi-theme.sh"
        ;;
    
    2)
        echo ""
        echo -e "${BLUE}Running theme validation...${NC}"
        echo ""
        
        # Run validation
        if bash "$SCRIPT_DIR/validate-kajabi-theme.sh"; then
            echo ""
            echo -e "${GREEN}Validation passed! Proceeding with export...${NC}"
            echo ""
            bash "$SCRIPT_DIR/export-kajabi-theme.sh"
        else
            echo ""
            echo -e "${RED}Validation failed. Fix errors before exporting.${NC}"
            echo ""
            read -p "Export anyway? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                echo ""
                bash "$SCRIPT_DIR/export-kajabi-theme.sh"
            fi
        fi
        ;;
    
    3)
        echo ""
        echo -e "${YELLOW}Skipping validation...${NC}"
        echo ""
        bash "$SCRIPT_DIR/export-kajabi-theme.sh"
        ;;
    
    4)
        echo ""
        echo -e "${BLUE}Cleaning up export files...${NC}"
        
        # Remove export directory
        if [ -d "$SCRIPT_DIR/kajabi-theme-export" ]; then
            rm -rf "$SCRIPT_DIR/kajabi-theme-export"
            echo "✓ Removed export directory"
        fi
        
        # Remove zip files (both old and new naming patterns)
        zip_count=$(ls "$SCRIPT_DIR"/*.zip 2>/dev/null | wc -l)
        if [ "$zip_count" -gt 0 ]; then
            echo ""
            echo "Found $zip_count zip file(s):"
            ls -lh "$SCRIPT_DIR"/*.zip
            echo ""
            read -p "Remove all zip files? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm "$SCRIPT_DIR"/*.zip
                echo "✓ Removed zip files"
            fi
        else
            echo "No zip files found"
        fi
        
        echo ""
        echo -e "${GREEN}Cleanup complete!${NC}"
        ;;
    
    5)
        echo ""
        echo "Goodbye!"
        exit 0
        ;;
    
    *)
        echo ""
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Done! Thank you for using Kajabi Theme Tools.${NC}"