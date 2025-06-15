# Theme Export & Version Management Guide

## Overview

The AttachmentNerd Kajabi theme system now includes comprehensive export and version management tools for managing multiple theme types efficiently.

## Directory Structure

```
.
├── shared/                 # Shared components across all themes
│   ├── styles/            # SCSS variables, mixins, components
│   ├── snippets/          # Reusable Liquid snippets
│   └── scripts/           # Common JavaScript
│
├── themes/                # Theme-specific source files
│   ├── website/          # Full site theme
│   ├── landing/          # Landing page theme
│   ├── product/          # Product/sales theme
│   └── email/            # Email templates
│
├── dist/                  # Built themes (not committed)
│   └── [theme-name]/     # Compiled theme ready for export
│
├── exports/               # Organized exports
│   ├── releases/         # Production releases
│   │   ├── v1.0.1/      # Version-specific folder
│   │   └── latest/      # Symlinks to latest versions
│   ├── dev/             # Development builds
│   └── archive/         # Old versions
│
└── old-exports/          # Legacy exports (to be removed)
```

## Commands

### Building Themes

```bash
# Build specific theme
npm run theme:build landing

# Build all themes
npm run theme:build all
```

### Exporting Themes

```bash
# Export with patch version bump (1.0.0 → 1.0.1)
npm run theme:export landing patch "Fixed button styles"

# Export with minor version bump (1.0.1 → 1.1.0)
npm run theme:export website minor "Added new sections"

# Export with major version bump (1.1.0 → 2.0.0)
npm run theme:export website major "Complete redesign"

# Create development build (no version bump)
npm run theme:dev landing
```

### Managing Versions

```bash
# List all versions
npm run theme:list

# List versions for specific theme
npm run theme:list landing

# Archive old versions (keep last 5)
npm run theme:archive

# Archive old versions (keep last 3)
npm run theme:archive 3

# Clean dev builds older than 7 days
npm run theme:clean

# Clean dev builds older than 3 days
npm run theme:clean 3
```

## Version Management

### Versioning Strategy

We use semantic versioning (MAJOR.MINOR.PATCH):

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, minor style adjustments
- **MINOR** (1.0.1 → 1.1.0): New features, sections, significant improvements
- **MAJOR** (1.1.0 → 2.0.0): Breaking changes, major redesigns

### Version Tracking

- `theme-versions.json`: Tracks current versions for all themes
- `CHANGELOG.md`: Automatically updated with each release
- Each export includes `metadata.json` with:
  - Version number
  - Release date
  - SHA-256 checksum
  - File size
  - Shared components version
  - Release notes

## Export Features

### Production Releases
- Automatic version bumping
- Changelog updates
- Git tagging (if enabled)
- Latest symlinks for easy access
- Metadata and checksums

### Development Builds
- Timestamped versions
- No version bumping
- Automatic cleanup after X days
- Quick testing and sharing

### Archive System
- Keeps configurable number of recent releases
- Moves old versions to archive folder
- Preserves all metadata

## Workflow Examples

### 1. Regular Updates
```bash
# Make changes to landing theme
# ... edit files ...

# Export with patch bump
npm run theme:export landing patch "Updated hero section colors"
```

### 2. Feature Development
```bash
# Create dev builds during development
npm run theme:dev landing

# When ready, create minor release
npm run theme:export landing minor "Added testimonial carousel section"
```

### 3. Major Changes
```bash
# After significant changes
npm run theme:export website major "Migrated to new design system"
```

### 4. Maintenance
```bash
# Weekly cleanup
npm run theme:archive 10  # Keep last 10 releases
npm run theme:clean 7     # Remove dev builds older than 7 days
```

## File Locations

### Latest Releases
- Website: `exports/releases/latest/website/`
- Landing: `exports/releases/latest/landing/`
- Product: `exports/releases/latest/product/`
- Email: `exports/releases/latest/email/`

### Specific Versions
- Format: `exports/releases/v{VERSION}/`
- Example: `exports/releases/v1.0.1/AttachmentNerd-Landing_1.0.1.zip`

### Development Builds
- Format: `exports/dev/v{VERSION}-dev.{TIMESTAMP}/`
- Example: `exports/dev/v1.0.1-dev.1702669030848/`

## Best Practices

1. **Always include meaningful commit messages**
   ```bash
   npm run theme:export landing patch "Fixed mobile navigation overflow issue"
   ```

2. **Use dev builds for testing**
   ```bash
   npm run theme:dev landing
   ```

3. **Regular maintenance**
   - Archive old versions monthly
   - Clean dev builds weekly
   - Review changelog quarterly

4. **Version appropriately**
   - Bug fixes → patch
   - New features → minor
   - Breaking changes → major

5. **Test before releasing**
   - Build and preview locally
   - Run validation script
   - Test in Kajabi staging

## Validation

Before uploading to Kajabi:

```bash
# Validate built theme
./validate-theme-build.sh landing

# Or validate exported theme
cd exports/releases/latest/landing
unzip -q *.zip -d temp
./validate-kajabi-theme.sh temp
rm -rf temp
```

## Troubleshooting

### Build Fails
- Check for SCSS syntax errors
- Ensure all required files exist
- Review console output for specific errors

### Export Fails
- Verify theme name is correct
- Check disk space
- Ensure write permissions

### Version Conflicts
- Check `theme-versions.json`
- Manually update if needed
- Commit changes before exporting

## Git Integration

The system is designed to work with Git:

1. Exports are in `.gitignore`
2. Only source files are committed
3. Version tracking via `theme-versions.json`
4. Changelog updates are committed

## Migration from Old System

1. Move old exports: `mv *.zip old-exports/`
2. Update scripts to use new commands
3. Set initial versions in `theme-versions.json`
4. Start using theme manager for all exports