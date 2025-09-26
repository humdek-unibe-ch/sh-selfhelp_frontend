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
| 25 | text_md | 4 | Legacy markdown field (deprecated - use rich-text-editor style) |
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
| 245 | mantine_border | 37 | Border style options (none, solid, dashed, dotted) |
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
| 2751 | mantine_border_size | 55 | Border size/thickness (1px, 2px, 3px, 4px, 5px) |
| 2752 | mantine_shadow | 55 | Shadow options (none, xs, sm, md, lg, xl) |

#### Field Type Reference
| Type ID | Type Name | Description |
|---------|-----------|-------------|
| 1 | text | Single line text input |
| 2 | textarea | Multi-line text input |
| 3 | checkbox | Boolean toggle |
| 4 | markdown | Legacy markdown editor (deprecated - use rich-text-editor style) |
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

## Complete Style Reference (Matching styles.types.ts)

This section documents every style defined in `styles.types.ts` with their exact fields and allowed values.

### Authentication & User Management Styles

#### ILoginStyle (`login`)
**Fields:**
- `label_user?`: IContentField<string> - Username/email field label
- `label_pw?`: IContentField<string> - Password field label
- `label_login?`: IContentField<string> - Login button label
- `label_pw_reset?`: IContentField<string> - Password reset link label
- `alert_fail?`: IContentField<string> - Login failure message
- `login_title?`: IContentField<string> - Login form title
- `type?`: IContentField<string> - Login type identifier
- `use_mantine_style?`: IContentField<TMantineFullWidth> - Enable Mantine styling

