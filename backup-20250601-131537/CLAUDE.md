# Kajabi Theme Development Guide

## Overview

This guide provides best practices and examples for developing Kajabi themes using Liquid. Kajabi uses a modified version of Shopify's Liquid templating language, but with significant differences and restrictions.

## 🚀 Quick Checklist - Avoid Upload Errors

Before uploading your theme to Kajabi, ensure:

✅ **All `{% render %}` replaced with `{% include %}`** (Most common error!)  
✅ **All `"type": "url"` replaced with `"type": "action"`** in ALL files (sections AND settings_schema.json)  
✅ **All `"type": "richtext"` replaced with `"type": "rich_text"`**  
✅ **`settings_validatable: true` present in theme_info**  
✅ **Using `"elements"` not `"settings"` in settings_schema.json** (but blocks use "settings" for their values in presets)  
✅ **No `theme.json` file exists**  
✅ **No `locales` directory exists**  
✅ **All 11 required templates present**  
✅ **No Shopify order objects** (use Kajabi purchases instead)  
✅ **Has `config/settings_data.json`** for default values  
✅ **Has `assets/styles.scss.liquid`** as main stylesheet  

Run `./validate-kajabi-theme.sh` to check automatically!

## 🚨 CRITICAL: Kajabi Theme Structure Requirements

### File Structure Differences from Shopify
- ❌ **NO `theme.json` file** - Kajabi doesn't use this
- ❌ **NO `locales` directory** - Kajabi doesn't support translations
- ✅ **Required directories**: `assets`, `config`, `layouts`, `sections`, `snippets`, `templates`
- ✅ **Required files**:
  - `config/settings_schema.json` - Theme settings configuration
  - `config/settings_data.json` - Default values for settings
  - `assets/styles.scss.liquid` - Main stylesheet (imports other CSS)

### Required Templates
Kajabi themes MUST include these templates:
- `404.liquid`
- `blog.liquid`
- `blog_post.liquid`
- `blog_search.liquid`
- `forgot_password.liquid`
- `forgot_password_edit.liquid`
- `index.liquid`
- `library.liquid`
- `login.liquid`
- `page.liquid`
- `thank_you.liquid`

## ⚠️ Critical Differences from Shopify

### ❌ DO NOT USE These Shopify Features

1. **Shopify-specific objects**: `collections`, `cart.items`, `checkout`, `variant`, `line_item`, `order`, `shipping_method`, `discount`
2. **Shopify-specific filters**: `money_with_currency`, `money_without_currency`, `payment_type_img_url`
3. **Shopify-specific tags**: 
   - `{% form 'product' %}`, `{% layout 'theme' %}`
   - `{% render %}` - Use `{% include %}` instead! ⚠️ **CRITICAL**
   - `{% section %}` - Not a valid Kajabi tag, use HTML `<div>` tags
4. **Shopify attributes**: `block.shopify_attributes`, `#shopify-section-`
5. **Metafields and SKU handling**
6. **Shopify checkout or cart functionality**
7. **`theme.json` and `locales` directory**
8. **Schema field types**: 
   - `"type": "url"` - Use `"type": "action"` instead! ⚠️ **CRITICAL**
   - `"type": "richtext"` - Use `"type": "rich_text"` instead!

### ✅ USE These Kajabi Equivalents Instead

#### Objects

```liquid
<!-- Kajabi Member/User object (not 'customer') -->
{% if member %}
  Welcome {{ member.first_name }}!
{% endif %}

<!-- Kajabi Products (Courses/Digital Products) -->
{% for product in products %}
  {{ product.title }}
  {{ product.price | money }}
{% endfor %}

<!-- Kajabi Offers -->
{% for offer in offers %}
  {{ offer.name }}
  {{ offer.price | money }}
{% endfor %}
```

#### Routes

```liquid
<!-- Kajabi URL Routes -->
{{ routes.root_url }}              <!-- Home -->
{{ routes.products_url }}          <!-- All Products -->
{{ routes.account_url }}           <!-- Member Dashboard -->
{{ routes.account_courses_url }}   <!-- Member's Courses -->
{{ routes.community_url }}         <!-- Community -->
{{ routes.account_login_url }}     <!-- Login -->
{{ routes.account_logout_url }}    <!-- Logout -->
```

## File Structure

```
theme/
├── assets/           # CSS, JS, images
├── config/           # settings_schema.json ONLY
├── layouts/          # Layout templates
├── sections/         # Reusable sections
├── snippets/         # Code snippets
│   └── kajabi/      # Kajabi-specific snippets
└── templates/        # Page templates
```

