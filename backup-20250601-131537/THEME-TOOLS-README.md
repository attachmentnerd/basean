# Kajabi Theme Tools

This directory contains scripts to validate and export your Kajabi theme.

## 🚀 Quick Start

Use the master script for all operations:

```bash
./kajabi-theme-tools.sh
```

This will show you a menu with options to:
1. Validate your theme
2. Export with validation
3. Export without validation
4. Clean up files

## 📁 Scripts Included

### `kajabi-theme-tools.sh`
The main script that provides a menu-driven interface to all tools.

### `validate-kajabi-theme.sh`
Checks your theme for:
- Shopify-specific objects (cart, variants, collections, etc.)
- Shopify attributes and IDs
- Incorrect object usage (customer vs member)
- Required Kajabi theme structure

### `export-kajabi-theme.sh`
Creates a clean export of your theme:
- Copies only required theme directories
- Creates timestamped zip files
- Verifies theme structure
- Cleans up temporary files

## 📋 What Gets Exported

The following directories and files are included in exports:
- `assets/` - CSS, JS, and images
- `config/` - Theme settings schema
- `layouts/` - Layout templates
- `locales/` - Translation files
- `sections/` - Reusable sections
- `snippets/` - Code snippets
- `templates/` - Page templates
- `theme.json` - Theme metadata

## ✅ Validation Checks

The validator checks for:
1. **Shopify Cart Objects**: `cart.items`, `cart.total_price`, etc.
2. **Product Variants**: `product.variants`, `variant.*`
3. **Collections**: Should use Kajabi categories instead
4. **Customer vs Member**: Should use `member` not `customer`
5. **Shopify Attributes**: `shopify_attributes`, `shopify-section-`
6. **Required Structure**: All Kajabi directories present

## 🎯 Usage Examples

### Validate Only
```bash
./validate-kajabi-theme.sh
```

### Export with Automatic Validation
```bash
./export-kajabi-theme.sh
```

### Clean Export Every Time
The export script:
1. Removes any existing export directory
2. Creates a fresh copy of theme files
3. Generates a timestamped zip file
4. Optionally cleans up temporary files

## 📝 Notes

- Zip files are timestamped: `kajabi-theme_YYYYMMDD_HHMMSS.zip`
- Validation errors will prevent export (unless you override)
- The scripts work from the current directory
- All paths are relative to script location

## 🔧 Troubleshooting

If scripts won't run:
```bash
chmod +x *.sh
```

If validation fails:
1. Check the specific files listed
2. Fix Shopify-specific code
3. Ensure using Kajabi objects correctly
4. Run validation again

## 🚫 Common Issues to Fix

1. **Cart References**: Replace with Kajabi checkout flow
2. **Variants**: Remove variant selectors
3. **Customer Object**: Change to `member`
4. **Collections**: Use categories instead
5. **Shopify Tags**: Remove Shopify-specific liquid tags