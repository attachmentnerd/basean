const express = require('express');
const path = require('path');
const { Liquid } = require('liquidjs');
const fs = require('fs').promises;
const livereload = require('livereload');
const connectLivereload = require('connect-livereload');

// Initialize Express
const app = express();
const port = process.env.PORT || 3333;

// Initialize Liquid engine
const liquid = new Liquid({
  root: [
    path.resolve(__dirname, 'snippets'),
    path.resolve(__dirname, 'sections'),
    path.resolve(__dirname, 'layouts'),
    path.resolve(__dirname, 'templates'),
    path.resolve(__dirname)
  ],
  extname: '.liquid',
  cache: false, // Disable caching for development
  globals: {
    theme_settings: {}
  },
  relativeReference: false // Disable relative reference to avoid fs issues
});

// Register Kajabi-specific tags
liquid.registerTag('content_for_index', {
  parse: function(tagToken, remainingTokens) {
    this.str = tagToken.args;
  },
  render: async function(scope, emitter) {
    // This tag is used to render dynamic sections on the index page
    // For now, we'll just render placeholder content
    emitter.write('<!-- Dynamic sections would be rendered here -->');
  }
});

liquid.registerTag('section', {
  parse: function(tagToken, remainingTokens) {
    this.sectionName = tagToken.args.trim().replace(/['"]/g, '');
  },
  render: async function(scope, emitter) {
    try {
      const sectionPath = `sections/${this.sectionName}.liquid`;
      
      // Load section settings from settings_data.json
      const settings = scope.environments.settings || {};
      const sectionSettings = settings.sections?.[this.sectionName] || {};
      
      // Create section object with mock data
      let defaultSettings = {};
      
      // Section-specific default settings
      if (this.sectionName === 'header') {
        defaultSettings = {
          background_color: '#FFFFFF',
          text_color: '#2d3031',
          position: 'static',
          font_size_desktop: '16px',
          font_size_mobile: '14px',
          mobile_header_background_color: '',
          mobile_header_text_color: '',
          hamburger_color: '#2d3031',
          horizontal: 'between'
        };
      } else if (this.sectionName === 'login') {
        defaultSettings = {
          login_text: 'Sign in to your account',
          email: 'Email',
          password: 'Password',
          remember_me: 'Remember Me',
          forgot_password: 'Forgot Password',
          btn_text: 'Sign In',
          button_text: 'Sign In',
          forgot_password_text: 'Forgot your password?',
          signup_text: "Don't have an account?",
          signup_link_text: 'Sign up',
          show_image: false
        };
      }
      
      // Add mock blocks for sections that need them
      let mockBlocks = [];
      if (this.sectionName === 'header') {
        mockBlocks = [
          {
            id: 'logo-block',
            type: 'logo',
            settings: {
              logo: '/assets/logo.png',
              logo_text: 'My Site',
              logo_width: '150px'
            }
          },
          {
            id: 'menu-block', 
            type: 'menu',
            settings: {
              menu_items: [
                { title: 'Home', url: '/' },
                { title: 'About', url: '/about' },
                { title: 'Products', url: '/products' },
                { title: 'Blog', url: '/blog' }
              ]
            }
          },
          {
            id: 'user-block',
            type: 'user',
            settings: {
              show_login: true,
              login_text: 'Login'
            }
          }
        ];
      }
      
      const sectionData = {
        ...scope.environments,
        section: {
          id: this.sectionName,
          settings: {
            ...defaultSettings,
            ...sectionSettings
          },
          blocks: mockBlocks
        },
        // Add mock block for header_block includes
        block: mockBlocks[0] || { id: 'default', type: 'default', settings: {} }
      };
      
      const rendered = await liquid.renderFile(sectionPath, sectionData);
      emitter.write(rendered);
    } catch (error) {
      console.error(`Section error: ${error.message}`);
      emitter.write(`<!-- Section ${this.sectionName} not found or error: ${error.message} -->`);
    }
  }
});

liquid.registerTag('layout', {
  parse: function(tagToken, remainingTokens) {
    this.layoutName = tagToken.args.trim().replace(/['"]/g, '');
  },
  render: async function(scope, emitter) {
    // Layout tags are handled differently in Kajabi
    // This is just a placeholder for the preview server
  }
});

// Register schema tag (used in sections)
liquid.registerTag('schema', {
  parse: function(tagToken, remainingTokens) {
    // Consume all tokens until endschema
    this.tokens = [];
    let token;
    while ((token = remainingTokens.shift())) {
      if (token.getText && token.getText() === 'endschema') break;
      this.tokens.push(token);
    }
  },
  render: async function(scope, emitter) {
    // Schema blocks are not rendered in the output
    // They're only used by the theme editor
  }
});

// Register dynamic_sections_for tag
liquid.registerTag('dynamic_sections_for', {
  parse: function(tagToken, remainingTokens) {
    this.templateName = tagToken.args.trim().replace(/['"]/g, '');
  },
  render: async function(scope, emitter) {
    // This would render dynamic sections for a template
    // For preview, we'll just add a placeholder
    emitter.write(`<!-- Dynamic sections for ${this.templateName} would appear here -->`);
  }
});

// Register element_attributes tag
liquid.registerTag('element_attributes', {
  parse: function(tagToken, remainingTokens) {
    this.args = tagToken.args;
  },
  render: async function(scope, emitter) {
    // This tag adds Kajabi-specific attributes to elements
    // For preview, we'll just output a simple id/class
    emitter.write('class="kajabi-element"');
  }
});

// Register block_attributes tag
liquid.registerTag('block_attributes', {
  parse: function(tagToken, remainingTokens) {
    this.args = tagToken.args;
  },
  render: async function(scope, emitter) {
    // This tag adds Kajabi-specific attributes to blocks
    // For preview, we'll just output a simple id/class
    const blockId = scope.environments.block?.id || 'default';
    emitter.write(`class="kajabi-block" data-block-id="${blockId}"`);
  }
});

// Register element tag
liquid.registerTag('element', {
  parse: function(tagToken, remainingTokens) {
    this.args = tagToken.args;
    this.tokens = [];
    let token;
    let depth = 1;
    while ((token = remainingTokens.shift())) {
      const text = token.getText && token.getText();
      if (text === 'element') depth++;
      if (text === 'endelement') {
        depth--;
        if (depth === 0) break;
      }
      this.tokens.push(token);
    }
  },
  render: async function(scope, emitter) {
    // Render the content between element tags
    const childTemplates = liquid.parser.parseTokens(this.tokens);
    await liquid.renderer.renderTemplates(childTemplates, scope, emitter);
  }
});

// Register endelement tag (for proper parsing)
liquid.registerTag('endelement', {
  parse: function() {},
  render: function() {}
});

// Register paginate tag
liquid.registerTag('paginate', {
  parse: function(tagToken, remainingTokens) {
    this.collection = tagToken.args.trim();
    this.tokens = [];
    let token;
    while ((token = remainingTokens.shift())) {
      if (token.getText && token.getText() === 'endpaginate') break;
      this.tokens.push(token);
    }
  },
  render: async function(scope, emitter) {
    // Add paginate object to scope
    scope.environments.paginate = {
      pages: 5,
      current_page: 1,
      items: 10,
      parts: [
        { is_link: false, title: '1' },
        { is_link: true, title: '2', url: '?page=2' },
        { is_link: true, title: '3', url: '?page=3' },
        { is_link: true, title: '4', url: '?page=4' },
        { is_link: true, title: '5', url: '?page=5' }
      ],
      previous: null,
      next: { url: '?page=2', title: 'Next' }
    };
    
    // Render the content between paginate tags
    const childTemplates = liquid.parser.parseTokens(this.tokens);
    await liquid.renderer.renderTemplates(childTemplates, scope, emitter);
  }
});

// Register endpaginate tag
liquid.registerTag('endpaginate', {
  parse: function() {},
  render: function() {}
});

// Register csrf_meta_tags
liquid.registerTag('csrf_meta_tags', {
  parse: function() {},
  render: async function(scope, emitter) {
    emitter.write('<meta name="csrf-token" content="preview-token">');
  }
});

// Register content_for_header
liquid.registerTag('content_for_header', {
  parse: function() {},
  render: async function(scope, emitter) {
    emitter.write('<!-- Kajabi header content -->');
  }
});

// Register form tag - handle different form types
liquid.registerTag('form', {
  parse: function(tagToken, remainingTokens) {
    this.args = tagToken.args;
    this.tokens = [];
    let token;
    while ((token = remainingTokens.shift())) {
      if (token.getText && token.getText() === 'endform') break;
      this.tokens.push(token);
    }
  },
  render: async function(scope, emitter) {
    try {
      // Parse form type from args
      const args = this.args.trim();
      const argParts = args.split(',').map(a => a.trim());
      let formType = argParts[0].replace(/['"]/g, '');
      
      // Handle different Kajabi form types
      let action = '/form-submit';
      if (formType === 'new_member_session' || formType === 'login') {
        action = '/login';
      }
      
      emitter.write(`<form method="post" action="${action}" class="kajabi-form">`);
      emitter.write(`<input type="hidden" name="authenticity_token" value="preview-token">`);
      
      // Add form object to scope
      scope.environments.form = {
        errors: { messages: {} },
        notice: null,
        email: '' // Add email field for form
      };
      
      // Render the content between form tags
      const childTokens = this.tokens;
      const childTemplates = liquid.parser.parseTokens(childTokens);
      await liquid.renderer.renderTemplates(childTemplates, scope, emitter);
      
      emitter.write('</form>');
    } catch (error) {
      console.error('Form tag error:', error.message);
      emitter.write(`<!-- Form error: ${error.message} -->`);
    }
  }
});

// Register Kajabi-specific filters
liquid.registerFilter('image_url', (v, size) => {
  // Mock implementation for image_url filter
  if (!v) return '/assets/placeholder.png';
  return v;
});

liquid.registerFilter('image_picker_url', (v, fallback) => {
  // Mock implementation for image_picker_url filter
  return v || `/assets/${fallback}`;
});

liquid.registerFilter('money', (v) => {
  // Mock implementation for money filter
  return `$${parseFloat(v || 0).toFixed(2)}`;
});

liquid.registerFilter('settings_id', (id, options = {}) => {
  // Mock implementation for settings_id filter
  if (options.block) {
    return `section-${options.section?.id}-block-${options.block?.id}-${id}`;
  }
  return `section-${options.section?.id}-${id}`;
});

liquid.registerFilter('color_scheme_class', (v) => {
  // Mock implementation for color_scheme_class filter
  return 'light'; // Default to light scheme
});

liquid.registerFilter('default', (v, defaultValue) => {
  // Implementation for default filter
  return v || defaultValue;
});

// Kajabi-specific filters
liquid.registerFilter('settings_google_font_url', (settings) => {
  // Mock implementation - return just the URL, not the full tag
  return 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap';
});

liquid.registerFilter('kajabi_asset_url', (v) => {
  // For local preview, we'll return a data URL that does nothing
  // This prevents broken requests while maintaining the filter chain
  console.log(`Skipping Kajabi core asset: ${v}`);
  return `data:text/javascript;base64,Ly8gS2FqYWJpIGNvcmUgYXNzZXQ6ICR7dn0gc2tpcHBlZCBmb3IgbG9jYWwgcHJldmlldw==`;
});

liquid.registerFilter('async_style_link', (url, options = {}) => {
  // Mock implementation for async style loading
  const crossorigin = options.crossorigin ? `crossorigin="${options.crossorigin}"` : '';
  return `<link rel="stylesheet" href="${url}" ${crossorigin}>`;
});

liquid.registerFilter('asset_url', (v) => {
  // Return local asset URL
  return `/assets/${v}`;
});

liquid.registerFilter('stylesheet_tag', (url) => {
  // Return stylesheet tag only if URL exists
  if (!url || url.trim() === '') {
    return '<!-- Skipped empty stylesheet -->';
  }
  return `<link rel="stylesheet" href="${url}">`;
});

liquid.registerFilter('script_tag', (url) => {
  // Return script tag only if URL exists
  if (!url || url.trim() === '') {
    return '<!-- Skipped empty script -->';
  }
  return `<script src="${url}"></script>`;
});

liquid.registerFilter('escape', (v) => {
  // HTML escape
  return String(v).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
});

liquid.registerFilter('image_tag', (url, options = {}) => {
  // Generate image tag
  const alt = options.alt || '';
  const className = options.class || '';
  return `<img src="${url}" alt="${alt}" class="${className}">`;
});

liquid.registerFilter('remove', (v, str) => {
  // Remove string from value
  return String(v).replace(new RegExp(str, 'g'), '');
});

liquid.registerFilter('append', (v, str) => {
  // Append string to value
  return String(v) + str;
});

// Additional Kajabi filters for showcase
liquid.registerFilter('display_price', (offer) => {
  // Display price for an offer
  if (!offer || !offer.price) return '$0.00';
  return `$${parseFloat(offer.price).toFixed(2)}`;
});

liquid.registerFilter('strip_html', (v) => {
  // Strip HTML tags from content
  if (!v) return '';
  return String(v).replace(/<[^>]*>/g, '');
});

liquid.registerFilter('truncate', (v, length = 50, suffix = '...') => {
  // Truncate text to specified length
  if (!v) return '';
  const str = String(v);
  if (str.length <= length) return str;
  return str.substring(0, length - suffix.length) + suffix;
});

liquid.registerFilter('date', (v, format) => {
  // Basic date formatting
  if (!v) return '';
  const date = new Date(v);
  if (format === 'long') {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString();
});

liquid.registerFilter('form_input', (field, options = {}) => {
  // Generate form input HTML
  const inputClass = options.input_class || 'form-control';
  const placeholder = options.placeholder ? `placeholder="${field.placeholder || field.name}"` : '';
  const label = options.label !== false ? `<label for="${field.name}">${field.name}</label>` : '';
  
  return `<div class="${options.class || 'form-group'}">
    ${label}
    <input type="${field.type || 'text'}" name="${field.name}" class="${inputClass}" ${placeholder}>
  </div>`;
});


// Override renderFile to use preview versions of global includes
const originalRenderFile = liquid.renderFile.bind(liquid);
liquid.renderFile = async function(file, ctx, opts) {
  // Use preview versions of global includes
  if (file === 'global_head' || file === 'snippets/global_head') {
    return originalRenderFile.call(this, 'snippets/global_head_preview', ctx, opts);
  }
  if (file === 'global_scripts' || file === 'snippets/global_scripts') {
    return originalRenderFile.call(this, 'snippets/global_scripts_preview', ctx, opts);
  }
  if (file === 'global_background' || file === 'snippets/global_background') {
    return '<!-- Background styles placeholder -->';
  }
  
  // For all other files, use the original
  return originalRenderFile.call(this, file, ctx, opts);
};

// Register Liquid as view engine
app.engine('liquid', liquid.express());
app.set('views', path.resolve(__dirname));
app.set('view engine', 'liquid');

// Setup livereload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch([
  path.join(__dirname, '**/*.liquid'),
  path.join(__dirname, 'assets/**/*'),
  path.join(__dirname, 'styles/**/*')
]);

// Middleware
app.use(connectLivereload());
app.use('/assets', express.static('assets'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Special handling for styles.scss.liquid
app.get('/assets/styles.scss.liquid', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'assets', 'styles.scss.liquid'));
});

// Load settings data
async function loadSettings() {
  try {
    const settingsData = await fs.readFile('./config/settings_data.json', 'utf8');
    return JSON.parse(settingsData);
  } catch (error) {
    console.warn('Could not load settings_data.json:', error.message);
    return {};
  }
}

// Mock Kajabi objects
function getMockKajabiData() {
  return {
    // Member object
    member: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      has_active_courses: true,
      has_community_access: true
    },
    
    // Routes
    routes: {
      root_url: '/',
      products_url: '/products',
      account_url: '/account',
      account_courses_url: '/account/courses',
      community_url: '/community',
      account_login_url: '/login',
      account_logout_url: '/logout'
    },
    
    // Current site
    current_site: {
      title: 'My Kajabi Site',
      url: 'http://localhost:3000',
      find_offer: {
        1: {
          id: 1,
          title: 'Premium Package',
          description: 'Get access to all courses with this premium package',
          price: 299.00,
          image_url: '/assets/placeholder.png',
          checkout_url: '/checkout/premium'
        }
      }
    },
    
    // Current site user (for forms)
    current_site_user: {},
    
    // Sample products
    products: [
      {
        id: 1,
        title: 'Sample Course',
        description: 'This is a sample course description',
        price: 99.00,
        thumbnail_url: '/assets/placeholder.png',
        url: '/products/sample-course'
      }
    ],
    
    // Page object
    page: {
      title: 'Sample Page',
      content: '<p>This is sample page content.</p>'
    },
    
    // Powered by link
    powered_by_link: '<a href="https://kajabi.com">Powered by Kajabi</a>',
    
    // Newsletter mock data
    newsletter: {
      form: {
        fields: [
          { name: 'email', type: 'email', placeholder: 'Enter your email' }
        ]
      }
    }
  };
}

// Helper function to render template with layout
async function renderWithLayout(templatePath, data) {
  try {
    // Add .liquid extension if not present
    if (!templatePath.endsWith('.liquid')) {
      templatePath += '.liquid';
    }
    
    // Read the template file first to check for layout directive
    const fs = require('fs').promises;
    const templateSource = await fs.readFile(path.join(__dirname, templatePath), 'utf8');
    
    // Check if template specifies a layout
    const layoutMatch = templateSource.match(/^{%\s*layout\s+["']?(\w+)["']?\s*%}/);
    
    if (layoutMatch) {
      const layoutName = layoutMatch[1];
      // Remove the layout tag from template
      const templateWithoutLayout = templateSource.replace(layoutMatch[0], '').trim();
      
      // Parse and render the template content
      const parsedTemplate = liquid.parse(templateWithoutLayout);
      const renderedContent = await liquid.render(parsedTemplate, data);
      
      // Now render the layout with the content
      const layoutData = {
        ...data,
        content_for_layout: renderedContent
      };
      
      return await liquid.renderFile(`layouts/${layoutName}.liquid`, layoutData);
    } else {
      // No layout specified, use default theme layout
      const parsedTemplate = liquid.parse(templateSource);
      const renderedContent = await liquid.render(parsedTemplate, data);
      
      const layoutData = {
        ...data,
        content_for_layout: renderedContent
      };
      
      return await liquid.renderFile('layouts/theme.liquid', layoutData);
    }
  } catch (error) {
    console.error(`Error in renderWithLayout: ${error.message}`);
    // If all else fails, just render the template without layout
    try {
      return await liquid.renderFile(templatePath, data);
    } catch (e) {
      throw error;
    }
  }
}

// Debug route - shows raw HTML
app.get('/debug/:template', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout(`templates/${req.params.template}`, {
      ...mockData,
      settings: settings.current || {},
      template: req.params.template,
      member: req.params.template === 'login' ? null : mockData.member
    });
    
    // Return as plain text to see the raw HTML
    res.type('text/plain');
    res.send(content);
  } catch (error) {
    res.status(500).send(`Debug error: ${error.message}\n${error.stack}`);
  }
});

// Test route
app.get('/test', async (req, res) => {
  try {
    const settings = await loadSettings();
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Kajabi Theme Preview Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          .status { background: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .routes { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          h1 { color: #333; }
          a { color: #1976d2; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .note { background: #fff3e0; padding: 10px; border-radius: 3px; margin-top: 20px; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>🚀 Kajabi Theme Preview Server</h1>
        <div class="status">
          <strong>✅ Server Status:</strong> Running on port ${port}<br>
          <strong>📁 Settings:</strong> ${Object.keys(settings).length} configuration keys loaded<br>
          <strong>🎨 Theme:</strong> ${settings.current?.theme_name || 'Unknown'}
        </div>
        
        <div class="routes">
          <h2>Available Routes:</h2>
          <ul>
            <li><a href="/">Homepage</a></li>
            <li><a href="/login">Login Page</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/products">Products (Library)</a></li>
            <li><a href="/page/about">About Page (dynamic)</a></li>
          </ul>
          
          <h3>Debug Routes:</h3>
          <ul>
            <li><a href="/debug/login">View Login Page Source (Raw HTML)</a></li>
            <li><a href="/debug/index">View Homepage Source (Raw HTML)</a></li>
          </ul>
        </div>
        
        <div class="note">
          <strong>Note:</strong> If pages appear blank, check the browser console for JavaScript errors or view the page source to see if HTML is being generated.
        </div>
      </body>
      </html>
    `;
    res.send(testHtml);
  } catch (error) {
    res.status(500).send(`Test error: ${error.message}`);
  }
});

// Routes
app.get('/', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/index', {
      ...mockData,
      settings: settings.current || {},
      template: 'index'
    });
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

app.get('/blog', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/blog', {
      ...mockData,
      settings: settings.current || {},
      template: 'blog',
      blog_posts: [
        {
          id: 1,
          title: 'Sample Blog Post',
          content: 'This is a sample blog post content.',
          url: '/blog/sample-post',
          created_at: new Date().toISOString()
        }
      ]
    });
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

app.get('/products', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/library', {
      ...mockData,
      settings: settings.current || {},
      template: 'library'
    });
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

app.get('/login', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    console.log('Rendering login page...');
    
    const content = await renderWithLayout('templates/login', {
      ...mockData,
      settings: settings.current || {},
      template: 'login',
      member: null // Not logged in on login page
    });
    
    console.log('Login page rendered, length:', content.length);
    
    if (!content || content.trim() === '') {
      console.error('Warning: Empty content generated for login page');
    }
    
    res.type('text/html');
    res.send(content);
  } catch (error) {
    console.error('Error rendering login:', error);
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

app.get('/test-simple', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/test_simple', {
      ...mockData,
      settings: settings.current || {},
      template: 'test_simple'
    });
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering test: ${error.message}`);
  }
});

app.get('/showcase', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    // Add extra mock data for showcase
    const showcaseData = {
      ...mockData,
      settings: settings.current || {},
      template: 'test_showcase',
      
      // Mock data for various components
      blog_posts: [
        {
          id: 1,
          title: 'First Blog Post',
          excerpt: 'This is the excerpt for the first blog post...',
          content: 'Full content of the first blog post',
          url: '/blog/first-post',
          featured_image: '/assets/placeholder.png',
          author: { name: 'John Doe' },
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Second Blog Post',
          excerpt: 'This is the excerpt for the second blog post...',
          content: 'Full content of the second blog post',
          url: '/blog/second-post',
          featured_image: '/assets/placeholder.png',
          author: { name: 'Jane Smith' },
          created_at: new Date().toISOString()
        }
      ],
      
      announcements: [
        {
          id: 1,
          title: 'Important Announcement',
          content: 'This is an important announcement for all members.',
          created_at: new Date().toISOString()
        }
      ],
      
      offers: [
        {
          id: 1,
          title: 'Premium Package',
          description: 'Get access to all courses with this premium package',
          price: 299.00,
          image_url: '/assets/placeholder.png',
          checkout_url: '/checkout/premium'
        }
      ],
      
      // Pagination mock
      paginate: {
        pages: 5,
        current: 2,
        previous: { url: '/showcase?page=1' },
        next: { url: '/showcase?page=3' },
        parts: [
          { is_link: true, url: '/showcase?page=1', title: '1' },
          { is_link: false, title: '2' },
          { is_link: true, url: '/showcase?page=3', title: '3' },
          { is_link: true, url: '/showcase?page=4', title: '4' },
          { is_link: true, url: '/showcase?page=5', title: '5' }
        ]
      }
    };
    
    const content = await renderWithLayout('templates/test_showcase', showcaseData);
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering showcase: ${error.message}`);
  }
});

app.get('/page/:slug', async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/page', {
      ...mockData,
      settings: settings.current || {},
      template: 'page',
      page: {
        title: req.params.slug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        content: `<p>This is the content for ${req.params.slug}</p>`
      }
    });
    
    res.send(content);
  } catch (error) {
    res.status(500).send(`Error rendering template: ${error.message}`);
  }
});

// 404 handler
app.use(async (req, res) => {
  try {
    const settings = await loadSettings();
    const mockData = getMockKajabiData();
    
    const content = await renderWithLayout('templates/404', {
      ...mockData,
      settings: settings.current || {},
      template: '404'
    });
    
    res.status(404).send(content);
  } catch (error) {
    res.status(404).send('Page not found');
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Kajabi theme preview server running at http://localhost:${port}`);
  console.log('📝 Available routes:');
  console.log('   - http://localhost:' + port + '/ (Homepage)');
  console.log('   - http://localhost:' + port + '/showcase (🎨 Component Showcase)');
  console.log('   - http://localhost:' + port + '/blog');
  console.log('   - http://localhost:' + port + '/products');
  console.log('   - http://localhost:' + port + '/login');
  console.log('   - http://localhost:' + port + '/page/about');
  console.log('\n🔄 Live reload enabled - changes will auto-refresh');
  console.log('⚡ Press Ctrl+C to stop the server');
});