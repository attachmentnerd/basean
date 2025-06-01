# Local Preview Server for Kajabi Theme

This lightweight server allows you to preview your Kajabi Liquid templates locally without uploading to Kajabi.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

Or for production mode without auto-restart:
```bash
npm start
```

## Features

- ✅ Live reload on file changes
- ✅ Liquid template rendering
- ✅ Mock Kajabi objects and data
- ✅ Serves static assets from `/assets`
- ✅ Supports all Kajabi theme structure

## Available Routes

- http://localhost:3000/ - Homepage (index.liquid)
- http://localhost:3000/blog - Blog listing
- http://localhost:3000/products - Product library
- http://localhost:3000/login - Login page
- http://localhost:3000/page/about - Dynamic pages

## Mock Data

The server provides mock Kajabi objects:
- `member` - User data
- `routes` - Kajabi URL routes
- `settings` - Theme settings from settings_data.json
- `products` - Sample products
- `current_site` - Site information

## Development Tips

1. The server automatically reloads when you save `.liquid` files
2. Settings are loaded from `config/settings_data.json`
3. All templates, sections, and snippets are available
4. Use Chrome DevTools to debug Liquid template issues

## Limitations

- Form submissions don't work (use mock data)
- No real authentication
- No database persistence
- Some Kajabi-specific filters may not work

This is purely for visual preview and template development!