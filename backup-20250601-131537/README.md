# AttachmentNerd Kajabi Base Theme

A complete, production-ready Kajabi theme designed for parenting brands and educational content creators.

## Theme Structure

```
├── assets/                  # CSS and JavaScript files
│   ├── application.css     # Main stylesheet
│   └── application.js      # Main JavaScript file
│
├── config/                 # Theme configuration
│   └── settings_schema.json # Theme settings definitions
│
├── layouts/                # Theme layouts
│   ├── theme.liquid       # Main layout
│   ├── minimal.liquid     # Minimal layout (checkout, etc.)
│   └── blank.liquid       # Blank layout
│
├── locales/               # Translation files
│   └── en.default.json    # English translations
│
├── sections/              # Dynamic and static sections
│   ├── header.liquid      # Site header
│   ├── footer.liquid      # Site footer
│   ├── hero.liquid        # Hero banner
│   ├── featured-products.liquid
│   ├── testimonials.liquid
│   ├── content-blocks.liquid
│   └── ...
│
├── snippets/              # Reusable code snippets
│   ├── ui/               # UI components
│   │   ├── icon.liquid
│   │   ├── announcement-bar.liquid
│   │   └── payment-icons.liquid
│   ├── content/          # Content components
│   │   ├── product-card.liquid
│   │   ├── post-card.liquid
│   │   └── course-card.liquid
│   ├── navigation/       # Navigation components
│   │   ├── pagination.liquid
│   │   └── mobile-menu.liquid
│   ├── forms/            # Form components
│   │   └── newsletter-form.liquid
│   ├── kajabi/           # Kajabi-specific components
│   │   └── member-nav.liquid
│   └── utils/            # Utility snippets
│       ├── social-share.liquid
│       └── trust-badges.liquid
│
├── templates/            # Page templates
│   ├── index.liquid      # Homepage
│   ├── page.liquid       # Static pages
│   ├── blog.liquid       # Blog listing
│   ├── post.liquid       # Blog post
│   ├── products.liquid   # Products listing
│   ├── product.liquid    # Product detail
│   ├── cart.liquid       # Shopping cart
│   ├── account.liquid    # Member dashboard
│   ├── login.liquid      # Login/Register
│   ├── search.liquid     # Search results
│   └── 404.liquid        # 404 error page
│
└── theme.json            # Theme metadata

```

## Features

### Design System

- CSS custom properties for consistent theming
- Responsive grid system
- Accessible color contrast ratios
- Smooth transitions and animations

### Components

- **Dynamic Sections**: Drag-and-drop homepage builder
- **Product Cards**: Variant support, quick view
- **Blog System**: Categories, comments, related posts
- **Member Dashboard**: Course progress, downloads
- **Mobile-First**: Responsive design with mobile menu
- **Search**: Predictive search with filters
- **Cart**: AJAX cart updates

### Kajabi Integration

- Full Kajabi Liquid support
- Member portal integration
- Course player compatibility
- Community features
- Payment processing
- Email automation triggers

### Performance

- Lazy loading images
- Optimized JavaScript bundles
- CSS optimization
- Minimal HTTP requests

## Customization

### Theme Settings

Access theme settings through the Kajabi admin:

1. Brand → Themes
2. Customize
3. Theme Settings

Available settings:

- Brand colors
- Typography
- Header/Footer options
- Social media links
- Trust badges
- Newsletter configuration

### Adding Sections

Create new sections in the `/sections` directory:

```liquid
<section class="my-section">
  <!-- Section content -->
</section>

{% schema %}
{
  "name": "My Section",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Title"
    }
  ]
}
{% endschema %}
```

### Styling

The theme uses CSS custom properties defined in the main layout:

```css
:root {
  --color-primary: #2563eb;
  --font-sans: "Inter", system-ui, sans-serif;
  --space-md: 1.5rem;
  /* etc. */
}
```

## Development

### JavaScript

Main JavaScript file: `/assets/application.js`

Namespaced under `window.AN`:

- `AN.mobileMenu`
- `AN.searchOverlay`
- `AN.ajaxCart`
- `AN.productSlider`

### Liquid Snippets

Reusable components in `/snippets`:

```liquid
{% render 'product-card', product: product %}
{% render 'icon', icon: 'heart', size: 'medium' %}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

Proprietary - AttachmentNerd

## Support

For theme support, visit: https://support.attachmentnerd.com