⚠️ **NO `theme.json` or `locales` directory in Kajabi themes!**

### 6. Liquid Tag Differences

```liquid
<!-- ❌ WRONG - Shopify syntax -->
{% render 'icon', icon: 'heart' %}
{% section "hero-section" %}

<!-- ✅ CORRECT - Kajabi syntax -->
{% include 'icon', icon: 'heart' %}
<div class="hero-section">
  <!-- section content -->
</div>

<!-- Including sections in layouts -->
{% section 'header' %}  <!-- This is valid for including section files -->
```

## Best Practices

### 1. Authentication & Member Access

```liquid
<!-- Check if member is logged in -->
{% if member %}
  <div class="member-content">
    Welcome back, {{ member.first_name }}!
  </div>
{% else %}
  <a href="{{ routes.account_login_url }}">Login</a>
{% endif %}

<!-- Check member permissions -->
{% if member.has_active_courses %}
  <a href="{{ routes.account_courses_url }}">My Courses</a>
{% endif %}

{% if member.has_community_access %}
  <a href="{{ routes.community_url }}">Community</a>
{% endif %}
```

### 2. Products & Courses

```liquid
<!-- Display course card -->
<div class="course-card">
  {% if course.featured_image %}
    <img src="{{ course.featured_image | image_url: '400x225' }}" alt="{{ course.title }}">
  {% endif %}

  <h3>{{ course.title }}</h3>
  <p>{{ course.description | truncate: 150 }}</p>

  {% if course.enrollment_status == 'enrolled' %}
    <div class="progress">
      Progress: {{ course.user_progress }}%
    </div>
    <a href="{{ course.url }}" class="btn">Continue Learning</a>
  {% else %}
    <div class="price">{{ course.price | money }}</div>
    <a href="{{ course.url }}" class="btn">Learn More</a>
  {% endif %}
</div>
```

### 3. Theme Settings

```liquid
<!-- Access theme settings -->
{{ settings.primary_color }}
{{ settings.logo | image_url: 'x60' }}
{{ settings.footer_text }}

<!-- Use in CSS variables -->
<style>
  :root {
    --primary-color: {{ settings.primary_color }};
    --secondary-color: {{ settings.secondary_color }};
    --text-color: {{ settings.text_color }};
  }
</style>
```

### 4. Forms

```liquid
<!-- Login form (Kajabi handles the backend) -->
<form action="{{ routes.account_login_url }}" method="post">
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <button type="submit">Login</button>
</form>

<!-- Newsletter signup -->
<form action="{{ routes.newsletter_signup_url }}" method="post">
  <input type="email" name="email" required>
  <button type="submit">Subscribe</button>
</form>
```

### 5. Sections Schema

⚠️ **CRITICAL: Use `"elements"` NOT `"settings"` in schemas!**

```json
{
  "name": "Hero Section",
  "elements": [
    {
      "type": "text",
      "id": "title",
      "label": "Title",
      "default": "Welcome to Our Site"
    },
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#FFFFFF"
    }
  ],
  "blocks": [
    {
      "type": "button",
      "name": "Button",
      "settings": [
        {
          "type": "text",
          "id": "button_text",
          "label": "Button Text"
        },
        {
          "type": "url",
          "id": "button_link",
          "label": "Button Link"
        }
      ]
    }
  ]
}
```

### 6. Responsive Images

```liquid
<!-- Kajabi image handling -->
<img src="{{ image | image_url: '800x600' }}"
     srcset="{{ image | image_url: '400x300' }} 400w,
             {{ image | image_url: '800x600' }} 800w,
             {{ image | image_url: '1200x900' }} 1200w"
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="{{ image.alt }}">
```

### 7. Pagination

```liquid
<!-- Kajabi pagination -->
{% if paginate.pages > 1 %}
  <nav class="pagination">
    {% if paginate.previous %}
      <a href="{{ paginate.previous.url }}">Previous</a>
    {% endif %}

    {% for part in paginate.parts %}
      {% if part.is_link %}
        <a href="{{ part.url }}">{{ part.title }}</a>
      {% else %}
        <span class="current">{{ part.title }}</span>
      {% endif %}
    {% endfor %}

    {% if paginate.next %}
      <a href="{{ paginate.next.url }}">Next</a>
    {% endif %}
  </nav>
{% endif %}
```

## Common Pitfalls to Avoid

