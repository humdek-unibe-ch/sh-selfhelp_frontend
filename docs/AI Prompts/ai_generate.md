# AI Generation Prompt for SH-SelfHelp CMS Sections

## Overview
This document provides comprehensive instructions for AI models to generate **complete JSON array structures** that can be directly imported into the SH-SelfHelp CMS system. The system uses a hierarchical section-based architecture where each section has a specific style type and configurable fields.

**CRITICAL REQUIREMENTS**:
1. Your final output must be valid JSON in array format `[]` containing all sections
2. Section names use the style_name (e.g., "container", "card", "button")
3. All content must be in both "en-GB" (English) and "de-CH" (German) for translatable fields
4. Use real Mantine field names and values from the actual system (see examples below)
5. Always include complete `global_fields` structure with `condition`, `data_config`, `css`, `css_mobile`, and `debug`
6. Boolean values are ALWAYS strings: `"0"` (false) or `"1"` (true)
7. **DARK AND LIGHT THEME COMPATIBILITY IS MANDATORY** - Every visual element MUST include dark mode variants using `dark:` prefix

## System Architecture

### Complete Page Structure
The entire page content must be wrapped in an array `[]` containing all sections:

```json
[
  {
    "name": "container",
    "style_name": "container",
    "children": [
      {
        "name": "card",
        "style_name": "card",
        "children": [...],
        "fields": {
          "mantine_spacing_margin_padding": {
            "all": {
              "content": "{\"all\":\"xl\"}",
              "meta": null
            }
          },
          "use_mantine_style": {
            "all": {
              "content": "1",
              "meta": null
            }
          }
        },
        "global_fields": {
          "condition": null,
          "data_config": null,
          "css": "hover:shadow-lg transition-all",
          "css_mobile": null,
          "debug": false
        }
      }
    ],
    "fields": {
      "mantine_size": {
        "all": {
          "content": "md",
          "meta": null
        }
      },
      "use_mantine_style": {
        "all": {
          "content": "1",
          "meta": null
        }
      }
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "py-16 px-4",
      "css_mobile": null,
      "debug": false
    }
  }
]
```

**CRITICAL NAMING RULES**:
- **Section Names**: Use descriptive names that reflect the content or style_name (e.g., "hero-section", "team-grid", "contact-form")
- **No Spaces/Special Chars**: Only letters, numbers, hyphens, and underscores allowed
- **Descriptive**: Choose meaningful names that make the structure clear in the admin interface

**Important Notes:**
- **Fields Structure**: Can be empty object `{}` or object with field definitions, but NEVER empty array `[]`
- **Boolean Values**: ALWAYS strings `"0"` (false) or `"1"` (true), never boolean literals
- **Language Codes**: `"en-GB"` and `"de-CH"` for translatable content, `"all"` for technical fields
- **Meta Field**: Always `"meta": null` in field content objects

### Key Principles
1. **Hierarchical Structure**: Sections can contain child sections, creating nested layouts
2. **Style-Based Rendering**: Each section has a `style_name` that determines how it renders
3. **Multi-Language Support**: All field values are organized by language code (e.g., "en-GB", "de-CH")
4. **Field-Based Configuration**: Section behavior is controlled through configurable fields
5. **Global Fields**: Every section includes global_fields for system-wide configuration
6. **CSS Classes**: Styling is applied using Tailwind CSS classes through the `css` field
7. **Mantine UI Integration**: Most styles support both Mantine UI components and custom implementations
8. **Global Style Components**: Form elements (buttons, inputs, etc.) are global and can be used anywhere
9. **CRITICAL - Form Labeling**: `text-input` and `select` components render ONLY the form control without labels. You MUST add separate label components (using `text` style) before each form field for proper accessibility and user experience. `textarea` includes built-in label support when using Mantine UI (`use_mantine_style: "1"`)

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

## Form Composition and Structure

### How Forms Work
Forms in this system are created by combining multiple components within a `form-record` container:

1. **Form Container**: Use `form-record` as the main wrapper
2. **Labels**: Use `text` style components for field labels (required for `text-input`, `select`, `datepicker`)
3. **Form Inputs**: Any form input component (`text-input`, `textarea`, `select`, `datepicker`, etc.)
4. **Buttons**: Use `button` components within the form for submit/reset actions
5. **Layout**: Use layout components (`stack`, `group`, `flex`) to organize form elements

### Form Field Labeling Rules
- **`text-input`**: REQUIRES separate `text` style label component above it
- **`select`**: REQUIRES separate `text` style label component above it
- **`datepicker`**: REQUIRES separate `text` style label component above it
- **`textarea`**: INCLUDES built-in label when using Mantine UI (`use_mantine_style: "1"`)
- **`radio`, `checkbox`, `switch`**: Include their own labels
- **`button`**: Uses its own `label` field for button text

