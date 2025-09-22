In file @mantine-styles.sql check and add the style that i am giving. 

 # Mantine Style Generation Process

## Process Overview

This document outlines the systematic process for integrating new Mantine components into the SelfHelp frontend system. The process involves three main phases:

1. **Information Gathering & Analysis**
2. **SQL Structure Implementation**
3. **Frontend Component Generation**

## Phase 1: Information Gathering & Analysis

### Required Information Template

For each Mantine component, gather the following information:

**Component Name:** `{COMPONENT_NAME}` (e.g., "accordion", "button", "modal")

**Mantine Documentation URL:** `https://mantine.dev/core/{COMPONENT_NAME}`

### Critical Rules for Mantine Styles

1. **ALWAYS CHECK EXISTING FIELDS FIRST**: Before creating new fields, search the codebase for existing fields like `mantine_radius`, `mantine_color`, `mantine_size`, etc. Reuse them instead of creating duplicates.

2. **REUSE EXISTING FIELDS**: The system has hundreds of pre-existing fields. Always check this comprehensive field catalog before creating new ones.

3. **MANTINE STYLES DON'T NEED FALLBACKS**: Unless explicitly requested by the user, Mantine components should return `null` when `use_mantine_style` is disabled. No fallback HTML/CSS implementations needed.

4. **USE_MANTINE_STYLE FIELD**: Always set `use_mantine_style` to `'1'` as default value and make it `hidden: 1` in the SQL. Mantine styles should be enabled by default.

5. **CREATABLE FIELDS FOR SIZES/DURATIONS**: Fields that represent sizes in pixels or durations in milliseconds should use `text` field type with `{"creatable": true}` configuration, allowing users to input custom values.

6. **FOLDER ORGANIZATION**: Group related components (parent-child relationships) in dedicated folders. Example: accordion and accordion-item should be in `/accordion/` folder.

7. **DEFAULT VALUE HINTS**: Include explanatory hints about fallback logic in field help text. Example: "Either a custom value or falls back to section-${style.id}".

8. **ICON HANDLING**: Use `IconComponent` for icon fields, not raw strings. Import from `'../../shared/common/IconComponent'` and use as `<IconComponent iconName={iconName} size={16} />`.

### Comprehensive Field Catalog

The system has hundreds of pre-existing fields that should be reused when possible. Below is a complete catalog organized by category:

#### Content & Text Fields (display = 1)
| ID | Field Name | Type | Description |
|----|------------|------|-------------|
| 1 | label_user | 1 | User label for login forms |
| 3 | label_login | 1 | Login button label |
| 4 | label_pw_reset | 1 | Password reset label |
| 5 | alert_fail | 1 | Failure alert message |
| 7 | login_title | 1 | Login form title |
| 8 | label | 7 | Generic label field |
| 9 | label_pw_confirm | 1 | Password confirmation label |
| 12 | delete_title | 1 | Delete confirmation title |
| 13 | label_delete | 1 | Delete button label |
| 14 | delete_content | 2 | Delete confirmation content |
| 19 | alert_del_fail | 1 | Delete failure alert |
| 20 | alert_del_success | 1 | Delete success alert |
| 22 | title | 7 | Generic title field |
| 24 | text | 2 | Generic text content |
| 25 | text_md | 4 | Markdown text content |
| 30 | alt | 1 | Image alt text |
| 34 | subtitle | 1 | Subtitle field |
| 35 | alert_success | 1 | Success alert message |
| 36 | label_name | 1 | Name field label |
| 37 | name_placeholder | 1 | Name input placeholder |
| 38 | name_description | 7 | Name field description |
| 39 | label_gender | 1 | Gender selection label |
| 40 | gender_male | 1 | Male gender option |
| 41 | gender_female | 1 | Female gender option |
| 42 | label_activate | 1 | Account activation label |
| 43 | pw_placeholder | 1 | Password placeholder |
| 44 | success | 1 | Success message |
| 49 | caption_title | 1 | Caption title |
| 50 | caption | 7 | Caption content |
| 51 | label_cancel | 1 | Cancel button label |
| 53 | img_src | 233 | Image source URL |
| 55 | placeholder | 1 | Input placeholder text |
| 90 | label_submit | 1 | Submit button label |
| 106 | description | 2 | Generic description field |
| 110 | email_user | 11 | User email field |
| 111 | subject_user | 1 | Email subject |
| 115 | maintenance | 4 | Maintenance message |
| 178 | gender_divers | 1 | Gender diverse option |
| 186 | confirmation_title | 1 | Confirmation dialog title |
| 187 | confirmation_continue | 1 | Continue button label |
| 188 | confirmation_message | 4 | Confirmation message |
| 213 | label_security_question_1 | 1 | Security question 1 label |
| 214 | label_security_question_2 | 1 | Security question 2 label |
| 215 | anonymous_users_registration | 4 | Anonymous registration message |
| 216 | anonymous_user_name_description | 4 | Anonymous user name description |
| 227 | confirmation_cancel | 7 | Cancel confirmation message |
| 233 | label_expiration_2fa | 7 | 2FA expiration label |