1. **Don't use Shopify cart objects** - Kajabi handles cart differently
2. **Don't reference collections** - Use Kajabi's products/offers instead
3. **Don't use Shopify form tags** - Use standard HTML forms with Kajabi endpoints
4. **Don't use shopify_attributes** - Remove these from any copied Shopify code
5. **Don't assume Shopify filters exist** - Test all filters in Kajabi environment

## Kajabi-Specific Features

### Member Navigation

```liquid
{% include 'kajabi/member-nav' %}
```

### Course Progress

```liquid
{% if course.enrollment_status == 'enrolled' %}
  <div class="course-progress">
    <div class="progress-bar" style="width: {{ course.user_progress }}%"></div>
  </div>
  <p>{{ course.lessons_completed }} of {{ course.lessons_count }} lessons completed</p>
{% endif %}
```

### Offers and Pricing

```liquid
{% for offer in product.offers %}
  <div class="offer">
    <h4>{{ offer.name }}</h4>
    <p class="price">{{ offer.price | money }}</p>
    {% if offer.payment_plan %}
      <p>{{ offer.payment_plan_details }}</p>
    {% endif %}
    <a href="{{ offer.checkout_url }}" class="btn">Get Access</a>
  </div>
{% endfor %}
```

## Testing Your Theme

1. **Always test with both logged-in and logged-out states**
2. **Test with members who have different access levels**
3. **Verify all Kajabi-specific functionality works**
4. **Check responsive design on all devices**
5. **Validate theme settings work correctly**

## Settings Schema Requirements

### Theme Info (Required)
The first item in `settings_schema.json` MUST be theme_info:

```json
[
  {
    "name": "theme_info",
    "settings_validatable": true,  // Required!
    "theme_name": "Your Theme Name",
    "theme_version": "1.0.0",
    "theme_author": "Your Name",
    "theme_documentation_url": "https://your-docs.com",
    "theme_support_url": "https://your-support.com"
  },
  {
    "name": "Colors",
    "elements": [  // Use 'elements', NOT 'settings'!
      {
        "type": "color",
        "id": "primary_color",
        "label": "Primary Color"
      }
    ]
  }
]
```

## Resources

