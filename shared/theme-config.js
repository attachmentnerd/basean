// Shared theme configuration system
const themeConfigs = {
  website: {
    name: 'AttachmentNerd Website',
    type: 'site',
    requiredTemplates: [
      '404', 'blog', 'blog_post', 'blog_search', 
      'forgot_password', 'forgot_password_edit', 
      'index', 'library', 'login', 'page', 'thank_you'
    ],
    sections: ['header', 'footer', 'hero', 'content-blocks', 'blog-listings'],
    features: {
      blog: true,
      memberArea: true,
      courses: true,
      community: true
    }
  },
  landing: {
    name: 'AttachmentNerd Landing',
    type: 'landing',
    requiredTemplates: ['index'],
    sections: ['hero', 'features', 'testimonials', 'cta', 'footer-minimal'],
    features: {
      blog: false,
      memberArea: false,
      courses: false,
      community: false
    }
  },
  product: {
    name: 'AttachmentNerd Product',
    type: 'product',
    requiredTemplates: ['sales_page', 'thank_you'],
    sections: ['sales-hero', 'pricing', 'features', 'testimonials', 'faq', 'guarantee'],
    features: {
      blog: false,
      memberArea: false,
      courses: true,
      community: false
    }
  },
  email: {
    name: 'AttachmentNerd Email',
    type: 'email',
    requiredTemplates: ['email'],
    sections: ['email-header', 'email-content', 'email-footer'],
    features: {
      blog: false,
      memberArea: false,
      courses: false,
      community: false
    }
  }
};

module.exports = themeConfigs;