#### Configuration Fields (display = 0)
| ID | Field Name | Type | Description |
|----|------------|------|-------------|
| 21 | level | 5 | Section level/hierarchy |
| 27 | url | 1 | URL field |
| 28 | type | 9 | Content type selector |
| 29 | is_fluid | 3 | Fluid layout toggle |
| 54 | type_input | 10 | Input type selector |
| 56 | is_required | 3 | Required field toggle |
| 57 | name | 1 | Field name |
| 58 | value | 2 | Field value |
| 59 | is_paragraph | 3 | Paragraph formatting toggle |
| 66 | items | 8 | List/array of items |
| 67 | is_multiple | 3 | Multiple selection toggle |
| 68 | labels | 8 | Array of labels |
| 69 | min | 5 | Minimum value |
| 70 | max | 5 | Maximum value |
| 71 | sources | 8 | Data sources array |
| 83 | id_prefix | 1 | ID prefix string |
| 85 | is_inline | 3 | Inline display toggle |
| 86 | open_in_new_tab | 3 | Open in new tab toggle |
| 87 | is_log | 3 | Logging toggle |
| 99 | has_controls | 3 | Controls visibility toggle |
| 100 | has_indicators | 3 | Indicators visibility toggle |
| 103 | has_crossfade | 3 | Crossfade effect toggle |
| 114 | is_html | 3 | HTML content toggle |
| 116 | maintenance_date | 13 | Maintenance date |
| 117 | maintenance_time | 14 | Maintenance time |
| 139 | anchor | 16 | Anchor link |
| 140 | open_registration | 3 | Registration toggle |
| 141 | live_search | 3 | Live search toggle |
| 142 | disabled | 3 | Disabled state toggle |
| 143 | group | 17 | Group assignment |
| 146 | export_pdf | 3 | PDF export toggle |
| 154 | ajax | 3 | AJAX functionality toggle |
| 155 | format | 1 | Data format |
| 168 | image_selector | 3 | Image selector toggle |
| 169 | redirect_at_end | 1 | Redirect URL |
| 170 | data_table | 20 | Data table configuration |
| 174 | icon | 1 | Icon identifier |
| 176 | own_entries_only | 3 | Own entries filter toggle |
| 179 | locked_after_submit | 3 | Lock after submit toggle |
| 181 | filter | 12 | Filter configuration |
| 190 | loop | 8 | Loop configuration |
| 191 | page_keyword | 25 | Page keyword |
| 192 | allow_clear | 3 | Clear option toggle |
| 194 | value_gender | 1 | Gender value |
| 195 | value_name | 1 | Name value |
| 201 | internal | 3 | Internal use toggle |
| 217 | toggle_switch | 3 | Toggle switch control |
| 218 | checkbox_value | 1 | Checkbox value |
| 219 | color_background | 29 | Background color |
| 220 | color_border | 29 | Border color |
| 221 | color_text | 29 | Text color |
| 222 | load_as_table | 3 | Table loading toggle |
| 223 | scope | 1 | Scope definition |
| 224 | url_param | 1 | URL parameter |
| 225 | html_tag | 30 | HTML tag selector |
| 226 | fields_map | 8 | Fields mapping |
| 228 | height | 1 | Height value |
| 229 | width | 1 | Width value |
| 230 | markdown_editor | 3 | Markdown editor toggle |

