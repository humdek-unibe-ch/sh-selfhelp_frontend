// Style name literal types for type safety
export type TStyleName =
    | 'login' | 'profile' | 'validate' | 'register' | 'resetPassword' | 'twoFactorAuth'
    | 'container' | 'alert' | 'div' | 'refContainer' | 'dataContainer' | 'html-tag' | 'center'
    | 'flex' | 'group' | 'stack' | 'simple-grid' | 'scroll-area' | 'space' | 'grid' | 'grid-column' | 'divider' | 'paper'
    | 'heading' | 'markdown' | 'markdownInline' | 'plaintext'
    | 'form-log' | 'form-record' | 'input' | 'text-input' | 'textarea' | 'select' | 'radio' | 'slider' | 'checkbox'
    | 'image' | 'video' | 'audio' | 'figure' | 'carousel'
    | 'button' | 'link'
    | 'entryList' | 'entryRecord' | 'entryRecordDelete'
    | 'tabs' | 'tab'
    | 'table' | 'tableRow' | 'tableCell'
    | 'progressBar' | 'showUserInput' | 'version' | 'loop'
    // Mantine form components
    | 'button' | 'color-input' | 'color-picker' | 'file-input' | 'number-input' | 'radio-group' | 'range-slider'
    | 'segmented-control' | 'switch' | 'combobox' | 'multiSelect' | 'action-icon' | 'rich-text-editor'
    // Mantine typography components
    | 'code'
    // Mantine data display components
    | 'badge' | 'chip' | 'avatar' | 'timeline' | 'indicator'
    | 'kbd' | 'rating' | 'theme-icon' | 'progress' | 'progress-root' | 'progress-section' | 'progress-label'
    // Mantine navigation components
    | 'accordion' | 'accordion-Item'
    // Mantine feedback components
    | 'notification'
    // Mantine typography components
    | 'title' | 'code' | 'highlight' | 'blockquote' | 'text'
    // Mantine utility components
    | 'aspect-ratio' | 'background-image' | 'fieldset' | 'spoiler'
    // Card components
    | 'card' | 'card-segment'
    // List components
    | 'list' | 'list-item'
    // Mantine checkbox component
    | 'checkbox'
    // Mantine datepicker component
    | 'datepicker'
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
export interface IBaseStyle {
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
    section_data?: any[];
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

    // Profile Section Title
    profile_title?: IContentField<string>;

    // User Information Display Labels
    profile_account_info_title?: IContentField<string>;
    profile_label_email?: IContentField<string>;
    profile_label_username?: IContentField<string>;
    profile_label_name?: IContentField<string>;
    profile_label_created?: IContentField<string>;
    profile_label_last_login?: IContentField<string>;

    // Name Change Section
    profile_name_change_title?: IContentField<string>;
    profile_name_change_description?: IContentField<string>;
    profile_name_change_label?: IContentField<string>;
    profile_name_change_placeholder?: IContentField<string>;
    profile_name_change_button?: IContentField<string>;

    // Name Change Messages
    profile_name_change_success?: IContentField<string>;
    profile_name_change_error_required?: IContentField<string>;
    profile_name_change_error_invalid?: IContentField<string>;
    profile_name_change_error_general?: IContentField<string>;

    // Password Reset Section
    profile_password_reset_title?: IContentField<string>;
    profile_password_reset_description?: IContentField<string>;
    profile_password_reset_label_current?: IContentField<string>;
    profile_password_reset_label_new?: IContentField<string>;
    profile_password_reset_label_confirm?: IContentField<string>;
    profile_password_reset_placeholder_current?: IContentField<string>;
    profile_password_reset_placeholder_new?: IContentField<string>;
    profile_password_reset_placeholder_confirm?: IContentField<string>;
    profile_password_reset_button?: IContentField<string>;

    // Password Reset Messages
    profile_password_reset_success?: IContentField<string>;
    profile_password_reset_error_current_required?: IContentField<string>;
    profile_password_reset_error_current_wrong?: IContentField<string>;
    profile_password_reset_error_new_required?: IContentField<string>;
    profile_password_reset_error_confirm_required?: IContentField<string>;
    profile_password_reset_error_mismatch?: IContentField<string>;
    profile_password_reset_error_weak?: IContentField<string>;
    profile_password_reset_error_general?: IContentField<string>;

    // Account Deletion Section
    profile_delete_title?: IContentField<string>;
    profile_delete_description?: IContentField<string>;
    profile_delete_alert_text?: IContentField<string>;
    profile_delete_modal_warning?: IContentField<string>;
    profile_delete_label_email?: IContentField<string>;
    profile_delete_placeholder_email?: IContentField<string>;
    profile_delete_button?: IContentField<string>;