- [Kajabi Theme Documentation](https://themes.kajabi.com/liquid/)
- [Kajabi Developer Account](mailto:themes@kajabi.com)
- Kajabi uses Cornerstone CSS Framework (under 400 lines of code)

3. Test all member/authentication flows
4. Validate course and product displays
5. Ensure all forms submit to correct Kajabi endpoints
6. Remove all Shopify-specific code before submission

Remember: Kajabi is a course and membership platform, not an e-commerce platform. Design your theme accordingly!

## Troubleshooting Common Errors

### "Error processing your theme" on Upload
This error is the most common issue when uploading to Kajabi. Here are the main causes:

1. **Using `{% render %}` instead of `{% include %}`** ⚠️ **MOST COMMON**
   - Search all `.liquid` files for `{% render` and replace with `{% include`
   - This is the #1 cause of upload failures

2. **Using `"type": "url"` anywhere** ⚠️ **VERY COMMON**
   - Search ALL files including `settings_schema.json` for `"type": "url"`
   - Replace with `"type": "action"` - Kajabi uses "action" type for all links/buttons
   - Don't forget to check settings_schema.json, not just section files!

3. **Using `"type": "richtext"` instead of `"type": "rich_text"`** ⚠️ **COMMON**
   - Search all files for `"type": "richtext"`
   - Replace with `"type": "rich_text"` (note the underscore)

4. **Missing `settings_validatable: true` in theme_info**
   ```json
   {
     "name": "theme_info",
     "settings_validatable": true,  // Required!
     "theme_name": "Your Theme",
     "theme_version": "1.0.0",  // Required! Auto-incremented by export script
     ...
   }
   ```

5. **Using `"settings"` instead of `"elements"` in schemas**
   - Replace all `"settings": [` with `"elements": [` in settings_schema.json
   - EXCEPTION: In preset blocks, use `"settings": {` for the block values

6. **Using Shopify order objects**
   - Replace `order.`, `orders.`, `recent_orders` with Kajabi purchases
   - Use `member.purchases` instead of `member.recent_orders`

7. **Missing required files**
   - Must have `config/settings_data.json` for default values
   - Must have `assets/styles.scss.liquid` as main stylesheet
   - Must have all 11 required templates

8. **Having forbidden files/directories**
   - Delete `theme.json` if present
   - Delete `locales` directory if present

9. **"Theme must have a version" error** - The export script now auto-increments version

### Theme Not Working Properly After Upload
1. **Sections not showing** - Ensure using `{% section 'name' %}` to include
2. **Settings not saving** - Check schema uses `"elements"` not `"settings"`
3. **Includes failing** - Use `{% include %}` not `{% render %}`
4. **Member not recognized** - Use `member` not `customer` object
5. **Links not working** - Use `"type": "action"` not `"type": "url"`

Documentation

Core Concepts
Settings
Themes include a settings_schema.json file, which is a form that makes it easy for the user to customize the look-and-feel of the theme.

You can use the settings_schema.json file to configure the theme settings that the user has access to using the theme editor.

About settings_schema.json
The settings_schema.json file is located in the config directory of a theme. It controls the organization and content of the menu in the theme editor.

The settings_schema.json file contains the definitions for your theme settings, grouped into sections according to the setting type.

Here's an example of a settings definition for two input settings of type colorin the settings_schema.json file:

Copy
[
{
"name": "Colors",
"settings": [
{
"type": "color",
"id": "color_borders",
"label": "Border colors",
"default": "#e5e5e5"
},
{
"type": "color",
"id": "color_body_text",
"label": "Body text",
"default": "#333333"
}
]
}
]
The settings_schema.json file is validated before being saved to make sure it follows the correct format.

Core Concepts
KJB Settings ID's
To make editing kajabi templates simple for the end user, Kajabi uses kjb-settings-id to create links to a sections setting.

KJB Settings show to the end user in the form of a blue outline when they hover an element that then takes them to that elements settings.

Copy

<div class="hero">
  <div class="container">
    <h1 kjb-settings-id="{{ 'heading' | settings_id: section: section }}">{{ section.settings.heading }}</h1>
  </div>
</div>
KJB tags can be applied to both section settings and block settings

Copy
{{ 'heading' | settings_id: section: section }}
{{ 'image' | settings_id: section: section, block: block }}

Core Concepts
Objects
Inside all Kajabi themes you have access to a number of objects that connect your theme to the data from the Kajabi Admin.

Announcement
Copy
{{ announcement.id }}
{{ announcement.title }}
{{ announcement.body }}
{{ announcement.created_at }}
{{ announcement.updated_at }}
Blog Post
Copy
{{ blog_post.id }}
{{ blog_post.title }}
{{ blog_post.content }}
{{ blog_post.image_url }}
{{ blog_post.created_at }}
{{ blog_post.url}}
{{ blog_post.tags | join: ', ' }}
Category
Copy
{{ category.id }}
{{ category.title }}
{{ category.description }}
{{ category.poster_image_url }}
{{ category.created_at }}
{{ product.updated_at }}
{{ category.subcategories }}
{{ category.product }}
{{ category.children? }}
{{ category.nested? }}
Comment
Copy
{{ comment.id }}
{{ comment.author }}
{{ comment.body }}
Completion
Copy
{{ completion.completed }}
{{ completion.total }}
{{ completion.percent }}
{{ completion.next_post }}
Download
Copy
{{ download.id }}
{{ download.display_name }}
{{ download.url }}
{{ download.extension }}
Form
Copy
{{ form.id }}
{{ form.title }}

<div data-gb-custom-block data-tag="assign"></div>

<div data-gb-custom-block data-tag="form">

<div data-gb-custom-block data-tag="for"></div>

{{ field | form_input: class: "form-group", input_class: "form-control", label: true, placeholder: false }}

</div>
Offer
Copy
{{ offer.id }}
{{ offer.image_url }}
{{ offer.description }}
{{ offer.title }}
{{ offer.thank_you_body }}
Page
Copy
{{ page.id }}
{{ page.title }}
{{ page.content }}
Paginate
Copy
{{ paginate.collection }}
{{ paginate.current_page }}
{{ paginate.current_offset }}
{{ paginate.items }}
{{ paginate.page_size }}
{{ paginate.pages }}
{{ paginate.parts }}
{{ paginate.previous }}
{{ paginate.next }}
Post
Copy
{{ post.id }}
{{ post.title }}
{{ post.url }}
{{ post.poster_image_url }}"
{{ post.body }}
{{ post.product }}
{{ post.category }}
{{ post.comments }}
{{ post.comments_mode_visible? }}
{{ post.comments_mode_hidden? }}
{{ post.comments_mode_locked? }}
Product
Copy
{{ product.id }}
{{ product.title }}
{{ product.url }}
{{ product.description }}
{{ product.thumbnail_url }}
{{ product.created_at }}
{{ product.updated_at }}
{{ product.categories_url }}
{{ product.completion }}
{{ product.categories }}
{{ product.announcements }}
Current Site
Copy
{{ current_site.id }}
{{ current_site.title }}
{{ current_site.url }}
{{ current_site.products }}
{{ current_site.login_url }}
{{ current_site.logout_url }}
{{ current_site.library_url }}
{{ current_site.google_analytics_script }}
Video
Copy
{{ post.video | wistia_video: controls_visible_on_load: false, autoplay: true }}
or

Copy

<div data-gb-custom-block data-tag="assign"></div>

<div data-gb-custom-block data-tag="assign" data-0='video.png' data-1='video.png' data-2='video.png' data-3='video.png' data-4='video.png'></div>

<div data-gb-custom-block data-tag="assign"></div>

<div data-gb-custom-block data-tag="assign"></div>
{{ v | wistia_video: player_color: v-Color, auto_play: v-Auto, still_url: v-Image, playerPreference: "html5" }}

Core Concepts
Page Objects
Kajabi has some special objects that are used to decorate the page and give the browser information about what the page is being used for.

Cannonical url
Copy
rel="canonical" href="{{ canonical_url }}"
Page Image Url
Copy
property="og:image" content="{{ page_image_url }}"
name="twitter:image" content="{{ page_image_url }}"
Page Title
Copy
property="og:title" content="{{ page_title }}"
name="twitter:title" content="{{ page_title }}"

Core Concepts
Elements
The different types of settings elements give you the developer the ability to choose any number of ways to let the end user customize the theme without touching the code.

Action
Displays a dropdown that lets the user choose what action a link takes. Depending on a section it then displays another field for them to direct the action.

Copy
{
"type": "action",
"id": "link_action",
"label": "Link Action",
"default": "http://www.kajabi.com"
}
Assessment
Displays a dropdown of all the assessments in the users account.

Copy
{
"type": "assessment",
"id": "assessment_id",
"label": "Assessment"
}
Checkbox
Displays a checkbox within the Theme Settings, allowing for a Boolean true / false setting.

Copy
{
"type": "checkbox",
"id": "show",
"label": "Show",
"default": "true"
}
Color
Displays a color-picker that returns a hex value.

Copy
{
"type": "color",
"label": "Color",
"id": "color",
"allow_blank": true
}
Date Time
Displays a date_time picker.

Copy
{
"type": "date_time",
"label": "Date & Time",
"id": "date_time"
}
Divider
Does not display an input but instead shows a divider between other settings. Great for breaking settings into sub sections.

Copy
{
"type": "divider"
}
Event
Displays a list of the events in the users account.

Copy
{
"type": "event",
"id": "event_id",
"label": "Select Your Event"
}
Font Select
Displays a custom dropdown with google fonts pre loaded in visually in their respective fonts.

Copy
{
"type": "font_select",
"label": "Font Family",
"id": "font_family",
"default": "Montserrat",
"preset": "google_fonts",
"options": []
}
Form
Displays a list of the forms in the users account.

Copy
{
"type": "form",
"id": "form",
"label": "Form",
"default": "default",
"allow_blank": true
}
Header
Does not display an input instead displays a heading that can be used to label sub sections. The style setting set to subheading can be used to shrink the font size.

Copy
{
"type": "header",
"content": "Your Heading"
}
Image Picker
Displays an option to select a previous image or upload a new image.

Copy
{
"type": "image_picker",
"id": "image",
"label": "Image",
"fit": "max",
"width": 3000,
"height": 3000
}
Link List
Displays a list of the link lists ( navigation menus ) in the users account.

Copy
{
"type": "link_list",
"id": "menu",
"label": "Menu",
"default": "footer"
}
Offer
Displays a list of the offers in the users account.

Copy
{
"type": "offer",
"id": "offer_id",
"label": "Offer"
}
Option
Displays a list of options for a user to select from.

Copy
{
"type": "radio",
"id": "alignment",
"label": "Alignment",
"default": "center",
"options": [
{"value": "left", "label": "Left"},
{"value": "center", "label": "Centered"},
{"value": "right", "label": "Right"}
]
}
Post
Displays a list of the posts in a users account.

Copy
{
"type": "post",
"id": "postr_id",
"label": "Post"
}
Radio
Displays a list of radio buttons for the user to select from.

Copy
{
"type": "radio",
"id": "style",
"label": "Style",
"default": "solid",
"options": [
{ "label": "Solid", "value": "solid" },
{ "label": "Outline", "value": "outline" }
]
}
Rich Text
Displays a full WYSIWYG editor for the user to use to create rich text layouts.

Copy
{
"type": "rich_text",
"label": "Text",
"id": "text"
}
Select
Displays a dropdown select box for the user to choose from.

Copy
{
"type": "select",
"id": "width",
"label": "width",
"default": "col-md-6",
"options": [
{ "value": "col-md-3", "label": "25%" },
{ "value": "col-md-6", "label": "50%" },
{ "value": "col-md-8", "label": "75%" },
{ "value": "col-md-12", "label": "100%" }
]
}
Text
Displays a one line text input for users to put short text strings in.

Copy
{
"type": "text",
"id": "text",
"label": "Text",
"default": "Your Text"
}
Video
Displays a video uploader for users to upload their videos or choose recently uploaded videos.

Copy
{
"type": "video",
"id": "video",
"label": "Video"
}

Core Concepts
Presets
Within the config folder of your theme, you can optionally include preset files, which, when selected, will override specified theme settings.

This is a great way to get more mileage out of one theme by giving the users a few starting points that have unique looks and feels.

preset_color.json
Copy
{
"display_name": "Preset Color",
"overrides":
{
"color_primary": "#444",
"color_light": "#f9f9f9",
"color_dark": "#333",
}
}

Core Concepts
Ownership
Kajabi is built around the concept of products and offers. This can be somewhat confusing but here is a basic description of how this works.

Products do not have a price. A Product is simply the piece of content that the user will consume inside your Kajabi portal. A Product is purchased by being add to an Offer. The Offer can contain as many products as you like and the Offer is what has the price associated with it. With this structure the Kajabi user is able to bundle Products in some really powerful ways.

Since we want to be able to see if someone not only has purchased an Offer, but also if they have access to a Product, we have a liquid filter that does just that.

Products
Copy

<div data-gb-custom-block data-tag="assign" data-0='12' data-1='12' data-2='12' data-3='12' data-4='12' data-5='12' data-6='12' data-7='12' data-8='12' data-9='12' data-10='12' data-11='12' data-12='12' data-13='12' data-14='12' data-15='12' data-16='12' data-17='12' data-18='12' data-19='12' data-20='2'></div>

<div data-gb-custom-block data-tag="if">

<a href="{{ enterprise.url }}">Enterprise</a>

</div>
Offers
Copy

<div data-gb-custom-block data-tag="assign" data-0='12' data-1='12' data-2='12' data-3='12' data-4='12' data-5='12' data-6='12' data-7='12' data-8='12' data-9='12' data-10='12' data-11='12' data-12='12' data-13='12' data-14='12' data-15='12' data-16='12' data-17='12' data-18='12' data-19='2'></div>

<div data-gb-custom-block data-tag="if">

<a href="{{ enterprise.url }}">Enterprise</a>

</div>

Building Blocks
Structure
Kajabi themes have a specific structure that can be utilized when creating or editing themes. Only this specific file structure will be included when a theme is uploaded to the system.

Assets
The assets directory is rendered as the Assets folder in the theme editor. It contains all the assets used in the theme, including images, stylesheets, and javascript files.

Use the asset_url filter to reference a theme asset in your templates.

Config
The config directory is rendered as the Configs folder in the theme editor. It includes a settings_schema.json file and a settings_data.json file. It will also contain any presets that you choose tho load into your theme such as preset_your_preset.json

Layout
The layout directory is rendered as the Layouts folder in the theme editor. It contains theme layout templates, which by default is the theme.liquid file. All Liquid templates inside the templates folder are rendered inside the theme.liquid file.

Sections
The sections directory is rendered as the Sections folder in the theme editor. It contains a theme's sections, which are reusable modules of content that can be customized and or re-ordered by users of the theme.

Snippets
The snippets directory is rendered as the Snippets folder in the theme editor. It contains all the theme's Liquid snippet files, which are bits of code that can be referenced in other templates of a theme.

Use the Liquid include tag to load a snippet into your theme.

Copy

<div data-gb-custom-block data-tag="include" data-0='my-snippet-file'></div>
Templates
The templates directory is rendered as the Templates folder in the theme editor. It contains all other Liquid templates that the theme gives you access to. You can see a detailed list of templates and what properties they give you access to here.

Building Blocks
Layouts
Layout files are very important for your theme because every other template file is rendered inside the active layout.

There is only ever one active layout on your store at any given time. The active layout changes when your online visitors begin authentication process.

theme.liquid
The theme.liquid file is the default active layout when visitors are browsing your online store and/or website. It usually renders the header content, footer content, navigation, and other global variables.

Additional Layouts
Inside the layouts folder you can add as many layouts as you like. These can be used by the templates by placing the following code at the top of the template file.

Copy

<div data-gb-custom-block data-tag="layout" data-0='minimal'></div>

Building Blocks
Sections
Kajabi themes are built around the concept of sections and blocks. These building blocks can be used in various ways to compose any layout.

Sections
Section files are housed in the sections folder of a theme and their name and settings are displayed in the sidebar of the of the Kajabi theme editor.

At its core a section in kajabi is simply HTML and liquid markup along with a settings schema that renders information on the page.

Copy

<div class="hero">
  <div class="container">
    <h1>{{ section.settings.heading }}</h1>
  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
]
}