#### Mantine-Specific Fields
| ID | Field Name | Type | Config/Description |
|----|------------|------|-------------------|
| 2612 | mantine_variant | 33 | Select: Filled, Light, Outline, Transparent, White, Subtle, Gradient |
| 2613 | mantine_color | 34 | Select: Gray, Red, Pink, Grape, Violet, Indigo, Blue, Cyan, Teal, Green, Lime, Yellow, Orange |
| 2614 | mantine_size | 55 | Select: xs, sm, md, lg, xl |
| 2615 | mantine_radius | 55 | Select: None, xs, sm, md, lg, xl |
| 2616 | mantine_left_icon | 36 | Icon selector for left position |
| 2617 | mantine_right_icon | 36 | Icon selector for right position |
| 2618 | mantine_orientation | 37 | Select: Horizontal, Vertical |
| 2619 | mantine_color_format | 37 | Select: Hex, Rgb, Rgba, Hsl, Hsla |
| 2620 | mantine_numeric_min | 33 | Numeric minimum value |
| 2621 | mantine_numeric_max | 33 | Numeric maximum value |
| 2622 | mantine_numeric_step | 33 | Numeric step value |
| 2623 | mantine_width | 33 | Width configuration |
| 2624 | mantine_height | 33 | Height configuration |
| 2625 | mantine_gap | 55 | Spacing gap selector |
| 2626 | mantine_justify | 33 | Justify content options |
| 2627 | mantine_align | 33 | Align items options |
| 2628 | mantine_direction | 37 | Select: Row, Column |
| 2629 | mantine_wrap | 37 | Select: Wrap, No Wrap |
| 2630 | mantine_fullwidth | 3 | Full width toggle |
| 2631 | mantine_compact | 3 | Compact mode toggle |
| 2632 | mantine_auto_contrast | 3 | Auto contrast toggle |
| 2633 | is_link | 3 | Link behavior toggle |
| 2634 | use_mantine_style | 3 | Mantine style enable toggle |
| 2635 | mantine_switch_on_label | 1 | Switch on state label |
| 2636 | mantine_switch_off_label | 1 | Switch off state label |
| 2637 | mantine_radio_options | 2 | Radio button options (JSON) |
| 2638 | mantine_segmented_control_data | 2 | Segmented control data (JSON) |
| 2639 | mantine_combobox_data | 2 | Combobox data (JSON) |
| 2640 | mantine_multi_select_data | 2 | Multi-select data (JSON) |
| 2648 | mantine_center_inline | 3 | Center inline toggle |
| 2651 | mantine_miw | 33 | Minimum inline width |
| 2652 | mantine_mih | 33 | Minimum inline height |
| 2653 | mantine_maw | 33 | Maximum width |
| 2654 | mantine_mah | 33 | Maximum height |
| 2655 | mantine_fluid | 3 | Fluid layout toggle |
| 2656 | mantine_px | 33 | Horizontal padding |
| 2657 | mantine_py | 33 | Vertical padding |
| 2663 | mantine_spacing | 55 | Spacing configuration |
| 2664 | mantine_breakpoints | 55 | Breakpoint configuration |
| 2665 | mantine_cols | 55 | Column count |
| 2666 | mantine_group_wrap | 37 | Group wrap options |
| 2667 | mantine_group_grow | 3 | Group grow toggle |
| 2668 | mantine_vertical_spacing | 55 | Vertical spacing |
| 2669 | mantine_space_h | 37 | Horizontal spacing |
| 2670 | mantine_grid_overflow | 37 | Grid overflow options |
| 2671 | mantine_grid_span | 55 | Grid span |
| 2672 | mantine_grid_offset | 55 | Grid offset |
| 2673 | mantine_grid_order | 55 | Grid order |
| 2674 | mantine_grid_grow | 3 | Grid grow toggle |
| 2675 | mantine_tabs_variant | 33 | Tabs variant options |
| 2676 | mantine_tabs_radius | 55 | Tabs border radius |
| 2677 | mantine_tab_disabled | 3 | Tab disabled state |
| 2678 | mantine_aspect_ratio | 33 | Aspect ratio (16:9, 4:3, 1:1, etc.) |
| 2679 | mantine_chip_variant | 33 | Chip variant options |
| 2680 | mantine_chip_checked | 3 | Chip checked state |
| 2681 | mantine_chip_multiple | 3 | Multiple chip selection |
| 2682 | mantine_image_fit | 33 | Image fit options (Contain, Cover, Fill, None, Scale-down) |
| 2693 | mantine_color_input_swatches | 3 | Color input swatches toggle |
| 2694 | mantine_color_picker_swatches_per_row | 55 | Swatches per row count |
| 2695 | mantine_fieldset_variant | 33 | Fieldset variant options |
| 2696 | mantine_file_input_multiple | 3 | Multiple file selection |
| 2697 | mantine_file_input_accept | 33 | File type acceptance |
| 2701 | mantine_number_input_decimal_scale | 55 | Decimal precision |
| 2702 | mantine_number_input_clamp_behavior | 37 | Number clamping behavior |
| 2704 | mantine_range_slider_marks | 3 | Range slider marks toggle |
| 2705 | mantine_rating_count | 55 | Rating star count |
| 2706 | mantine_rating_readonly | 3 | Rating readonly state |
| 2707 | mantine_rating_fractions | 55 | Rating fraction precision |
| 2713 | mantine_multi_select_max_values | 33 | Maximum selected values |
| 2714 | mantine_action_icon_loading | 3 | Action icon loading state |
| 2715 | mantine_stepper_active | 55 | Active step index |
| 2716 | mantine_stepper_allow_next_clicks | 3 | Allow next step clicks |
| 2717 | mantine_stepper_step_with_icon | 3 | Step with icon toggle |
| 2718 | mantine_stepper_step_allow_click | 3 | Allow step clicks |
| 2719 | mantine_notification_loading | 3 | Notification loading state |
| 2720 | mantine_notification_with_close_button | 3 | Close button toggle |
| 2721 | mantine_accordion_variant | 33 | Accordion variant options |
| 2722 | mantine_accordion_multiple | 3 | Multiple panel expansion |
| 2723 | mantine_accordion_chevron_position | 37 | Chevron position (Left, Right) |
| 2724 | mantine_accordion_chevron_size | 33 | Chevron size |
| 2725 | mantine_accordion_disable_chevron_rotation | 3 | Disable chevron rotation |
| 2726 | mantine_accordion_loop | 3 | Loop navigation toggle |
| 2727 | mantine_accordion_transition_duration | 33 | Transition duration |
| 2728 | mantine_accordion_default_value | 1 | Default expanded panel |
| 2729 | mantine_accordion_item_value | 1 | Accordion item value |
| 2730 | mantine_accordion_item_icon | 36 | Accordion item icon |
| 2731 | mantine_avatar_initials | 1 | Avatar initials text |
| 2732 | mantine_indicator_processing | 3 | Indicator processing state |
| 2733 | mantine_indicator_disabled | 3 | Indicator disabled state |
| 2734 | mantine_spoiler_max_height | 33 | Spoiler max height |
| 2735 | mantine_spoiler_show_label | 1 | Spoiler show label |
| 2736 | mantine_spoiler_hide_label | 1 | Spoiler hide label |
| 2737 | mantine_timeline_line_width | 33 | Timeline line width |
| 2738 | mantine_timeline_item_bullet | 36 | Timeline item bullet icon |
| 2739 | mantine_timeline_item_line_variant | 33 | Timeline line variant |
| 2740 | mantine_code_block | 3 | Code block toggle |
| 2741 | mantine_highlight_highlight | 33 | Text highlight options |
| 2742 | mantine_title_order | 55 | Title heading level (H1, H2, H3, etc.) |
| 2743 | mantine_divider_variant | 33 | Divider variant options |
| 2744 | mantine_divider_size | 33 | Divider size/thickness |
| 2745 | mantine_divider_label | 1 | Divider label text |
| 2746 | mantine_divider_label_position | 33 | Label position options |
| 2747 | mantine_paper_shadow | 33 | Paper shadow options |
| 2748 | mantine_scrollarea_scrollbar_size | 33 | Scrollbar size |
| 2749 | mantine_scrollarea_type | 37 | Scrollarea type (Hover, Always, Scroll) |
| 2750 | mantine_scrollarea_offset_scrollbars | 3 | Offset scrollbars toggle |