### Date Input Best Practices
**ALWAYS use `datepicker` component instead of `text-input` with `type_input: "date"`** for:
- Better user experience with calendar popup
- Proper date formatting and validation
- Localization support
- Consistent cross-browser behavior

### Form Submission
Forms automatically handle submission when `button` components with appropriate actions are included. The form will:
- Validate required fields
- Submit data to the configured endpoint
- Show success messages
- Handle errors gracefully

## Dark and Light Theme Compatibility - MANDATORY

### **MANDATORY REQUIREMENT**
**EVERY generated component MUST be fully compatible with both dark and light themes.** This is not optional - it is a critical system requirement.

### Core Dark Mode Principles
1. **Every visual element** must include dark mode variants using the `dark:` prefix
2. **No exceptions** - all backgrounds, text colors, borders, and interactive states must have dark variants
3. **Consistent color mapping** - use established dark mode color pairs
4. **Test mentally** - visualize how each element looks in both themes before finalizing

### Essential Dark Mode Color Mappings
```css
/* Backgrounds */
bg-white dark:bg-gray-900          /* Primary backgrounds */
bg-gray-50 dark:bg-gray-800        /* Secondary backgrounds */
bg-gray-100 dark:bg-gray-700       /* Tertiary backgrounds */

/* Text Colors */
text-gray-900 dark:text-white      /* Primary text */
text-gray-700 dark:text-gray-300   /* Secondary text */
text-gray-600 dark:text-gray-400   /* Tertiary text */

/* Borders */
border-gray-200 dark:border-gray-700   /* Light borders */
border-gray-300 dark:border-gray-600   /* Medium borders */

/* Interactive Elements */
hover:bg-gray-50 dark:hover:bg-gray-800    /* Hover states */
focus:ring-gray-300 dark:focus:ring-gray-600  /* Focus states */
```

### Standard Tailwind Dark Mode Usage
**Use standard Tailwind `dark:` prefix for all dark mode classes:**

```json
"css": "bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
```

**How it works:**
- `bg-white`: Light background (default)
- `dark:bg-gray-900`: Dark background when `dark` class is on `<html>`
- `text-gray-900`: Dark text (default)
- `dark:text-white`: Light text when `dark` class is on `<html>`

### Dark Mode Implementation Checklist
**Before finalizing any component, verify:**
- [ ] All background colors have `dark:` variants
- [ ] All text colors have `dark:` variants
- [ ] All border colors have `dark:` variants
- [ ] All hover states have `dark:` variants
- [ ] All focus states have `dark:` variants
- [ ] All shadow colors have `dark:` variants
- [ ] Container backgrounds are theme-aware
- [ ] Card backgrounds are theme-aware
- [ ] Button variants work in both themes

### Common Dark Mode Mistakes to Avoid
- ❌ Missing `dark:` variants on any visual elements
- ❌ Using light-only colors (white, black) without variants
- ❌ Inconsistent color mapping across components
- ❌ Forgetting hover/focus states in dark mode
- ❌ Using insufficient contrast in dark mode

### Dark Mode Testing Visualization
When generating components, mentally test:
1. **Light Theme**: Does everything look good on white/light backgrounds?
2. **Dark Theme**: Does everything maintain proper contrast and readability?
3. **Transitions**: Do hover states and interactions work in both themes?
4. **Consistency**: Are colors consistent with the established design system?

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
- **container**: Responsive container with Mantine fluid/fixed width options. Perfect for page layouts, content wrappers, and responsive design. Supports fluid width for full-width layouts or fixed max-width containers. Use for main content areas and page structure.
- **center**: Centers content horizontally and vertically. Ideal for hero sections, loading states, empty states, and centered content blocks. Automatically centers both inline and block content.
- **flex**: Flexbox layout with direction, justify, align controls. Advanced flexbox container supporting all flex properties. Use for horizontal/vertical layouts, navigation bars, button groups, and complex alignments.
- **group**: Horizontal group layout with spacing. Simple horizontal layout with consistent spacing between child elements. Perfect for button groups, navigation items, and inline element collections.
- **stack**: Vertical stack layout with spacing. Vertical layout container with customizable gaps. Ideal for forms, content sections, and vertical content flows.
- **simple-grid**: CSS Grid with responsive columns. Responsive grid system that automatically adjusts columns based on screen size. Perfect for card layouts, galleries, and responsive content grids.
- **grid**: Advanced CSS Grid with column spans. Full-featured CSS Grid supporting custom column spans, row spans, and complex grid layouts. For advanced grid-based designs.
- **grid-column**: Grid column with span/offset controls. Individual grid column component for custom grid layouts within grid containers.
- **space**: Spacing component. Invisible spacing element for adding gaps between components without visual elements.
- **aspect-ratio**: Maintains aspect ratio for content. Forces content to maintain specific aspect ratios (16:9, 4:3, square, etc.). Perfect for video containers, image placeholders, and responsive media.
- **background-image**: Background image container. Container with background image support. Use for hero banners, section backgrounds, and image overlays.
- **divider**: Visual divider with variants and orientation. Horizontal/vertical dividers with different styles. Perfect for separating content sections, form groups, and navigation items.
- **paper**: Elevated surface with shadow and radius. Material Design-style elevated surface with customizable shadows and border radius. Use for cards, panels, and elevated content.
- **fieldset**: Form fieldset with legend. Form grouping component with legend/label. Perfect for organizing form sections and grouping related fields.
- **box**: Basic container with background, border, and text colors. Simple container with customizable background, borders, and text colors. Use for custom styling and basic containers.
- **card**: Card component with segments, shadows, and padding. Material Design card with header, body, and footer sections. Perfect for content cards, product cards, and information displays.
- **card-segment**: Card content sections. Individual sections within cards for header, body, and footer content.

