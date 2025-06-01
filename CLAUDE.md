Overview
This guide equips your developer to build, organize, and upload Kajabi themes correctly. Kajabi uses a Shopify-derived Liquid engine with its own objects, filters, and restrictions. Follow these conventions to avoid upload failures and ensure a seamless local-to-Kajabi workflow.

🚀 Quick Checklist (Before You Upload)
Replace all {% render %} with {% include %}

Change every "type": "url" → "type": "action" (in all settings_schema.json and section files)

Change every "type": "richtext" → "type": "rich_text"

Ensure settings_validatable: true is present under theme_info in settings_schema.json

Use "elements" (not "settings") for schema fields; only blocks inside presets use "settings"

Remove any theme.json file and the locales/ directory

Include all 11 required templates (listed below)

No Shopify-specific objects, filters, tags, or directories (collections, cart, order, etc.)

Have config/settings_data.json for default values

Have assets/styles.scss.liquid as the main stylesheet

Use a validation script (e.g., ./validate-kajabi-theme.sh) to verify these rules automatically.

Theme Structure & Required Files
pgsql
Copy
Edit
theme/
├── assets/ # Images, JS, CSS (styles.scss.liquid is mandatory)
├── config/ # settings_schema.json & settings_data.json (+ optional presets)
├── layouts/ # Layout templates (e.g., theme.liquid, minimal.liquid)
├── sections/ # Reusable sections (each with HTML/Liquid + schema)
├── snippets/ # Partial includes (e.g., header.liquid, footer.liquid, kajabi-specific)
└── templates/ # Page templates (must include all listed below)
Required Templates (Site Themes)
bash
Copy
Edit
templates/404.liquid
templates/blog.liquid
templates/blog_post.liquid
templates/blog_search.liquid
templates/forgot_password.liquid
templates/forgot_password_edit.liquid
templates/index.liquid
templates/library.liquid
templates/login.liquid
templates/page.liquid
templates/thank_you.liquid
Note: Landing‐page‐only themes only need templates/index.liquid.

Critical Differences from Shopify
Forbidden Shopify Features
Objects & Filters

No collections, cart.items, checkout, order, variant, line_item

No filters like money_with_currency, payment_type_img_url

Tags

{% render %} → use {% include %}

{% section %} (Shopify) → do not use (Kajabi handles sections differently)

No {% form 'product' %}, {% layout 'theme' %}

Directories/Files

No theme.json or locales/