#### Field Type Reference
| Type ID | Type Name | Description |
|---------|-----------|-------------|
| 1 | text | Single line text input |
| 2 | textarea | Multi-line text input |
| 3 | checkbox | Boolean toggle |
| 4 | markdown | Markdown editor |
| 5 | number | Numeric input |
| 7 | rich_text | Rich text editor |
| 8 | json | JSON data input |
| 9 | select | Dropdown selection |
| 10 | input_type | Input type selector |
| 11 | email | Email input |
| 12 | filter | Filter configuration |
| 13 | date | Date picker |
| 14 | time | Time picker |
| 16 | anchor | Anchor link |
| 17 | group | Group selector |
| 20 | data_table | Data table configuration |
| 25 | page_keyword | Page keyword selector |
| 29 | color | Color picker |
| 30 | html_tag | HTML tag selector |
| 33 | creatable_select | Select with custom value creation |
| 34 | color_select | Color selection dropdown |
| 36 | icon_select | Icon selection |
| 37 | option_select | Predefined options select |
| 55 | size_select | Size selection (xs, sm, md, lg, xl) |
| 233 | image_url | Image URL input |

### Data Collection Checklist

#### 1. Component Structure Analysis
- [ ] **Main Component**: Identify the primary component and its import path
- [ ] **Sub-components**: List all sub-components (e.g., `Accordion.Item`, `Accordion.Control`, `Accordion.Panel`)
- [ ] **Component Variants**: Document available variants (default, filled, outline, etc.)
- [ ] **Component Hierarchy**: Determine if component can have children (`can_have_children`)