    // Account Deletion Messages
    profile_delete_success?: IContentField<string>;
    profile_delete_error_email_required?: IContentField<string>;
    profile_delete_error_email_mismatch?: IContentField<string>;
    profile_delete_error_general?: IContentField<string>;

    // UI Configuration Fields
    profile_gap?: IContentField<string>;
    profile_use_accordion?: IContentField<string>;
    profile_accordion_multiple?: IContentField<string>;
    profile_accordion_default_opened?: IContentField<string>;

    // Styling Fields
    profile_variant?: IContentField<string>;
    profile_radius?: IContentField<string>;
    profile_shadow?: IContentField<string>;

    // Layout Configuration
    profile_columns?: IContentField<string>;

    // Global Margin and Padding Fields
    mantine_padding_inline?: IContentField<string>;
    mantine_padding_block?: IContentField<string>;
    mantine_margin_inline?: IContentField<string>;
    mantine_margin_block?: IContentField<string>;

    // Legacy fields (keeping for compatibility)
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
    // Form configuration fields
    is_log?: IContentField<string>;
    redirect_at_end?: IContentField<string>;
    cancel_url?: IContentField<string>;
    ajax?: IContentField<string>;
    label_save?: IContentField<string>;
    label_update?: IContentField<string>;
    label_cancel?: IContentField<string>;
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
    style_name: 'html-tag';
    html_tag?: IContentField<string>;
    html_tag_content?: IContentField<string>;
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

export interface IFormStyle extends IBaseStyle {
    style_name: 'form-log' | 'form-record';
    btn_save_label?: IContentField<string>;
    alert_success?: IContentField<string>;
    name?: IContentField<string>;
    is_log?: IContentField<string>;
    redirect_at_end?: IContentField<string>;
    btn_cancel_url?: IContentField<string>;
    btn_cancel_label?: IContentField<string>;
    alert_error?: IContentField<string>;
    buttons_size?: IContentField<string>;
    buttons_radius?: IContentField<string>;
    btn_save_color?: IContentField<string>;    
    btn_cancel_color?: IContentField<string>;
    buttons_variant?: IContentField<string>;
    buttons_position?: IContentField<string>;
}

export interface IFormLogStyle extends IFormStyle {
    style_name: 'form-log';
}

export interface IFormRecordStyle extends IFormStyle {
    style_name: 'form-record';
    btn_update_label?: IContentField<string>;
    btn_update_color?: IContentField<string>;
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

export interface ITextInputStyle extends IBaseStyle {
    style_name: 'text-input';
    label?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    placeholder?: IContentField<string>;
    description?: IContentField<string>;
    is_required?: IContentField<string>;
    disabled?: IContentField<string>;
    mantine_left_icon?: IContentField<string>;
    mantine_right_icon?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
    mantine_size?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    mantine_text_input_variant?: IContentField<string>;
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
    markdown_editor?: IContentField<string>;
    description?: IContentField<string>;
    disabled?: IContentField<string>;
    mantine_left_icon?: IContentField<string>;
    mantine_right_icon?: IContentField<string>;
    mantine_textarea_autosize?: IContentField<string>;
    mantine_textarea_min_rows?: IContentField<string>;
    mantine_textarea_max_rows?: IContentField<string>;
    mantine_textarea_resize?: IContentField<string>;
    mantine_size?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    mantine_textarea_variant?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
}

export interface IRichTextEditorStyle extends IBaseStyle {
    style_name: 'rich-text-editor';
    label?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    placeholder?: IContentField<string>;
    description?: IContentField<string>;
    is_required?: IContentField<string>;
    disabled?: IContentField<string>;
    mantine_rich_text_editor_variant?: IContentField<string>;
    mantine_rich_text_editor_placeholder?: IContentField<string>;
    mantine_rich_text_editor_bubble_menu?: IContentField<string>;
    mantine_rich_text_editor_text_color?: IContentField<string>;
    mantine_rich_text_editor_task_list?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
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
    // Standard input fields
    label?: IContentField<string>;
    description?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    // Mantine unified numeric fields
    mantine_numeric_min?: IContentField<string>;
    mantine_numeric_max?: IContentField<string>;
    mantine_numeric_step?: IContentField<string>;
    // Mantine unified styling fields
    mantine_size?: IContentField<string>;
    mantine_color?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    disabled?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
    // Slider-specific fields
    mantine_slider_marks_values?: IContentField<string>;
    mantine_slider_show_label?: IContentField<string>;
    mantine_slider_labels_always_on?: IContentField<string>;
    mantine_slider_inverted?: IContentField<string>;
    mantine_slider_thumb_size?: IContentField<string>;
    mantine_slider_required?: IContentField<string>;
    // Legacy fields for backward compatibility
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
    // Mantine-specific fields
    mantine_checkbox_icon?: IContentField<string>;
    mantine_checkbox_labelPosition?: IContentField<string>;
    description?: IContentField<string>;
    disabled?: IContentField<string>;
    // Reusable Mantine fields
    mantine_size?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    mantine_color?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
    mantine_use_input_wrapper?: IContentField<string>; // Checkbox field for using Input.Wrapper vs inline labels
}

// DatePicker Styles
export interface IDatePickerStyle extends IBaseStyle {
    style_name: 'datepicker';
    // DatePicker-specific fields
    label?: IContentField<string>;
    name?: IContentField<string>;
    value?: IContentField<string>;
    is_required?: IContentField<string>;
    disabled?: IContentField<string>;
    description?: IContentField<string>;
    mantine_datepicker_type?: IContentField<string>;
    mantine_datepicker_format?: IContentField<string>;
    mantine_datepicker_locale?: IContentField<string>;
    mantine_datepicker_placeholder?: IContentField<string>;
    mantine_datepicker_min_date?: IContentField<string>;
    mantine_datepicker_max_date?: IContentField<string>;
    mantine_datepicker_first_day_of_week?: IContentField<string>;
    mantine_datepicker_weekend_days?: IContentField<string>;
    mantine_datepicker_clearable?: IContentField<string>;
    mantine_datepicker_allow_deseselect?: IContentField<string>;
    mantine_datepicker_readonly?: IContentField<string>;
    mantine_datepicker_with_time_grid?: IContentField<string>;
    mantine_datepicker_consistent_weeks?: IContentField<string>;
    mantine_datepicker_hide_outside_dates?: IContentField<string>;
    mantine_datepicker_hide_weekends?: IContentField<string>;
    mantine_datepicker_time_step?: IContentField<string>;
    mantine_datepicker_time_format?: IContentField<string>;
    mantine_datepicker_date_format?: IContentField<string>;
    mantine_datepicker_time_grid_config?: IContentField<string>;
    mantine_datepicker_with_seconds?: IContentField<string>;
    // Reusable Mantine fields
    mantine_size?: IContentField<string>;
    mantine_radius?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
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
    mantine_height?: IContentField<string>;
    mantine_carousel_slide_size?: IContentField<string>;
    mantine_carousel_slide_gap?: IContentField<string>;
    mantine_orientation?: IContentField<string>;
    mantine_control_size?: IContentField<string>;
    mantine_carousel_controls_offset?: IContentField<string>;
    mantine_carousel_next_control_icon?: IContentField<string>;
    mantine_carousel_previous_control_icon?: IContentField<string>;
    mantine_loop?: IContentField<string>;
    drag_free?: IContentField<string>;
    mantine_carousel_align?: IContentField<string>;
    mantine_carousel_contain_scroll?: IContentField<string>;
    skip_snaps?: IContentField<string>;
    mantine_carousel_in_view_threshold?: IContentField<string>;
    mantine_carousel_duration?: IContentField<string>;
    mantine_carousel_embla_options?: IContentField<string>;
    use_mantine_style?: IContentField<string>;
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
    mantine_left_icon?: IContentField<string>;  // Select-icon field for left icon
    mantine_right_icon?: IContentField<string>; // Select-icon field for right icon
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
    style_name: 'simple-grid';
    // SimpleGrid-specific fields
    mantine_cols?: IContentField<string>;             // Slider field for number of columns
    mantine_spacing?: IContentField<string>;          // Slider field for spacing
    mantine_breakpoints?: IContentField<string>;      // Slider field for breakpoints
    mantine_vertical_spacing?: IContentField<string>; // Slider field for vertical spacing
    mantine_width?: IContentField<string>;            // Select field for width
    mantine_height?: IContentField<string>;           // Select field for height
}

export interface IScrollAreaStyle extends IBaseStyle {
    style_name: 'scroll-area';
    // ScrollArea-specific fields
    mantine_scroll_area_scrollbar_size?: IContentField<string>;        // Select field for scrollbar size
    mantine_scroll_area_type?: IContentField<string>;                  // Segment field for scrollbar type (hover/always/never)
    mantine_scroll_area_offset_scrollbars?: IContentField<string>;     // Checkbox field for offset scrollbars
    mantine_scroll_area_scroll_hide_delay?: IContentField<string>;     // Text field for scroll hide delay
    mantine_height?: IContentField<string>;                           // Select field for height
    mantine_width?: IContentField<string>;                            // Select field for width
}

export interface ISpaceStyle extends IBaseStyle {
    style_name: 'space';
    // Space-specific fields
    mantine_size?: IContentField<string>;      // Slider field for size
    mantine_space_direction?: IContentField<string>;          // Segment field for direction
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
    style_name: 'file-input';
    mantine_file_input_multiple?: IContentField<string>; // Checkbox field for multiple files
    mantine_file_input_accept?: IContentField<string>; // Select field for accepted file types
    mantine_file_input_clearable?: IContentField<string>; // Checkbox field for clearable option
    mantine_file_input_max_size?: IContentField<string>; // Select field for max file size
    mantine_file_input_max_files?: IContentField<string>; // Select field for max number of files
    mantine_file_input_drag_drop?: IContentField<string>; // Checkbox field for drag and drop
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_left_icon?: IContentField<string>;        // Icon field for left section
    mantine_right_icon?: IContentField<string>;       // Icon field for right section
    placeholder?: IContentField<string>;              // Translatable placeholder
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    is_required?: IContentField<string>;              // Checkbox field for required validation
    name?: IContentField<string>;                     // Text field for form field name
    label?: IContentField<string>;                    // Text field for label
    description?: IContentField<string>;              // Textarea field for description
}

export interface INumberInputStyle extends IBaseStyle {
    style_name: 'number-input';
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
    mantine_use_input_wrapper?: IContentField<string>; // Checkbox field for using Input.Wrapper vs inline labels
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
    mantine_range_slider_marks_values?: IContentField<string>; // Translatable textarea for custom marks JSON
    mantine_range_slider_show_label?: IContentField<string>; // Checkbox field for show label on hover
    mantine_range_slider_labels_always_on?: IContentField<string>; // Checkbox field for labels always on
    mantine_range_slider_inverted?: IContentField<string>; // Checkbox field for inverted slider
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_radius?: IContentField<string>;           // Select field for border radius
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ISegmentedControlStyle extends IBaseStyle {
    style_name: 'segmented-control';
    mantine_segmented_control_data?: IContentField<string>; // Translatable JSON textarea for data
    mantine_orientation?: IContentField<string>;      // Segment field for orientation
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    fullwidth?: IContentField<string>;                // Checkbox field for full width
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    readonly?: IContentField<string>;                 // Checkbox field for readonly state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    mantine_segmented_control_item_border?: IContentField<string>; // Checkbox field for item border
    label?: IContentField<string>;                     // Text field for label
    description?: IContentField<string>;              // Text field for description
    value?: IContentField<string>;                    // Text field for default value
    is_required?: IContentField<string>;              // Checkbox field for required validation
    name?: IContentField<string>;                     // Text field for form field name
}

export interface ISwitchStyle extends IBaseStyle {
    style_name: 'switch';
    label?: IContentField<string>;                    // Translatable label
    description?: IContentField<string>;              // Translatable description
    mantine_switch_on_label?: IContentField<string>;  // Translatable on label
    mantine_switch_off_label?: IContentField<string>; // Translatable off label
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_radius?: IContentField<string>;           // Select field for border radius
    disabled?: IContentField<string>;                 // Checkbox field for disabled state
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
    name?: IContentField<string>;                     // Text field for form field name
    is_required?: IContentField<string>;              // Checkbox field for required validation
    mantine_label_position?: IContentField<string>;   // Segment field for label position
    value?: IContentField<string>;                    // Text field for current value
    mantine_switch_on_value?: IContentField<string>;  // Text field for on state value
    mantine_use_input_wrapper?: IContentField<string>; // Checkbox field for using Input.Wrapper vs inline labels
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
    style_name: 'action-icon';
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
    mantine_timeline_bullet_size?: IContentField<string>; // Select field for bullet size
    mantine_timeline_line_width?: IContentField<string>; // Select field for line width
    mantine_timeline_active?: IContentField<string>; // Select field for active index
    mantine_timeline_align?: IContentField<string>; // Select field for alignment
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
    // Standard input fields
    label?: IContentField<string>;                       // Label text for the rating input field
    description?: IContentField<string>;                 // Description text for the rating input field
    name?: IContentField<string>;                        // Name attribute for the rating input field (required)
    disabled?: IContentField<string>;                    // Checkbox field for disabled state
    value?: IContentField<string>;                       // Initial value for the rating
    readonly?: IContentField<string>;                    // Checkbox field for readonly mode (moved from mantine-specific)

