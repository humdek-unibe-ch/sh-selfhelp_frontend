export type Style = ContainerStyle | ImageStyle | MarkdownStyle | HeadingStyle | CardStyle | DivStyle | ButtonStyle | CarouselStyle | LinkStyle;

interface BaseStyle {
    id: IdType;
    css: string;
    style_name: string;
    condition?: ContentField<any> | null;
    debug?: ContentField<string>;
    data_config?: ContentField<any>;
    css_mobile?: ContentField<string>;
}

export interface ContainerStyle extends BaseStyle {
    style_name: 'container';
    children: Style[];
    is_fluid?: ContentField<string>;
    export_pdf?: ContentField<string>;
}

export interface ImageStyle extends BaseStyle {
    style_name: 'image';
    title?: ContentField<string>;
    is_fluid?: ContentField<string>;
    alt?: ContentField<string>;
    img_src: ContentField<string>;
    height?: ContentField<string>;
    width?: ContentField<string>;
    source?: {
        content: string;
    };
}

export interface MarkdownStyle extends BaseStyle {
    style_name: 'markdown';
    text_md: ContentField<string>;
    formula?: ContentField<string>;
}

export interface HeadingStyle extends BaseStyle {
    style_name: 'heading';
    level: ContentField<string>;
    title: ContentField<string>;
}

export interface CardStyle extends BaseStyle {
    style_name: 'card';
    children: Style[];
    title: ContentField<string>;
    type?: ContentField<string>;
    is_expanded?: ContentField<string>;
    is_collapsible?: ContentField<string>;
    url_edit?: ContentField<string>;
}

export interface DivStyle extends BaseStyle {
    style_name: 'div';
    children: Style[];
    color_background?: ContentField<string>;
    color_border?: ContentField<string>;
    color_text?: ContentField<string>;
    custom_style?: {
        content: string;
    };
}

export interface IdType {
    content: number;
    type: string;
}

export interface ContentField<T> {
    content: T;
    meta?: string;
    type?: string;
    id?: string;
    default?: string;
}

export interface ButtonStyle extends BaseStyle {
    style_name: 'button';
    label: ContentField<string>;
    url?: ContentField<string>;
    type?: ContentField<string>;
    label_cancel?: ContentField<string>;
    confirmation_title?: ContentField<string>;
    confirmation_continue?: ContentField<string>;
    confirmation_message?: ContentField<string>;
}

interface CarouselSource {
    source: string;
    alt?: string;
    caption?: string;
}

export interface CarouselStyle extends BaseStyle {
    style_name: 'carousel';
    sources: ContentField<CarouselSource[]>;
    id_prefix?: ContentField<string>;
    has_controls?: ContentField<string>;
    has_indicators?: ContentField<string>;
    has_crossfade?: ContentField<string>;
}

export interface LinkStyle extends BaseStyle {
    style_name: 'link';
    label: ContentField<string>;
    url: ContentField<string>;
    open_in_new_tab?: ContentField<string>;
}