#### 2. Props Analysis
For each prop, document:
- [ ] **Prop Name**: The actual prop name used in Mantine
- [ ] **Type**: String, number, boolean, array, object, etc.
- [ ] **Default Value**: The default value if any
- [ ] **Required**: Whether the prop is required
- [ ] **Description**: What the prop does
- [ ] **Options**: For select/segment type props, list available options

#### 3. Field Type Mapping
Map Mantine prop types to system field types:
- [ ] `string` → `text` or `textarea`
- [ ] `number` → `select` with `{"creatable": true}` for sizes/durations (provides presets + custom input), `select` for predefined options only
- [ ] `boolean` → `checkbox`
- [ ] `enum` → `segment` or `select`
- [ ] `ReactNode` → `text` (for content)
- [ ] Arrays → `textarea` with JSON validation
- [ ] Objects → `textarea` with JSON validation
- [ ] **Icon fields** → `select-icon` (always use this for Mantine icon props)
- [ ] **Size values (px)** → `select` with creatable: true and preset options (14px, 16px, 18px, 20px, 24px, 32px)
- [ ] **Duration values (ms)** → `select` with creatable: true and preset options (150ms, 200ms, 300ms, 400ms, 0ms, 500ms)

#### 4. Special Field Requirements
- [ ] **Display Field**: `display = 1` for content fields (translatable)
- [ ] **Property Fields**: `display = 0` for configuration (non-translatable)
- [ ] **Custom Fields**: New fields that need to be created in the system
- [ ] **Field Configuration**: JSON config for select/segment options

## Phase 2: SQL Structure Implementation

### SQL Generation Template

