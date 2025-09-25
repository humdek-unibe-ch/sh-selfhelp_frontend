# AI Generation Prompt for SH-SelfHelp CMS Sections

## Overview
This document provides comprehensive instructions for AI models to generate **complete JSON array structures** that can be directly imported into the SH-SelfHelp CMS system. The system uses a hierarchical section-based architecture where each section has a specific style type and configurable fields.

**CRITICAL**: Your final output must be valid JSON in array format `[]` containing all sections.

## System Architecture

### Complete Page Structure
The entire page content must be wrapped in an array `[]` containing all sections:

```json
[
  {
    "name": "section-name",
    "style_name": "style_type",
    "children": [],
    "fields": {
      "field_name": {
        "language_code": {
          "content": "field_value",
          "meta": null
        }
      }
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "tailwind-classes",
      "css_mobile": "mobile-specific-classes",
      "debug": false
    }
  }
]
```

**CRITICAL**: Always generate the complete JSON array structure, not individual objects.

**Important Notes:**
- **Section Names**: Use format `style_name` (e.g., "html-tag")
- **Fields**: Can be an empty array `[]` or an object with field definitions
- **Boolean Values**: Always stored as strings `"0"` (false) or `"1"` (true)
- **Language Codes**: Use specific codes like `"de-CH"`, `"en-GB"`, or `"all"` for non-translatable fields

### Key Principles
1. **Hierarchical Structure**: Sections can contain child sections, creating nested layouts
2. **Style-Based Rendering**: Each section has a `style_name` that determines how it renders
3. **Multi-Language Support**: All field values are organized by language code (e.g., "en-GB", "de-CH")
4. **Field-Based Configuration**: Section behavior is controlled through configurable fields
5. **Global Fields**: Every section includes global_fields for system-wide configuration
6. **CSS Classes**: Styling is applied using Tailwind CSS classes through the `css` field
7. **Mantine UI Integration**: Most styles support both Mantine UI components and custom implementations
8. **Global Style Components**: Form elements (buttons, inputs, etc.) are global and can be used anywhere

### CSS and Styling System

#### Tailwind CSS Classes
All styling is applied through Tailwind CSS classes in the `css` field:
- **Layout**: `flex flex-col gap-4`, `grid grid-cols-2 gap-6`, `container mx-auto`
- **Spacing**: `p-4 m-4`, `px-6 py-8`, `space-y-4`
- **Colors**: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-white`, `border-gray-200`
- **Typography**: `text-lg font-bold`, `text-center`, `leading-relaxed`
- **Responsive**: `sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Dark Mode**: Always include dark mode variants (dark:) for all colors and backgrounds

#### Dark Mode Support
**CRITICAL**: Always include dark mode variants for visual elements:
```json
"css": "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
```

#### Mobile-Specific Styling
Use `css_mobile` for mobile-specific overrides:
```json
"css_mobile": "px-2 py-4 text-sm"
```

### Style Loading and Rendering System

#### Style Categories
Styles are organized into categories and loaded from different folders:

**Mantine UI Styles** (`src/app/components/frontend/styles/mantine/`):
- These are the primary style implementations using Mantine UI v8 components
- Support both Mantine styling (`use_mantine_style = '1'`) and custom fallbacks
- Include comprehensive Mantine props mapping

**Legacy/Custom Styles** (`src/app/components/frontend/styles/` root level):
- Custom implementations for specific use cases
- Authentication forms, basic HTML elements
- May not support Mantine toggling

**Global Styles** (Form components):
- Button, Input, Textarea, Select, etc. can be used in any context
- Support both Mantine and custom implementations

#### Mantine vs Custom Implementation Toggle
Many components support toggling between Mantine UI and custom implementations:

```json
"fields": {
  "use_mantine_style": {
    "all": {
      "content": "1",
      "meta": null
    }
  }
}
```

- `"1"` = Use Mantine UI component with full props support
- `"0"` or `null` = Use custom HTML implementation or return `null`

#### Mantine Properties & Tailwind CSS Priority
**ALWAYS** use proper Mantine properties first to achieve the desired styling and behavior. Only use Tailwind CSS classes in `global_fields.css` when Mantine properties cannot achieve the required result.

**Examples:**
- Use `mantine_size`, `mantine_variant`, `mantine_color` for component styling
- Use `mantine_justify`, `mantine_align` for layout alignment
- Use `mantine_gap` for spacing between child elements
- Use `mantine_radius` for border radius
- Only use Tailwind classes like `bg-blue-500`, `text-center`, `shadow-lg` when Mantine properties are insufficient

#### Style Router (BasicStyle.tsx)
The `BasicStyle` component acts as a router, mapping `style_name` to specific components:
- Authentication: `login`, `register`, `profile`, `validate`, `resetPassword`, `twoFactorAuth`
- Layout: `container`, `div`, `flex`, `grid`, `stack`, `center`, etc.
- Content: `heading`, `markdown`, `plaintext`, `image`, `video`
- Forms: `input`, `textarea`, `select`, `radio`, `checkbox`, `button`
- Advanced: `tabs`, `accordion`, `timeline`, `carousel`, etc.

### Custom HTML with HtmlTag Style
For very custom layouts that Mantine UI cannot support, use the `html-tag` style:

```json
{
  "name": "custom-layout",
  "style_name": "html-tag",
  "children": [],
  "fields": {
    "html_tag": {
      "all": {
        "content": "section",
        "meta": null
      }
    },
    "html_tag_content": {
      "all": {
        "content": "<div class=\"custom-layout\">Custom HTML content</div>",
        "meta": null
      }
    }
  },
  "global_fields": {
    "css": "custom-styling-classes",
    "css_mobile": null,
    "condition": null,
    "data_config": null,
    "debug": false
  }
}
```

This allows arbitrary HTML tags and content with full CSS customization.

## Comprehensive Style Guide & Capabilities

### Layout & Container Styles
- **container**: Responsive container with Mantine fluid/fixed width options
- **card**: Card component with segments, shadows, and padding
- **card-segment**: Card content sections
- **center**: Centers content horizontally and vertically
- **flex**: Flexbox layout with direction, justify, align controls
- **group**: Horizontal group layout with spacing
- **stack**: Vertical stack layout with spacing
- **simple-grid**: CSS Grid with responsive columns
- **grid**: Advanced CSS Grid with column spans
- **grid-column**: Grid column with span/offset controls
- **space**: Spacing component
- **aspect-ratio**: Maintains aspect ratio for content
- **background-image**: Background image container
- **divider**: Visual divider with variants and orientation
- **paper**: Elevated surface with shadow and radius
- **fieldset**: Form fieldset with legend

### Content & Text Styles
- **heading**: Headings (h1-h6) - Note: Uses `title` field, not `text`
- **markdown**: Markdown content renderer - Uses `text_md` field
- **text**: Plain text with typography controls - Uses `text` field
- **plaintext**: Simple text display - Uses `text` field
- **code**: Inline/block code with syntax highlighting
- **highlight**: Text highlighting with customizable colors - Uses `text` and `mantine_highlight_highlight` fields
- **blockquote**: Blockquote with optional icon and citation
- **title**: Large title component with size and alignment

### Media Styles
- **image**: Responsive images with alt text and sizing
  - Uses `img_src`, `alt`, `title`, `is_fluid` fields
  - Supports external URLs and uploaded assets