### Content & Text Styles
- **text**: Plain text with typography controls and optional paragraph wrapping. Uses `text` field. Simple text display with customizable typography. Use for labels, descriptions, and plain content.
- **code**: Inline and block code with syntax highlighting. Supports multiple programming languages. Perfect for code examples, technical content, and developer documentation.
- **highlight**: Text highlighting with customizable colors and marks. Uses `text` and `mantine_highlight_highlight` fields. Perfect for emphasizing important text, search results, and key terms.
- **blockquote**: Blockquote with optional icon and citation. Elegant quote styling with author attribution. Perfect for testimonials, quotes, and highlighted content.
- **title**: Large title component with size variants and alignment options. Uses `content` and `mantine_title_order` fields. Perfect for page titles, hero headings, and prominent text displays.
- **typography**: Typography wrapper for consistent text styling. Applies consistent typography rules across content blocks.

### Media Styles
- **image**: Responsive images with alt text, titles, and sizing controls. Uses `img_src`, `alt`, `title`, `is_fluid` fields. Supports external URLs, uploaded assets, and responsive sizing. Perfect for hero images, content images, and visual content. Includes lazy loading and optimization.
- **carousel**: Image carousel with navigation controls, indicators, and autoplay. Uses `sources` array for multiple images. Supports crossfade effects, custom controls, and responsive design. Perfect for image galleries, product showcases, and testimonials.
- **video**: Video player with multiple source support and responsive design. Uses `sources` array for different video formats. Includes custom controls, poster images, and accessibility features. Perfect for video content, tutorials, and media-rich pages.
- **audio**: Audio player with multiple source support and custom controls. Uses `sources` array for different audio formats. Includes playback controls, progress bars, and volume controls. Perfect for podcasts, music, and audio content.
- **figure**: Image with caption and optional figcaption. Combines image display with descriptive text. Perfect for diagrams, illustrations, and images that need explanation.
- **avatar**: User avatar with image, alt text, and fallback initials. Supports various sizes and shapes. Perfect for user profiles, comments, and user identification.
- **background-image**: Background image container with overlay support. Uses for hero sections, banners, and background imagery with content overlays.

### Interactive Elements
- **button**: Action button with navigation, confirmations, and multiple styles. Uses `label`, `page_keyword`, `open_in_new_tab`, `disabled`, `confirmation_*` fields. Supports variants (filled, light, outline, subtle), colors, sizes, and custom confirmation dialogs. Perfect for form submissions, navigation, and user actions. Supports both Mantine UI and custom HTML rendering.
- **link**: Navigation link with custom styling and target options. Uses `label`, `url`, `open_in_new_tab` fields. Perfect for external links, internal navigation, and text-based navigation elements.
- **actionIcon**: Icon button with navigation and actions. Compact icon-only buttons with hover states and accessibility. Perfect for toolbar actions, card actions, and compact interfaces.
- **action-icon**: Alternative action icon component with extended functionality. Enhanced icon buttons with additional customization options.

### Form Elements
**IMPORTANT**: Form elements can be combined within `form-record` containers to create complete forms. Forms automatically include submit/reset functionality and can contain any combination of form inputs plus `button` components for actions. Always use `text` style for labels above form inputs.**

