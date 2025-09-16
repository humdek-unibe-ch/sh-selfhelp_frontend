// Style name literal types for type safety
export type TStyleName =
    | 'login' | 'profile' | 'validate' | 'register' | 'resetPassword' | 'twoFactorAuth'
    | 'container' | 'alert' | 'div' | 'refContainer' | 'dataContainer' | 'htmlTag' | 'center'
    | 'flex' | 'group' | 'stack' | 'simpleGrid' | 'space' | 'grid' | 'grid-column' | 'divider' | 'paper'
    | 'heading' | 'markdown' | 'markdownInline' | 'plaintext'
    | 'formUserInput' | 'formUserInputLog' | 'formUserInputRecord' | 'input' | 'textarea' | 'select' | 'radio' | 'slider' | 'checkbox'
    | 'image' | 'video' | 'audio' | 'figure' | 'carousel'
    | 'button' | 'link'
    | 'entryList' | 'entryRecord' | 'entryRecordDelete'
    | 'tabs' | 'tab'
    | 'table' | 'tableRow' | 'tableCell'
    | 'progressBar' | 'showUserInput' | 'version' | 'loop'
    // Mantine form components
    | 'button' | 'color-input' | 'color-picker' | 'fileInput' | 'numberInput' | 'radio-group' | 'range-slider'
    | 'segmentedControl' | 'switch' | 'combobox' | 'multiSelect' | 'actionIcon'
    // Mantine typography components
    | 'code'
    // Mantine data display components
    | 'badge' | 'chip' | 'avatar' | 'timeline' | 'timeline-item' | 'indicator'
    | 'kbd' | 'rating' | 'themeIcon' | 'progress' | 'progress-root' | 'progress-section' | 'progress-label'
    // Mantine navigation components
    | 'stepper' | 'stepper-Step' | 'stepper-Complete' | 'accordion' | 'accordion-Item'
    // Mantine feedback components
    | 'notification'
    // Mantine typography components
    | 'title' | 'code' | 'highlight' | 'blockquote'
    // Mantine utility components
    | 'aspectRatio' | 'background-image' | 'fieldset' | 'spoiler'
    // Card components
    | 'card' | 'card-segment'
    // List components
    | 'list' | 'list-item'
    // Remove duplicates and ensure proper names
    | 'typography';

// Base interfaces
export interface IContentField<T> {
    content: T;
    meta?: string;
    type?: string;
    id?: string;
    default?: string;
}

// Base style interface that all styles extend
interface IBaseStyle {
    id: number;
    id_styles: number;
    style_name: TStyleName;
    can_have_children: number | null;
    position: number;
    path: string;
    children?: TStyle[];
    name?: IContentField<string>;
    label?: IContentField<string>;
    label_cancel?: IContentField<string>;
    section_data: any[];
    fields: Record<string, IContentField<any>>;
    // Direct fields from API response (not nested in global_fields)
    condition: string | null;
    css: string | null;
    css_mobile: string | null;
    debug: number | null;
    data_config: string | number | null;
}

// Authentication & User Management Styles
export interface ILoginStyle extends IBaseStyle {
    style_name: 'login';
    label_user?: IContentField<string>;
    label_pw?: IContentField<string>;
    label_login?: IContentField<string>;
    label_pw_reset?: IContentField<string>;
    alert_fail?: IContentField<string>;
    login_title?: IContentField<string>;
    type?: IContentField<string>;
}

export interface IProfileStyle extends IBaseStyle {
    style_name: 'profile';
    alert_fail?: IContentField<string>;
    alert_del_fail?: IContentField<string>;
    alert_del_success?: IContentField<string>;
    alert_success?: IContentField<string>;
}

export interface IValidateStyle extends IBaseStyle {
    style_name: 'validate';
    label_pw?: IContentField<string>;
    label_login?: IContentField<string>;
    alert_fail?: IContentField<string>;
    label_pw_confirm?: IContentField<string>;
    title?: IContentField<string>;
    subtitle?: IContentField<string>;
    alert_success?: IContentField<string>;
    label_name?: IContentField<string>;
    name_placeholder?: IContentField<string>;
    name_description?: IContentField<string>;
    label_gender?: IContentField<string>;
    gender_male?: IContentField<string>;
    gender_female?: IContentField<string>;
    gender_divers?: IContentField<string>;
    label_activate?: IContentField<string>;
    pw_placeholder?: IContentField<string>;
    success?: IContentField<string>;
    name?: IContentField<string>;
    page_keyword?: IContentField<string>;
    value_gender?: IContentField<string>;
    value_name?: IContentField<string>;
    anonymous_user_name_description?: IContentField<string>;
}

export interface IRegisterStyle extends IBaseStyle {
    style_name: 'register';
    label_user?: IContentField<string>;
    label_pw?: IContentField<string>;
    label_submit?: IContentField<string>;
    alert_fail?: IContentField<string>;
    alert_success?: IContentField<string>;
    title?: IContentField<string>;
    success?: IContentField<string>;
}

export interface IResetPasswordStyle extends IBaseStyle {
    style_name: 'resetPassword';
    label_pw_reset?: IContentField<string>;
    text_md?: IContentField<string>;
    type?: IContentField<string>;
    alert_success?: IContentField<string>;
    placeholder?: IContentField<string>;
    email_user?: IContentField<string>;
    subject_user?: IContentField<string>;
    is_html?: IContentField<string>;
}