- **carousel**: Image carousel with controls and indicators
- **video**: Video player (custom implementation)
- **audio**: Audio player (custom implementation)
- **figure**: Image with caption
- **avatar**: User avatar with image and alt text
- **background-image**: Background image component

### Interactive Elements
- **button**: Action button with navigation and confirmations
  - Uses `label`, `page_keyword`, `open_in_new_tab`, `disabled`, `confirmation_*` fields
  - Supports both Mantine and custom HTML rendering
- **link**: Navigation link (custom implementation)
- **actionIcon**: Icon button with navigation

### Form Elements
- **form-record**: Record creation/editing form container
  - Uses `alert_success`, `name`, `is_log` fields
- **text-input**: Text input field with Mantine styling
- **textarea**: Multi-line text with rich editor option
- **select**: Dropdown selection with search
- **radio**: Radio button group
- **checkbox**: Checkbox with custom values
- **switch**: Toggle switch
- **datepicker**: Date picker with localization
- **file-input**: File upload with drag & drop
- **rich-text-editor**: WYSIWYG editor
- **combobox**: Advanced select with create/search
- **chip**: Chip/toggle component
- **slider**: Range slider with marks and labels
- **range-slider**: Dual-handle range slider
- **number-input**: Numeric input with validation
- **color-input**: Color picker input
- **color-picker**: Standalone color picker

### Navigation & Lists
- **tabs**: Tab container with tab children
- **tab**: Individual tab with label and content
- **accordion**: Collapsible sections
- **accordion-Item**: Accordion item with content
- **list**: Ordered/unordered lists
- **list-item**: List item with optional icon and content

### Data Display
- **timeline**: Timeline with items and bullets
- **timeline-item**: Timeline entry with title
- **progress**: Progress bar
- **progress-root**: Progress container
- **progress-section**: Multi-section progress
- **badge**: Status badge with variants
- **indicator**: Notification indicator
- **kbd**: Keyboard key display
- **rating**: Star rating component
- **theme-icon**: Themed icon container

### Feedback Components
- **alert**: Alert/notification box with variants
- **notification**: Toast-style notification

### Utility & Advanced
- **html-tag**: Custom HTML with arbitrary tags and content
- **scroll-area**: Scrollable container
- **spoiler**: Collapsible content spoiler
- **typography**: Typography wrapper

### Legacy/Custom Styles
- **div**: Basic div container (legacy)
- **input**: Basic input field (legacy)
- **video**: Basic video player (legacy)
- **audio**: Basic audio player (legacy)
- **figure**: Basic figure with caption (legacy)
- **entryList**: Data list display (legacy)
- **entryRecord**: Data record display (legacy)
- **entryRecordDelete**: Delete confirmation (legacy)
- **version**: Version display (legacy)
- **loop**: Content loop (legacy)
- **dataContainer**: Data container (legacy)
- **showUserInput**: User input display (legacy)

### Authentication Styles (Legacy)
- **login**: User login form
- **register**: User registration form
- **validate**: User validation form
- **resetPassword**: Password reset form
- **twoFactorAuth**: Two-factor authentication form
- **profile**: User profile management form

### Container & Layout Styles
- **container**: Main container with optional fluid layout
- **div**: Generic div container with background, border, and text colors

### Text & Content Styles
- **heading**: Headings h1-h6 with configurable level and title
- **markdown**: Full markdown content with GitHub Flavored Markdown support
- **plaintext**: Plain text with optional paragraph wrapping

### Media Styles
- **image**: Images with src, alt, title, width, height
- **video**: Video player with multiple sources
- **audio**: Audio player with multiple sources
- **carousel**: Image carousel with controls and indicators
- **figure**: Image with caption

### Interactive Elements
- **button**: Buttons with labels, URLs, types, confirmation dialogs
- **link**: Links with labels, URLs, new tab options

### Form Elements
- **form**: Form containers with action URLs and labels
- **input**: Text inputs with types, placeholders, validation
- **textarea**: Multi-line text inputs with markdown editor option
- **select**: Dropdown selects with options and search
- **radio**: Radio button groups with options
- **checkbox**: Checkboxes with values and validation
- **slider**: Range sliders with labels and min/max values
- **validate**: Form validation component

### Navigation & Lists
- **tabs**: Tab containers for organizing content (requires tab children)
- **tab**: Individual tab component (used within tabs)

### Tables
- **table**: Table container
- **tableRow**: Table row
- **tableCell**: Table cell

### Advanced Elements
- **progressBar**: Progress indicators with counts and styling
- **showUserInput**: Display user input data
- **alert**: Alert boxes with types (primary/secondary/success/danger/warning/info/light/dark)
- **version**: Version information display
- **entryList**: List of data entries
- **entryRecord**: Individual data record display
- **entryRecordDelete**: Delete confirmation for data records
- **refContainer**: Reference container for data relationships
- **formUserInputLog**: User input logging form
- **formUserInputRecord**: User input record form
- **loop**: Loop container for repeating content
- **dataContainer**: Generic data container
- **htmlTag**: Custom HTML tag wrapper

## Field Reference by Style Type

### Global Fields (Available for all styles)
All sections include these global_fields:
- `css`: Tailwind CSS classes for styling (moved to global_fields)
- `css_mobile`: Mobile-specific CSS classes (moved to global_fields)
- `condition`: Conditional display logic (moved to global_fields)
- `data_config`: Data configuration for dynamic content
- `debug`: Debug information (boolean, moved to global_fields)

### Authentication Styles Fields
**login**:
- `email_label`: Email field label
- `password_label`: Password field label
- `submit_label`: Submit button text
- `forgot_password_url`: Forgot password link URL
- `remember_me`: "1" to show remember me checkbox

**register**:
- `email_label`: Email field label
- `password_label`: Password field label
- `confirm_password_label`: Confirm password field label
- `submit_label`: Submit button text
- `login_url`: Login page URL

**resetPassword**:
- `email_label`: Email field label
- `submit_label`: Submit button text
- `back_to_login_url`: Back to login URL

**twoFactorAuth**:
- `code_label`: Authentication code label
- `submit_label`: Submit button text
- `resend_label`: Resend code button text

**profile**:
- `first_name_label`: First name field label
- `last_name_label`: Last name field label
- `email_label`: Email field label
- `submit_label`: Submit button text

### Container Styles Fields
**container**:
- `is_fluid`: "1" for fluid container, "0" for fixed width

**div**:
- `color_background`: Background color
- `color_border`: Border color
- `color_text`: Text color

### Text Styles Fields
**heading**:
- `level`: Heading level (1-6)
- `title`: Heading text

**markdown**:
- `text_md`: Markdown content

**plaintext**:
- `text`: Plain text content
- `is_paragraph`: "1" to wrap in paragraph tags