    // Rating-specific fields
    mantine_rating_count?: IContentField<string>;       // Slider field for number of stars
    mantine_rating_fractions?: IContentField<string>;   // Slider field for fractional stars
    mantine_rating_use_smiles?: IContentField<string>;  // Checkbox field for using smiley faces
    mantine_rating_empty_icon?: IContentField<string>;  // Icon selector for unselected rating items
    mantine_rating_full_icon?: IContentField<string>;   // Icon selector for selected rating items
    mantine_rating_highlight_selected_only?: IContentField<string>; // Checkbox field for highlighting selected only

    // Mantine styling fields
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
    style_name: 'theme-icon';
    mantine_variant?: IContentField<string>;          // Select field for variant
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_radius?: IContentField<string>;           // Select field for radius
    mantine_color?: IContentField<string>;            // Color picker field
    use_mantine_style?: IContentField<string>; 
    mantine_left_icon?: IContentField<string>;  // Select-icon field for icon
}

// ===========================================
// MANTINE NAVIGATION COMPONENTS
// ===========================================


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
    content?: IContentField<string>;                  // Translatable content field
    mantine_title_order?: IContentField<string>;      // Select field for heading level (1-6)
    mantine_size?: IContentField<string>;             // Select field for size
    mantine_title_text_wrap?: IContentField<string>;  // Select field for text-wrap (wrap, balance, nowrap)
    mantine_title_line_clamp?: IContentField<string>; // Select field for line clamp (1-5 lines)
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ITextStyle extends IBaseStyle {
    style_name: 'text';
    text?: IContentField<string>;                     // Translatable text content field
    mantine_size?: IContentField<string>;             // Select field for size (xs, sm, md, lg, xl)
    mantine_color?: IContentField<string>;            // Color picker field
    mantine_text_font_weight?: IContentField<string>; // Select field for font weight (100-900)
    mantine_text_font_style?: IContentField<string>;  // Segment field for font style (italic, normal)
    mantine_text_text_decoration?: IContentField<string>; // Segment field for text decoration (underline, line-through, none)
    mantine_text_text_transform?: IContentField<string>;    // Segment field for text transform (uppercase, capitalize, lowercase, none)
    mantine_text_align?: IContentField<string>;       // Segment field for text alignment (left, center, right, justify)
    mantine_text_variant?: IContentField<string>;     // Segment field for variant (default, gradient)
    mantine_text_gradient?: IContentField<string>;    // Textarea field for gradient configuration
    mantine_text_truncate?: IContentField<string>;    // Segment field for truncation (end, start)
    mantine_text_line_clamp?: IContentField<string>;  // Select field for line clamp (2-5 lines)
    mantine_text_inherit?: IContentField<string>;     // Checkbox field for inherit styles
    mantine_text_span?: IContentField<string>;        // Checkbox field for span element
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
    style_name: 'aspect-ratio';
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
    mantine_height?: IContentField<string>; // Select field for max height
    mantine_spoiler_show_label?: IContentField<string>; // Translatable show label
    mantine_spoiler_hide_label?: IContentField<string>; // Translatable hide label
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface ITypographyStyle extends IBaseStyle {
    style_name: 'typography';
    use_mantine_style?: IContentField<string>;        // Checkbox field for Mantine styling
}

export interface IUnknownStyle {
    id: number;
    id_styles: number;
    style_name: string; // Any style_name that doesn't match known styles
    can_have_children: number | null;
    position: number;
    path: string;
    children?: TStyle[];
    fields: Record<string, IContentField<any>>;
    css?: string;
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
    | IInputStyle
    | ITextInputStyle
    | ITextareaStyle
    | IRichTextEditorStyle
    | ISelectStyle
    | IRadioStyle
    | ISliderStyle
    | ICheckboxStyle
    | IDatePickerStyle
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
    | IScrollAreaStyle
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
    | IIndicatorStyle
    | IKbdStyle
    | IRatingStyle
    | IProgressStyle
    | IProgressRootStyle
    | IProgressSectionStyle
    | IThemeIconStyle
    // Mantine Navigation Components
    | IAccordionStyle
    | IAccordionItemStyle
    // Mantine Feedback Components
    | INotificationStyle
    // Mantine Typography Components
    | ITitleStyle
    | ITextStyle
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