export interface ITwoFactorAuthStyle extends IBaseStyle {
    style_name: 'twoFactorAuth';
    label_code?: IContentField<string>;
    label_submit?: IContentField<string>;
    alert_fail?: IContentField<string>;
    title?: IContentField<string>;
    text_md?: IContentField<string>;
    label_expiration_2fa?: IContentField<string>;
}

// Container & Layout Styles
export interface IContainerStyle extends IBaseStyle {
    style_name: 'container';
    mantine_slider_size?: IContentField<string>;     // Maps to Mantine 'size' prop
    mantine_fluid?: IContentField<string>;           // Maps to Mantine 'fluid' prop
    mantine_px?: IContentField<string>;              // Maps to Mantine 'px' prop
    mantine_py?: IContentField<string>;              // Maps to Mantine 'py' prop
    use_mantine_style?: IContentField<string>;       // Controls Mantine vs custom styling
}

export interface ICenterStyle extends IBaseStyle {
    style_name: 'center';
    mantine_center_inline?: IContentField<string>;
    mantine_width?: IContentField<string>;
    mantine_height?: IContentField<string>;
    mantine_miw?: IContentField<string>;
    mantine_mih?: IContentField<string>;
    mantine_maw?: IContentField<string>;
    mantine_mah?: IContentField<string>;
}

export interface IDividerStyle extends IBaseStyle {
    style_name: 'divider';
    mantine_divider_variant?: IContentField<string>;
    mantine_divider_size?: IContentField<string>;
    mantine_divider_label?: IContentField<string>;
    mantine_divider_label_position?: IContentField<string>;
    mantine_orientation?: IContentField<string>;
    mantine_color?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
}

export interface IPaperStyle extends IBaseStyle {
    style_name: 'paper';
    mantine_paper_shadow?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    mantine_px?: IContentField<string>;
    mantine_py?: IContentField<string>;
    mantine_border?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
}

export interface IAlertStyle extends IBaseStyle {
    style_name: 'alert';
    mantine_alert_title?: IContentField<string>;
    close_button_label?: IContentField<string>;
    mantine_variant?: IContentField<string>;
    mantine_color?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    mantine_left_icon?: IContentField<string>;
    mantine_with_close_button?: IContentField<string>;
    content?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
}


export interface IDivStyle extends IBaseStyle {
    style_name: 'div';
    color_background?: IContentField<string>;
    color_border?: IContentField<string>;
    color_text?: IContentField<string>;
}


export interface IRefContainerStyle extends IBaseStyle {
    style_name: 'refContainer';
}

export interface IDataContainerStyle extends IBaseStyle {
    style_name: 'dataContainer';
}

export interface IHtmlTagStyle extends IBaseStyle {
    style_name: 'htmlTag';
    html_tag?: IContentField<string>;
}

// Text & Content Styles
export interface IHeadingStyle extends IBaseStyle {
    style_name: 'heading';
    level?: IContentField<string>;
    title?: IContentField<string>;
}

export interface IMarkdownStyle extends IBaseStyle {
    style_name: 'markdown';
    text_md?: IContentField<string>;
}


export interface IPlaintextStyle extends IBaseStyle {
    style_name: 'plaintext';
    text?: IContentField<string>;
    is_paragraph?: IContentField<string>;
}


// Form & Input Styles

export interface IFormUserInputLogStyle extends IBaseStyle {
    style_name: 'formUserInputLog';
    label?: IContentField<string>;
    type?: IContentField<string>;
    alert_success?: IContentField<string>;
    name?: IContentField<string>;
    is_log?: IContentField<string>;
    anchor?: IContentField<string>;
    ajax?: IContentField<string>;
    redirect_at_end?: IContentField<string>;
    own_entries_only?: IContentField<string>;
    internal?: IContentField<string>;
}

export interface IFormUserInputRecordStyle extends IBaseStyle {
    style_name: 'formUserInputRecord';
    label?: IContentField<string>;
    type?: IContentField<string>;
    alert_success?: IContentField<string>;
    name?: IContentField<string>;
    is_log?: IContentField<string>;
    anchor?: IContentField<string>;
    ajax?: IContentField<string>;
    redirect_at_end?: IContentField<string>;
    own_entries_only?: IContentField<string>;
    internal?: IContentField<string>;
}

export interface IInputStyle extends IBaseStyle {
    style_name: 'input';
    label?: IContentField<string>;
    type_input?: IContentField<string>;
    placeholder?: IContentField<string>;
    is_required?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    min?: IContentField<string>;
    max?: IContentField<string>;
    format?: IContentField<string>;
    locked_after_submit?: IContentField<string>;
}

export interface ITextareaStyle extends IBaseStyle {
    style_name: 'textarea';
    label?: IContentField<string>;
    placeholder?: IContentField<string>;
    is_required?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    min?: IContentField<string>;
    max?: IContentField<string>;
    locked_after_submit?: IContentField<string>;
    markdown_editor?: IContentField<string>;
}

