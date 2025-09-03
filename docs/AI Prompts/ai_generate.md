# AI Generation Prompt for SH-SelfHelp CMS Sections

## Overview
This document provides comprehensive instructions for AI models to generate JSON structures that can be imported into the SH-SelfHelp CMS system. The system uses a hierarchical section-based architecture where each section has a specific style type and configurable fields.

## System Architecture

### Section Structure
Every section in the system follows this base structure:
```json
{
  "name": "Section Name",
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
    "css": null,
    "css_mobile": null,
    "debug": false
  }
}
```

### Key Principles
1. **Hierarchical Structure**: Sections can contain child sections, creating nested layouts
2. **Style-Based Rendering**: Each section has a `style_name` that determines how it renders
3. **Multi-Language Support**: All field values are organized by language code (e.g., "en-GB", "de-CH")
4. **Field-Based Configuration**: Section behavior is controlled through configurable fields
5. **Global Fields**: Every section includes global_fields for system-wide configuration (condition, data_config, css, css_mobile, debug)
6. **CSS Classes**: Styling is applied using Tailwind CSS classes through the `css` field in global_fields

## Available Style Types

### Authentication Styles
- **login**: User login form with email/password fields
- **register**: User registration form
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

When generating JSON structures based on an image:

1. **Analyze the Layout**: Identify the main sections, their hierarchy, and relationships
2. **Choose Appropriate Styles**: Select the most suitable style types for each element from the supported list
3. **Structure Hierarchically**: Create parent-child relationships using the `children` array
4. **Configure Fields**: Set appropriate field values based on the visual content
5. **Apply Global Fields**: **CRITICAL** - Always include `global_fields` with condition, data_config, css, css_mobile, and debug for each section
6. **Apply Styling**: Use Tailwind CSS classes in `global_fields.css` to match the visual appearance
7. **Dark Mode Support**: **CRITICAL** - Always include dark mode variants (dark:) for all colors, backgrounds, borders, and shadows in global_fields.css
8. **Use Placeholder Images**: Always use `http://127.0.0.1/selfhelp/assets/image-holder.png` for image sources
9. **Multi-Language Structure**: Use field name first, then language code (field_name -> language_code -> content)
10. **Required Languages**: Always include both "en-GB" (English) and "de-CH" (German) for all translatable text content
11. **Language Codes**: Use "en-GB" and "de-CH" for translatable content, "all" for technical fields
12. **Semantic Naming**: Give meaningful names to sections for admin interface
13. **Naming Rules**: Section names can ONLY contain letters, numbers, hyphens (-), and underscores (_). No spaces, special characters, or other symbols are allowed.

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

## Practical Example: Travel Blog Layout

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

## Important Notes

1. **Always use the placeholder image URL**: `http://127.0.0.1/selfhelp/assets/image-holder.png`
2. **Maintain proper JSON structure**: Ensure all brackets and quotes are properly closed
3. **Use semantic section names**: Names should be descriptive for admin users
4. **Consider accessibility**: Include alt text for images, proper heading hierarchy
5. **Mobile responsiveness**: Use responsive Tailwind classes when appropriate
6. **Validation**: Ensure required fields are marked with `is_required: "1"`

When generating JSON from an image, focus on recreating the visual layout and structure while using the appropriate style types and field configurations outlined above.
