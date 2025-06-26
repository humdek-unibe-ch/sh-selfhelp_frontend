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
  }
}
```

### Key Principles
1. **Hierarchical Structure**: Sections can contain child sections, creating nested layouts
2. **Style-Based Rendering**: Each section has a `style_name` that determines how it renders
3. **Multi-Language Support**: All field values are organized by language code (e.g., "en-GB", "de-CH")
4. **Field-Based Configuration**: Section behavior is controlled through configurable fields
5. **CSS Classes**: Styling is applied using Tailwind CSS classes through the `css` field

## Available Style Types

### Container & Layout Styles
- **container**: Main container with optional fluid layout
- **div**: Generic div container with background, border, and text colors
- **card**: Collapsible card with title, type (primary/secondary/success/danger/warning/info/light/dark)
- **jumbotron**: Hero section container
- **alert**: Alert boxes with types (primary/secondary/success/danger/warning/info/light/dark)

### Text & Content Styles  
- **heading**: Headings h1-h6 with configurable level and title
- **markdown**: Full markdown content with GitHub Flavored Markdown support
- **markdownInline**: Inline markdown for simple formatting
- **plaintext**: Plain text with optional paragraph wrapping
- **rawText**: Raw text without any processing

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

### Navigation & Lists
- **tabs**: Tab containers for organizing content (requires tab children)
- **tab**: Individual tab component (used within tabs)
- **accordionList**: Collapsible list items
- **nestedList**: Hierarchical navigation lists
- **sortableList**: Drag-and-drop sortable lists
- **navigationContainer**: Navigation wrapper with title

### Tables
- **table**: Table container
- **tableRow**: Table row
- **tableCell**: Table cell

### Advanced Elements
- **progressBar**: Progress indicators with counts and styling
- **quiz**: Interactive quiz components
- **json**: JSON data display (content must be JSON string)
- **showUserInput**: Display user input data
- **htmlTag**: Custom HTML tag wrapper

### Special Styles (Available but not commonly used)
- **profile**: User profile management (authentication style)
- **formUserInput**: User input form handler
- **formUserInputLog**: User input logging form
- **formUserInputRecord**: User input record form

## Field Reference by Style Type

### Common Fields (Available for all styles)
- `css`: Tailwind CSS classes for styling
- `css_mobile`: Mobile-specific CSS classes
- `condition`: Conditional display logic
- `debug`: Debug information

### Container Styles Fields
**container**:
- `is_fluid`: "1" for fluid container, "0" for fixed width

**div**:
- `color_background`: Background color
- `color_border`: Border color  
- `color_text`: Text color

**card**:
- `title`: Card title
- `type`: Card type (primary/secondary/success/danger/warning/info/light/dark)
- `is_expanded`: "1" if expanded by default
- `is_collapsible`: "1" if collapsible
- `url_edit`: Edit URL for admin functionality

**alert**:
- `type`: Alert type (primary/secondary/success/danger/warning/info/light/dark)
- `is_dismissable`: "1" if dismissable

### Text Styles Fields
**heading**:
- `level`: Heading level (1-6)
- `title`: Heading text

**markdown**:
- `text_md`: Markdown content

**markdownInline**:
- `text_md_inline`: Inline markdown content

**plaintext**:
- `text`: Plain text content
- `is_paragraph`: "1" to wrap in paragraph tags

**rawText**:
- `text`: Raw text content

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

**quiz**:
- `type`: Quiz type
- `caption`: Quiz question text
- `label_right`: Text for correct answer
- `label_wrong`: Text for wrong answer
- `right_content`: Content shown for correct answer
- `wrong_content`: Content shown for wrong answer

**json**:
- `json`: JSON data as string (e.g., "{\"key\": \"value\", \"number\": 42}")

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

### Navigation & List Fields
**tabs**:
- No specific fields (uses child tab components)

**tab**:
- `label`: Tab label text
- `type`: Tab type
- `is_active`: "1" if this tab is active by default
- `icon`: Icon class for tab

**accordionList**:
- `items`: JSON string array of accordion items (e.g., "[{\"title\": \"Item 1\", \"content\": \"Content 1\"}]")
- `title_prefix`: Prefix for accordion titles
- `label_root`: Root label text
- `id_prefix`: ID prefix for accordion items
- `id_active`: ID of active accordion item

**nestedList**:
- `items`: JSON string array of nested list items (e.g., "[{\"title\": \"Parent\", \"children\": [{\"title\": \"Child\"}]}]")
- `title_prefix`: Prefix for list titles
- `is_expanded`: "1" if expanded by default
- `is_collapsible`: "1" if collapsible
- `search_text`: Search functionality text
- `id_prefix`: ID prefix for list items
- `id_active`: ID of active list item

**sortableList**:
- `items`: JSON string array of sortable items
- `is_sortable`: "1" if items can be sorted
- `is_editable`: "1" if items can be edited
- `url_delete`: URL for delete action
- `label_add`: Add button label
- `url_add`: URL for add action

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
  },
  "css": {
    "all": {
      "content": "text-center font-bold",
      "meta": null
    }
  }
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
  "css": {
    "all": { "content": "text-center font-bold", "meta": null }
  },
  "level": {
    "all": { "content": "2", "meta": null }
  },
  "img_src": {
    "all": { "content": "http://127.0.0.1/selfhelp/assets/image-holder.png", "meta": null }
  }
}
```

## Generation Instructions

When generating JSON structures based on an image:

1. **Analyze the Layout**: Identify the main sections, their hierarchy, and relationships
2. **Choose Appropriate Styles**: Select the most suitable style types for each element
3. **Structure Hierarchically**: Create parent-child relationships using the `children` array
4. **Configure Fields**: Set appropriate field values based on the visual content
5. **Apply Styling**: Use Tailwind CSS classes to match the visual appearance
6. **Dark Mode Support**: **CRITICAL** - Always include dark mode variants (dark:) for all colors, backgrounds, borders, and shadows
7. **Use Placeholder Images**: Always use `http://127.0.0.1/selfhelp/assets/image-holder.png` for image sources
8. **Multi-Language Structure**: Use field name first, then language code (field_name -> language_code -> content)
9. **Required Languages**: Always include both "en-GB" (English) and "de-CH" (German) for all translatable text content
10. **Language Codes**: Use "en-GB" and "de-CH" for translatable content, "all" for CSS and technical fields
11. **Semantic Naming**: Give meaningful names to sections for admin interface
12. **Naming Rules**: Section names can ONLY contain letters, numbers, hyphens (-), and underscores (_). No spaces, special characters, or other symbols are allowed.

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
        },
        "css": {
          "all": {
            "content": "text-4xl font-bold text-center mb-6",
            "meta": null
          }
        }
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
        },
        "css": {
          "all": {
            "content": "w-full h-64 object-cover rounded-lg mb-6",
            "meta": null
          }
        }
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
        },
        "css": {
          "all": {
            "content": "prose max-w-none text-gray-700",
            "meta": null
          }
        }
      }
    }
  ],
  "fields": {
    "css": {
      "all": {
        "content": "container mx-auto px-4 py-8",
        "meta": null
      }
    }
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