export interface ISelectStyle extends IBaseStyle {
    style_name: 'select';
    label?: IContentField<string>;
    alt?: IContentField<string>;
    is_required?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    items?: IContentField<any[]>;
    is_multiple?: IContentField<string>;
    max?: IContentField<string>;
    live_search?: IContentField<string>;
    disabled?: IContentField<string>;
    image_selector?: IContentField<string>;
    locked_after_submit?: IContentField<string>;
    allow_clear?: IContentField<string>;
}

export interface IRadioStyle extends IBaseStyle {
    style_name: 'radio';
    label?: IContentField<string>;
    is_required?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    items?: IContentField<any[]>;
    is_inline?: IContentField<string>;
    locked_after_submit?: IContentField<string>;
}

export interface ISliderStyle extends IBaseStyle {
    style_name: 'slider';
    label?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    labels?: IContentField<any[]>;
    min?: IContentField<string>;
    max?: IContentField<string>;
    locked_after_submit?: IContentField<string>;
}

export interface ICheckboxStyle extends IBaseStyle {
    style_name: 'checkbox';
    label?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    is_required?: IContentField<string>;
    checkbox_value?: IContentField<string>;
}

// Media Styles
export interface IImageStyle extends IBaseStyle {
    style_name: 'image';
    title?: IContentField<string>;
    is_fluid?: IContentField<string>;
    alt?: IContentField<string>;
    img_src?: IContentField<string>;
    height?: IContentField<string>;
    width?: IContentField<string>;
    // Mantine-specific fields
    mantine_image_fit?: IContentField<string>;
    mantine_width?: IContentField<string>;
    mantine_height?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
}

export interface IVideoStyle extends IBaseStyle {
    style_name: 'video';
    is_fluid?: IContentField<string>;
    alt?: IContentField<string>;
    sources?: IContentField<any[]>;
}

export interface IAudioStyle extends IBaseStyle {
    style_name: 'audio';
    sources?: IContentField<any[]>;
}

export interface IFigureStyle extends IBaseStyle {
    style_name: 'figure';
    caption_title?: IContentField<string>;
    caption?: IContentField<string>;
}

export interface ICarouselStyle extends IBaseStyle {
    style_name: 'carousel';
    id_prefix?: IContentField<string>;
    has_controls?: IContentField<string>;
    has_indicators?: IContentField<string>;
    has_crossfade?: IContentField<string>;
    sources?: IContentField<any[]>;
}

// Navigation & Links Styles

export interface ILinkStyle extends IBaseStyle {
    style_name: 'link';
    label?: IContentField<string>;
    url?: IContentField<string>;
    open_in_new_tab?: IContentField<string>;
}

// List Styles
export interface IEntryListStyle extends IBaseStyle {
    style_name: 'entryList';
}

export interface IEntryRecordStyle extends IBaseStyle {
    style_name: 'entryRecord';
}

export interface IEntryRecordDeleteStyle extends IBaseStyle {
    style_name: 'entryRecordDelete';
}

// Tab Styles
export interface ITabsStyle extends IBaseStyle {
    style_name: 'tabs';
    // Tabs-specific fields
    mantine_tabs_variant?: IContentField<string>;      // Select field for variant (default, outline, pills)
    mantine_tabs_orientation?: IContentField<string>;  // Segment field for orientation (horizontal, vertical)
    mantine_tabs_radius?: IContentField<string>;       // Slider field for radius (xs, sm, md, lg, xl)
    mantine_color?: IContentField<string>;        // Select field for color (blue, gray, red, etc.)
    mantine_width?: IContentField<string>;             // Select field for width
    mantine_height?: IContentField<string>;            // Select field for height
    use_mantine_style?: IContentField<string>;         // Checkbox for Mantine vs custom styling
}

export interface ITabStyle extends IBaseStyle {
    style_name: 'tab';
    // Tab-specific fields (mantine_tab_value removed - using section ID instead)
    label?: IContentField<string>;                     // Content field for tab label
    mantine_tab_left_section?: IContentField<string>;  // Select-icon field for left icon
    mantine_tab_right_section?: IContentField<string>; // Select-icon field for right icon
    mantine_tab_disabled?: IContentField<string>;      // Checkbox field for disabled state
    mantine_width?: IContentField<string>;             // Select field for width
    mantine_height?: IContentField<string>;            // Select field for height
    use_mantine_style?: IContentField<string>;         // Checkbox for Mantine vs custom styling
    // Legacy fields for backward compatibility
    type?: IContentField<string>;
    is_active?: IContentField<string>;
    icon?: IContentField<string>;
}

// Table Styles
export interface ITableStyle extends IBaseStyle {
    style_name: 'table';
}

export interface ITableRowStyle extends IBaseStyle {
    style_name: 'tableRow';
}

export interface ITableCellStyle extends IBaseStyle {
    style_name: 'tableCell';
}

export interface IShowUserInputStyle extends IBaseStyle {
    style_name: 'showUserInput';
    delete_title?: IContentField<string>;
    label_delete?: IContentField<string>;
    delete_content?: IContentField<string>;
    is_log?: IContentField<string>;
    anchor?: IContentField<string>;
    form_name?: IContentField<string>;
    is_expanded?: IContentField<string>;
    column_names?: IContentField<string>;
    load_as_table?: IContentField<string>;
}

export interface IVersionStyle extends IBaseStyle {
    style_name: 'version';
}

export interface ILoopStyle extends IBaseStyle {
    style_name: 'loop';
    loop?: IContentField<any[]>;
}