- **form-record**: Record creation/editing form container. Wraps multiple form inputs and buttons. Uses `alert_success`, `name`, `is_log` fields. Automatically handles form submission, validation, and success messages. Can contain any form inputs plus button components.
- **form-log**: Form logging container for tracking user interactions and form submissions.
- **text-input**: Text input field with Mantine styling. Renders only the input field without label. **REQUIRES separate `text` style label component**. Supports all HTML input types (text, email, password, number, tel, url, etc.) via `type_input` field.
- **textarea**: Multi-line text input with rich editor option. **INCLUDES built-in label when using Mantine UI** (`use_mantine_style: "1"`). Supports markdown editing and plain text modes.
- **select**: Dropdown selection with search and multiple selection. Renders only the select field without label. **REQUIRES separate `text` style label component**. Supports single/multiple selection, search, and custom options arrays.
- **input**: Legacy input field (deprecated - use text-input instead).
- **radio**: Radio button group with custom options. Perfect for single-choice selections from multiple options.
- **checkbox**: Single checkbox with custom values and labels. Perfect for boolean inputs and optional selections.
- **switch**: Toggle switch component. Modern alternative to checkboxes for boolean values.
- **datepicker**: **DEDICATED DATE PICKER COMPONENT** - Use this instead of text-input with type="date". Provides calendar popup, localization, and proper date formatting. **REQUIRES separate `text` style label component**.
- **file-input**: File upload with drag & drop support. Supports single/multiple file uploads with validation.
- **rich-text-editor**: WYSIWYG editor for rich content creation. Perfect for content management and formatted text input.
- **combobox**: Advanced select with create/search functionality. Combines dropdown with text input for dynamic option creation.
- **chip**: Chip/toggle component for tag-like selections.
- **slider**: Range slider with marks and labels. Perfect for numeric ranges and value selection.
- **range-slider**: Dual-handle range slider for min/max value selection.
- **numberInput**: Numeric input with validation and increment/decrement controls.
- **number-input**: Alternative numeric input component with extended functionality.
- **color-input**: Color picker input with palette and custom color selection.
- **color-picker**: Standalone color picker component.

### Navigation & Lists
- **tabs**: Tab container that organizes content into tabbed sections. Requires child `tab` components. Perfect for organizing related content, settings panels, and multi-step processes.
- **tab**: Individual tab component with label and associated content. Used within `tabs` containers. Each tab can contain any type of content or components.
- **accordion**: Collapsible sections for organizing content hierarchically. Perfect for FAQs, documentation, and progressive disclosure of information.
- **accordion-Item**: Individual accordion item with header and collapsible content. Used within accordion containers for expandable sections.
- **list**: Ordered and unordered lists with customizable styling. Supports nested lists and various bullet/number styles.
- **list-item**: Individual list item with optional icons and rich content. Supports text, images, and complex content within list structures.

### Data Display
- **timeline**: Timeline component with chronological items and connecting bullets. Perfect for displaying events, history, and step-by-step processes in chronological order.
- **timeline-item**: Individual timeline entry with title, content, and bullet styling. Used within timeline containers to represent specific events or milestones.
- **progress**: Progress bar showing completion percentage. Supports various styles, colors, and animation options.
- **progress-root**: Progress container for custom progress implementations and complex progress displays.
- **progress-section**: Multi-section progress bar for displaying progress across multiple stages or categories.
- **badge**: Status badge with variants and colors. Perfect for displaying status indicators, labels, and small information badges.
- **indicator**: Notification indicator for showing counts, status, or alerts. Perfect for unread messages, notifications, and status updates.
- **kbd**: Keyboard key display component. Perfect for displaying keyboard shortcuts and key combinations.
- **rating**: Star rating component with interactive rating selection. Perfect for reviews, feedback, and rating systems.
- **theme-icon**: Themed icon container with consistent sizing and theming. Perfect for icon collections and themed icon displays.
- **avatar**: User avatar with image, alt text, and fallback initials. Supports various sizes and shapes for user identification.
- **chip**: Chip/toggle component for selections and tags. Perfect for filtering, selections, and tag displays.

### Feedback Components
- **alert**: Alert/notification box with multiple variants (primary, secondary, success, danger, warning, info, light, dark). Perfect for displaying important messages, warnings, and status updates.
- **notification**: Toast-style notification system. Perfect for temporary messages, success confirmations, and non-intrusive alerts.

### Utility & Advanced
- **html-tag**: Custom HTML with arbitrary tags and content. For advanced layouts that need specific HTML structure. Use `html_tag` and `html_tag_content` fields for custom markup.
- **scroll-area**: Scrollable container with custom scrollbar styling. Perfect for content that exceeds container height and needs scrolling.
- **spoiler**: Collapsible content spoiler with show/hide functionality. Perfect for hiding spoilers, additional details, or expandable content.
- **segmented-control**: Segmented control for option selection. Perfect for switching between related options or views.
- **typography**: Typography wrapper for consistent text styling and theming across content blocks.

### Legacy/Custom Styles
**Note**: These are legacy components. Prefer modern Mantine UI equivalents when possible.**

