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
    style_name: string;
    can_have_children: number;
    position: number;
    path: string;
    children?: TStyle[];
    name?: IContentField<string>;
    label?: IContentField<string>;
    label_cancel?: IContentField<string>;
    fields: Record<string, IContentField<any>>;
    // Common fields that appear in most styles
    css?: string;
    condition?: IContentField<any> | null;
    debug?: IContentField<string>;
    data_config?: IContentField<any>;
    css_mobile?: IContentField<string>;
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
    is_fluid?: IContentField<string>;
    export_pdf?: IContentField<string>;
}


export interface IAlertStyle extends IBaseStyle {
    style_name: 'alert';
    type?: IContentField<string>;
    is_dismissable?: IContentField<string>;
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
export interface IButtonStyle extends IBaseStyle {
    style_name: 'button';
    label?: IContentField<string>;
    url?: IContentField<string>;
    type?: IContentField<string>;
    label_cancel?: IContentField<string>;
    confirmation_title?: IContentField<string>;
    confirmation_continue?: IContentField<string>;
    confirmation_message?: IContentField<string>;
}

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
}

export interface ITabStyle extends IBaseStyle {
    style_name: 'tab';
    label?: IContentField<string>;
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

// Misc Styles
export interface IProgressBarStyle extends IBaseStyle {
    style_name: 'progressBar';
    type?: IContentField<string>;
    count?: IContentField<string>;
    count_max?: IContentField<string>;
    is_striped?: IContentField<string>;
    has_label?: IContentField<string>;
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

// Union type for all styles
export type TStyle =
    | ILoginStyle
    | IProfileStyle
    | IValidateStyle
    | IRegisterStyle
    | IResetPasswordStyle
    | ITwoFactorAuthStyle
    | IContainerStyle
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
    | IProgressBarStyle
    | IShowUserInputStyle
    | IVersionStyle
    | ILoopStyle; 