#### IProfileStyle (`profile`)
**Fields:**
- Profile Title: `profile_title?`: IContentField<string>
- Account Info: `profile_account_info_title?`: IContentField<string>
- User Labels: `profile_label_email?`, `profile_label_username?`, `profile_label_name?`, `profile_label_created?`, `profile_label_last_login?`: IContentField<string>
- Name Change: `profile_name_change_title?`, `profile_name_change_description?`, `profile_name_change_label?`, `profile_name_change_placeholder?`, `profile_name_change_button?`: IContentField<string>
- Name Change Messages: `profile_name_change_success?`, `profile_name_change_error_required?`, `profile_name_change_error_invalid?`, `profile_name_change_error_general?`: IContentField<string>
- Password Reset: `profile_password_reset_title?`, `profile_password_reset_description?`, `profile_password_reset_label_current?`, `profile_password_reset_label_new?`, `profile_password_reset_label_confirm?`, `profile_password_reset_placeholder_current?`, `profile_password_reset_placeholder_new?`, `profile_password_reset_placeholder_confirm?`, `profile_password_reset_button?`: IContentField<string>
- Password Reset Messages: `profile_password_reset_success?`, `profile_password_reset_error_*?`: IContentField<string>
- Account Deletion: `profile_delete_title?`, `profile_delete_description?`, `profile_delete_alert_text?`, `profile_delete_modal_warning?`, `profile_delete_label_email?`, `profile_delete_placeholder_email?`, `profile_delete_button?`: IContentField<string>
- Account Deletion Messages: `profile_delete_success?`, `profile_delete_error_*?`: IContentField<string>
- UI Config: `profile_gap?`, `profile_use_accordion?`, `profile_accordion_multiple?`, `profile_accordion_default_opened?`: IContentField<string>
- Styling: `profile_variant?`, `profile_radius?`, `profile_shadow?`: IContentField<string>
- Layout: `profile_columns?`: IContentField<string>
- Legacy: `alert_fail?`, `alert_del_fail?`, `alert_del_success?`, `alert_success?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IValidateStyle (`validate`)
**Fields:**
- User Info: `label_pw?`, `label_login?`, `title?`, `subtitle?`, `label_name?`, `name_placeholder?`, `name_description?`, `label_activate?`, `pw_placeholder?`, `success?`, `name?`, `page_keyword?`, `value_name?`, `anonymous_user_name_description?`: IContentField<string>
- Messages: `alert_fail?`, `alert_success?`: IContentField<string>
- Form Config: `redirect_at_end?`, `cancel_url?`, `label_save?`, `label_update?`, `label_cancel?`: IContentField<string>
- Buttons: `mantine_buttons_size?`, `mantine_buttons_radius?`, `mantine_buttons_variant?`, `mantine_buttons_position?`, `mantine_buttons_order?`, `mantine_btn_save_color?`, `mantine_btn_cancel_color?`: IContentField<string>
- Styling: `mantine_card_shadow?`, `mantine_card_padding?`, `mantine_radius?`: IContentField<TMantineRadius>, `mantine_border?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IRegisterStyle (`register`)
**Fields:**
- `label_user?`, `label_pw?`, `label_submit?`, `alert_fail?`, `alert_success?`, `title?`, `success?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IResetPasswordStyle (`resetPassword`)
**Fields:**
- `label_pw_reset?`, `text_md?`, `type?`, `alert_success?`, `placeholder?`, `email_user?`, `subject_user?`, `is_html?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ITwoFactorAuthStyle (`twoFactorAuth`)
**Fields:**
- `label_code?`, `label_submit?`, `alert_fail?`, `title?`, `text_md?`, `label_expiration_2fa?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Container & Layout Styles

#### IContainerStyle (`container`)
**Fields:**
- `mantine_size?`: IContentField<TMantineSize> - Container size (xs, sm, md, lg, xl)
- `mantine_fluid?`: IContentField<TMantineFullWidth> - Fluid layout toggle
- `mantine_px?`: IContentField<TMantineSpacing> - Horizontal padding (none, xs, sm, md, lg, xl)
- `mantine_py?`: IContentField<TMantineSpacing> - Vertical padding (none, xs, sm, md, lg, xl)
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ICenterStyle (`center`)
**Fields:**
- `mantine_center_inline?`: IContentField<TMantineFullWidth> - Center inline content
- `mantine_width?`: IContentField<TMantineWidth> - Width constraint (25%, 50%, 75%, 100%, auto, etc.)
- `mantine_height?`: IContentField<TMantineHeight> - Height constraint
- `mantine_miw?`: IContentField<TMantineWidth> - Minimum inline width
- `mantine_mih?`: IContentField<TMantineHeight> - Minimum inline height
- `mantine_maw?`: IContentField<TMantineWidth> - Maximum width
- `mantine_mah?`: IContentField<TMantineHeight> - Maximum height

#### IDividerStyle (`divider`)
**Fields:**
- `mantine_divider_variant?`: IContentField<TMantineDividerVariant> - solid, dashed, dotted
- `mantine_size?`: IContentField<TMantineSize> - Size (xs, sm, md, lg, xl)
- `mantine_divider_label?`: IContentField<string> - Label text
- `mantine_divider_label_position?`: IContentField<string> - left, center, right
- `mantine_orientation?`: IContentField<TMantineOrientation> - horizontal, vertical
- `mantine_color?`: IContentField<TMantineColor> - Color (gray, red, etc.)
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IPaperStyle (`paper`)
**Fields:**
- `mantine_paper_shadow?`: IContentField<TMantinePaperShadow> - none, xs, sm, md, lg, xl
- `mantine_radius?`: IContentField<TMantineRadius> - none, xs, sm, md, lg, xl
- `mantine_px?`: IContentField<TMantineSpacing> - Horizontal padding
- `mantine_py?`: IContentField<TMantineSpacing> - Vertical padding
- `mantine_border?`: IContentField<TMantineBorder> - 0, 1
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IAlertStyle (`alert`)
**Fields:**
- `mantine_alert_title?`: IContentField<string> - Alert title
- `close_button_label?`: IContentField<string> - Close button label
- `mantine_variant?`: IContentField<TMantineVariant> - filled, light, outline, etc.
- `mantine_color?`: IContentField<TMantineColor> - Color
- `mantine_radius?`: IContentField<TMantineRadius> - Border radius
- `mantine_left_icon?`: IContentField<string> - Left icon
- `mantine_with_close_button?`: IContentField<TMantineWithCloseButton> - Show close button
- `content?`: IContentField<string> - Alert content
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IRefContainerStyle (`refContainer`)
**Fields:** None specific (base style only)

#### IDataContainerStyle (`dataContainer`)
**Fields:** None specific (base style only)

#### IHtmlTagStyle (`html-tag`)
**Fields:**
- `html_tag?`: IContentField<string> - HTML tag name
- `html_tag_content?`: IContentField<string> - HTML content

#### IBoxStyle (`box`)
**Fields:**
- `content?`: IContentField<string> - Box content
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Layout Components

#### IFlexStyle (`flex`)
**Fields:**
- `mantine_gap?`: IContentField<TMantineGap> - Gap between items (0, xs, sm, md, lg, xl)
- `mantine_justify?`: IContentField<TMantineJustify> - Justify content (flex-start, center, etc.)
- `mantine_align?`: IContentField<TMantineAlign> - Align items (flex-start, center, etc.)
- `mantine_direction?`: IContentField<TMantineDirection> - Flex direction
- `mantine_wrap?`: IContentField<TMantineWrap> - Flex wrap
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height

#### IGroupStyle (`group`)
**Fields:**
- `mantine_gap?`: IContentField<TMantineGap> - Gap between items
- `mantine_justify?`: IContentField<TMantineJustify> - Justify content
- `mantine_align?`: IContentField<TMantineAlign> - Align items
- `mantine_group_wrap?`: IContentField<'0' | '1'> - Wrap toggle
- `mantine_group_grow?`: IContentField<'0' | '1'> - Grow toggle
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height

#### IStackStyle (`stack`)
**Fields:**
- `mantine_gap?`: IContentField<TMantineGap> - Gap between items
- `mantine_justify?`: IContentField<TMantineJustify> - Justify content
- `mantine_align?`: IContentField<TMantineAlign> - Align items
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height

#### ISimpleGridStyle (`simple-grid`)
**Fields:**
- `mantine_cols?`: IContentField<TMantineCols> - Number of columns (1-12, string)
- `mantine_spacing?`: IContentField<TMantineSpacing> - Spacing
- `mantine_breakpoints?`: IContentField<string> - Breakpoints config
- `mantine_vertical_spacing?`: IContentField<TMantineSpacing> - Vertical spacing
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height

#### IScrollAreaStyle (`scroll-area`)
**Fields:**
- `mantine_scroll_area_scrollbar_size?`: IContentField<TMantineScrollAreaSize> - Scrollbar size
- `mantine_scroll_area_type?`: IContentField<TMantineScrollAreaType> - hover, always, never, scroll
- `mantine_scroll_area_offset_scrollbars?`: IContentField<TMantineFullWidth> - Offset scrollbars
- `mantine_scroll_area_scroll_hide_delay?`: IContentField<string> - Hide delay
- `mantine_height?`: IContentField<TMantineHeight> - Height
- `mantine_width?`: IContentField<TMantineWidth> - Width

#### ISpaceStyle (`space`)
**Fields:**
- `mantine_size?`: IContentField<TMantineSize> - Space size
- `mantine_space_direction?`: IContentField<string> - Direction

#### IGridStyle (`grid`)
**Fields:**
- `mantine_cols?`: IContentField<TMantineCols> - Number of columns
- `mantine_gap?`: IContentField<TMantineGap> - Gap/spacing
- `mantine_justify?`: IContentField<TMantineJustify> - Justify content
- `mantine_align?`: IContentField<TMantineAlign> - Align items
- `mantine_grid_overflow?`: IContentField<string> - Overflow handling
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IGridColumnStyle (`grid-column`)
**Fields:**
- `mantine_grid_span?`: IContentField<TMantineGridSpan> - Column span (1-12, auto, content)
- `mantine_grid_offset?`: IContentField<TMantineGridOffset> - Column offset (0-11)
- `mantine_grid_order?`: IContentField<TMantineGridOrder> - Column order (1-12)
- `mantine_grid_grow?`: IContentField<TMantineFullWidth> - Grow toggle
- `mantine_width?`: IContentField<TMantineWidth> - Width
- `mantine_height?`: IContentField<TMantineHeight> - Height
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Form & Input Styles

#### IFormStyle (`form-log`, `form-record`)
**Fields:**
- `btn_save_label?`, `alert_success?`, `name?`, `is_log?`, `redirect_at_end?`, `btn_cancel_url?`, `btn_cancel_label?`, `alert_error?`, `buttons_size?`, `buttons_radius?`, `btn_save_color?`, `btn_cancel_color?`, `buttons_variant?`, `buttons_position?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IInputStyle (`input`)
**Fields:**
- `type_input?`, `placeholder?`, `name?`, `value?`, `min?`, `max?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>

#### ITextInputStyle (`text-input`)
**Fields:**
- `label?`, `name?`, `value?`, `placeholder?`, `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_text_input_variant?`: IContentField<TMantineTextInputVariant>

#### ITextareaStyle (`textarea`)
**Fields:**
- `label?`, `placeholder?`, `name?`, `value?`, `min?`, `max?`, `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `markdown_editor?`: IContentField<string>
- `mantine_textarea_autosize?`: IContentField<TMantineTextareaAutosize>
- `mantine_textarea_min_rows?`: IContentField<string>
- `mantine_textarea_max_rows?`: IContentField<string>
- `mantine_textarea_resize?`: IContentField<TMantineTextareaResize>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_textarea_variant?`: IContentField<TMantineTextareaVariant>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IRichTextEditorStyle (`rich-text-editor`)
**Fields:**
- `label?`, `name?`, `value?`, `placeholder?`, `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `mantine_rich_text_editor_variant?`, `mantine_rich_text_editor_placeholder?`, `mantine_rich_text_editor_bubble_menu?`, `mantine_rich_text_editor_text_color?`, `mantine_rich_text_editor_task_list?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ISelectStyle (`select`)
**Fields:**
- `alt?`, `name?`, `value?`, `placeholder?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `options?`: IContentField<string>
- `is_multiple?`, `live_search?`, `allow_clear?`: IContentField<string>
- `max?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `image_selector?`: IContentField<string>

#### IRadioStyle (`radio`)
**Fields:**
- `label?`, `description?`, `name?`, `value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `mantine_orientation?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_radio_options?`: IContentField<string>
- `mantine_radio_label_position?`: IContentField<string>
- `mantine_radio_variant?`: IContentField<string>
- `mantine_radio_card?`: IContentField<string>
- `mantine_tooltip_label?`, `mantine_tooltip_position?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_use_input_wrapper?`: IContentField<string>