- **input**: Basic input field (legacy - use `text-input` instead for better Mantine integration)
- **entryList**: Data list display for showing collections of records (legacy data component)
- **entryRecord**: Data record display for individual record viewing (legacy data component)
- **entryRecordDelete**: Delete confirmation for data records (legacy data component)
- **version**: Version information display component (legacy utility)
- **loop**: Content loop for repeating content based on data (legacy data component)
- **dataContainer**: Generic data container for dynamic content (legacy data component)
- **refContainer**: Reference container for data relationships and linked content (legacy data component)
- **validate**: Form validation component for input validation (legacy form component)
- **profile**: User profile management form component (legacy auth component)
- **login**: User login form component (legacy auth component)
- **register**: User registration form component (legacy auth component)
- **twoFactorAuth**: Two-factor authentication form component (legacy auth component)


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

**text-input**:
- **IMPORTANT**: This component renders only the input field without any label. You must add a separate label element (using `text` style) before the input field for accessibility and user experience.
- `type_input`: Input type (text/email/password/number/date/etc.)
- `placeholder`: Placeholder text
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default value
- `min`: Minimum value (for numbers/dates)
- `max`: Maximum value (for numbers/dates)
- `format`: Input format validation
- `locked_after_submit`: "1" if locked after form submission
- **Usage Pattern**: Always pair with a separate label component (e.g., `text` style) for proper form labeling

**textarea**:
- `label`: Textarea label (when using Mantine UI - `use_mantine_style: "1"`)
- `placeholder`: Placeholder text
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default value
- `min`: Minimum character count
- `max`: Maximum character count
- `locked_after_submit`: "1" if locked after form submission
- `markdown_editor`: "1" to enable markdown editor
- **Note**: Unlike `text-input` and `select`, `textarea` includes built-in label support when using Mantine UI (`use_mantine_style: "1"`)

**select**:
- **IMPORTANT**: This component renders only the select dropdown without any label. You must add a separate label element (using `text` style) before the select field for accessibility and user experience.
- `alt`: Placeholder text for select (shown as first empty option when not required)
- `is_required`: "1" if required
- `name`: Form field name
- `value`: Default selected value (comma-separated for multiple selection)
- `options`: JSON string array of options (e.g., "[{\"value\": \"val\", \"label\": \"Display Text\"}]")
- `is_multiple`: "1" for multiple selection
- `max`: Maximum number of selections (for multiple)
- `live_search`: "1" to enable search
- `disabled`: "1" if disabled
- `image_selector`: "1" for image selection mode
- `locked_after_submit`: "1" if locked after form submission
- `allow_clear`: "1" to allow clearing selection
- **Usage Pattern**: Always pair with a separate label component (e.g., `text` style) for proper form labeling

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

## Real-World Examples (From Actual System Exports)