#### 1. Create Component Style Entry
```sql
-- Add {COMPONENT_NAME} style
INSERT IGNORE INTO `styles` (`id`, `name`, `id_type`, `id_group`, `description`, `can_have_children`) VALUES (
    NULL,
    '{COMPONENT_NAME}',
    (SELECT id FROM lookups WHERE type_code = 'styleType' AND lookup_code = 'component' LIMIT 1),
    get_style_group_id('mantine'),
    '{COMPONENT_DESCRIPTION}',
    {CAN_HAVE_CHILDREN} -- 1 for yes, 0 for no
);
```

#### 2. Create Custom Fields (if needed)
```sql
-- Create {COMPONENT_NAME}-specific fields if they don't exist
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_{PROP_NAME}', get_field_type_id('{FIELD_TYPE}'), {DISPLAY}, {CONFIG_JSON});
```

#### 3. Link Fields to Style
```sql
-- Link fields to {COMPONENT_NAME} style
INSERT IGNORE INTO `styles_fields` (`id_styles`, `id_fields`, `default_value`, `help`, `disabled`, `hidden`, `title`) VALUES
(get_style_id('{COMPONENT_NAME}'), get_field_id('mantine_{COMPONENT_NAME}_{PROP_NAME}'), '{DEFAULT_VALUE}', '{HELP_TEXT}', 0, 0, '{TITLE}'),
(get_style_id('{COMPONENT_NAME}'), get_field_id('use_mantine_style'), '1', 'Use Mantine styling for the {COMPONENT_NAME} component', 0, 1, 'Use Mantine Style');
```

### Field Configuration Examples

#### Size Fields (Creatable Select)
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_size', get_field_type_id('select'), 0, '{
"creatable": true,
"searchable": false,
"clearable": false,
"placeholder": "16",
"options": [
{"value": "14", "text": "Small (14px)"},
{"value": "16", "text": "Medium (16px)"},
{"value": "18", "text": "Large (18px)"},
{"value": "20", "text": "Extra Large (20px)"},
{"value": "24", "text": "XL (24px)"},
{"value": "32", "text": "XXL (32px)"}
]
}');
```

#### Duration Fields (Creatable Select)
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_duration', get_field_type_id('select'), 0, '{
"creatable": true,
"searchable": false,
"clearable": false,
"placeholder": "200",
"options": [
{"value": "150", "text": "Fast (150ms)"},
{"value": "200", "text": "Normal (200ms)"},
{"value": "300", "text": "Slow (300ms)"},
{"value": "400", "text": "Very Slow (400ms)"},
{"value": "0", "text": "Instant (0ms)"},
{"value": "500", "text": "Extra Slow (500ms)"}
]
}');
```