</div>
Section Schema
The schema of a section is what allows the user to input data into your theme without having to touch the code. A schema is made up of different elements to create extremely customizable pages.

A schema also gives you the ability to let the user add and remove a section from pages such as index.liquid by adding presets.

Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"presets": [
{
"name": "Example Section",
"category": "Content",
"settings": {
}
}
]
}

</div>
Multiple presets can be added to a schema giving you the ability to allow users to add a section to a page with different settings values.

Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"presets": [
{
"name": "Example Section 1",
"category": "Content",
"settings": {
"heading": "I love sections"
}
},
{
"name": "Example Section 2",
"category": "Content",
"settings": {
"heading": "I also love sections!"
}
}
]
}

</div>
Blocks
If you think of a section as a row then its columns are what kajabi calls blocks. Blocks are groupings of settings that can be added and removed from a section by the user. Blocks are added to the schema and looped over inside the section in liquid.

Copy

<div class="hero">
  <div class="container">
    <h1>{{ section.settings.heading }}</h1>

<div data-gb-custom-block data-tag="for">

      <a href="{{ block.settings.link_action }}">
        {{ block.settings.link_text }}
      </a>

</div>

  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"blocks": [
{
"type": "link",
"name": "Link",
"elements": [
{
"type": "text",
"id": "link_text",
"label": "Link Text",
"default": "CALL TO ACTION"
},
{
"type": "action",
"id": "link_action",
"label": "Link Action",
"default": "http://www.kajabi.com"
}
]
}
]
}