### Example 1: Team Page Layout with Cards
```json
[
  {
    "name": "team-container",
    "style_name": "container",
    "children": [
      {
        "name": "team-header",
        "style_name": "stack",
        "children": [
          {
            "name": "team-title",
            "style_name": "title",
            "children": [],
            "fields": {
              "use_mantine_style": {
                "all": {
                  "content": "1",
                  "meta": null
                }
              },
              "content": {
                "de-CH": {
                  "content": "Lernen Sie unser Führungsteam kennen",
                  "meta": null
                },
                "en-GB": {
                  "content": "Meet Our Executive Team",
                  "meta": null
                }
              },
              "mantine_title_order": {
                "all": {
                  "content": "2",
                  "meta": null
                }
              }
            },
            "global_fields": {
              "condition": null,
              "data_config": null,
              "css": "text-center",
              "css_mobile": null,
              "debug": false
            }
          }
        ],
        "fields": {
          "mantine_gap": {
            "all": {
              "content": "lg",
              "meta": null
            }
          },
          "mantine_justify": {
            "all": {
              "content": "center",
              "meta": null
            }
          },
          "mantine_align": {
            "all": {
              "content": "center",
              "meta": null
            }
          }
        },
        "global_fields": {
          "condition": null,
          "data_config": null,
          "css": "mb-16",
          "css_mobile": "mb-12",
          "debug": false
        }
      },
      {
        "name": "team-grid",
        "style_name": "simple-grid",
        "children": [
          {
            "name": "team-member-card",
            "style_name": "card",
            "children": [
              {
                "name": "member-image-container",
                "style_name": "stack",
                "children": [
                  {
                    "name": "member-image",
                    "style_name": "image",
                    "children": [],
                    "fields": {
                      "is_fluid": {
                        "all": {
                          "content": "1",
                          "meta": null
                        }
                      },
                      "alt": {
                        "de-CH": {
                          "content": "Dr. Sarah Müller - Geschäftsführerin & Gründerin",
                          "meta": null
                        },
                        "en-GB": {
                          "content": "Dr. Sarah Müller - CEO & Founder",
                          "meta": null
                        }
                      },
                      "img_src": {
                        "all": {
                          "content": "http://127.0.0.1/selfhelp/assets/image-holder.png",
                          "meta": null
                        }
                      },
                      "mantine_radius": {
                        "all": {
                          "content": "lg",
                          "meta": null
                        }
                      },
                      "use_mantine_style": {
                        "all": {
                          "content": "1",
                          "meta": null
                        }
                      }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "aspect-square object-cover",
                      "css_mobile": null,
                      "debug": false
                    }
                  }
                ],
                "fields": {
                  "mantine_spacing_margin_padding": {
                    "all": {
                      "content": "{\"bottom\":\"lg\"}",
                      "meta": null
                    }
                  }
                },
                "global_fields": {
                  "condition": null,
                  "data_config": null,
                  "css": "",
                  "css_mobile": null,
                  "debug": false
                }
              }
            ],
            "fields": {
              "mantine_spacing_margin_padding": {
                "all": {
                  "content": "{\"all\":\"xl\"}",
                  "meta": null
                }
              },
              "mantine_border": {
                "all": {
                  "content": "0",
                  "meta": null
                }
              },
              "mantine_radius": {
                "all": {
                  "content": "xl",
                  "meta": null
                }
              },
              "use_mantine_style": {
                "all": {
                  "content": "1",
                  "meta": null
                }
              },
              "mantine_card_shadow": {
                "all": {
                  "content": "md",
                  "meta": null
                }
              }
            },
            "global_fields": {
              "condition": null,
              "data_config": null,
              "css": "hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700",
              "css_mobile": null,
              "debug": false
            }
          }
        ],
        "fields": {
          "use_mantine_style": {
            "all": {
              "content": "1",
              "meta": null
            }
          },
          "mantine_cols": {
            "all": {
              "content": "3",
              "meta": null
            }
          },
          "mantine_vertical_spacing": {
            "all": {
              "content": "xl",
              "meta": null
            }
          }
        },
        "global_fields": {
          "condition": null,
          "data_config": null,
          "css": "max-w-7xl",
          "css_mobile": null,
          "debug": false
        }
      }
    ],
    "fields": {
      "mantine_size": {
        "all": {
          "content": "md",
          "meta": null
        }
      },
      "use_mantine_style": {
        "all": {
          "content": "1",
          "meta": null
        }
      },
      "mantine_fluid": {
        "all": {
          "content": "0",
          "meta": null
        }
      }
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "py-16 px-4 bg-gray-50 dark:bg-gray-900",
      "css_mobile": "py-8 px-4",
      "debug": false
    }
  }
]
```

### Example 2: Form with Multiple Input Types (Properly Labeled)
**IMPORTANT**: This example shows the CORRECT way to create forms with input/select components. Each input/select MUST have a separate label component for accessibility and proper form structure. **Note**: This example has some issues - see the improved Example 3 below for better practices.**

### Example 3: Improved Task Form (Correct Implementation)
**This example shows the proper way to create forms with labels, datepicker, and button integration.**

**Best Practices Demonstrated:**
- Use `text` style for labels above `text-input`, `select`, and `datepicker` fields
- Use `datepicker` component (not `text-input` with `type_input: "date"`)
- Include `button` components within `form-record` for form submission
- Use proper form field naming with `name` field for each input
- Set `is_required: "1"` for mandatory fields
- Always include `use_mantine_style: "1"` for modern UI components