#### ISliderStyle (`slider`)
**Fields:**
- `label?`, `description?`, `name?`, `value?`: IContentField<string>
- `mantine_numeric_min?`, `mantine_numeric_max?`, `mantine_numeric_step?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_radius?`: IContentField<TMantineRadius>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_slider_marks_values?`, `mantine_slider_show_label?`, `mantine_slider_labels_always_on?`, `mantine_slider_inverted?`, `mantine_slider_thumb_size?`, `mantine_slider_required?`: IContentField<string>
- Legacy: `labels?`: IContentField<any[]>, `min?`, `max?`: IContentField<string>, `locked_after_submit?`: IContentField<string>

#### ICheckboxStyle (`checkbox`)
**Fields:**
- `label?`, `name?`, `value?`, `checkbox_value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `mantine_checkbox_icon?`: IContentField<TMantineCheckboxIcon>
- `mantine_checkbox_labelPosition?`: IContentField<TMantineCheckboxLabelPosition>
- `description?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_use_input_wrapper?`: IContentField<TMantineUseInputWrapper>

#### IDatePickerStyle (`datepicker`)
**Fields:**
- `label?`, `name?`, `value?`, `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `mantine_datepicker_type?`, `mantine_datepicker_format?`, `mantine_datepicker_locale?`, `mantine_datepicker_placeholder?`: IContentField<string>
- `mantine_datepicker_min_date?`, `mantine_datepicker_max_date?`, `mantine_datepicker_first_day_of_week?`, `mantine_datepicker_weekend_days?`: IContentField<string>
- `mantine_datepicker_clearable?`, `mantine_datepicker_allow_deselect?`, `mantine_datepicker_readonly?`: IContentField<string>
- `mantine_datepicker_with_time_grid?`, `mantine_datepicker_consistent_weeks?`, `mantine_datepicker_hide_outside_dates?`, `mantine_datepicker_hide_weekends?`: IContentField<string>
- `mantine_datepicker_time_step?`, `mantine_datepicker_time_format?`, `mantine_datepicker_date_format?`, `mantine_datepicker_time_grid_config?`: IContentField<string>
- `mantine_datepicker_with_seconds?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Navigation & Links Styles