Do not reference Shopify-specific attributes (block.shopify_attributes, #shopify-section-)

Schema Field Types

"type": "url" → "type": "action"

"type": "richtext" → "type": "rich_text"

Kajabi-Specific Equivalents
Core Objects
liquid
Copy
Edit

<!-- Member / User -->

{% if member %}
Hello, {{ member.first_name }}!
{% endif %}

<!-- Products & Offers -->

{% for product in products %}
{{ product.title }} — {{ product.price | money }}
{% endfor %}
{% for offer in offers %}
{{ offer.name }} — {{ offer.price | money }}
{% endfor %}
URL Routes
liquid
Copy
Edit
{{ routes.root_url }}
{{ routes.products_url }}
{{ routes.account_url }}
{{ routes.account_courses_url }}
{{ routes.community_url }}
{{ routes.account_login_url }}
{{ routes.account_logout_url }}
File Structure Details
bash
Copy
Edit
theme/
├── assets/ # CSS, JS, images (use asset_url filter)
├── config/
│ ├── settings_schema.json # Defines theme settings
│ └── settings_data.json # Default values for settings
├── layouts/ # Layouts (theme.liquid wraps every page)
├── sections/ # Section files (HTML + Liquid + schema JSON)
├── snippets/ # Partial includes (e.g., header, footer, nav)
└── templates/ # Page templates (refer to required list above)
Key: Everything inside templates/ is rendered within theme.liquid (or another active layout).

Liquid Tag & Schema Conventions
Include vs. Render
liquid
Copy
Edit

<!-- ❌ Shopify syntax -->

{% render 'icon', icon: 'heart' %}

<!-- ✅ Kajabi syntax -->

{% include 'icon', icon: 'heart' %}
Sections in Layouts
liquid
Copy
Edit

<!-- To include a section file -->

{% section 'header' %}
Kajabi automatically handles section registration; you don’t use {% render %} for sections.

Schema Structure
Top-level settings_schema.json must start with a theme_info object:

jsonc
Copy
Edit
[
{
"name": "theme_info",
"settings_validatable": true,
"theme_name": "My Theme",
"theme_version": "1.0.0",
"theme_author": "Developer Name",
"theme_documentation_url": "https://docs.example.com",
"theme_support_url": "https://support.example.com"
},
{
"name": "Colors",
"elements": [
{
"type": "color",
"id": "primary_color",
"label": "Primary Color",
"default": "#000000"
}
]
}
]
“elements” array holds input fields. Do not use "settings" at the top level.

Blocks inside sections use "settings" to define their own fields.

Best Practices

1. Theme Settings & CSS Variables
   Expose colors, fonts, and basic layout options via settings_schema.json.

In your CSS (inside assets/styles.scss.liquid), reference theme settings as CSS custom properties:

liquid
Copy
Edit

<style>
  :root {
    --primary-color: {{ settings.primary_color }};
    --font-family: {{ settings.font_family }};
  }
</style>

Keep SCSS modular: store section-specific styles in /styles/sections/\_section_name.scss and import them into styles/theme.scss.

2. Authentication & Member Access
liquid
Copy
Edit
{% if member %}
  <p>Welcome back, {{ member.first_name }}!</p>
  {% if member.has_active_courses %}
    <a href="{{ routes.account_courses_url }}">My Courses</a>
  {% endif %}
{% else %}
  <a href="{{ routes.account_login_url }}">Login</a>
{% endif %}
Use member (not customer) to gate content or links.

Check member.has_community_access for group/forum links.

3. Displaying Courses & Offers
liquid
Copy
Edit
<div class="course-list">
  {% for course in courses %}
    <div class="course-card">
      {% if course.featured_image %}
        <img src="{{ course.featured_image | image_url: '400x225' }}" alt="{{ course.title }}">
      {% endif %}
      <h3>{{ course.title }}</h3>
      <p>{{ course.description | truncate: 150 }}</p>
      {% if course.enrollment_status == 'enrolled' %}
        <p>Progress: {{ course.user_progress }}%</p>
        <a href="{{ course.url }}" class="btn">Continue</a>
      {% else %}
        <p>{{ course.price | money }}</p>
        <a href="{{ course.url }}" class="btn">Learn More</a>
      {% endif %}
    </div>
  {% endfor %}
</div>
Loop through products or offers similarly if you need simplified listings.

4. Forms & Actions
   Use plain HTML forms pointing to Kajabi routes, since {% form %} tags are Shopify-specific:

liquid
Copy
Edit

<form action="{{ routes.account_login_url }}" method="post">
  <input type="email" name="email" required>
  <input type="password" name="password" required>
  <button type="submit">Login</button>
</form>
For newsletter or custom forms, use {{ routes.newsletter_signup_url }}.

5. Pagination
liquid
Copy
Edit
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
Use paginate.collection when listing blog posts or products.

6. Responsive Images
   liquid
   Copy
   Edit
   <img
     src="{{ image | image_url: '800x600' }}"
     srcset="
       {{ image | image_url: '400x300' }} 400w,
       {{ image | image_url: '800x600' }} 800w,
       {{ image | image_url: '1200x900' }} 1200w
     "
     sizes="(max-width: 768px) 100vw, 50vw"
     alt="{{ image.alt }}">
   Leverage Kajabi’s image_url filter to request different sizes.

Sections & Blocks (Development Workflow)
Section Anatomy
File: /sections/section_name.liquid

Contains HTML + Liquid and a JSON schema at the bottom (within a {% schema %} ... {% endschema %} block).

SCSS: /styles/sections/\_section_name.scss

Scoped styles for that section; import it in styles/theme.scss.

Schema (in the same .liquid file):

Use "elements" (not "settings") to define fields.

Groups of fields can be separated by "type": "header" or "type": "divider".

Define "blocks" if the section has repeatable items.

Example: Hero Section
liquid
Copy
Edit

<!-- sections/hero_banner.liquid -->
<div class="hero-banner-section">
  <div class="content">
    <h1>{{ section.settings.title }}</h1>
    {% for block in section.blocks %}
      {% case block.type %}
        {% when 'button' %}
          <a
            href="{{ block.settings.button_link }}"
            class="btn"
            kjb-settings-id="{{ 'button_text' | settings_id: section: section, block: block }}"
          >
            {{ block.settings.button_text }}
          </a>
        {% when 'image' %}
          <img
            src="{{ block.settings.image | image_picker_url: 'placeholder.png' }}"
            alt="Section Image"
          />
      {% endcase %}
    {% endfor %}
  </div>
</div>

{% schema %}
{
"name": "Hero Banner",
"elements": [
{
"type": "text",
"id": "title",
"label": "Heading",
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
"elements": [
{
"type": "text",
"id": "button_text",
"label": "Button Text",
"default": "Click Here"
},
{
"type": "action",
"id": "button_link",
"label": "Button Link"
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
],
"presets": [
{
"name": "Hero Banner",
"category": "Hero",
"settings": {
"title": "Welcome to Our Site",
"text_color": "#FFFFFF"
},
"blocks": [
{
"type": "button",
"settings": {
"button_text": "Get Started"
}
}
]
}
]
}
{% endschema %}
SCSS: /styles/sections/\_hero_banner.scss
scss
Copy
Edit
.hero-banner-section {
position: relative;
padding: 80px 0;
background-image: url({{ section.settings.background_image | image_url: "1200x800" }});
color: {{ section.settings.text_color }};

.content {
max-width: 1200px;
margin: 0 auto;
text-align: center;
}

.btn {
display: inline-block;
margin-top: 20px;
}

@media (max-width: 768px) {
padding: 40px 0;
}
}
Import in styles/theme.scss:

scss
Copy
Edit
@import 'sections/hero_banner';
Common Pitfalls & Troubleshooting
Upload Errors (“Error processing your theme”)

{% render %} instead of {% include %}

"type": "url" instead of "type": "action"

"type": "richtext" instead of "type": "rich_text"

Missing settings_validatable: true under theme_info

Using "settings" instead of "elements" in top-level schemas

Retaining theme.json or locales/ directory

Missing config/settings_data.json or assets/styles.scss.liquid

Leftover Shopify-specific code (collection, cart, order, etc.)

Broken Sections / Includes

Using {% render %} tags or Shopify IDs (real that code snippet → remove)

Incorrect section filenames or incorrect {% section 'filename' %} syntax (filename must match)

Not wrapping template contents in the active layout (e.g., theme.liquid)

Settings Not Saving / Not Showing

Schema uses "settings" instead of "elements" for top-level fields

Missing "presets" for dynamic sections—without a preset, users can’t add that section

Member / Course Access Issues

Using customer instead of member

Checking Shopify-style objects (order, line_item) instead of Kajabi’s member.has_active_courses or member.purchases

Asset Paths / Images

Not stubbing or configuring asset_url in local previews

Forgetting to serve /assets/ in a local server, causing missing images/CSS
