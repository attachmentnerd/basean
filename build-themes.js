const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const fs = require('fs-extra');
const path = require('path');
const themeConfigs = require('./shared/theme-config');

// Build function for a specific theme
async function buildTheme(themeName) {
  const config = themeConfigs[themeName];
  if (!config) {
    console.error(`Theme ${themeName} not found`);
    return;
  }

  console.log(`Building ${config.name}...`);

  const themeDir = `./themes/${themeName}`;
  const outputDir = `./dist/${themeName}`;

  // Ensure directories exist
  await fs.ensureDir(outputDir);
  await fs.ensureDir(`${outputDir}/assets`);
  await fs.ensureDir(`${outputDir}/config`);
  await fs.ensureDir(`${outputDir}/layouts`);
  await fs.ensureDir(`${outputDir}/sections`);
  await fs.ensureDir(`${outputDir}/snippets`);
  await fs.ensureDir(`${outputDir}/templates`);

  // Copy theme-specific files if they exist
  if (await fs.pathExists(themeDir)) {
    await fs.copy(themeDir, outputDir, {
      filter: (src) => !src.includes('node_modules')
    });
  }

  // Copy shared snippets
  await fs.copy('./shared/snippets', `${outputDir}/snippets/shared`);

  // Build SCSS
  await buildStyles(themeName, outputDir);

  // Copy shared scripts
  await fs.copy('./shared/scripts', `${outputDir}/assets`);

  // Generate minimal required templates based on theme type
  await generateRequiredTemplates(themeName, config, outputDir);

  console.log(`✓ ${config.name} built successfully!`);
}

// Build styles for a theme
async function buildStyles(themeName, outputDir) {
  const themeScssPath = `./themes/${themeName}/styles/theme.scss`;
  
  // Create theme-specific SCSS if it doesn't exist
  if (!(await fs.pathExists(themeScssPath))) {
    await fs.ensureDir(`./themes/${themeName}/styles`);
    await fs.writeFile(themeScssPath, `
// ${themeName} Theme Styles
@import '../../../shared/styles/core/shared-variables';
@import '../../../shared/styles/core/helpers';
@import '../../../shared/styles/core/typography';
@import '../../../shared/styles/components/buttons';

// Theme-specific styles
`);
  }

  // First, copy the liquid variables file
  await fs.copy('./shared/styles/liquid-variables.scss.liquid', `${outputDir}/assets/liquid-variables.scss.liquid`);

  // Then build the SCSS
  return new Promise((resolve, reject) => {
    gulp.src(themeScssPath)
      .pipe(sass().on('error', sass.logError))
      .pipe(concat('theme.css'))
      .pipe(gulp.dest(`${outputDir}/assets`))
      .on('end', async () => {
        // Create the final styles.scss.liquid that includes both
        const finalStyles = `
{% comment %} Liquid variables from settings {% endcomment %}
{% include 'liquid-variables.scss.liquid' %}

{% comment %} Compiled theme styles {% endcomment %}
{{ 'theme.css' | asset_url | stylesheet_tag }}
`;
        await fs.writeFile(`${outputDir}/assets/styles.scss.liquid`, finalStyles);
        resolve();
      })
      .on('error', reject);
  });
}

// Generate required templates for theme type
async function generateRequiredTemplates(themeName, config, outputDir) {
  for (const template of config.requiredTemplates) {
    const templatePath = `${outputDir}/templates/${template}.liquid`;
    
    if (!(await fs.pathExists(templatePath))) {
      // Create minimal template
      let content = '';
      
      switch (template) {
        case 'index':
          content = `{% section 'hero' %}
{% section 'features' %}
{% section 'cta' %}`;
          break;
        case 'sales_page':
          content = `{% section 'sales-hero' %}
{% section 'pricing' %}
{% section 'testimonials' %}
{% section 'faq' %}`;
          break;
        case '404':
          content = `<div class="error-page">
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
  <a href="{{ routes.root_url }}" class="btn btn-primary">Go Home</a>
</div>`;
          break;
        default:
          content = `<!-- ${template} template -->
<div class="container">
  <h1>{{ page_title }}</h1>
</div>`;
      }
      
      await fs.writeFile(templatePath, content);
    }
  }
}

// Build all themes
async function buildAll() {
  for (const themeName of Object.keys(themeConfigs)) {
    await buildTheme(themeName);
  }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];
const themeName = args[1];

if (command === 'build') {
  if (themeName && themeConfigs[themeName]) {
    buildTheme(themeName);
  } else if (themeName === 'all') {
    buildAll();
  } else {
    console.log('Usage: node build-themes.js build [theme-name|all]');
    console.log('Available themes:', Object.keys(themeConfigs).join(', '));
  }
} else {
  console.log('Usage: node build-themes.js build [theme-name|all]');
}

module.exports = { buildTheme, buildAll };