#### IButtonStyle (`button`)
**Fields:**
- `mantine_variant?`: IContentField<TMantineVariant>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `mantine_fullwidth?`: IContentField<TMantineFullWidth>
- `mantine_compact?`: IContentField<TMantineCompact>
- `mantine_auto_contrast?`: IContentField<TMantineAutoContrast>
- `is_link?`: IContentField<TMantineFullWidth>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `disabled?`: IContentField<TMantineDisabled>
- `open_in_new_tab?`: IContentField<TMantineFullWidth>
- `page_keyword?`: IContentField<string>
- `url?`: IContentField<string>
- `label?`: IContentField<string>
- `label_cancel?`: IContentField<string>
- `confirmation_title?`, `confirmation_continue?`, `confirmation_message?`: IContentField<string>

#### ILinkStyle (`link`)
**Fields:**
- `label?`: IContentField<string>
- `url?`: IContentField<string>
- `open_in_new_tab?`: IContentField<string>

#### ITabsStyle (`tabs`)
**Fields:**
- `mantine_tabs_variant?`: IContentField<string>
- `mantine_tabs_orientation?`: IContentField<TMantineOrientation>
- `mantine_tabs_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_width?`: IContentField<TMantineWidth>
- `mantine_height?`: IContentField<TMantineHeight>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ITabStyle (`tab`)
**Fields:**
- `label?`: IContentField<string>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `mantine_tab_disabled?`: IContentField<TMantineDisabled>
- `mantine_width?`: IContentField<TMantineWidth>
- `mantine_height?`: IContentField<TMantineHeight>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- Legacy: `type?`, `is_active?`, `icon?`: IContentField<string>

#### IEntryListStyle (`entryList`)
**Fields:** None specific (base style only)

#### IEntryRecordStyle (`entryRecord`)
**Fields:** None specific (base style only)

#### IEntryRecordDeleteStyle (`entryRecordDelete`)
**Fields:** None specific (base style only)

#### IVersionStyle (`version`)
**Fields:** None specific (base style only)

#### ILoopStyle (`loop`)
**Fields:**
- `loop?`: IContentField<any[]>

### Mantine Form Components