```json
[
  {
    "name": "task-form-container",
    "style_name": "container",
    "children": [
      {
        "name": "task-form-card",
        "style_name": "card",
        "children": [
          {
            "name": "form-stack",
            "style_name": "stack",
            "children": [
              {
                "name": "form-title",
                "style_name": "title",
                "children": [],
                "fields": {
                  "content": {
                    "en-GB": { "content": "Create Task", "meta": null },
                    "de-CH": { "content": "Aufgabe erstellen", "meta": null }
                  },
                  "mantine_title_order": { "all": { "content": "2", "meta": null } },
                  "use_mantine_style": { "all": { "content": "1", "meta": null } }
                },
                "global_fields": {
                  "condition": null,
                  "data_config": null,
                  "css": "text-center mb-6",
                  "css_mobile": null,
                  "debug": false
                }
              },
              {
                "name": "task-form-record",
                "style_name": "form-record",
                "children": [
                  {
                    "name": "class-label",
                    "style_name": "text",
                    "children": [],
                    "fields": {
                      "text": {
                        "en-GB": { "content": "Class *", "meta": null },
                        "de-CH": { "content": "Klasse *", "meta": null }
                      }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "font-medium mb-2",
                      "css_mobile": null,
                      "debug": false
                    }
                  },
                  {
                    "name": "class-select",
                    "style_name": "select",
                    "children": [],
                    "fields": {
                      "alt": {
                        "en-GB": { "content": "Select class...", "meta": null },
                        "de-CH": { "content": "Klasse wählen...", "meta": null }
                      },
                      "is_required": { "all": { "content": "1", "meta": null } },
                      "name": { "all": { "content": "class", "meta": null } },
                      "options": {
                        "all": {
                          "content": "[{\"value\":\"9a\",\"label\":\"9a\"},{\"value\":\"9b\",\"label\":\"9b\"}]",
                          "meta": null
                        }
                      },
                      "use_mantine_style": { "all": { "content": "1", "meta": null } }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "mb-4",
                      "css_mobile": null,
                      "debug": false
                    }
                  },
                  {
                    "name": "date-label",
                    "style_name": "text",
                    "children": [],
                    "fields": {
                      "text": {
                        "en-GB": { "content": "Due Date *", "meta": null },
                        "de-CH": { "content": "Fälligkeitsdatum *", "meta": null }
                      }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "font-medium mb-2",
                      "css_mobile": null,
                      "debug": false
                    }
                  },
                  {
                    "name": "date-datepicker",
                    "style_name": "datepicker",
                    "children": [],
                    "fields": {
                      "placeholder": {
                        "en-GB": { "content": "Select due date", "meta": null },
                        "de-CH": { "content": "Datum wählen", "meta": null }
                      },
                      "name": { "all": { "content": "due_date", "meta": null } },
                      "is_required": { "all": { "content": "1", "meta": null } },
                      "use_mantine_style": { "all": { "content": "1", "meta": null } }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "mb-6",
                      "css_mobile": null,
                      "debug": false
                    }
                  },
                  {
                    "name": "submit-button",
                    "style_name": "button",
                    "children": [],
                    "fields": {
                      "label": {
                        "en-GB": { "content": "Create Task", "meta": null },
                        "de-CH": { "content": "Aufgabe erstellen", "meta": null }
                      },
                      "mantine_variant": { "all": { "content": "filled", "meta": null } },
                      "mantine_color": { "all": { "content": "green", "meta": null } },
                      "mantine_size": { "all": { "content": "md", "meta": null } },
                      "use_mantine_style": { "all": { "content": "1", "meta": null } }
                    },
                    "global_fields": {
                      "condition": null,
                      "data_config": null,
                      "css": "w-full",
                      "css_mobile": null,
                      "debug": false
                    }
                  }
                ],
                "fields": {
                  "alert_success": {
                    "en-GB": { "content": "Task created successfully!", "meta": null },
                    "de-CH": { "content": "Aufgabe erfolgreich erstellt!", "meta": null }
                  },
                  "name": { "all": { "content": "task_form", "meta": null } },
                  "is_log": { "all": { "content": "0", "meta": null } }
                },
                "global_fields": {
                  "condition": null,
                  "data_config": null,
                  "css": "space-y-4",
                  "css_mobile": null,
                  "debug": false
                }
              }
            ],
            "fields": {
              "mantine_gap": { "all": { "content": "lg", "meta": null } },
              "use_mantine_style": { "all": { "content": "1", "meta": null } }
            },
            "global_fields": {
              "condition": null,
              "data_config": null,
              "css": "",
              "css_mobile": null,
              "debug": false
            }
          }
        ],
        "fields": {
          "mantine_spacing_margin_padding": { "all": { "content": "{\"all\":\"xl\"}", "meta": null } },
          "mantine_card_shadow": { "all": { "content": "md", "meta": null } },
          "mantine_radius": { "all": { "content": "lg", "meta": null } },
          "use_mantine_style": { "all": { "content": "1", "meta": null } }
        },
        "global_fields": {
          "condition": null,
          "data_config": null,
          "css": "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md",
          "css_mobile": null,
          "debug": false
        }
      }
    ],
    "fields": {
      "mantine_size": { "all": { "content": "md", "meta": null } },
      "use_mantine_style": { "all": { "content": "1", "meta": null } },
      "mantine_fluid": { "all": { "content": "0", "meta": null } }
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "max-w-2xl mx-auto py-12 px-6",
      "css_mobile": "px-4 py-6",
      "debug": false
    }
  }
]
```

## Real-World Examples (From Actual System Exports)