</div>
To build even more complex sections, a section can have multiple types of blocks that a user chooses from.

Copy

<div class="hero">
  <div class="container">
    <h1>{{ section.settings.heading }}</h1>

<div data-gb-custom-block data-tag="for">

<div data-gb-custom-block data-tag="case">

<div data-gb-custom-block data-tag="when" data-0='link'></div>

          <a href="{{ block.settings.link_action }}">
            {{ block.settings.link_text }}
          </a>

<div data-gb-custom-block data-tag="when" data-0='image'></div>

          <img src="{{ block.settings.image }}"/>

</div>

</div>

  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"blocks": [
{
"type": "link",
"name": "Link",
"elements": [
{
"type": "text",
"id": "link_text",
"label": "Link Text",
"default": "CALL TO ACTION"
},
{
"type": "action",
"id": "link_action",
"label": "Link Action",
"default": "http://www.kajabi.com"
}
]
},
{
"type": "image",
"name": "Image",
"elements": [
{
"type": "image_picker",
"id": "image",
"label": "Image"
}
]
}
]
}

</div>

Building Blocks
Section Types
In Kajabi there are two types of sections, sections that the user can add to the page and sections that are pre loaded onto the page.

Static Sections
Static sections are generic groupings of settings that you explicitly add to the page in liquid and allow the user to edit the content but not the location of the section.