#### IColorInputStyle (`color-input`)
**Fields:**
- `mantine_color_format?`: IContentField<TMantineColorFormat>
- `mantine_color_input_swatches?`: IContentField<TMantineColorPickerSwatches>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `placeholder?`: IContentField<string>
- `name?`: IContentField<string>
- `value?`: IContentField<string>
- `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IColorPickerStyle (`color-picker`)
**Fields:**
- `mantine_color_format?`: IContentField<string>
- `mantine_color_picker_swatches_per_row?`: IContentField<string>
- `mantine_color_picker_swatches?`: IContentField<string>
- `mantine_color_picker_with_picker?`: IContentField<string>
- `mantine_color_picker_saturation_label?`, `mantine_color_picker_hue_label?`, `mantine_color_picker_alpha_label?`: IContentField<string>
- `mantine_color_picker_as_button?`: IContentField<string>
- `mantine_color_picker_button_label?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_fullwidth?`: IContentField<string>
- `name?`: IContentField<string>
- `value?`: IContentField<string>
- `description?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IFileInputStyle (`file-input`)
**Fields:**
- `mantine_file_input_multiple?`: IContentField<string>
- `mantine_file_input_accept?`: IContentField<string>
- `mantine_file_input_clearable?`: IContentField<string>
- `mantine_file_input_max_size?`: IContentField<string>
- `mantine_file_input_max_files?`: IContentField<string>
- `mantine_file_input_drag_drop?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `placeholder?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `is_required?`: IContentField<TMantineRequired>
- `name?`: IContentField<string>
- `label?`: IContentField<string>
- `description?`: IContentField<string>

#### INumberInputStyle (`number-input`)
**Fields:**
- `mantine_numeric_min?`, `mantine_numeric_max?`, `mantine_numeric_step?`: IContentField<string>
- `mantine_number_input_decimal_scale?`: IContentField<string>
- `mantine_number_input_clamp_behavior?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `placeholder?`: IContentField<string>
- `label?`: IContentField<string>
- `description?`: IContentField<string>
- `name?`: IContentField<string>
- `value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IRangeSliderStyle (`range-slider`)
**Fields:**
- `label?`, `description?`, `name?`, `value?`: IContentField<string>
- `mantine_numeric_min?`, `mantine_numeric_max?`, `mantine_numeric_step?`: IContentField<string>
- `mantine_range_slider_marks_values?`: IContentField<string>
- `mantine_range_slider_show_label?`, `mantine_range_slider_labels_always_on?`, `mantine_range_slider_inverted?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_radius?`: IContentField<TMantineRadius>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ISegmentedControlStyle (`segmented-control`)
**Fields:**
- `mantine_segmented_control_data?`: IContentField<string>
- `mantine_orientation?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `fullwidth?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `readonly?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_segmented_control_item_border?`: IContentField<string>
- `label?`, `description?`, `value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `name?`: IContentField<string>

#### ISwitchStyle (`switch`)
**Fields:**
- `label?`, `description?`: IContentField<string>
- `mantine_switch_on_label?`, `mantine_switch_off_label?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_radius?`: IContentField<TMantineRadius>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `name?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `mantine_label_position?`: IContentField<string>
- `value?`: IContentField<string>
- `mantine_switch_on_value?`, `mantine_switch_off_value?`: IContentField<string>
- `mantine_use_input_wrapper?`: IContentField<string>

#### IComboboxStyle (`combobox`)
**Fields:**
- `placeholder?`: IContentField<string>
- `mantine_combobox_options?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `label?`, `description?`, `name?`, `value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `mantine_combobox_multi_select?`, `mantine_combobox_searchable?`, `mantine_combobox_creatable?`, `mantine_combobox_clearable?`, `mantine_combobox_separator?`: IContentField<string>
- `mantine_multi_select_max_values?`: IContentField<string>

#### IActionIconStyle (`action-icon`)
**Fields:**
- `mantine_variant?`: IContentField<TMantineVariant>
- `mantine_action_icon_loading?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_left_icon?`: IContentField<string>
- `is_link?`: IContentField<string>
- `page_keyword?`: IContentField<string>
- `open_in_new_tab?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Mantine Typography Components

#### ITitleStyle (`title`)
**Fields:**
- `content?`: IContentField<string>
- `mantine_title_order?`: IContentField<TMantineTitleOrder>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_title_text_wrap?`: IContentField<TMantineTitleTextWrap>
- `mantine_title_line_clamp?`: IContentField<TMantineTitleLineClamp>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ITextStyle (`text`)
**Fields:**
- `text?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_text_font_weight?`: IContentField<TMantineTextFontWeight>
- `mantine_text_font_style?`: IContentField<TMantineTextFontStyle>
- `mantine_text_text_decoration?`: IContentField<TMantineTextDecoration>
- `mantine_text_text_transform?`: IContentField<TMantineTextTransform>
- `mantine_text_align?`: IContentField<TMantineTextAlign>
- `mantine_text_variant?`: IContentField<TMantineTextVariant>
- `mantine_text_gradient?`: IContentField<string>
- `mantine_text_truncate?`: IContentField<TMantineTextTruncate>
- `mantine_text_line_clamp?`: IContentField<TMantineLineClamp>
- `mantine_text_inherit?`: IContentField<TMantineTextInherit>
- `mantine_text_span?`: IContentField<TMantineTextSpan>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ICodeStyle (`code`)
**Fields:**
- `mantine_code_block?`: IContentField<string>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `content?`: IContentField<string>