#### Icon Fields
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_icon', get_field_type_id('select-icon'), 0, null);
```

#### Default Value Fields with Hints
```sql
INSERT IGNORE INTO `styles_fields` (`id_styles`, `id_fields`, `default_value`, `help`, `disabled`, `hidden`, `title`) VALUES
(get_style_id('{COMPONENT_NAME}'), get_field_id('mantine_{COMPONENT_NAME}_value'), NULL, 'Unique identifier for the {COMPONENT_NAME}. Either a custom value or falls back to section-${style.id}', 0, 0, 'Item Value');
```

### Field Configuration Structure Reference

When configuring select fields with creatable options, use this structure:

```json
{
  "creatable": true,           // Allows users to add custom values
  "searchable": false,         // Keep simple for size/duration fields
  "clearable": false,          // Usually false for required size/duration values
  "placeholder": "16",         // Default value hint
  "options": [                 // Preset options array
    {"value": "14", "text": "Small (14px)"},
    {"value": "16", "text": "Medium (16px)"},
    {"value": "18", "text": "Large (18px)"},
    {"value": "20", "text": "Extra Large (20px)"},
    {"value": "24", "text": "XL (24px)"},
    {"value": "32", "text": "XXL (32px)"}
  ]
}
```

#### Key Configuration Properties:
- **`creatable: true`**: Essential for allowing custom size/duration values
- **`searchable: false`**: Keep false for size/duration presets (they're usually short lists)
- **`clearable: false`**: Usually false since sizes/durations are typically required
- **`placeholder`**: Should show the default value to guide users
- **`options`**: Array of preset options with user-friendly labels

### Help Text Patterns for Size and Duration Fields

#### Size Fields (px values):
```
'Sets the size in pixels. Choose from preset sizes or enter a custom value (e.g., 12, 14, 16, 18, 20, 24, 32).'
```

#### Duration Fields (ms values):
```
'Sets the duration in milliseconds. Choose from preset durations or enter a custom value (e.g., 100, 150, 200, 300, 400, 500).'
```

#### Icon Fields:
```
'Sets the icon. For more information check https://mantine.dev/core/{COMPONENT_NAME}'
```

#### Boolean Fields:
```
'If set, {DESCRIPTION}. For more information check https://mantine.dev/core/{COMPONENT_NAME}'
```

#### 4. Define Parent-Child Relationships (if applicable)
```sql
-- {PARENT_COMPONENT} can contain {CHILD_COMPONENT}
INSERT IGNORE INTO styles_allowed_relationships (id_parent_style, id_child_style)
SELECT s1.id, s2.id FROM styles s1, styles s2
WHERE s1.name = '{PARENT_COMPONENT}' AND s2.name = '{CHILD_COMPONENT}';
```

### Field Naming Convention
- **Standard Fields**: Use existing field names (e.g., `label`, `value`, `disabled`)
- **Mantine-specific Fields**: Prefix with `mantine_` (e.g., `mantine_size`, `mantine_variant`)
- **Component-specific Fields**: Prefix with `mantine_{component}_` (e.g., `mantine_accordion_chevron`)

## Phase 3: Frontend Component Generation

### TypeScript Interface Generation

#### 1. Main Component Interface
```typescript
interface I{COMPONENT_NAME}Style {
    id: number;
    name: string;
    // Standard fields
    label?: string;
    value?: any;
    disabled?: boolean;
    // Mantine-specific fields
    mantine_size?: string;
    mantine_variant?: string;
    // Component-specific fields
    mantine_{COMPONENT_NAME}_{PROP}?: any;
}

interface I{COMPONENT_NAME}StyleProps {
    style: I{COMPONENT_NAME}Style;
}
```

#### 2. Component Implementation Template
```typescript
import React from 'react';
import { {COMPONENT_NAME} } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import IconComponent from '../../shared/common/IconComponent';
import { I{COMPONENT_NAME}Style } from '../../../../../types/common/styles.types';

interface I{COMPONENT_NAME}StyleProps {
    style: I{COMPONENT_NAME}Style;
}

