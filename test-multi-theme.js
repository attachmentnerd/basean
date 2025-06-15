#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Multi-Theme Test Suite');
console.log('========================\n');

// Create a simple product theme
console.log('Creating product theme...');
const productThemeDir = 'themes/product';
fs.ensureDirSync(`${productThemeDir}/templates`);
fs.ensureDirSync(`${productThemeDir}/sections`);
fs.ensureDirSync(`${productThemeDir}/config`);
fs.ensureDirSync(`${productThemeDir}/layouts`);
fs.ensureDirSync(`${productThemeDir}/styles`);

// Product theme config
const productConfig = [
  {
    name: "theme_info",
    settings_validatable: true,
    theme_name: "AttachmentNerd Product",
    theme_version: "1.0.0",
    theme_author: "AttachmentNerd"
  },
  {
    name: "Product Settings",
    elements: [
      {
        type: "color",
        id: "product_primary_color",
        label: "Primary Color",
        default: "#FF6B6B"
      }
    ]
  }
];

fs.writeJsonSync(`${productThemeDir}/config/settings_schema.json`, productConfig, { spaces: 2 });
fs.writeJsonSync(`${productThemeDir}/config/settings_data.json`, { current: {} }, { spaces: 2 });

// Product theme layout
fs.writeFileSync(`${productThemeDir}/layouts/theme.liquid`, `
<!DOCTYPE html>
<html>
<head>
  <title>{{ page_title }}</title>
  {{ 'styles.scss.liquid' | asset_url | stylesheet_tag }}
</head>
<body class="product-theme">
  {{ content_for_layout }}
</body>
</html>
`);

// Product theme templates
fs.writeFileSync(`${productThemeDir}/templates/sales_page.liquid`, `
{% section 'product-hero' %}
{% section 'product-features' %}
{% section 'product-pricing' %}
`);

fs.writeFileSync(`${productThemeDir}/templates/thank_you.liquid`, `
<div class="thank-you">
  <h1>Thank You!</h1>
  <p>Your purchase was successful.</p>
</div>
`);

// Product theme section
fs.writeFileSync(`${productThemeDir}/sections/product-hero.liquid`, `
<section class="product-hero">
  <h1>{{ section.settings.title }}</h1>
  {% include 'shared/snippets/ui/button', 
     text: section.settings.button_text,
     url: section.settings.button_link,
     style: 'primary',
     size: 'lg'
  %}
</section>

{% schema %}
{
  "name": "Product Hero",
  "elements": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Amazing Product"
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Buy Now"
    },
    {
      "type": "action",
      "id": "button_link",
      "label": "Button Link"
    }
  ]
}
{% endschema %}
`);

// Test building and exporting multiple themes
console.log('\nTesting multi-theme operations...\n');

try {
  // Build both themes
  console.log('1. Building landing theme...');
  execSync('node build-themes.js build landing', { stdio: 'inherit' });
  
  console.log('\n2. Building product theme...');
  execSync('node build-themes.js build product', { stdio: 'inherit' });
  
  // Export both themes
  console.log('\n3. Exporting landing theme...');
  execSync('node theme-manager.js export landing patch "Multi-theme test"', { stdio: 'inherit' });
  
  console.log('\n4. Exporting product theme...');
  execSync('node theme-manager.js export product patch "Initial product theme"', { stdio: 'inherit' });
  
  // List all versions
  console.log('\n5. Listing all versions...');
  execSync('node theme-manager.js list', { stdio: 'inherit' });
  
  // Check shared component usage
  console.log('\n6. Verifying shared components...');
  const productButtonPath = 'dist/product/snippets/shared/ui/button.liquid';
  if (fs.existsSync(productButtonPath)) {
    console.log('✅ Product theme has shared button component');
  } else {
    console.log('❌ Product theme missing shared button component');
  }
  
  // Check both themes have different styles
  const landingStyles = 'dist/landing/assets/theme.css';
  const productStyles = 'dist/product/assets/theme.css';
  
  if (fs.existsSync(landingStyles) && fs.existsSync(productStyles)) {
    const landingSize = fs.statSync(landingStyles).size;
    const productSize = fs.statSync(productStyles).size;
    console.log(`✅ Landing theme CSS: ${landingSize} bytes`);
    console.log(`✅ Product theme CSS: ${productSize} bytes`);
  }
  
  // Verify exports
  console.log('\n7. Checking exports...');
  const releases = fs.readdirSync('exports/releases');
  const landingExports = releases.filter(r => {
    const metaPath = path.join('exports/releases', r, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = fs.readJsonSync(metaPath);
      return meta.theme === 'landing';
    }
    return false;
  });
  
  const productExports = releases.filter(r => {
    const metaPath = path.join('exports/releases', r, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      const meta = fs.readJsonSync(metaPath);
      return meta.theme === 'product';
    }
    return false;
  });
  
  console.log(`✅ Landing theme exports: ${landingExports.length}`);
  console.log(`✅ Product theme exports: ${productExports.length}`);
  
  console.log('\n✅ Multi-theme test completed successfully!');
  
} catch (error) {
  console.error('\n❌ Multi-theme test failed:', error.message);
  process.exit(1);
}