#### IHighlightStyle (`highlight`)
**Fields:**
- `text?`: IContentField<string>
- `mantine_highlight_highlight?`: IContentField<string>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IBlockquoteStyle (`blockquote`)
**Fields:**
- `content?`: IContentField<string>
- `cite?`: IContentField<string>
- `mantine_left_icon?`: IContentField<string>
- `mantine_icon_size?`: IContentField<TMantineIconSize>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Mantine Data Display Components

#### IBadgeStyle (`badge`)
**Fields:**
- `mantine_variant?`: IContentField<TMantineVariant>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_left_icon?`, `mantine_right_icon?`: IContentField<string>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_auto_contrast?`: IContentField<TMantineAutoContrast>

#### IChipStyle (`chip`)
**Fields:**
- `mantine_chip_variant?`: IContentField<TMantineChipVariant>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_chip_checked?`: IContentField<TMantineChipChecked>
- `mantine_chip_multiple?`: IContentField<TMantineChipMultiple>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_left_icon?`: IContentField<string>
- `mantine_icon_size?`: IContentField<TMantineIconSize>
- `name?`: IContentField<string>
- `value?`: IContentField<string>
- `chip_value?`: IContentField<string>
- `mantine_chip_on_value?`, `mantine_chip_off_value?`: IContentField<string>
- `is_required?`: IContentField<TMantineRequired>
- `tooltip?`: IContentField<string>
- `mantine_tooltip_position?`: IContentField<string>
- `chip_on_value?`, `chip_off_value?`: IContentField<string>
- `chip_checked?`: IContentField<string>

#### IAvatarStyle (`avatar`)
**Fields:**
- `src?`: IContentField<string>
- `alt?`: IContentField<string>
- `mantine_avatar_variant?`: IContentField<TMantineAvatarVariant>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_left_icon?`: IContentField<string>
- `mantine_avatar_initials?`: IContentField<string>
- `img_src?`: IContentField<string>

#### ITimelineStyle (`timeline`)
**Fields:**
- `mantine_timeline_bullet_size?`: IContentField<TMantineTimelineBulletSize>
- `mantine_timeline_line_width?`: IContentField<TMantineTimelineLineWidth>
- `mantine_timeline_active?`: IContentField<TMantineTimelineActive>
- `mantine_timeline_align?`: IContentField<TMantineTimelineAlign>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IIndicatorStyle (`indicator`)
**Fields:**
- `mantine_indicator_processing?`: IContentField<string>
- `mantine_indicator_disabled?`: IContentField<TMantineDisabled>
- `mantine_indicator_size?`: IContentField<string>
- `mantine_indicator_position?`: IContentField<string>
- `label?`: IContentField<string>
- `mantine_indicator_inline?`: IContentField<string>
- `mantine_indicator_offset?`: IContentField<string>
- `mantine_border?`: IContentField<string>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IKbdStyle (`kbd`)
**Fields:**
- `label?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IRatingStyle (`rating`)
**Fields:**
- `label?`, `description?`, `name?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `value?`: IContentField<string>
- `readonly?`: IContentField<string>
- `mantine_rating_count?`: IContentField<string>
- `mantine_rating_fractions?`: IContentField<string>
- `mantine_rating_use_smiles?`: IContentField<string>
- `mantine_rating_empty_icon?`, `mantine_rating_full_icon?`: IContentField<string>
- `mantine_rating_highlight_selected_only?`: IContentField<string>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IProgressStyle (`progress`)
**Fields:**
- `value?`: IContentField<string>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_progress_striped?`: IContentField<TMantineFullWidth>
- `mantine_progress_animated?`: IContentField<TMantineFullWidth>
- `mantine_progress_transition_duration?`: IContentField<TMantineProgressTransitionDuration>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IProgressRootStyle (`progress-root`)
**Fields:**
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_progress_auto_contrast?`: IContentField<TMantineFullWidth>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IProgressSectionStyle (`progress-section`)
**Fields:**
- `value?`: IContentField<string>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_progress_striped?`: IContentField<TMantineFullWidth>
- `mantine_progress_animated?`: IContentField<TMantineFullWidth>
- `label?`: IContentField<string>
- `mantine_tooltip_label?`: IContentField<string>
- `mantine_tooltip_position?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IThemeIconStyle (`theme-icon`)
**Fields:**
- `mantine_variant?`: IContentField<TMantineVariant>
- `mantine_size?`: IContentField<TMantineSize>
- `mantine_radius?`: IContentField<TMantineRadius>
- `mantine_color?`: IContentField<TMantineColor>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_left_icon?`: IContentField<string>