const {COMPONENT_NAME}Style: React.FC<I{COMPONENT_NAME}StyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Extract Mantine-specific props
    const variant = getFieldContent(style, 'mantine_{COMPONENT_NAME}_variant') || 'default';
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const iconName = getFieldContent(style, 'mantine_{COMPONENT_NAME}_icon');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    if (use_mantine_style) {
        return (
            <{COMPONENT_NAME}
                variant={variant}
                size={size}
                icon={icon}
                className={cssClass}
                {...otherProps}
            >
                {children}
            </{COMPONENT_NAME}>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};
```

### Field Value Extraction Pattern
```typescript
const getFieldValue = (style: any, fieldName: string, defaultValue?: any) => {
    const field = style.fields?.find((f: any) => f.name === fieldName);
    return field?.value || defaultValue;
};
```

### Import Requirements
- Import the Mantine component from `@mantine/core`
- Import utility functions for field extraction
- Import CSS modules if custom styling is used

## Implementation Checklist

### Pre-Implementation
- [ ] Review Mantine documentation for the component
- [ ] Identify all props and their types
- [ ] Determine component hierarchy and relationships
- [ ] Plan field mapping strategy

### SQL Implementation
- [ ] Create style entry with correct `can_have_children` value
- [ ] Create any new custom fields needed
- [ ] Link all fields to the style with appropriate defaults
- [ ] Define parent-child relationships if applicable
- [ ] Test SQL execution order and dependencies

### Frontend Implementation
- [ ] Create/update TypeScript interfaces
- [ ] Implement component with proper prop extraction
- [ ] Handle both Mantine and custom styling modes
- [ ] Implement proper error handling and fallbacks
- [ ] Test component rendering and functionality

### Post-Implementation
- [ ] Verify all fields are properly mapped
- [ ] Test component in different scenarios
- [ ] Check for console errors or warnings
- [ ] Validate TypeScript compilation
- [ ] Test with sample data
- [ ] **CRITICAL**: Add style case to BasicStyle.tsx component (see detailed instructions below)

### Adding Style to BasicStyle.tsx Component

**CRITICAL STEP**: After implementing the component, you must add it to the BasicStyle.tsx component so it can be loaded by the system.

#### 1. Add Import Statement
Add the component import to the imports section at the top of `src/app/components/frontend/styles/BasicStyle.tsx`:

```typescript
import {
    // ... existing imports ...
    ActionIconStyle  // Add this line
} from './SelfHelpStyles';
```

#### 2. Add Case Statement
Add a case for your component in the switch statement within the BasicStyle component:

```typescript
switch (style.style_name) {
    // ... existing cases ...
    case 'action-icon':          // Use the exact style_name from your SQL
        return <ActionIconStyle style={style} />;
    // ... other cases ...
}
```

#### 3. Export the Component
Ensure your component is exported from `src/app/components/frontend/styles/mantine/index.ts`:

```typescript
export { default as ActionIconStyle } from './ActionIconStyle';
```

**Why This Step is Critical:**
- BasicStyle.tsx is the main component router that determines which style component to render
- Without this step, your component will never be loaded, even if the SQL and TypeScript are correct
- The system uses the `style_name` field to route to the appropriate component

**Common Issues:**
- Case sensitivity: Ensure `style_name` matches exactly (e.g., 'action-icon', not 'action-icon')
- Import path: Make sure the import path is correct
- Export: Ensure the component is properly exported from the index file

## Quality Assurance

### Validation Checklist
- [ ] **Existing fields checked**: Searched for reusable fields like `mantine_radius`, `mantine_color`, `mantine_size`
- [ ] **No fallbacks implemented**: Component returns `null` when `use_mantine_style` is disabled
- [ ] **use_mantine_style configured**: Set to `'1'` default and `hidden: 1`
- [ ] **Creatable select fields for sizes/durations**: Select fields with `{"creatable": true}` and preset options for pixel/ms values
- [ ] **Folder organization**: Related components grouped in dedicated folders
- [ ] **Icon handling**: Using `IconComponent` for icon fields, not raw strings
- [ ] **Default value hints**: Field help text explains fallback logic (e.g., "falls back to section-${style.id}")
- [ ] All required Mantine props are implemented
- [ ] Field types match Mantine prop types
- [ ] Default values are appropriate
- [ ] Help text is clear and accurate
- [ ] Component hierarchy is correctly defined
- [ ] No duplicate or conflicting field names
- [ ] SQL executes without errors
- [ ] Component renders without errors
- [ ] TypeScript compilation passes

## Usage Instructions

To use this process for a new component:

1. **Replace `{COMPONENT_NAME}`** with the actual component name (e.g., "accordion")
2. **Review the Mantine documentation** at `https://mantine.dev/core/{COMPONENT_NAME}`
3. **Follow the checklists** in order, checking off completed items
4. **Execute SQL changes** in the correct order (style group → styles → fields → styles_fields → relationships)
5. **Implement the frontend component** using the provided templates
6. **CRITICAL**: Add the component to BasicStyle.tsx (see detailed instructions in Post-Implementation section)
7. **Test thoroughly** before marking as complete

## Common Patterns and Best Practices

### Field Type Selection
- Use `checkbox` for boolean values
- Use `select` for predefined string options
- Use `segment` for mutually exclusive options
- Use `textarea` for JSON data or long text
- Use `text` for short strings and URLs

### Default Value Strategy
- Match Mantine's actual defaults when possible
- Use sensible fallbacks for optional props
- Consider user experience implications

### Error Handling
- Always provide fallback values
- Handle missing or malformed data gracefully
- Log errors for debugging but don't break the UI

### Performance Considerations
- Use React.memo for components with stable props
- Extract field values once at component level
- Avoid unnecessary re-renders with proper memoization