Based on the actual exported page data, here are the critical patterns to follow:
                "en-GB": {
                  "content": "",
                  "meta": null
                }
              },
              "placeholder": {
                "de-CH": {
                  "content": "",
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
                  "content": "text",
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
          },
          {
            "name": "newsletter-checkbox",
            "style_name": "checkbox",
            "children": [],
            "fields": {
              "label": {
                "de-CH": {
                  "content": "check",
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
                  "content": "check",
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
              },
              "checkbox_value": {
                "all": {
                  "content": "dfff",
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
          },
          {
            "name": "notification-switch",
            "style_name": "switch",
            "children": [],
            "fields": {
              "label": {
                "de-CH": {
                  "content": "switch",
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
                  "content": "switch",
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
          "alert_success": {
            "de-CH": {
              "content": "Record saved successfully!",
              "meta": null
            },
            "en-GB": {
              "content": "",
              "meta": null
            }
          },
          "name": {
            "all": {
              "content": "record",
              "meta": null
            }
          },
          "is_log": {
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
      },
      "mantine_spacing_margin_padding": {
        "all": {
          "content": "{\"mt\":\"xl\",\"mb\":\"xl\",\"me\":\"xl\",\"ms\":\"xl\"}",
          "meta": null
        }
      },
      "mantine_radius": {
        "all": {
          "content": "sm",
          "meta": null
        }
      },
      "use_mantine_style": {
        "all": {
          "content": "1",
          "meta": null
        }
      },
      "mantine_fieldset_variant": {
        "all": {
          "content": "default",
          "meta": null
        }
      }
    },
    "global_fields": {
      "condition": null,
      "data_config": null,
      "css": "hover:shadow-lg",
      "css_mobile": null,
      "debug": false
    }
  }
]
```

## Real Data Patterns & Best Practices

Based on the actual exported page data, here are the critical patterns to follow:

### Critical Patterns from Real Data:
1. **Section Names**: MUST follow `{style_name}-{timestamp}` pattern (e.g., "fieldset-1757924762")
2. **Fields Structure**: Can be `{}` (empty object) or object with fields, but NEVER `[]` (empty array)
3. **Boolean Values**: ALWAYS strings `"0"` (false) or `"1"` (true), never boolean literals
4. **Language Keys**: `"en-GB"` and `"de-CH"` for translatable content, `"all"` for technical fields
5. **Meta Field**: Always `"meta": null` in every field content object
6. **Global Fields**: Always include complete structure: `condition`, `data_config`, `css`, `css_mobile`, `debug`
7. **Mantine Fields**: Use real field names like `mantine_spacing_margin_padding`, `mantine_card_shadow`, etc.
8. **Spacing JSON**: Complex spacing uses JSON strings with specific structures
9. **Descriptive Names**: Use meaningful section names for admin interface clarity
10. **Form Fields**: Always include `is_required`, `disabled`, `name` for form inputs

### Essential Rules for AI Generation:
- **NEVER use empty arrays `[]` for fields** - use empty objects `{}` or populated objects
- **ALWAYS use string booleans** - `"0"` and `"1"` only, never `true`/`false`
- **ALWAYS include both languages** - `en-GB` and `de-CH` for translatable fields
- **ALWAYS include `meta: null`** - in every field content object
- **ALWAYS use Mantine components** - `use_mantine_style: "1"` is preferred
- **ALWAYS use descriptive naming** - Choose meaningful section names
- **ALWAYS include complete global_fields** - all 5 fields required

## Final Generation Checklist

Before outputting your JSON, verify all requirements are met:

- [ ] **Framework**: First word is "mantine" (Tailwind is legacy)
- [ ] **Array Format**: Output is valid JSON array `[]`
- [ ] **Section Names**: Descriptive names without timestamps (e.g., "hero-section", "contact-form")
- [ ] **Languages**: Both "en-GB" and "de-CH" for translatable content
- [ ] **Boolean Values**: Only string `"0"` and `"1"`, never boolean literals
- [ ] **Meta Fields**: Every field content has `"meta": null`
- [ ] **Global Fields**: All sections have complete global_fields structure
- [ ] **Mantine Style**: `use_mantine_style` set to `"1"` for components
- [ ] **Field Structure**: Never use empty arrays `[]` for fields
- [ ] **Real Field Names**: Use actual Mantine field names from examples
- [ ] **Spacing**: Use proper `mantine_spacing_margin_padding` JSON format
- [ ] **Form Fields**: Include required form field properties
- [ ] **CRITICAL - Form Labels**: `text-input`, `select`, and `datepicker` components require separate `text` style label components; `textarea` has built-in labels when using Mantine UI
- [ ] **Form Composition**: Forms use `form-record` containers with proper label + input pairs and `button` components for actions
- [ ] **Date Inputs**: Use `datepicker` component instead of `text-input` with `type_input: "date"`
- [ ] **DARK/LIGHT THEME COMPATIBILITY**: Every visual element has `dark:` variants - this is MANDATORY and cannot be skipped

**REMEMBER**: The examples above are your primary reference. Study them carefully and replicate their exact patterns, field names, and structures in your generated JSON.