### Mantine Navigation Components

#### IAccordionStyle (`accordion`)
**Fields:**
- `mantine_accordion_variant?`: IContentField<TMantineAccordionVariant>
- `mantine_accordion_multiple?`: IContentField<TMantineAccordionMultiple>
- `mantine_accordion_chevron_position?`: IContentField<TMantineAccordionChevronPosition>
- `mantine_accordion_chevron_size?`: IContentField<TMantineAccordionChevronSize>
- `mantine_accordion_disable_chevron_rotation?`: IContentField<TMantineAccordionDisableChevronRotation>
- `mantine_accordion_loop?`: IContentField<TMantineAccordionLoop>
- `mantine_accordion_transition_duration?`: IContentField<TMantineAccordionTransitionDuration>
- `mantine_accordion_default_value?`: IContentField<TMantineAccordionDefaultValue>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IAccordionItemStyle (`accordion-item`)
**Fields:**
- `mantine_accordion_item_value?`: IContentField<string>
- `label?`: IContentField<string>
- `mantine_accordion_item_icon?`: IContentField<string>
- `disabled?`: IContentField<TMantineDisabled>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Mantine Feedback Components

#### INotificationStyle (`notification`)
**Fields:**
- `title?`: IContentField<string>
- `content?`: IContentField<string>
- `mantine_left_icon?`: IContentField<string>
- `mantine_color?`: IContentField<TMantineColor>
- `mantine_notification_loading?`: IContentField<string>
- `mantine_notification_with_close_button?`: IContentField<string>
- `mantine_border?`: IContentField<string>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Card Components

#### ICardStyle (`card`)
**Fields:**
- `mantine_card_shadow?`: IContentField<TMantineCardShadow>
- `mantine_border?`: IContentField<TMantineBorder>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ICardSegmentStyle (`card-segment`)
**Fields:**
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### List Components

#### IListStyle (`list`)
**Fields:**
- `mantine_list_type?`: IContentField<TMantineListType>
- `mantine_spacing?`: IContentField<TMantineSpacing>
- `mantine_size?`: IContentField<TMantineSize>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `mantine_list_list_style_type?`: IContentField<TMantineListStyleType>
- `mantine_list_with_padding?`: IContentField<TMantineListWithPadding>
- `mantine_list_center?`: IContentField<TMantineListCenter>
- `mantine_list_icon?`: IContentField<string>

#### IListItemStyle (`list-item`)
**Fields:**
- `mantine_list_item_content?`: IContentField<string>
- `mantine_list_item_icon?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

### Utility Components

#### IAspectRatioStyle (`aspect-ratio`)
**Fields:**
- `mantine_aspect_ratio?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IBackgroundImageStyle (`background-image`)
**Fields:**
- `img_src?`: IContentField<string>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IFieldsetStyle (`fieldset`)
**Fields:**
- `legend?`: IContentField<string>
- `mantine_fieldset_variant?`: IContentField<TMantineFieldsetVariant>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>
- `disabled?`: IContentField<TMantineDisabled>