Copy

<div class="header">
  <div class="container">
    <div class="media align-items-center">
      <div>
        <a href="/">
          <img src="{{ section.settings.logo | image_picker_url: 'logo.png' }}" kjb-settings-id="{{ 'logo' | settings_id: section: section }}"/>
        </a>
      </div>
      <div class="media-body text-right">
        <span kjb-settings-id="{{ 'menu' | settings_id: section: section }}">
          <div data-gb-custom-block data-tag="for">

            <a href="{{ link.url }}">{{ link.name }}</a>

</div>

        </span>
      </div>
    </div>

  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Header",
"elements": [
{
"type": "image_picker",
"id": "logo",
"label": "Logo Image"
},
{
"type": "link_list",
"id": "menu",
"label": "Menu",
"default": "main-menu"
}
]
}

</div>
You will notice that the schema of this section does not have the preset tag. If a section has a preset tag it automatically gets added to the pickable section list. This section can only be used as a static section.

Static sections can be added to the page with the following

Copy

<div data-gb-custom-block data-tag="section" data-0='header'></div>
Dynamic Sections
The only thing you need to do to make a section available for a user to add and reorder on a page is to add a preset to the sections schema. This will give the pickable section a title and a set of settings to start the section off with.

Copy
"presets": [
{
"name": "Section",
"category": "Content",
"blocks": [],
"settings": {
}
}
]