// Mantine Layout Components
export interface IFlexStyle extends IBaseStyle {
    style_name: 'flex';
    // Flex-specific fields
    mantine_gap?: IContentField<string>;              // Slider field for gap spacing
    mantine_justify?: IContentField<string>;          // Select field for justify-content
    mantine_align?: IContentField<string>;            // Select field for align-items
    mantine_direction?: IContentField<string>;        // Segment field for flex-direction
    mantine_wrap?: IContentField<string>;             // Segment field for flex-wrap
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

export interface IGroupStyle extends IBaseStyle {
    style_name: 'group';
    // Group-specific fields
    mantine_gap?: IContentField<string>;              // Slider field for gap spacing
    mantine_justify?: IContentField<string>;          // Select field for justify-content
    mantine_align?: IContentField<string>;            // Select field for align-items
    mantine_group_wrap?: IContentField<string>;       // Segment field for wrap
    mantine_group_grow?: IContentField<string>;       // Checkbox field for grow
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

export interface ISimpleGridStyle extends IBaseStyle {
    style_name: 'simpleGrid';
    // SimpleGrid-specific fields
    mantine_cols?: IContentField<string>;             // Slider field for number of columns
    mantine_spacing?: IContentField<string>;          // Slider field for spacing
    mantine_breakpoints?: IContentField<string>;      // Slider field for breakpoints
    mantine_vertical_spacing?: IContentField<string>; // Slider field for vertical spacing
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

export interface ISpaceStyle extends IBaseStyle {
    style_name: 'space';
    // Space-specific fields
    mantine_slider_size?: IContentField<string>;      // Slider field for size
    mantine_space_h?: IContentField<string>;          // Segment field for direction
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

export interface IGridStyle extends IBaseStyle {
    style_name: 'grid';
    // Grid-specific fields
    mantine_cols?: IContentField<string>;             // Slider field for number of columns
    mantine_gap?: IContentField<string>;              // Slider field for gap/spacing
    mantine_justify?: IContentField<string>;          // Select field for justify-content
    mantine_align?: IContentField<string>;            // Select field for align-items
    mantine_grid_overflow?: IContentField<string>;    // Segment field for overflow
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
    use_mantine_style?: IContentField<string>;        // Checkbox for Mantine vs custom styling
}

export interface IGridColumnStyle extends IBaseStyle {
    style_name: 'grid-column';
    // GridColumn-specific fields
    mantine_grid_span?: IContentField<string>;        // Slider field for span (1-12, auto, content)
    mantine_grid_offset?: IContentField<string>;      // Slider field for offset (0-11)
    mantine_grid_order?: IContentField<string>;       // Slider field for order (1-12)
    mantine_grid_grow?: IContentField<string>;        // Checkbox field for grow
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
    use_mantine_style?: IContentField<string>;        // Checkbox for Mantine vs custom styling
}

export interface IStackStyle extends IBaseStyle {
    style_name: 'stack';
    // Stack-specific fields
    mantine_gap?: IContentField<string>;              // Slider field for gap spacing
    mantine_justify?: IContentField<string>;          // Select field for justify-content
    mantine_align?: IContentField<string>;            // Select field for align-items
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

// ===========================================
// MANTINE FORM COMPONENTS
// ===========================================

export interface IButtonStyle extends IBaseStyle {
    style_name: 'button';
    // Core button fields
    mantine_variant?: IContentField<string>;          // Select field for variant
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_left_icon?: IContentField<string>;        // Select-icon field for left icon
    mantine_right_icon?: IContentField<string>;       // Select-icon field for right icon
    mantine_fullwidth?: IContentField<string>;        // Checkbox field for full width
    mantine_compact?: IContentField<string>;          // Checkbox field for compact
    mantine_auto_contrast?: IContentField<string>;    // Checkbox field for auto contrast
    is_link?: IContentField<string>;                  // Checkbox field for link behavior
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    open_in_new_tab?: IContentField<string>;          // Checkbox field for opening in new tab
    page_keyword?: IContentField<string>;             // Select field for page link
    url?: IContentField<string>;                      // Text input for URL
    // Translatable content fields
    label?: IContentField<string>;                    // Translatable button label
    label_cancel?: IContentField<string>;             // Cancel button label
    confirmation_title?: IContentField<string>;       // Confirmation dialog title
    confirmation_continue?: IContentField<string>;    // Continue button text
    confirmation_message?: IContentField<string>;     // Confirmation message
}

export interface IColorInputStyle extends IBaseStyle {
    style_name: 'color-input';
    mantine_color_format?: IContentField<string>;     // Segment field for color format
    mantine_color_input_swatches?: IContentField<string>; // Checkbox field for swatches
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    placeholder?: IContentField<string>;              // Translatable placeholder
    name?: IContentField<string>;                     // Text field for form field name
    value?: IContentField<string>;                    // Text field for default value
    description?: IContentField<string>;              // Textarea field for description
    is_required?: IContentField<string>;              // Checkbox field for required validation
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IColorPickerStyle extends IBaseStyle {
    style_name: 'color-picker';
    mantine_color_format?: IContentField<string>;     // Segment field for color format
    mantine_color_picker_swatches_per_row?: IContentField<string>; // Slider field for swatches per row
    mantine_color_picker_swatches?: IContentField<string>; // Textarea field for swatches array
    mantine_color_picker_with_picker?: IContentField<string>; // Checkbox field for showing picker
    mantine_color_picker_saturation_label?: IContentField<string>; // Text field for saturation label
    mantine_color_picker_hue_label?: IContentField<string>; // Text field for hue label
    mantine_color_picker_alpha_label?: IContentField<string>; // Text field for alpha label
    mantine_color_picker_as_button?: IContentField<string>; // Checkbox field for button display mode
    mantine_color_picker_button_label?: IContentField<string>; // Text field for button label
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_fullwidth?: IContentField<string>;        // Checkbox field for full width
    name?: IContentField<string>;                     // Text field for form field name
    value?: IContentField<string>;                    // Text field for default value
    description?: IContentField<string>;              // Textarea field for description
    is_required?: IContentField<string>;              // Checkbox field for required validation
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IFileInputStyle extends IBaseStyle {
    style_name: 'fileInput';
    mantine_file_input_multiple?: IContentField<string>; // Checkbox field for multiple files
    mantine_file_input_accept?: IContentField<string>; // Select field for accepted file types
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    placeholder?: IContentField<string>;              // Translatable placeholder
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface INumberInputStyle extends IBaseStyle {
    style_name: 'numberInput';
    mantine_numeric_min?: IContentField<string>;      // Select field for minimum value
    mantine_numeric_max?: IContentField<string>;      // Select field for maximum value
    mantine_numeric_step?: IContentField<string>;     // Select field for step value
    mantine_number_input_decimal_scale?: IContentField<string>; // Slider field for decimal places
    mantine_number_input_clamp_behavior?: IContentField<string>; // Segment field for clamp behavior
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    placeholder?: IContentField<string>;              // Translatable placeholder
    label?: IContentField<string>;                    // Text field for label
    description?: IContentField<string>;              // Textarea field for description
    name?: IContentField<string>;                     // Text field for form field name
    value?: IContentField<string>;                    // Text field for default value
    is_required?: IContentField<string>;              // Checkbox field for required validation
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}


export interface IRadioStyle extends IBaseStyle {
    style_name: 'radio';
    label?: IContentField<string>;                    // Translatable label
    description?: IContentField<string>;              // Translatable description
    name?: IContentField<string>;                     // Form field name
    value?: IContentField<string>;                    // Form field value
    is_required?: IContentField<string>;              // Required field flag
    mantine_orientation?: IContentField<string>;      // Segment field for orientation (when options provided)
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_radio_options?: IContentField<string>;    // Translatable JSON textarea for options (renders as group when provided)
    mantine_radio_label_position?: IContentField<string>; // Select field for label position (left/right)
    mantine_radio_variant?: IContentField<string>;    // Select field for radio variant (default/outline)
    mantine_radio_card?: IContentField<string>;       // Checkbox field for radio card option
    mantine_tooltip_label?: IContentField<string>;    // Textarea field for tooltip text
    mantine_tooltip_position?: IContentField<string>; // Select field for tooltip position
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IRangeSliderStyle extends IBaseStyle {
    style_name: 'range-slider';
    label?: IContentField<string>;                     // Translatable label for the input field
    description?: IContentField<string>;              // Translatable description text
    name?: IContentField<string>;        
    value?: IContentField<string>;              // Value attribute for form integration
    mantine_numeric_min?: IContentField<string>;      // Select field for minimum value
    mantine_numeric_max?: IContentField<string>;      // Select field for maximum value
    mantine_numeric_step?: IContentField<string>;     // Select field for step value
    mantine_range_slider_marks?: IContentField<string>; // Checkbox field for marks
    mantine_range_slider_marks_values?: IContentField<string>; // Translatable textarea for custom marks JSON
    mantine_range_slider_show_label?: IContentField<string>; // Checkbox field for show label on hover
    mantine_range_slider_labels_always_on?: IContentField<string>; // Checkbox field for labels always on
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_radius?: IContentField<string>;           // Select field for border radius
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ISegmentedControlStyle extends IBaseStyle {
    style_name: 'segmentedControl';
    mantine_segmented_control_data?: IContentField<string>; // Translatable JSON textarea for data
    mantine_orientation?: IContentField<string>;      // Segment field for orientation
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    fullwidth?: IContentField<string>;                // Checkbox field for full width
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ISwitchStyle extends IBaseStyle {
    style_name: 'switch';
    label?: IContentField<string>;                    // Translatable label
    description?: IContentField<string>;              // Translatable description
    mantine_switch_on_label?: IContentField<string>;  // Translatable on label
    mantine_switch_off_label?: IContentField<string>; // Translatable off label
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IComboboxStyle extends IBaseStyle {
    style_name: 'combobox';
    placeholder?: IContentField<string>;              // Translatable placeholder
    mantine_combobox_options?: IContentField<string>; // Translatable JSON textarea for options
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    // Form integration fields
    label?: IContentField<string>;                    // Label for form integration
    description?: IContentField<string>;              // Description text
    name?: IContentField<string>;                     // Field name for form submission
    value?: IContentField<string>;                    // Default value
    is_required?: IContentField<string>;              // Required field flag
    // Combobox configuration (similar to CreatableSelectField)
    mantine_combobox_multi_select?: IContentField<string>; // Multi-select toggle
    mantine_combobox_searchable?: IContentField<string>;   // Searchable toggle
    mantine_combobox_creatable?: IContentField<string>;    // Creatable toggle
    mantine_combobox_clearable?: IContentField<string>;    // Clearable toggle
    mantine_combobox_separator?: IContentField<string>;     // Separator for multi-select
    mantine_multi_select_max_values?: IContentField<string>; // Max values for multi-select
}

export interface IActionIconStyle extends IBaseStyle {
    style_name: 'actionIcon';
    mantine_variant?: IContentField<string>;          // Select field for variant
    mantine_action_icon_loading?: IContentField<string>; // Checkbox field for loading
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_left_icon?: IContentField<string>;        // Select-icon field for icon
    is_link?: IContentField<string>;                  // Checkbox field for link behavior
    page_keyword?: IContentField<string>;             // Select field for page link
    open_in_new_tab?: IContentField<string>;          // Checkbox field for opening in new tab
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// MANTINE DATA DISPLAY COMPONENTS
// ===========================================

export interface IBadgeStyle extends IBaseStyle {
    style_name: 'badge';
    mantine_variant?: IContentField<string>;          // Select field for variant
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_left_icon?: IContentField<string>;        // Select-icon field for left icon
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IChipStyle extends IBaseStyle {
    style_name: 'chip';
    mantine_chip_variant?: IContentField<string>;     // Select field for variant
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_chip_checked?: IContentField<string>;     // Checkbox field for checked state
    mantine_chip_multiple?: IContentField<string>;    // Checkbox field for multiple selection
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    // Icon configuration fields
    mantine_left_icon?: IContentField<string>;        // Icon selection field
    mantine_icon_size?: IContentField<string>;        // Icon size field
    // Form configuration fields
    name?: IContentField<string>;                     // Field name for form submission
    value?: IContentField<string>;                    // Default value for the chip field
    chip_value?: IContentField<string>;               // Legacy field - value to be submitted when checked
    mantine_chip_on_value?: IContentField<string>;    // Value when chip is checked
    mantine_chip_off_value?: IContentField<string>;   // Value when chip is unchecked
    is_required?: IContentField<string>;              // Makes the chip field required
}

export interface IAvatarStyle extends IBaseStyle {
    style_name: 'avatar';
    src?: IContentField<string>;                      // Image source
    alt?: IContentField<string>;                      // Translatable alt text
    mantine_avatar_variant?: IContentField<string>;   // Select field for variant
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ITimelineStyle extends IBaseStyle {
    style_name: 'timeline';
    mantine_size?: IContentField<string>;             // Select field for bullet size
    mantine_timeline_line_width?: IContentField<string>; // Select field for line width
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ITimelineItemStyle extends IBaseStyle {
    style_name: 'timeline-item';
    title?: IContentField<string>;                    // Translatable title
    mantine_timeline_item_bullet?: IContentField<string>; // Select-icon field for bullet icon
    mantine_timeline_item_line_variant?: IContentField<string>; // Segment field for line variant
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IIndicatorStyle extends IBaseStyle {
    style_name: 'indicator';
    mantine_indicator_processing?: IContentField<string>; // Checkbox field for processing
    mantine_indicator_disabled?: IContentField<string>; // Checkbox field for disabled
    mantine_indicator_size?: IContentField<string>;     // Slider field for size (6-40px)
    mantine_indicator_position?: IContentField<string>;  // Select field for position
    label?: IContentField<string>;    // Text field for label
    mantine_indicator_inline?: IContentField<string>;   // Checkbox field for inline
    mantine_indicator_offset?: IContentField<string>;   // Select field for offset
    mantine_border?: IContentField<string>; // Checkbox field for border
    mantine_radius?: IContentField<string>;             // Select field for border radius
    mantine_color?: IContentField<string>;              // Color picker field
    use_mantine_style?: IContentField<string>;          // Checkbox field for Mantine styling
}

export interface IKbdStyle extends IBaseStyle {
    style_name: 'kbd';
    label?: IContentField<string>;                    // Translatable label
    mantine_size?: IContentField<string>;             // Select field for size
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IRatingStyle extends IBaseStyle {
    style_name: 'rating';
    mantine_rating_count?: IContentField<string>;       // Slider field for number of stars
    mantine_rating_fractions?: IContentField<string>;   // Slider field for fractional stars
    mantine_rating_readonly?: IContentField<string>;    // Checkbox field for readonly mode
    mantine_size?: IContentField<string>;               // Select field for size
    mantine_color?: IContentField<string>;              // Color picker field
    use_mantine_style?: IContentField<string>;          // Checkbox field for Mantine styling
}

export interface IProgressStyle extends IBaseStyle {
    style_name: 'progress';
    value?: IContentField<string>;             // Number field for progress value (0-100)
    mantine_color?: IContentField<string>;                      // Color picker field
    mantine_radius?: IContentField<string>;                     // Select field for radius
    mantine_size?: IContentField<string>;                       // Select field for size
    mantine_progress_striped?: IContentField<string>;           // Checkbox field for striped pattern
    mantine_progress_animated?: IContentField<string>;          // Checkbox field for animation
    mantine_progress_transition_duration?: IContentField<string>; // Select field for transition duration
    use_mantine_style?: IContentField<string>;                  // Checkbox field for Mantine styling
}

export interface IProgressRootStyle extends IBaseStyle {
    style_name: 'progress-root';
    mantine_size?: IContentField<string>;                       // Select field for size
    mantine_progress_auto_contrast?: IContentField<string>;     // Checkbox field for auto contrast
    use_mantine_style?: IContentField<string>;                  // Checkbox field for Mantine styling
}

export interface IProgressSectionStyle extends IBaseStyle {
    style_name: 'progress-section';
    value?: IContentField<string>;             // Number field for section value (0-100)
    mantine_color?: IContentField<string>;                      // Color picker field
    mantine_progress_striped?: IContentField<string>;           // Checkbox field for striped pattern
    mantine_progress_animated?: IContentField<string>;          // Checkbox field for animation
    label?: IContentField<string>;                              // Text field for section label
    mantine_tooltip_label?: IContentField<string>;              // Text field for tooltip label (display = 1)
    mantine_tooltip_position?: IContentField<string>;           // Select field for tooltip position
    use_mantine_style?: IContentField<string>;                  // Checkbox field for Mantine styling
}

export interface IThemeIconStyle extends IBaseStyle {
    style_name: 'themeIcon';
    mantine_variant?: IContentField<string>;          // Select field for variant
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// MANTINE NAVIGATION COMPONENTS
// ===========================================

export interface IStepperStyle extends IBaseStyle {
    style_name: 'stepper';
    mantine_stepper_active?: IContentField<string>;   // Slider field for active step
    mantine_orientation?: IContentField<string>;      // Segment field for orientation
    mantine_stepper_allow_next_clicks?: IContentField<string>; // Checkbox field for allow next clicks
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IStepperStepStyle extends IBaseStyle {
    style_name: 'stepper-Step';
    label?: IContentField<string>;                    // Translatable label
    description?: IContentField<string>;              // Translatable description
    mantine_stepper_step_with_icon?: IContentField<string>; // Checkbox field for with icon
    mantine_stepper_step_allow_click?: IContentField<string>; // Checkbox field for allow click
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IStepperCompleteStyle extends IBaseStyle {
    style_name: 'stepper-Complete';
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IAccordionStyle extends IBaseStyle {
    style_name: 'accordion';
    mantine_accordion_variant?: IContentField<string>; // Select field for variant
    mantine_accordion_multiple?: IContentField<string>; // Checkbox field for multiple
    mantine_accordion_chevron_position?: IContentField<string>; // Segment field for chevron position
    mantine_accordion_chevron_size?: IContentField<string>; // Text field for chevron size (creatable)
    mantine_accordion_disable_chevron_rotation?: IContentField<string>; // Checkbox field for chevron rotation
    mantine_accordion_loop?: IContentField<string>; // Checkbox field for loop navigation
    mantine_accordion_transition_duration?: IContentField<string>; // Text field for transition duration (creatable)
    mantine_accordion_default_value?: IContentField<string>; // Text field for default open items
    mantine_radius?: IContentField<string>;           // Select field for radius
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling (hidden)
}

export interface IAccordionItemStyle extends IBaseStyle {
    style_name: 'accordion-Item';
    mantine_accordion_item_value?: IContentField<string>; // Text field for item value
    label?: IContentField<string>;                    // Translatable label text
    mantine_accordion_item_icon?: IContentField<string>; // Select-icon field for item icon
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// MANTINE FEEDBACK COMPONENTS
// ===========================================

export interface INotificationStyle extends IBaseStyle {
    style_name: 'notification';
    title?: IContentField<string>;                    // Translatable title
    content?: IContentField<string>;                  // Translatable content/message
    mantine_left_icon?: IContentField<string>;        // Select-icon field for icon
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_notification_loading?: IContentField<string>; // Checkbox field for loading
    mantine_notification_with_close_button?: IContentField<string>; // Checkbox field for close button
    mantine_border?: IContentField<string>; // Checkbox field for border
    mantine_radius?: IContentField<string>;           // Select field for radius
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// MANTINE TYPOGRAPHY COMPONENTS
// ===========================================

export interface ITitleStyle extends IBaseStyle {
    style_name: 'title';
    mantine_title_order?: IContentField<string>;      // Slider field for heading level (1-6)
    mantine_size?: IContentField<string>;             // Select field for size
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ICodeStyle extends IBaseStyle {
    style_name: 'code';
    mantine_code_block?: IContentField<string>;       // Checkbox field for block display
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IHighlightStyle extends IBaseStyle {
    style_name: 'highlight';
    text?: IContentField<string>;                     // Translatable main content to be highlighted
    mantine_highlight_highlight?: IContentField<string>; // Translatable text to highlight within content
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IBlockquoteStyle extends IBaseStyle {
    style_name: 'blockquote';
    content?: IContentField<string>;                  // Translatable blockquote content
    cite?: IContentField<string>;                     // Translatable citation
    mantine_left_icon?: IContentField<string>;        // Select-icon field for icon
    mantine_icon_size?: IContentField<string>;        // Select field for icon size
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// MANTINE UTILITY COMPONENTS
// ===========================================

export interface IAspectRatioStyle extends IBaseStyle {
    style_name: 'aspectRatio';
    mantine_aspect_ratio?: IContentField<string>;     // Select field for aspect ratio
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// CARD COMPONENTS
// ===========================================

export interface ICardStyle extends IBaseStyle {
    style_name: 'card';
    mantine_card_shadow?: IContentField<string>;      // Select field for shadow
    mantine_card_padding?: IContentField<string>;     // Select field for padding
    mantine_border?: IContentField<string>; // Checkbox field for border
    mantine_radius?: IContentField<string>;           // Select field for radius
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ICardSegmentStyle extends IBaseStyle {
    style_name: 'card-segment';
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// ===========================================
// LIST COMPONENTS
// ===========================================

export interface IListStyle extends IBaseStyle {
    style_name: 'list';
    mantine_list_type?: IContentField<string>;        // Segment field for list type
    mantine_list_spacing?: IContentField<string>;     // Select field for spacing
    mantine_size?: IContentField<string>;             // Select field for size
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    mantine_list_list_style_type?: IContentField<string>; // Select field for list style type
    mantine_list_with_padding?: IContentField<string>; // Checkbox field for with padding
    mantine_list_center?: IContentField<string>; // Checkbox field for center
    mantine_list_icon?: IContentField<string>; // Select-icon field for icon
}

export interface IListItemStyle extends IBaseStyle {
    style_name: 'list-item';
    mantine_list_item_content?: IContentField<string>; // Textarea field for content (display = 1)
    mantine_list_item_icon?: IContentField<string>;    // Select-icon field for icon
    use_mantine_style?: IContentField<string>;         // Checkbox field for Mantine styling
}

export interface IBackgroundImageStyle extends IBaseStyle {
    style_name: 'background-image';
    src?: IContentField<string>;                      // Background image source
    mantine_radius?: IContentField<string>;           // Select field for radius
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IFieldsetStyle extends IBaseStyle {
    style_name: 'fieldset';
    legend?: IContentField<string>;                   // Translatable legend
    mantine_fieldset_variant?: IContentField<string>; // Select field for variant
    mantine_radius?: IContentField<string>;           // Select field for radius
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ISpoilerStyle extends IBaseStyle {
    style_name: 'spoiler';
    mantine_spoiler_max_height?: IContentField<string>; // Select field for max height
    mantine_spoiler_show_label?: IContentField<string>; // Translatable show label
    mantine_spoiler_hide_label?: IContentField<string>; // Translatable hide label
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ITypographyStyle extends IBaseStyle {
    style_name: 'typography';
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

// Union type for all styles
export type TStyle =
    | ILoginStyle
    | IProfileStyle
    | IValidateStyle
    | IRegisterStyle
    | IResetPasswordStyle
    | ITwoFactorAuthStyle
    | IContainerStyle
    | ICenterStyle
    | IDividerStyle
    | IPaperStyle
    | IAlertStyle
    | IDivStyle
    | IRefContainerStyle
    | IDataContainerStyle
    | IHtmlTagStyle
    | IHeadingStyle
    | IMarkdownStyle
    | IPlaintextStyle
    | IFormUserInputLogStyle
    | IFormUserInputRecordStyle
    | IInputStyle
    | ITextareaStyle
    | ISelectStyle
    | IRadioStyle
    | ISliderStyle
    | ICheckboxStyle
    | IImageStyle
    | IVideoStyle
    | IAudioStyle
    | IFigureStyle
    | ICarouselStyle
    | IButtonStyle
    | ILinkStyle
    | IEntryListStyle
    | IEntryRecordStyle
    | IEntryRecordDeleteStyle
    | ITabsStyle
    | ITabStyle
    | ITableStyle
    | ITableRowStyle
    | ITableCellStyle
    | IShowUserInputStyle
    | IVersionStyle
    | ILoopStyle
    | IFlexStyle
    | IGroupStyle
    | ISimpleGridStyle
    | IGridStyle
    | IGridColumnStyle
    | ISpaceStyle
    | IStackStyle
    // Mantine Form Components
    | IButtonStyle
    | IColorInputStyle
    | IColorPickerStyle
    | IFileInputStyle
    | INumberInputStyle
    | IRadioStyle
    | IRangeSliderStyle
    | ISegmentedControlStyle
    | ISwitchStyle
    | IComboboxStyle
    | IActionIconStyle
    // Mantine Typography Components
    | ICodeStyle
    // Mantine Data Display Components
    | IBadgeStyle
    | IChipStyle
    | IAvatarStyle
    | ITimelineStyle
    | ITimelineItemStyle
    | IIndicatorStyle
    | IKbdStyle
    | IRatingStyle
    | IProgressStyle
    | IProgressRootStyle
    | IProgressSectionStyle
    | IThemeIconStyle
    // Mantine Navigation Components
    | IStepperStyle
    | IStepperStepStyle
    | IStepperCompleteStyle
    | IAccordionStyle
    | IAccordionItemStyle
    // Mantine Feedback Components
    | INotificationStyle
    // Mantine Typography Components
    | ITitleStyle
    | ICodeStyle
    | IHighlightStyle
    | IBlockquoteStyle
    // Mantine Utility Components
    | IAspectRatioStyle
    | IBackgroundImageStyle
    | IFieldsetStyle
    | ISpoilerStyle
    | ITypographyStyle
    // Card Components
    | ICardStyle
    | ICardSegmentStyle
    // List Components
    | IListStyle
    | IListItemStyle; 