#### ISpoilerStyle (`spoiler`)
**Fields:**
- `mantine_height?`: IContentField<TMantineSpoilerMaxHeight>
- `mantine_spoiler_show_label?`: IContentField<string>
- `mantine_spoiler_hide_label?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### ITypographyStyle (`typography`)
**Fields:**
- `use_mantine_style?`: IContentField<TMantineTypographyUseMantineStyle>

### Media Components

#### IImageStyle (`image`)
**Fields:**
- `title?`: IContentField<string>
- `is_fluid?`: IContentField<string>
- `alt?`: IContentField<string>
- `img_src?`: IContentField<string>
- `height?`: IContentField<string>
- `width?`: IContentField<string>
- `mantine_image_fit?`: IContentField<TMantineImageFit>
- `mantine_width?`: IContentField<TMantineWidth>
- `mantine_height?`: IContentField<TMantineHeight>
- `mantine_radius?`: IContentField<TMantineRadius>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

#### IVideoStyle (`video`)
**Fields:**
- `is_fluid?`: IContentField<string>
- `alt?`: IContentField<string>
- `sources?`: IContentField<any[]>

#### IAudioStyle (`audio`)
**Fields:**
- `sources?`: IContentField<any[]>

#### IFigureStyle (`figure`)
**Fields:**
- `caption_title?`: IContentField<string>
- `caption?`: IContentField<string>

#### ICarouselStyle (`carousel`)
**Fields:**
- `id_prefix?`: IContentField<string>
- `has_controls?`: IContentField<string>
- `has_indicators?`: IContentField<string>
- `has_crossfade?`: IContentField<string>
- `sources?`: IContentField<any[]>
- `mantine_height?`: IContentField<string>
- `mantine_carousel_slide_size?`: IContentField<string>
- `mantine_carousel_slide_gap?`: IContentField<string>
- `mantine_orientation?`: IContentField<string>
- `mantine_control_size?`: IContentField<string>
- `mantine_carousel_controls_offset?`: IContentField<string>
- `mantine_carousel_next_control_icon?`: IContentField<string>
- `mantine_carousel_previous_control_icon?`: IContentField<string>
- `mantine_loop?`: IContentField<string>
- `drag_free?`: IContentField<string>
- `mantine_carousel_align?`: IContentField<string>
- `mantine_carousel_contain_scroll?`: IContentField<string>
- `skip_snaps?`: IContentField<string>
- `mantine_carousel_in_view_threshold?`: IContentField<string>
- `mantine_carousel_duration?`: IContentField<string>
- `mantine_carousel_embla_options?`: IContentField<string>
- `use_mantine_style?`: IContentField<TMantineFullWidth>

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
- [ ] `string` → `text` (for short strings), `textarea` (for longer content)
- [ ] `number` → `select` with `{"creatable": true}` for sizes/durations (provides presets + custom input), `select` for predefined options only
- [ ] `boolean` → `checkbox`
- [ ] `enum` → `segment` or `select`
- [ ] `ReactNode` → `text` (for content) or appropriate text style
- [ ] Arrays → `textarea` with JSON validation
- [ ] Objects → `textarea` with JSON validation
- [ ] **Icon fields** → `select-icon` (always use this for Mantine icon props)
- [ ] **Size values (px)** → `select` with creatable: true and preset options (14px, 16px, 18px, 20px, 24px, 32px)
- [ ] **Duration values (ms)** → `select` with creatable: true and preset options (150ms, 200ms, 300ms, 400ms, 0ms, 500ms)
- [ ] **Rich text content** → Use `rich-text-editor` style instead of markdown

#### 4. Special Field Requirements
- [ ] **Display Field**: `display = 1` for content fields (translatable)
- [ ] **Property Fields**: `display = 0` for configuration (non-translatable)
- [ ] **Custom Fields**: New fields that need to be created in the system
- [ ] **Field Configuration**: JSON config for select/segment options
- [ ] **Text Content**: Choose appropriate text style (`text`, `title`, `blockquote`, `code`, `highlight`, `typography`) based on content type

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
import IconComponent from '../../shared/common/IconComponent';
import { I{COMPONENT_NAME}Style } from '../../../../../types/common/styles.types';

interface I{COMPONENT_NAME}StyleProps {
    style: I{COMPONENT_NAME}Style;
}

const {COMPONENT_NAME}Style: React.FC<I{COMPONENT_NAME}StyleProps> = ({ style }) => {
    // Extract field values using direct style property access
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Extract Mantine-specific props
    const variant = style.mantine_{COMPONENT_NAME}_variant?.content || 'default';
    const size = style.mantine_size?.content || 'sm';
    const iconName = style.mantine_{COMPONENT_NAME}_icon?.content;

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
Use direct property access on the style object:
```typescript
// Access field content directly
const fieldValue = style.field_name?.content;

// For boolean fields
const isEnabled = style.field_name?.content === '1';

// For numeric fields with fallback
const size = style.mantine_size?.content || 'md';
```

### Import Requirements
- Import the Mantine component from `@mantine/core`
- Import IconComponent for icon fields
- Import CSS modules if custom styling is used
- Only import utility functions like `castMantineSize`, `castMantineRadius` when needed for type casting

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
3. **For text content**: Choose the appropriate text style from the available options:
   - `text` for simple paragraphs and descriptions
   - `title` for headings and prominent text
   - `blockquote` for quotes and testimonials
   - `code` for code examples and technical content
   - `highlight` for emphasized text and search results
   - `rich-text-editor` for rich formatted content (WYSIWYG)
4. **Follow the checklists** in order, checking off completed items
5. **Execute SQL changes** in the correct order (style group → styles → fields → styles_fields → relationships)
6. **Implement the frontend component** using the provided templates
7. **CRITICAL**: Add the component to BasicStyle.tsx (see detailed instructions in Post-Implementation section)
8. **Test thoroughly** before marking as complete

## Common Patterns and Best Practices

### Field Type Selection
- Use `checkbox` for boolean values
- Use `select` for predefined string options
- Use `segment` for mutually exclusive options
- Use `textarea` for JSON data or long text
- Use `text` for short strings and URLs
- Use `rich-text-editor` for rich formatted content
- Use appropriate text styles (`text`, `title`, `blockquote`, `code`, `highlight`, `typography`) based on content type and presentation needs

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