Building Blocks
Blocks
If you think of a section as a row then its columns are what kajabi calls blocks. Blocks are groupings of settings that can be added and removed from a section by the user.

Blocks are added to the schema and looped over inside the section in liquid.

Copy

<div class="hero">
  <div class="container">
    <h1>{{ section.settings.heading }}</h1>
    <div data-gb-custom-block data-tag="for">

      <a href="{{ block.settings.link_action }}">
        {{ block.settings.link_text }}
      </a>

</div>

  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"blocks": [
{
"type": "link",
"name": "Link",
"elements": [
{
"type": "text",
"id": "link_text",
"label": "Link Text",
"default": "CALL TO ACTION"
},
{
"type": "action",
"id": "link_action",
"label": "Link Action",
"default": "http://www.kajabi.com"
}
]
}
]
}

</div>
To build even more complex sections, a section can have multiple types of blocks that a user chooses from.

Copy

<div class="hero">
  <div class="container">
    <h1>{{ section.settings.heading }}</h1>

<div data-gb-custom-block data-tag="for">

<div data-gb-custom-block data-tag="case">

<div data-gb-custom-block data-tag="when" data-0='link'></div>

          <a href="{{ block.settings.link_action }}">
            {{ block.settings.link_text }}
          </a>

<div data-gb-custom-block data-tag="when" data-0='image'></div>

          <img src="{{ block.settings.image }}"/>

</div>

</div>

  </div>
</div>
Copy

<div data-gb-custom-block data-tag="schema">

{
"name": "Example Section",
"elements": [
{
"type": "text",
"id": "heading",
"label": "Heading",
"default": "This is an example heading"
}
],
"blocks": [
{
"type": "link",
"name": "Link",
"elements": [
{
"type": "text",
"id": "link_text",
"label": "Link Text",
"default": "CALL TO ACTION"
},
{
"type": "action",
"id": "link_action",
"label": "Link Action",
"default": "http://www.kajabi.com"
}
]
},
{
"type": "image",
"name": "Image",
"elements": [
{
"type": "image_picker",
"id": "image",
"label": "Image"
}
]
}
]
}

</div>

Theme Requirements
Required Pages
Kajabi has three types of themes: Landing pages, Sites and products. Each theme type has a few required templates to ensure that they tap into all kajabi functionality.

Landing Page
Because landing pages are a single page they only require the one index template.

Copy
/templates/index.liquid
Site
The site themes control everything from login to the customers product library. There are many pages that make up a fully functioning site theme.

Copy
/templates/404.liquid
/templates/blog.liquid
/templates/blog_post.liquid
/templates/blog_search.liquid
/templates/forgot_password.liquid
/templates/forgot_password_edit.liquid
/templates/index.liquid
/templates/library.liquid
/templates/login.liquid
/templates/page.liquid
/templates/thank_you.liquid

Theme Requirements
Theme Info
Inside the Kajabi settings schema we have the option to include theme info. This is info is meant to tell the user what version they are on and who supports the theme when issues come up.

The format is as follows:

Copy
{
"name": "theme_info",
"theme_name": "Cornerstone",
"theme_version": "1.1.1",
"theme_author": "Kajabi",
"theme_documentation_url": "https://developers.mykajabi.com/blog?tag=cornerstone+page",
"theme_support_url": "https://github.com/Kajabi/theme-cornerstone-page/issues"
}
This must come first in the settings schema and must include all of the info above and nothing else. Theme_info is a requirement for all themes as of Jun 4th 2019.

Theme Requirements
Powered By Branding
All Kajabi themes are required to include a powered by branding link that is not accessible to the user in the theme settings.

This link is auto populated with the users referral link so that they get credit for any click thru signups.

Copy

<div data-gb-custom-block data-tag="if">

  <div class="powered-by">
    <div class="container">
      {{ powered_by_link }}
    </div>
  </div>

</div>
The Powered By Link can be turned off by users at specific plan levels via their site settings.