### Media Styles Fields
**image**:
- `img_src`: Image source URL (use: http://127.0.0.1/selfhelp/assets/image-holder.png)
- `alt`: Alt text for accessibility
- `title`: Image title
- `width`: Image width
- `height`: Image height
- `is_fluid`: "1" for responsive image

**video**:
- `sources`: JSON string array of video sources (e.g., "[{\"src\": \"video.mp4\", \"type\": \"video/mp4\"}]")
- `is_fluid`: "1" for responsive video
- `alt`: Alternative text

**audio**:
- `sources`: JSON string array of audio sources (e.g., "[{\"src\": \"audio.mp3\", \"type\": \"audio/mpeg\"}]")

**carousel**:
- `sources`: JSON string array of image sources (e.g., "[{\"src\": \"image.jpg\", \"alt\": \"Image\"}]")
- `has_controls`: "1" to show controls
- `has_indicators`: "1" to show indicators
- `has_crossfade`: "1" for crossfade effect
- `id_prefix`: Unique ID prefix

**figure**:
- `caption_title`: Caption title
- `caption`: Caption text

### Interactive Elements Fields
**button**:
- `label`: Button text
- `url`: Button URL/action
- `type`: Button type (primary/secondary/success/danger/warning/info/light/dark)
- `confirmation_title`: Confirmation dialog title
- `confirmation_message`: Confirmation dialog message
- `confirmation_continue`: Confirmation button text

**link**:
- `label`: Link text
- `url`: Link URL
- `open_in_new_tab`: "1" to open in new tab

### Form Elements Fields
**form**:
- `label`: Form label/title
- `url`: Form action URL
- `type`: Form type
- `label_cancel`: Cancel button label
- `url_cancel`: Cancel button URL

**input**:
- `label`: Input label
- `type_input`: Input type (text/email/password/number/date/etc.)
- `placeholder`: Placeholder text
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default value
- `min`: Minimum value (for numbers/dates)
- `max`: Maximum value (for numbers/dates)
- `format`: Input format validation
- `locked_after_submit`: "1" if locked after form submission

**textarea**:
- `label`: Textarea label
- `placeholder`: Placeholder text
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default value
- `min`: Minimum character count
- `max`: Maximum character count
- `locked_after_submit`: "1" if locked after form submission
- `markdown_editor`: "1" to enable markdown editor

**select**:
- `label`: Select label
- `alt`: Placeholder text for select
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default selected value
- `items`: JSON string array of options (e.g., "[{\"value\": \"val\", \"text\": \"Label\"}]")
- `is_multiple`: "1" for multiple selection
- `max`: Maximum number of selections (for multiple)
- `live_search`: "1" to enable search
- `disabled`: "1" if disabled
- `image_selector`: "1" for image selection mode
- `locked_after_submit`: "1" if locked after form submission
- `allow_clear`: "1" to allow clearing selection

**radio**:
- `label`: Radio group label
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default selected value
- `items`: JSON string array of options (e.g., "[{\"value\": \"val\", \"text\": \"Label\"}]")
- `is_inline`: "1" for inline layout
- `locked_after_submit`: "1" if locked after form submission

**checkbox**:
- `label`: Checkbox label
- `name`: Form field name
- `value`: Current value
- `checkbox_value`: Value when checked
- `is_required`: "1" if required

**slider**:
- `label`: Slider label
- `name`: Form field name
- `value`: Default value
- `min`: Minimum value
- `max`: Maximum value
- `labels`: Array of label objects
- `locked_after_submit`: "1" if locked after form submission

### Advanced Elements Fields
**progressBar**:
- `count`: Progress current value
- `count_max`: Progress maximum value
- `type`: Progress bar type (primary/secondary/success/danger/warning/info/light/dark)
- `is_striped`: "1" for striped appearance
- `has_label`: "1" to show label

**showUserInput**:
- `form_name`: Name of form to display data from
- `delete_title`: Delete confirmation title
- `label_delete`: Delete button label
- `delete_content`: Delete confirmation message
- `is_log`: "1" if showing log data
- `anchor`: Anchor for navigation
- `is_expanded`: "1" if expanded by default
- `column_names`: Column names to display
- `load_as_table`: "1" to display as table

**alert**:
- `type`: Alert type (primary/secondary/success/danger/warning/info/light/dark)
- `is_dismissable`: "1" if dismissable

**version**:
- `version_number`: Version number to display
- `build_date`: Build date
- `changelog_url`: URL to changelog

**entryList**:
- `data_source`: Data source configuration
- `items_per_page`: Number of items per page
- `sort_field`: Default sort field
- `sort_direction`: Sort direction (asc/desc)

**entryRecord**:
- `record_id`: Record ID to display
- `display_fields`: JSON array of fields to show
- `edit_url`: Edit URL for the record

**entryRecordDelete**:
- `record_id`: Record ID to delete
- `confirmation_title`: Delete confirmation title
- `confirmation_message`: Delete confirmation message

**refContainer**:
- `reference_type`: Type of reference
- `reference_id`: Reference ID
- `display_mode`: Display mode (inline/block)

**formUserInputLog**:
- `form_id`: Form ID for logging
- `log_level`: Log level (info/warn/error)
- `max_entries`: Maximum log entries

**formUserInputRecord**:
- `record_id`: Record ID for form input
- `form_fields`: JSON array of form fields
- `submit_url`: Form submission URL

**loop**:
- `data_source`: Data source for looping
- `item_template`: Template for each item
- `max_iterations`: Maximum loop iterations

**dataContainer**:
- `data_type`: Type of data to contain
- `data_source`: Data source configuration
- `render_mode`: Render mode (list/grid/table)

**htmlTag**:
- `tag_name`: HTML tag name
- `attributes`: JSON object of tag attributes
- `content`: Tag content

### Navigation & List Fields
**tabs**:
- No specific fields (uses child tab components)

**tab**:
- `label`: Tab label text
- `type`: Tab type
- `is_active`: "1" if this tab is active by default
- `icon`: Icon class for tab



## CSS Styling Guidelines

### Available Tailwind CSS Classes

The system includes a comprehensive safelist of Tailwind CSS classes that are preserved during CSS purging. These classes are organized into categories and can be used in the `css` field of any section's `global_fields`. The available classes are loaded from the project's CSS safelist configuration and include:

#### Layout & Container Classes
- **Containers**: `container`, `mx-auto`
- **Padding**: `px-0` through `px-8`, `py-0` through `py-8`, `p-0` through `p-8`
- **Margins**: `m-0` through `m-8`, `mx-0` through `mx-8`, `my-0` through `my-8`, `mt-0` through `mt-8`, `mb-0` through `mb-8`, `ml-0` through `ml-8`, `mr-0` through `mr-8`, `mx-auto`, `my-auto`
- **Max Widths**: `max-w-xs`, `max-w-sm`, `max-w-md`, `max-w-lg`, `max-w-xl`, `max-w-2xl`, `max-w-full`

#### Grid & Flexbox Classes
- **Grid**: `grid`, `grid-cols-1`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`, `grid-cols-6`, `grid-cols-12`
- **Responsive Grids**: `sm:grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3`
- **Flexbox**: `flex`, `flex-row`, `flex-col`, `flex-wrap`, `flex-nowrap`
- **Alignment**: `justify-start`, `justify-center`, `justify-end`, `justify-between`, `items-start`, `items-center`, `items-end`
- **Gaps**: `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6`, `gap-8`

#### Spacing Classes
- **Margins**: `m-0`, `m-1`, `m-2`, `mx-auto`, `my-0`, `mt-0`, `mb-0`, `ml-0`, `mr-0` (and values up to 8)
- **Padding**: `p-0`, `p-1`, `p-2`, `px-0`, `py-0`, `pt-0`, `pb-0`, `pl-0`, `pr-0` (and values up to 8)

#### Typography Classes
- **Font Sizes**: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`, `text-6xl`
- **Font Weights**: `font-thin`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`
- **Text Alignment**: `text-left`, `text-center`, `text-right`, `text-justify`
- **Line Heights**: `leading-none`, `leading-tight`, `leading-snug`, `leading-normal`, `leading-relaxed`, `leading-loose`

#### Color Classes (with Dark Mode Support)
- **Text Colors**: `text-white`, `text-black`, `text-gray-100` through `text-gray-900`, `text-blue-500/600/700`, `text-red-500/600/700`, `text-green-500/600/700`, `text-purple-*`, `text-pink-*`, `text-orange-*`, `text-indigo-500/600/700`, `text-yellow-600/700`
- **Background Colors**: `bg-white`, `bg-black`, `bg-gray-100` through `bg-gray-900`, `bg-blue-500/600/700`, `bg-red-500/600/700`, `bg-green-500/600/700`, `bg-indigo-500/600/700`, `bg-yellow-400/500/600`
- **Border Colors**: `border-gray-200/300/400`, `border-blue-500`, `border-green-500`, `border-red-500`
- **Dark Mode**: All color classes have `dark:` variants available

#### Sizing Classes
- **Widths**: `w-auto`, `w-full`, `w-screen`, plus fractional widths (`w-1/2`, `w-1/3`, `w-2/3`, `w-1/4`, etc.) and fixed widths (`w-1` through `w-64`)
- **Heights**: `h-auto`, `h-full`, `h-screen`, plus fixed heights (`h-1` through `h-64`)

#### Border & Radius Classes
- **Borders**: `border`, `border-0`, `border-2`, `border-4`, `border-8`
- **Border Radius**: `rounded-none`, `rounded-sm`, `rounded`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`

#### Shadow Classes
- **Box Shadows**: `shadow-none`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `shadow-inner`

#### Display & Position Classes
- **Display**: `block`, `inline-block`, `inline`, `hidden`
- **Position**: `relative`, `absolute`, `fixed`, `sticky`
- **Overflow**: `overflow-hidden`, `overflow-visible`, `overflow-auto`, `overflow-scroll`

#### Animation & Transition Classes
- **Animations**: `animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`
- **Transitions**: `transition-none`, `transition-all`, `transition-colors`, `transition-opacity`, `transition-transform`
- **Durations**: `duration-75`, `duration-100`, `duration-150`, `duration-200`, `duration-300`, `duration-500`

#### Responsive Breakpoints
- **Breakpoints**: `sm:`, `md:`, `lg:`, `xl:` prefixes for all responsive classes
- **Examples**: `sm:hidden`, `md:flex`, `lg:grid-cols-3`

#### Interactive States (Hover, Focus)
- **Hover States**: `hover:bg-*`, `hover:text-*`, `hover:shadow-*`
- **Focus States**: `focus:outline-none`, `focus:ring-*`

#### Advanced Classes
- **Transforms**: `transform`, `rotate-*`, `translate-*`, `skew-*`, `scale-*`
- **Backdrop Filters**: `backdrop-blur-*`, `backdrop-brightness-*`
- **Object Fit**: `object-contain`, `object-cover`, `object-fill`, `object-none`, `object-scale-down`
- **Aspect Ratio**: `aspect-auto`, `aspect-square`, `aspect-video`
- **Scroll Behavior**: `scroll-smooth`, `scroll-auto`
- **Prose (for markdown)**: `prose`, `prose-sm`, `prose-lg`, `prose-xl`

#### **Complete CMS Class Library**
The system now includes **400+ predefined Tailwind CSS classes** from the comprehensive CMS class library, including:
- **All spacing utilities** (`p-*`, `m-*`, `px-*`, `py-*`, etc.)
- **Complete color palette** with Bootstrap-compatible colors
- **All responsive breakpoints** (`sm:`, `md:`, `lg:`)
- **Interactive states** (`hover:`, `focus:` with ring utilities)
- **Typography transforms** (`uppercase`, `capitalize`, `underline`)
- **Layout utilities** (`relative`, `absolute`, `fixed`, `sticky`)
- **Z-index layers** (`z-10` through `z-50`)
- **Overflow controls** (`overflow-*`, `overflow-x-*`, `overflow-y-*`)
- **Cursor styles** and **pointer events**
- **Resize utilities** and **appearance controls**

All classes include **dark mode variants** (`dark:*`) and are validated in real-time during development by checking if they actually exist in the browser's loaded CSS stylesheets.

### Tailwind CSS Classes with Dark Mode Support
The system uses Tailwind CSS with Mantine UI theming for styling. **CRITICAL**: Always include dark mode variants for proper theme support.

**Dark Mode Implementation**:
- Use `dark:` prefix for dark mode variants of colors, backgrounds, and borders
- **ALWAYS** provide both light and dark variants for visual elements
- Example: `bg-white dark:bg-gray-900 text-gray-900 dark:text-white`

**Layout & Spacing**:
- `container mx-auto`: Centered container
- `p-4 m-4`: Padding and margin
- `flex flex-col gap-4`: Flexbox layouts
- `grid grid-cols-2 gap-4`: Grid layouts

**Colors with Dark Mode**:
- `bg-white dark:bg-gray-900`: Background colors
- `text-gray-900 dark:text-white`: Text colors
- `border-gray-200 dark:border-gray-700`: Border colors
- `hover:bg-gray-50 dark:hover:bg-gray-800`: Hover states

**Typography**:
- `text-lg font-bold`: Text size and weight
- `text-center`: Text alignment
- `leading-relaxed`: Line height

**Shadows with Dark Mode**:
- `shadow-lg dark:shadow-2xl`: Shadows that work in both themes
- `shadow-gray-200 dark:shadow-gray-800`: Colored shadows

**Responsive Design**:
- `sm:text-lg md:text-xl lg:text-2xl`: Responsive text
- `sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3`: Responsive grids

**Essential Dark Mode Patterns**:
```css
/* Backgrounds */
bg-white dark:bg-gray-900
bg-gray-50 dark:bg-gray-800
bg-gray-100 dark:bg-gray-700

/* Text Colors */
text-gray-900 dark:text-white
text-gray-700 dark:text-gray-300
text-gray-600 dark:text-gray-400

/* Borders */
border-gray-200 dark:border-gray-700
border-gray-300 dark:border-gray-600

/* Cards & Components */
bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
shadow-lg dark:shadow-2xl
```

## Language Configuration
All content fields must be wrapped in language objects. The structure is field name first, then language code. Use "en-GB" as the default language, and "all" for non-translatable fields:

**CRITICAL**: All field content values must be strings. Arrays and objects should be JSON-encoded strings.

```json
"fields": {
  "title": {
    "en-GB": {
      "content": "Your Title Here",
      "meta": null
    },
    "de-CH": {
      "content": "Ihr Titel hier",
      "meta": null
    }
  }
},
"global_fields": {
  "condition": null,
  "data_config": null,
  "css": "text-center font-bold",
  "css_mobile": null,
  "debug": false
}
```

### Language Code Guidelines:
- **Translatable content fields**: Use specific language codes like "en-GB", "de-CH", "fr-FR"
  - Examples: `title`, `text_md`, `alt`, `label`, `placeholder`, `caption`
- **Non-translatable fields**: Use "all" for CSS, configuration, and technical fields
  - Examples: `css`, `css_mobile`, `level`, `img_src`, `type`, `is_required`, `width`, `height`
- **Multiple languages**: Add multiple language objects under the same field name
- **Required languages**: Always include both "en-GB" (English) and "de-CH" (German) for all translatable content
- **Default language**: Always include "en-GB" as the primary language

### Field Language Usage Examples:
```json
"fields": {
  "title": {
    "en-GB": { "content": "English Title", "meta": null },
    "de-CH": { "content": "Deutscher Titel", "meta": null }
  },
  "text": {
    "en-GB": { "content": "Welcome to our service", "meta": null },
    "de-CH": { "content": "Willkommen zu unserem Service", "meta": null }
  },
  "label": {
    "en-GB": { "content": "Follow", "meta": null },
    "de-CH": { "content": "Folgen", "meta": null }
  },
  "level": {
    "all": { "content": "2", "meta": null }
  },
  "img_src": {
    "all": { "content": "http://127.0.0.1/selfhelp/assets/image-holder.png", "meta": null }
  }
},
"global_fields": {
  "condition": null,
  "data_config": null,
  "css": "text-center font-bold",
  "css_mobile": null,
  "debug": false
}
```

## Generation Instructions

### CRITICAL: Framework Selection
The first word of your request MUST be either "mantine" or "tailwind" to specify the framework approach:

- **"mantine"**: Use Mantine UI v8 components with Mantine properties. Only in very rare cases add Tailwind CSS classes when Mantine properties cannot achieve the desired result.
- **"tailwind"**: Use only core components (html-tag, image, button, form inputs like select, input, textarea) with Tailwind CSS classes for styling.

### Framework-Specific Guidelines

#### Mantine Framework Approach
When "mantine" is specified as the first word:
1. **Use Mantine Components**: Always prefer Mantine UI v8 components and their properties
2. **Mantine Properties First**: Use Mantine component props (mantine_size, mantine_color, mantine_variant, etc.) for styling
3. **Tailwind Only When Necessary**: Add Tailwind CSS classes in `global_fields.css` ONLY when Mantine properties cannot achieve the required styling
4. **Component Availability**: Use all available Mantine components from the style types list (flex, grid, button, card, etc.)
5. **Mantine Field Values**: Use the predefined Mantine field values from the reference section

#### Tailwind Framework Approach
When "tailwind" is specified as the first word:
1. **Core Components Only**: Use only these components:
   - `html-tag`: For custom HTML layouts and content
   - `image`: For images with Tailwind styling
   - `button`: For buttons with Tailwind styling
   - `text-input`, `textarea`, `select`: For forms with Tailwind styling
2. **Tailwind CSS Focus**: Apply all styling through `global_fields.css` with Tailwind classes
3. **No Mantine Components**: Do NOT use any Mantine-specific components (card, flex, grid, etc.)
4. **HTML Structure**: Build layouts using html-tag with custom HTML content and Tailwind classes

### TypeScript Type Definitions Reference
**CRITICAL**: Always reference `src/types/common/styles.types.ts` for accurate field names, types, and values:

#### Mantine Field Types and Supported Values
Use the exact field names and values defined in `styles.types.ts`. Here are the actual supported values for each type:

**Sizes**: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`

**Colors**: `'gray' | 'red' | 'grape' | 'violet' | 'blue' | 'cyan' | 'green' | 'lime' | 'yellow' | 'orange'`

**Variants**: `'filled' | 'light' | 'outline' | 'subtle' | 'default' | 'transparent' | 'white'`

**Radii**: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`

**Spacing/Gaps**: `'0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`

**Justify Content**: `'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'`

**Align Items**: `'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'`

**Width Values**: `'25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | 'max-content' | 'min-content'` (+ any custom string value)

**Height Values**: `'25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | 'max-content' | 'min-content'` (+ any custom string value)

**Boolean Fields**: Always use string values `'0'` (false) or `'1'` (true)

#### Component-Specific Fields and Spacing
For each component, use the exact field names from the corresponding interface in `styles.types.ts`. **ALWAYS prefer Mantine spacing fields over CSS classes for consistent theming:**

**Spacing Fields (Available for most components):**
- `mantine_spacing_margin_padding`: Combined margin and padding (JSON structure with top/bottom/left/right)
- `mantine_spacing_margin`: Margin only (JSON structure with top/bottom/left/right)
- `mantine_gap`: Gap between child elements
- `mantine_spacing`: Grid/container spacing
- `mantine_vertical_spacing`: Vertical spacing in grids

**Example Spacing JSON Structure:**
```json
"mantine_spacing_margin_padding": {
  "all": {
    "content": "{\"top\":\"md\",\"bottom\":\"lg\",\"left\":\"sm\",\"right\":\"sm\"}",
    "meta": null
  }
}
```

**Component-Specific Fields:**
- `IButtonStyle`: `mantine_variant`, `mantine_color`, `mantine_size`, `mantine_radius`, etc.
- `ICardStyle`: `mantine_card_shadow`, `mantine_border`, `mantine_radius`, etc.
- `ITextInputStyle`: `mantine_size`, `mantine_radius`, `mantine_text_input_variant`, etc.
- `IStackStyle`: `mantine_gap`, `mantine_justify`, `mantine_align`, `mantine_width`, `mantine_height`
- `ISimpleGridStyle`: `mantine_cols`, `mantine_spacing`, `mantine_vertical_spacing`

**Example - StackStyle Component Values:**
```json
{
  "mantine_gap": {"all": {"content": "md", "meta": null}},           // '0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  "mantine_justify": {"all": {"content": "center", "meta": null}},   // 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  "mantine_align": {"all": {"content": "stretch", "meta": null}},    // 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  "mantine_width": {"all": {"content": "100%", "meta": null}},       // '25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | etc.
  "mantine_height": {"all": {"content": "auto", "meta": null}}       // '25%' | '50%' | '75%' | '100%' | 'auto' | 'fit-content' | etc.
}
```

#### Field Naming Convention and Value Mapping
Always use the exact field names from `styles.types.ts` with the correct value types:

**Mantine Properties**: `mantine_[component]_[property]` (e.g., `mantine_stack_gap`)
- **Boolean fields**: Use `'0'` (false) or `'1'` (true) as string values
- **Size fields**: Use TMantineSize values: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- **Color fields**: Use TMantineColor values: `'gray' | 'red' | 'grape' | 'violet' | 'blue' | 'cyan' | 'green' | 'lime' | 'yellow' | 'orange'`
- **Gap/Spacing fields**: Use TMantineGap values: `'0' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- **Justify fields**: Use TMantineJustify values: `'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'`
- **Align fields**: Use TMantineAlign values: `'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'`
- **Width/Height fields**: Use TMantineWidth/TMantineHeight values with predefined options plus custom strings

### Content Requirements
**ALWAYS provide comprehensive content in both English ("en-GB") and German ("de-CH") languages for all translatable fields.** Each piece of content should be full, professional, and engaging:

- **Names & Titles**: Use realistic, professional names and complete job titles
- **Descriptions**: Provide detailed, meaningful bios (2-4 sentences minimum)
- **Contact Information**: Include office location, phone number, and email
- **Complete Coverage**: Every translatable field must have content in both languages
- **Professional Quality**: Content should be suitable for a business website

### Content Source
After the framework word ("mantine" or "tailwind"), provide either:
- **Image**: An image showing how the content should look
- **Descriptive Text**: Clear text describing what should be built

### General Generation Steps
1. **Framework Recognition**: Identify if using Mantine or Tailwind approach from the first word
2. **Content Analysis**: Analyze the provided image or descriptive text
3. **Component Selection**:
   - **Mantine**: Choose from all available Mantine components
   - **Tailwind**: Choose only from core components (html-tag, image, button, form inputs)
4. **Structure Hierarchically**: Create parent-child relationships using the `children` array
5. **Configure Fields**: Set appropriate field values based on content and framework
6. **Apply Global Fields**: **CRITICAL** - Always include `global_fields` with condition, data_config, css, css_mobile, and debug
7. **Framework-Specific Styling**:
   - **Mantine**: Use Mantine properties first, Tailwind classes only when absolutely necessary
   - **Tailwind**: Use Tailwind CSS classes for all styling in `global_fields.css`
8. **Dark Mode Support**: **CRITICAL** - Always include dark mode variants (dark:) for all colors, backgrounds, borders, and shadows
9. **Use Placeholder Images**: Always use `http://127.0.0.1/selfhelp/assets/image-holder.png` for image sources
10. **Multi-Language Structure**: Use field name first, then language code (field_name -> language_code -> content)
11. **Required Languages**: Always include both "en-GB" (English) and "de-CH" (German) for all translatable text content
12. **Language Codes**: Use "en-GB" and "de-CH" for translatable content, "all" for technical fields
13. **Semantic Naming**: Give meaningful names to sections for admin interface
14. **Naming Rules**: Section names can ONLY contain letters, numbers, hyphens (-), and underscores (_). No spaces, special characters, or other symbols are allowed.

### Naming Convention Examples:
- ✅ **Correct**: "travel-blog-container", "norway_article_card", "hero-section", "main-heading"
- ❌ **Incorrect**: "Travel Blog Container", "Norway Article (Card)", "Hero Section!", "Main Heading & Content"

### Example Generation Process:
For a page with a header, image, and text content:

1. **Root Container**: Use `container` style for the main wrapper (name: "page-container")
2. **Header Section**: Use `heading` style with appropriate level (name: "page-header" or "main-heading")
3. **Image Section**: Use `image` style with placeholder URL (name: "hero-image" or "feature-image")
4. **Content Section**: Use `markdown` or `plaintext` for text content (name: "main-content" or "description-text")
5. **Styling**: Apply appropriate Tailwind classes for layout and appearance
6. **Naming**: Ensure all section names use only letters, numbers, hyphens, and underscores

## Sample JSON Structure

Here's a complete example of a simple page section:

```json
{
  "name": "hero-section",
  "style_name": "container",
  "children": [
    {
      "name": "main-heading",
      "style_name": "heading",
      "children": [],
      "fields": {
        "level": {
          "all": {
            "content": "1",
            "meta": null
          }
        },
        "title": {
          "en-GB": {
            "content": "Welcome to Our Service",
            "meta": null
          }
        }
      },
      "global_fields": {
        "condition": null,
        "data_config": null,
        "css": "text-4xl font-bold text-center mb-6",
        "css_mobile": null,
        "debug": false
      }
    },
    {
      "name": "hero-image",
      "style_name": "image",
      "children": [],
      "fields": {
        "img_src": {
          "all": {
            "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
            "meta": null
          }
        },
        "alt": {
          "en-GB": {
            "content": "Hero image showing our main service",
            "meta": null
          }
        }
      },
      "global_fields": {
        "condition": null,
        "data_config": null,
        "css": "w-full h-64 object-cover rounded-lg mb-6",
        "css_mobile": null,
        "debug": false
      }
    },
    {
      "name": "description-text",
      "style_name": "markdown",
      "children": [],
      "fields": {
        "text_md": {
          "en-GB": {
            "content": "This is a comprehensive description of our service. We provide **excellent solutions** for your needs with modern technology and professional support.\n\n- Feature 1: Advanced functionality\n- Feature 2: User-friendly interface\n- Feature 3: 24/7 support",
            "meta": null
          }
        }
      },
      "global_fields": {
        "condition": null,
        "data_config": null,
        "css": "prose max-w-none text-gray-700",
        "css_mobile": null,
        "debug": false
      }
    }
  ],
  "fields": {},
  "global_fields": {
    "condition": null,
    "data_config": null,
    "css": "container mx-auto px-4 py-8",
    "css_mobile": null,
    "debug": false
  }
}
```

## Practical Example: Real Page Export Analysis

Based on the actual exported page data, here's how the system structures real content. Notice the naming patterns, field structures, and hierarchical relationships:

### Key Patterns from Real Data:
1. **Section Names**: Use style_name format (e.g., "html-tag")
2. **Empty Fields**: Many sections have `[]` instead of `{}` for fields
3. **Boolean Values**: Always strings "0" or "1"
4. **Language Structure**: Multi-language support with "de-CH", "en-GB", "all"
5. **HTML Content**: Rich text fields can contain HTML (like `<p>`, `<strong>`, etc.)
6. **Global Fields**: Always present with consistent structure

### Real Example Structure:
```json
[
  {
    "name": "fieldset",
    "style_name": "fieldset",
    "children": [
    {
      "name": "datepicker",
      "style_name": "datepicker",
      "children": [],
      "fields": {
        "label": {
          "de-CH": {
            "content": "Date",
            "meta": null
          },
          "en-GB": {
            "content": "",
            "meta": null
          }
        },
        "is_required": {
          "all": {
            "content": "0",
            "meta": null
          }
        },
        "name": {
          "all": {
            "content": "date",
            "meta": null
          }
        },
        "value": {
          "all": {
            "content": "",
            "meta": null
          }
        },
        "description": {
          "de-CH": {
            "content": "",
            "meta": null
          },
          "en-GB": {
            "content": "",
            "meta": null
          }
        },
        "disabled": {
          "all": {
            "content": "0",
            "meta": null
          }
        }
      },
      "global_fields": {
        "condition": null,
        "data_config": null,
        "css": null,
        "css_mobile": null,
        "debug": false
      }
    }
  ],
  "fields": {
    "label": {
      "de-CH": {
        "content": "Form",
        "meta": null
      },
      "en-GB": {
        "content": "",
        "meta": null
      }
    },
    "disabled": {
      "all": {
        "content": "0",
        "meta": null
      }
    }
  },
  "global_fields": {
    "condition": null,
    "data_config": null,
    "css": null,
    "css_mobile": null,
    "debug": false
  }
  }
]
```

## Legacy Example: Travel Blog Layout

Based on the provided image showing a travel blog layout with multiple articles, here's how to generate the JSON structure:

```json
[
  {
    "name": "Travel Blog Container",
    "style_name": "container",
    "children": [
      {
        "name": "Blog Grid",
        "style_name": "div",
        "children": [
          {
            "name": "Norway Article Card",
            "style_name": "card",
            "children": [
              {
                "name": "Norway Image",
                "style_name": "image",
                "children": [],
                "fields": {
                  "img_src": {
                    "all": {
                      "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
                      "meta": null
                    }
                  },
                  "alt": {
                    "en-GB": {
                      "content": "Beautiful Norwegian landscape with red houses by the sea",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "w-full h-48 object-cover rounded-t-lg",
                      "meta": null
                    }
                  }
                }
              },
              {
                "name": "Norway Article Title",
                "style_name": "heading",
                "children": [],
                "fields": {
                  "level": {
                    "all": {
                      "content": "3",
                      "meta": null
                    }
                  },
                  "title": {
                    "en-GB": {
                      "content": "Top 10 places to visit in Norway this summer",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "text-xl font-semibold p-4 pb-2",
                      "meta": null
                    }
                  }
                }
              }
            ],
            "fields": {
              "css": {
                "all": {
                  "content": "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
                  "meta": null
                }
              }
            }
          },
          {
            "name": "Forest Article Card",
            "style_name": "card",
            "children": [
              {
                "name": "Forest Image",
                "style_name": "image",
                "children": [],
                "fields": {
                  "img_src": {
                    "all": {
                      "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
                      "meta": null
                    }
                  },
                  "alt": {
                    "en-GB": {
                      "content": "Misty forest with sunlight streaming through trees",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "w-full h-48 object-cover rounded-t-lg",
                      "meta": null
                    }
                  }
                }
              },
              {
                "name": "Forest Article Title",
                "style_name": "heading",
                "children": [],
                "fields": {
                  "level": {
                    "all": {
                      "content": "3",
                      "meta": null
                    }
                  },
                  "title": {
                    "en-GB": {
                      "content": "Best forests to visit in North America",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "text-xl font-semibold p-4 pb-2",
                      "meta": null
                    }
                  }
                }
              }
            ],
            "fields": {
              "css": {
                "all": {
                  "content": "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
                  "meta": null
                }
              }
            }
          },
          {
            "name": "Hawaii Article Card",
            "style_name": "card",
            "children": [
              {
                "name": "Hawaii Beach Image",
                "style_name": "image",
                "children": [],
                "fields": {
                  "img_src": {
                    "all": {
                      "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
                      "meta": null
                    }
                  },
                  "alt": {
                    "en-GB": {
                      "content": "Pristine Hawaiian beach with turquoise water",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "w-full h-48 object-cover rounded-t-lg",
                      "meta": null
                    }
                  }
                }
              },
              {
                "name": "Hawaii Article Title",
                "style_name": "heading",
                "children": [],
                "fields": {
                  "level": {
                    "all": {
                      "content": "3",
                      "meta": null
                    }
                  },
                  "title": {
                    "en-GB": {
                      "content": "Hawaii beaches review: better than you think",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "text-xl font-semibold p-4 pb-2",
                      "meta": null
                    }
                  }
                }
              }
            ],
            "fields": {
              "css": {
                "all": {
                  "content": "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
                  "meta": null
                }
              }
            }
          },
          {
            "name": "Mountains Article Card",
            "style_name": "card",
            "children": [
              {
                "name": "Mountains Night Image",
                "style_name": "image",
                "children": [],
                "fields": {
                  "img_src": {
                    "all": {
                      "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
                      "meta": null
                    }
                  },
                  "alt": {
                    "en-GB": {
                      "content": "Mountain landscape at night with starry sky",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "w-full h-48 object-cover rounded-t-lg",
                      "meta": null
                    }
                  }
                }
              },
              {
                "name": "Mountains Article Title",
                "style_name": "heading",
                "children": [],
                "fields": {
                  "level": {
                    "all": {
                      "content": "3",
                      "meta": null
                    }
                  },
                  "title": {
                    "en-GB": {
                      "content": "Mountains at night: 12 best locations to enjoy the view",
                      "meta": null
                    }
                  },
                  "css": {
                    "all": {
                      "content": "text-xl font-semibold p-4 pb-2",
                      "meta": null
                    }
                  }
                }
              }
            ],
            "fields": {
              "css": {
                "all": {
                  "content": "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
                  "meta": null
                }
              }
            }
          }
        ],
        "fields": {
          "css": {
            "all": {
              "content": "grid grid-cols-1 md:grid-cols-2 gap-6",
              "meta": null
            }
          }
        }
      }
    ],
    "fields": {
      "css": {
        "all": {
          "content": "container mx-auto px-4 py-8 max-w-6xl",
          "meta": null
        }
      }
    }
  }
]
```

## Important Notes for AI Generation

### System-Specific Requirements:
1. **Section Naming**: Always use `style_name` format (e.g., "html-tag")
2. **Boolean Values**: Always use string values `"0"` or `"1"`, never boolean `true`/`false`
3. **Fields Structure**: Can be empty array `[]` or object with field definitions
4. **Language Keys**: Use `"de-CH"`, `"en-GB"`, `"all"` - match the real export patterns
5. **Meta Field**: Always set `"meta": null` in field content objects
6. **Global Fields**: Always include the complete global_fields structure

### Content Guidelines:
1. **Image Sources**: Use real URLs or `uploads/assets/general/image-holder.png` for uploaded images
2. **HTML Content**: Rich text fields can contain HTML tags like `<p>`, `<strong>`, `<hr>`
3. **Form Fields**: Use the exact field names from real export data
4. **CSS Classes**: Apply Tailwind classes in `global_fields.css` for styling
5. **Dark Mode**: Include dark mode variants (`dark:`) for all color-related classes

### Style Selection Guidelines:
1. **Mantine First**: Prefer Mantine UI styles (`use_mantine_style: "1"`) for modern components
2. **Form Components**: Use specific Mantine form styles (text-input, file-input, etc.)
3. **Layout Components**: Use flex, grid, stack, container for modern layouts
4. **Custom HTML**: Use `html-tag` style only for very custom layouts that Mantine cannot support
5. **Legacy Styles**: Use legacy styles only when modern equivalents don't exist

### Validation Checklist:
- [ ] **Framework Specified**: First word is either "mantine" or "tailwind"
- [ ] **Framework Compliance**:
  - **Mantine**: Uses appropriate Mantine components, Mantine properties first, minimal Tailwind CSS
  - **Tailwind**: Uses only core components (html-tag, image, button, form inputs), Tailwind CSS for all styling
- [ ] **Spacing Fields**: Uses proper Mantine spacing fields (`mantine_gap`, `mantine_spacing_margin_padding`) instead of CSS margin/padding classes
- [ ] **Complete JSON Array**: Output must be wrapped in `[]` containing all sections
- [ ] **TypeScript Compliance**: Field names and values match `styles.types.ts` exactly
- [ ] **Content Completeness**: All translatable fields have content in both "en-GB" and "de-CH" languages
- [ ] **Content Quality**: Professional, comprehensive content (names, descriptions, contact info) suitable for business use
- [ ] Section names follow style format
- [ ] Boolean values are strings "0"/"1"
- [ ] Language structure matches real exports
- [ ] Global fields are complete for every section
- [ ] **Framework-Specific Styling**:
  - **Mantine**: Mantine properties used first, Tailwind only when absolutely necessary
  - **Tailwind**: All styling through `global_fields.css` with Tailwind classes
- [ ] CSS includes dark mode variants when using Tailwind
- [ ] Form fields use correct naming conventions
- [ ] Image sources use valid URLs or asset paths

## Mantine Field Value Reference

### Segment Field Values (Fixed Options)
Segment fields provide mutually exclusive options and have predefined values:

**mantine_orientation**: `horizontal`, `vertical`

**mantine_color_format**: `hex`, `rgba`, `hsla`

**mantine_direction**: `row`, `column`, `row-reverse`, `column-reverse`

**mantine_wrap**: `wrap`, `nowrap`, `wrap-reverse`

**mantine_group_wrap**: `wrap`, `nowrap`, `wrap-reverse`

**mantine_space_direction**: `horizontal`, `vertical`

**mantine_grid_overflow**: `visible`, `hidden`, `scroll`, `auto`

**mantine_number_input_clamp_behavior**: `strict`, `blur`

### Select Field Values (Fixed Options)
Select fields provide dropdown choices with predefined and creatable options:

**mantine_variant**: `filled`, `light`, `outline`, `subtle`, `default`, `transparent`, `white`

**mantine_size**: `xs`, `sm`, `md`, `lg`, `xl`

**mantine_radius**: `none`, `xs`, `sm`, `md`, `lg`, `xl`

**mantine_gap**: `0`, `xs`, `sm`, `md`, `lg`, `xl`

**mantine_justify**: `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly`

**mantine_align**: `flex-start`, `center`, `flex-end`, `stretch`, `baseline`

**mantine_width**: `25%`, `50%`, `75%`, `100%`, `auto`, `fit-content`, `max-content`, `min-content` (+ creatable)

**mantine_height**: `25%`, `50%`, `75%`, `100%`, `auto`, `fit-content`, `max-content`, `min-content` (+ creatable)

**mantine_tooltip_position**: `top`, `bottom`, `left`, `right`, `top-start`, `top-end`, `bottom-start`, `bottom-end`, `left-start`, `left-end`, `right-start`, `right-end`

**mantine_numeric_min**: `0`, `1`, `10`, `100` (+ creatable)

**mantine_numeric_max**: `10`, `100`, `1000`, `10000` (+ creatable)

**mantine_numeric_step**: `0.1`, `0.5`, `1`, `5`, `10` (+ creatable)

**mantine_icon_size**: `14`, `16`, `18`, `20`, `24`, `32` (+ creatable)

**mantine_control_size**: `14`, `16`, `18`, `20`, `24`, `32` (+ creatable)

**mantine_tabs_variant**: `default`, `outline`, `pills`

**mantine_aspect_ratio**: `1/1`, `4/3`, `16/9`, `21/9`, etc. (+ creatable)

**mantine_chip_variant**: `filled`, `light`, `outline`, `dot`, `light-outline`

**mantine_image_fit**: `contain`, `cover`, `fill`, `none`, `scale-down`

**mantine_radio_label_position**: `right`, `left`

**mantine_fieldset_variant**: `default`, `filled`

**mantine_file_input_accept**: `image/*`, `audio/*`, `video/*`, `.pdf`, `.doc`, `.docx` (+ creatable)

**mantine_file_input_max_size**: `1024`, `5242880`, `10485760`, `20971520` (+ creatable)

**mantine_file_input_max_files**: `1`, `5`, `10`, `20` (+ creatable)

### Slider Field Values (Range Options)
Slider fields provide ranged values with predefined steps:

**mantine_size**: `xs` (smallest) to `xl` (largest)

**mantine_radius**: `none` (sharp) to `xl` (most rounded)

**mantine_gap**: `0` (no gap) to `xl` (largest gap)

### Color Field Values (Mantine Colors)
**mantine_color**: `gray`, `red`, `grape`, `violet`, `blue`, `cyan`, `green`, `lime`, `yellow`, `orange`

### Usage Guidelines for AI Generation

#### When to Use Specific Values:
1. **Size Fields**: Use `md` as default, `sm`/`lg` for smaller/larger variants
2. **Color Fields**: Use `blue` as primary default, `gray` for neutral elements
3. **Variant Fields**: Use `filled` as default for buttons, `light` for subtle elements
4. **Layout Fields**: Use `center` for alignment, `flex-start` for left/top alignment
5. **Spacing Fields**: Use `md` for standard spacing, `sm` for tight, `lg` for loose
6. **Width/Height**: Use `100%` for full width, `auto` for content-based sizing

#### Creatable Fields:
Fields marked with "(+ creatable)" allow custom values beyond the predefined options. For example:
- **mantine_width**: Can use custom percentages like `33.33%` or pixel values like `300px`
- **mantine_numeric_min/max**: Can use any numeric value like `25`, `500`, etc.
- **mantine_icon_size**: Can use any pixel value like `28`, `36`, etc.

#### Common Field Combinations:
```json
// Standard button
"mantine_variant": "filled",
"mantine_color": "blue",
"mantine_size": "md",
"mantine_radius": "md"

// Layout container
"mantine_width": "100%",
"mantine_gap": "md",
"mantine_justify": "center",
"mantine_align": "center"

// Form input
"mantine_size": "md",
"mantine_radius": "md",
"use_mantine_style": "1"
```

### JSON Generation Requirements
**ALWAYS** generate the complete JSON array structure as your final output. The response should be valid JSON that can be directly imported into the SH-SelfHelp CMS system.

**Framework-Specific Output Requirements:**

#### Mantine Framework Output:
```json
[
  {
    "name": "mantine-container",
    "style_name": "container",
    "children": [...],
    "fields": {
      "mantine_size": {"all": {"content": "md", "meta": null}},
      "mantine_fluid": {"all": {"content": "0", "meta": null}},
      "use_mantine_style": {"all": {"content": "1", "meta": null}}
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": null,
      "css_mobile": null,
      "debug": false
    }
  }
]
```

#### Tailwind Framework Output:
```json
[
  {
    "name": "tailwind-container",
    "style_name": "html-tag",
    "children": [...],
    "fields": {
      "html_tag": {"all": {"content": "div", "meta": null}},
      "html_tag_content": {"all": {"content": "<div>Custom content</div>", "meta": null}}
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "container mx-auto px-4 py-8 bg-white dark:bg-gray-900",
      "css_mobile": "px-2 py-4",
      "debug": false
    }
  }
]
```

**Priority Order for Styling by Framework:**

#### Mantine Framework Priority:
1. **Mantine Properties**: Always use Mantine component props first (mantine_size, mantine_color, mantine_variant, etc.)
2. **Mantine Field Values**: Use the predefined values from `styles.types.ts`
3. **Tailwind CSS**: Only in very rare cases when Mantine properties cannot achieve the required result
4. **Custom HTML**: Never use `html-tag` for Mantine framework

#### Tailwind Framework Priority:
1. **Tailwind CSS**: Apply all styling through `global_fields.css` with Tailwind classes
2. **Core Components**: Use only html-tag, image, button, and form inputs
3. **Custom HTML**: Build layouts using html-tag with custom HTML content
4. **Mantine Components**: Never use any Mantine-specific components

**CRITICAL**: Always reference `src/types/common/styles.types.ts` for exact field names and `docs/AI Prompts/ai_generate.md` for framework-specific guidelines when generating JSON structures.
