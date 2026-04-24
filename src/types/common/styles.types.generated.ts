/* eslint-disable */
/**
 * THIS FILE IS AUTO-GENERATED.
 *
 * Source:    http://localhost/symfony/cms-api/v1/admin/styles/schema
 * Generated: 2026-04-24T15:32:10.929Z
 *
 * DO NOT EDIT MANUALLY — regenerate with `npm run gen:styles`.
 */

// Keep these aligned with the generated per-style field type unions.
import type { IContentField } from './styles.types';

export type TStyleNameFromDb =
    | "accordion"
    | "accordion-item"
    | "action-icon"
    | "alert"
    | "aspect-ratio"
    | "audio"
    | "avatar"
    | "background-image"
    | "badge"
    | "blockquote"
    | "box"
    | "button"
    | "card"
    | "card-segment"
    | "carousel"
    | "center"
    | "checkbox"
    | "chip"
    | "code"
    | "color-input"
    | "color-picker"
    | "combobox"
    | "container"
    | "dataContainer"
    | "datepicker"
    | "divider"
    | "entryList"
    | "entryRecord"
    | "entryRecordDelete"
    | "fieldset"
    | "figure"
    | "file-input"
    | "flex"
    | "form-log"
    | "form-record"
    | "grid"
    | "grid-column"
    | "group"
    | "highlight"
    | "html-tag"
    | "image"
    | "indicator"
    | "input"
    | "kbd"
    | "link"
    | "list"
    | "list-item"
    | "login"
    | "loop"
    | "notification"
    | "number-input"
    | "paper"
    | "profile"
    | "progress"
    | "progress-root"
    | "progress-section"
    | "radio"
    | "range-slider"
    | "rating"
    | "refContainer"
    | "register"
    | "resetPassword"
    | "rich-text-editor"
    | "scroll-area"
    | "segmented-control"
    | "select"
    | "simple-grid"
    | "slider"
    | "space"
    | "spoiler"
    | "stack"
    | "switch"
    | "tab"
    | "tabs"
    | "text"
    | "text-input"
    | "textarea"
    | "theme-icon"
    | "timeline"
    | "timeline-item"
    | "title"
    | "twoFactorAuth"
    | "typography"
    | "validate"
    | "version"
    | "video";

export interface IStyleFieldSchemaMeta {
    /** SQL field type (e.g. 'text', 'checkbox', 'slider', 'select-css'). */
    type: string;
    /** 1 = translatable / user-facing, 0 = property. */
    display: 0 | 1;
    /** DB default value (may be null). */
    default_value: string | null;
    help?: string | null;
    title?: string | null;
    hidden?: 0 | 1;
}

export interface IStyleSchemaEntry {
    id: number;
    group: string;
    can_have_children: boolean;
    description?: string | null;
    fields: Record<string, IStyleFieldSchemaMeta>;
    allowed_children: string[];
    allowed_parents: string[];
}

export type IStyleSchemaMap = Record<TStyleNameFromDb, IStyleSchemaEntry>;

// --- Per-style field-shape interfaces ----------------------------------
// These describe the *shape* of the `fields` map in the backend style
// schema. They are intentionally narrow (every field is optional) so
// the minimized export/import JSON shape type-checks cleanly.

export interface IAccordionFields {
    /** @type segment @default "right" */
    mantine_accordion_chevron_position?: IContentField<string>;
    /** @type select @default "16" */
    mantine_accordion_chevron_size?: IContentField<string>;
    /** @type text */
    mantine_accordion_default_value?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_accordion_disable_chevron_rotation?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    mantine_accordion_loop?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_accordion_multiple?: IContentField<'0' | '1'>;
    /** @type select @default "200" */
    mantine_accordion_transition_duration?: IContentField<string>;
    /** @type select @default "default" */
    mantine_accordion_variant?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IAccordionItemFields {
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select-icon */
    mantine_accordion_item_icon?: IContentField<string>;
    /** @type text */
    mantine_accordion_item_value?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IActionIconFields {
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_link?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_action_icon_loading?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "subtle" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "0" */
    open_in_new_tab?: IContentField<'0' | '1'>;
    /** @type select-page-keyword @default "#" */
    page_keyword?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IAlertFields {
    /** @type textarea @translatable */
    content?: IContentField<string>;
    /** @type text @translatable */
    mantine_alert_title?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_alert_with_close_button?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "md" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select @default "light" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_with_close_button?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IAspectRatioFields {
    /** @type select @default "16/9" */
    mantine_aspect_ratio?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IAudioFields {
    /** @type text @translatable */
    alt?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type json @translatable */
    sources?: IContentField<string>;
}

export interface IAvatarFields {
    /** @type text @default "Avatar" @translatable */
    alt?: IContentField<string>;
    /** @type select-image @translatable */
    img_src?: IContentField<string>;
    /** @type text @default "U" */
    mantine_avatar_initials?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "50%" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "light" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IBackgroundImageFields {
    /** @type select-image @translatable */
    img_src?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IBadgeFields {
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_auto_contrast?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "xl" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IBlockquoteFields {
    /** @type text @translatable */
    cite?: IContentField<string>;
    /** @type textarea @translatable */
    content?: IContentField<string>;
    /** @type color-picker @default "gray" */
    mantine_color?: IContentField<string>;
    /** @type select @default "20" */
    mantine_icon_size?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IBoxFields {
    /** @type textarea @default "" @translatable */
    content?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IButtonFields {
    /** @type text @default "OK" @translatable */
    confirmation_continue?: IContentField<string>;
    /** @type textarea @default "Do you want to continue?" @translatable */
    confirmation_message?: IContentField<string>;
    /** @type text @default "" @translatable */
    confirmation_title?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_link?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type text @default "" @translatable */
    label_cancel?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_auto_contrast?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_compact?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_fullwidth?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "0" */
    open_in_new_tab?: IContentField<'0' | '1'>;
    /** @type select-page-keyword @default "#" */
    page_keyword?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ICardFields {
    /** @type checkbox @default "0" */
    mantine_border?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_card_padding?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_card_shadow?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ICardSegmentFields {
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
}

export interface ICarouselFields {
    /** @type checkbox @default "0" */
    drag_free?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    has_controls?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    has_indicators?: IContentField<'0' | '1'>;
    /** @type segment @default "start" */
    mantine_carousel_align?: IContentField<string>;
    /** @type segment @default "trimSnaps" */
    mantine_carousel_contain_scroll?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_carousel_controls_offset?: IContentField<string>;
    /** @type select @default "25" */
    mantine_carousel_duration?: IContentField<string>;
    /** @type json */
    mantine_carousel_embla_options?: IContentField<string>;
    /** @type slider @default "0" */
    mantine_carousel_in_view_threshold?: IContentField<string>;
    /** @type select-icon */
    mantine_carousel_next_control_icon?: IContentField<string>;
    /** @type select-icon */
    mantine_carousel_previous_control_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_carousel_slide_gap?: IContentField<string>;
    /** @type slider @default "100" */
    mantine_carousel_slide_size?: IContentField<string>;
    /** @type select @default "26" */
    mantine_control_size?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_loop?: IContentField<'0' | '1'>;
    /** @type segment @default "horizontal" */
    mantine_orientation?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "0" */
    skip_snaps?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ICenterFields {
    /** @type checkbox @default "0" */
    mantine_center_inline?: IContentField<'0' | '1'>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select */
    mantine_mah?: IContentField<string>;
    /** @type select */
    mantine_maw?: IContentField<string>;
    /** @type select */
    mantine_mih?: IContentField<string>;
    /** @type select */
    mantine_miw?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
}

export interface ICheckboxFields {
    /** @type text @default "1" */
    checkbox_value?: IContentField<string>;
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_checkbox_checked?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_checkbox_icon?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_checkbox_indeterminate?: IContentField<'0' | '1'>;
    /** @type segment @default "right" */
    mantine_checkbox_labelPosition?: IContentField<string>;
    /** @type color-picker */
    mantine_color?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_use_input_wrapper?: IContentField<'0' | '1'>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "0" */
    toggle_switch?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IChipFields {
    /** @type checkbox @default "0" */
    chip_checked?: IContentField<'0' | '1'>;
    /** @type text @default "0" */
    chip_off_value?: IContentField<string>;
    /** @type text @default "1" */
    chip_on_value?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_chip_variant?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select @default "16" */
    mantine_icon_size?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "top" */
    mantine_tooltip_position?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface ICodeFields {
    /** @type textarea @translatable */
    content?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_code_block?: IContentField<'0' | '1'>;
    /** @type color-picker @default "gray" */
    mantine_color?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IColorInputFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type segment @default "hex" */
    mantine_color_format?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type text @default "Pick a color" @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface IColorPickerFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type segment @default "hex" */
    mantine_color_format?: IContentField<string>;
    /** @type text @default "Alpha" @translatable */
    mantine_color_picker_alpha_label?: IContentField<string>;
    /** @type text @default "Hue" @translatable */
    mantine_color_picker_hue_label?: IContentField<string>;
    /** @type text @default "Saturation" @translatable */
    mantine_color_picker_saturation_label?: IContentField<string>;
    /** @type textarea @default "[\"#2e2e2e\", \"#868e96\", \"#fa5252\", \"#e64980\", \"#be4bdb\", \"#7950f2\", \"#4c6ef5\", \"#228be6\"]" */
    mantine_color_picker_swatches?: IContentField<string>;
    /** @type slider @default "7" */
    mantine_color_picker_swatches_per_row?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_fullwidth?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface IComboboxFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_combobox_clearable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_combobox_creatable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_combobox_multi_select?: IContentField<'0' | '1'>;
    /** @type json @default "[{\"value\":\"option1\",\"text\":\"Option 1\"},{\"value\":\"option2\",\"text\":\"Option 2\"}]" @translatable */
    mantine_combobox_options?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_combobox_searchable?: IContentField<'0' | '1'>;
    /** @type text @default " " */
    mantine_combobox_separator?: IContentField<string>;
    /** @type select */
    mantine_multi_select_max_values?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type text @default "Select option" @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface IContainerFields {
    /** @type checkbox @default "0" */
    mantine_fluid?: IContentField<'0' | '1'>;
    /** @type slider */
    mantine_px?: IContentField<string>;
    /** @type slider */
    mantine_py?: IContentField<string>;
    /** @type slider */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IDataContainerFields {
    /** @type text @default "" */
    scope?: IContentField<string>;
}

export interface IDatepickerFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_datepicker_allow_deseselect?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_datepicker_clearable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_datepicker_consistent_weeks?: IContentField<'0' | '1'>;
    /** @type select @default "YYYY-MM-DD" */
    mantine_datepicker_date_format?: IContentField<string>;
    /** @type segment @default "1" */
    mantine_datepicker_first_day_of_week?: IContentField<string>;
    /** @type select */
    mantine_datepicker_format?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_datepicker_hide_outside_dates?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_datepicker_hide_weekends?: IContentField<'0' | '1'>;
    /** @type text @default "en" */
    mantine_datepicker_locale?: IContentField<string>;
    /** @type text */
    mantine_datepicker_max_date?: IContentField<string>;
    /** @type text */
    mantine_datepicker_min_date?: IContentField<string>;
    /** @type text @translatable */
    mantine_datepicker_placeholder?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_datepicker_readonly?: IContentField<'0' | '1'>;
    /** @type segment @default "24" */
    mantine_datepicker_time_format?: IContentField<string>;
    /** @type textarea */
    mantine_datepicker_time_grid_config?: IContentField<string>;
    /** @type segment @default "15" */
    mantine_datepicker_time_step?: IContentField<string>;
    /** @type segment @default "date" */
    mantine_datepicker_type?: IContentField<string>;
    /** @type text @default "[0,6]" */
    mantine_datepicker_weekend_days?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_datepicker_with_seconds?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_datepicker_with_time_grid?: IContentField<'0' | '1'>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IDividerFields {
    /** @type color-picker @default "gray" */
    mantine_color?: IContentField<string>;
    /** @type text @translatable */
    mantine_divider_label?: IContentField<string>;
    /** @type select @default "center" */
    mantine_divider_label_position?: IContentField<string>;
    /** @type select @default "solid" */
    mantine_divider_variant?: IContentField<string>;
    /** @type segment @default "horizontal" */
    mantine_orientation?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IEntryListFields {
    /** @type select-data_table @default "" */
    data_table?: IContentField<string>;
    /** @type code */
    filter?: IContentField<string>;
    /** @type checkbox @default "0" */
    load_as_table?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    own_entries_only?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    scope?: IContentField<string>;
}

export interface IEntryRecordFields {
    /** @type select-data_table @default "" */
    data_table?: IContentField<string>;
    /** @type code */
    filter?: IContentField<string>;
    /** @type checkbox @default "1" */
    own_entries_only?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    scope?: IContentField<string>;
    /** @type text @default "record_id" */
    url_param?: IContentField<string>;
}

export interface IEntryRecordDeleteFields {
    /** @type markdown-inline @default "" @translatable */
    confirmation_cancel?: IContentField<string>;
    /** @type text @default "OK" @translatable */
    confirmation_continue?: IContentField<string>;
    /** @type textarea @default "Do you want to continue?" @translatable */
    confirmation_message?: IContentField<string>;
    /** @type text @default "" @translatable */
    confirmation_title?: IContentField<string>;
    /** @type text @default "Delete" @translatable */
    label_delete?: IContentField<string>;
    /** @type checkbox @default "1" */
    own_entries_only?: IContentField<'0' | '1'>;
    /** @type style-bootstrap @default "danger" */
    type?: IContentField<string>;
}

export interface IFieldsetFields {
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select @default "default" */
    mantine_fieldset_variant?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IFigureFields {
    /** @type markdown-inline @translatable */
    caption?: IContentField<string>;
    /** @type text @translatable */
    caption_title?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
}

export interface IFileInputFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select */
    mantine_file_input_accept?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_file_input_clearable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_file_input_drag_drop?: IContentField<'0' | '1'>;
    /** @type select */
    mantine_file_input_max_files?: IContentField<string>;
    /** @type select */
    mantine_file_input_max_size?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_file_input_multiple?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type text @default "Select files" @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IFlexFields {
    /** @type select */
    mantine_align?: IContentField<string>;
    /** @type segment @default "row" */
    mantine_direction?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_gap?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select */
    mantine_justify?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type segment @default "nowrap" */
    mantine_wrap?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IFormLogFields {
    /** @type textarea @default "An error occurred while submitting the form" @translatable */
    alert_error?: IContentField<string>;
    /** @type text @default "" @translatable */
    alert_success?: IContentField<string>;
    /** @type text @default "Cancel" @translatable */
    btn_cancel_label?: IContentField<string>;
    /** @type select-page-keyword */
    btn_cancel_url?: IContentField<string>;
    /** @type text @default "Save" @translatable */
    btn_save_label?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    is_log?: IContentField<'0' | '1'>;
    /** @type color-picker @default "gray" */
    mantine_btn_cancel_color?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_btn_save_color?: IContentField<string>;
    /** @type segment @default "save-cancel" */
    mantine_buttons_order?: IContentField<string>;
    /** @type select @default "space-between" */
    mantine_buttons_position?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_size?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_buttons_variant?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type select-page-keyword */
    redirect_at_end?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IFormRecordFields {
    /** @type textarea @default "An error occurred while saving the record" @translatable */
    alert_error?: IContentField<string>;
    /** @type text @default "" @translatable */
    alert_success?: IContentField<string>;
    /** @type text @default "Cancel" @translatable */
    btn_cancel_label?: IContentField<string>;
    /** @type select-page-keyword */
    btn_cancel_url?: IContentField<string>;
    /** @type text @default "Save" @translatable */
    btn_save_label?: IContentField<string>;
    /** @type text @default "Update" @translatable */
    btn_update_label?: IContentField<string>;
    /** @type checkbox @default "0" @hidden */
    is_log?: IContentField<'0' | '1'>;
    /** @type color-picker @default "gray" */
    mantine_btn_cancel_color?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_btn_save_color?: IContentField<string>;
    /** @type color-picker @default "orange" */
    mantine_btn_update_color?: IContentField<string>;
    /** @type segment @default "save-cancel" */
    mantine_buttons_order?: IContentField<string>;
    /** @type select @default "space-between" */
    mantine_buttons_position?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_size?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_buttons_variant?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type select-page-keyword */
    redirect_at_end?: IContentField<string>;
    /** @type checkbox @default "1" */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IGridFields {
    /** @type select */
    mantine_align?: IContentField<string>;
    /** @type slider @default "12" */
    mantine_cols?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_gap?: IContentField<string>;
    /** @type segment @default "visible" */
    mantine_grid_overflow?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select */
    mantine_justify?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IGridColumnFields {
    /** @type checkbox @default "0" */
    mantine_grid_grow?: IContentField<'0' | '1'>;
    /** @type slider @default "0" */
    mantine_grid_offset?: IContentField<string>;
    /** @type slider */
    mantine_grid_order?: IContentField<string>;
    /** @type slider @default "1" */
    mantine_grid_span?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IGroupFields {
    /** @type select */
    mantine_align?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_gap?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_group_grow?: IContentField<'0' | '1'>;
    /** @type segment @default "0" */
    mantine_group_wrap?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select */
    mantine_justify?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IHighlightFields {
    /** @type color-picker @default "yellow" */
    mantine_color?: IContentField<string>;
    /** @type text @default "highlight" @translatable */
    mantine_highlight_highlight?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type textarea @default "Highlight some text in this content" @translatable */
    text?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IHtmlTagFields {
    /** @type select @default "div" */
    html_tag?: IContentField<string>;
    /** @type textarea @translatable */
    html_tag_content?: IContentField<string>;
}

export interface IImageFields {
    /** @type text @translatable */
    alt?: IContentField<string>;
    /** @type select-image @translatable */
    img_src?: IContentField<string>;
    /** @type checkbox @default "1" */
    is_fluid?: IContentField<'0' | '1'>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type text @translatable */
    mantine_image_alt?: IContentField<string>;
    /** @type select @default "contain" */
    mantine_image_fit?: IContentField<string>;
    /** @type text @translatable */
    mantine_image_src?: IContentField<string>;
    /** @type slider @default "0" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type markdown-inline @translatable */
    title?: IContentField<string>;
    /** @type checkbox @default "1" */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IIndicatorFields {
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_border?: IContentField<'0' | '1'>;
    /** @type color-picker @default "red" */
    mantine_color?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_indicator_disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_indicator_inline?: IContentField<'0' | '1'>;
    /** @type select @default "0" */
    mantine_indicator_offset?: IContentField<string>;
    /** @type select @default "top-end" */
    mantine_indicator_position?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_indicator_processing?: IContentField<'0' | '1'>;
    /** @type slider @default "10" */
    mantine_indicator_size?: IContentField<string>;
    /** @type slider @default "xl" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IInputFields {
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type select @default "default" */
    mantine_variant?: IContentField<string>;
    /** @type number */
    max?: IContentField<string>;
    /** @type number */
    min?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type text @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "0" */
    translatable?: IContentField<'0' | '1'>;
    /** @type select @default "text" */
    type_input?: IContentField<string>;
    /** @type checkbox @default "1" */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IKbdFields {
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ILinkFields {
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox */
    open_in_new_tab?: IContentField<'0' | '1'>;
    /** @type text */
    url?: IContentField<string>;
}

export interface IListFields {
    /** @type checkbox @default "0" */
    mantine_list_center?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_list_icon?: IContentField<string>;
    /** @type select @default "disc" */
    mantine_list_list_style_type?: IContentField<string>;
    /** @type select @default "md" */
    mantine_list_spacing?: IContentField<string>;
    /** @type segment @default "unordered" */
    mantine_list_type?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_list_with_padding?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IListItemFields {
    /** @type textarea @translatable */
    mantine_list_item_content?: IContentField<string>;
    /** @type select-icon */
    mantine_list_item_icon?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ILoginFields {
    /** @type text @translatable */
    alert_fail?: IContentField<string>;
    /** @type text @translatable */
    label_login?: IContentField<string>;
    /** @type text @translatable */
    label_pw?: IContentField<string>;
    /** @type text @translatable */
    label_pw_reset?: IContentField<string>;
    /** @type text @translatable */
    label_user?: IContentField<string>;
    /** @type text @translatable */
    login_title?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type style-bootstrap @default "dark" */
    type?: IContentField<string>;
}

export interface ILoopFields {
    /** @type json */
    loop?: IContentField<string>;
    /** @type text @default "" */
    scope?: IContentField<string>;
}

export interface INotificationFields {
    /** @type textarea @translatable */
    content?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_border?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_notification_loading?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    mantine_notification_with_close_button?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type markdown-inline @translatable */
    title?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface INumberInputFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type segment @default "strict" */
    mantine_number_input_clamp_behavior?: IContentField<string>;
    /** @type slider @default "2" */
    mantine_number_input_decimal_scale?: IContentField<string>;
    /** @type select */
    mantine_numeric_max?: IContentField<string>;
    /** @type select */
    mantine_numeric_min?: IContentField<string>;
    /** @type select @default "1" */
    mantine_numeric_step?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type text @default "Enter number" @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface IPaperFields {
    /** @type checkbox @default "0" */
    mantine_border?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_paper_shadow?: IContentField<string>;
    /** @type slider */
    mantine_px?: IContentField<string>;
    /** @type slider */
    mantine_py?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IProfileFields {
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select @default "user_info" */
    profile_accordion_default_opened?: IContentField<string>;
    /** @type checkbox @default "1" */
    profile_accordion_multiple?: IContentField<'0' | '1'>;
    /** @type text @default "Account Information" @translatable */
    profile_account_info_title?: IContentField<string>;
    /** @type select @default "2" */
    profile_columns?: IContentField<string>;
    /** @type text @default "This action cannot be undone. All your data will be permanently deleted." @translatable */
    profile_delete_alert_text?: IContentField<string>;
    /** @type text @default "Delete Account" @translatable */
    profile_delete_button?: IContentField<string>;
    /** @type textarea @default "<p>Permanently delete your account and all associated data. This action cannot be undone.</p>" @translatable */
    profile_delete_description?: IContentField<string>;
    /** @type text @default "Email does not match your account email" @translatable */
    profile_delete_error_email_mismatch?: IContentField<string>;
    /** @type text @default "Email confirmation is required" @translatable */
    profile_delete_error_email_required?: IContentField<string>;
    /** @type text @default "Failed to delete account. Please try again." @translatable */
    profile_delete_error_general?: IContentField<string>;
    /** @type text @default "Confirm Email" @translatable */
    profile_delete_label_email?: IContentField<string>;
    /** @type textarea @default "<p>Deleting your account will permanently remove all your data, including profile information, preferences, and any content you have created.</p>" @translatable */
    profile_delete_modal_warning?: IContentField<string>;
    /** @type text @default "Enter your email to confirm" @translatable */
    profile_delete_placeholder_email?: IContentField<string>;
    /** @type text @default "Account deleted successfully." @translatable */
    profile_delete_success?: IContentField<string>;
    /** @type text @default "Delete Account" @translatable */
    profile_delete_title?: IContentField<string>;
    /** @type select @default "md" */
    profile_gap?: IContentField<string>;
    /** @type text @default "Account Created" @translatable */
    profile_label_created?: IContentField<string>;
    /** @type text @default "Email" @translatable */
    profile_label_email?: IContentField<string>;
    /** @type text @default "Last Login" @translatable */
    profile_label_last_login?: IContentField<string>;
    /** @type text @default "Full Name" @translatable */
    profile_label_name?: IContentField<string>;
    /** @type text @default "Timezone" @translatable */
    profile_label_timezone?: IContentField<string>;
    /** @type text @default "Username" @translatable */
    profile_label_username?: IContentField<string>;
    /** @type text @default "Update Display Name" @translatable */
    profile_name_change_button?: IContentField<string>;
    /** @type textarea @default "<p>Update your display name. This will be visible to other users.</p>" @translatable */
    profile_name_change_description?: IContentField<string>;
    /** @type text @default "Failed to update display name. Please try again." @translatable */
    profile_name_change_error_general?: IContentField<string>;
    /** @type text @default "Display name contains invalid characters" @translatable */
    profile_name_change_error_invalid?: IContentField<string>;
    /** @type text @default "Display name is required" @translatable */
    profile_name_change_error_required?: IContentField<string>;
    /** @type text @default "New Display Name" @translatable */
    profile_name_change_label?: IContentField<string>;
    /** @type text @default "Enter new display name" @translatable */
    profile_name_change_placeholder?: IContentField<string>;
    /** @type text @default "Display name updated successfully!" @translatable */
    profile_name_change_success?: IContentField<string>;
    /** @type text @default "Change Display Name" @translatable */
    profile_name_change_title?: IContentField<string>;
    /** @type text @default "Update Password" @translatable */
    profile_password_reset_button?: IContentField<string>;
    /** @type textarea @default "<p>Set a new password for your account. Make sure it is strong and secure.</p>" @translatable */
    profile_password_reset_description?: IContentField<string>;
    /** @type text @default "Password confirmation is required" @translatable */
    profile_password_reset_error_confirm_required?: IContentField<string>;
    /** @type text @default "Current password is required" @translatable */
    profile_password_reset_error_current_required?: IContentField<string>;
    /** @type text @default "Current password is incorrect" @translatable */
    profile_password_reset_error_current_wrong?: IContentField<string>;
    /** @type text @default "Failed to update password. Please try again." @translatable */
    profile_password_reset_error_general?: IContentField<string>;
    /** @type text @default "New passwords do not match" @translatable */
    profile_password_reset_error_mismatch?: IContentField<string>;
    /** @type text @default "New password is required" @translatable */
    profile_password_reset_error_new_required?: IContentField<string>;
    /** @type text @default "Password is too weak. Please choose a stronger password." @translatable */
    profile_password_reset_error_weak?: IContentField<string>;
    /** @type text @default "Confirm New Password" @translatable */
    profile_password_reset_label_confirm?: IContentField<string>;
    /** @type text @default "Current Password" @translatable */
    profile_password_reset_label_current?: IContentField<string>;
    /** @type text @default "New Password" @translatable */
    profile_password_reset_label_new?: IContentField<string>;
    /** @type text @default "Confirm new password" @translatable */
    profile_password_reset_placeholder_confirm?: IContentField<string>;
    /** @type text @default "Enter current password" @translatable */
    profile_password_reset_placeholder_current?: IContentField<string>;
    /** @type text @default "Enter new password" @translatable */
    profile_password_reset_placeholder_new?: IContentField<string>;
    /** @type text @default "Password updated successfully!" @translatable */
    profile_password_reset_success?: IContentField<string>;
    /** @type text @default "Change Password" @translatable */
    profile_password_reset_title?: IContentField<string>;
    /** @type slider @default "sm" */
    profile_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    profile_shadow?: IContentField<string>;
    /** @type text @default "My Profile" @translatable */
    profile_title?: IContentField<string>;
    /** @type checkbox @default "0" */
    profile_use_accordion?: IContentField<'0' | '1'>;
    /** @type select @default "default" */
    profile_variant?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IProgressFields {
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_progress_animated?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_progress_striped?: IContentField<'0' | '1'>;
    /** @type select @default "200" */
    mantine_progress_transition_duration?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "0" */
    value?: IContentField<string>;
}

export interface IProgressRootFields {
    /** @type checkbox @default "0" */
    mantine_progress_auto_contrast?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IProgressSectionFields {
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_progress_animated?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_progress_striped?: IContentField<'0' | '1'>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @translatable */
    mantine_tooltip_label?: IContentField<string>;
    /** @type select @default "top" */
    mantine_tooltip_position?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "0" */
    value?: IContentField<string>;
}

export interface IRadioFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type segment @default "vertical" */
    mantine_orientation?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_radio_card?: IContentField<'0' | '1'>;
    /** @type select @default "right" */
    mantine_radio_label_position?: IContentField<string>;
    /** @type json @default "[{\"value\":\"option1\",\"text\":\"Option 1\",\"description\":\"First choice description\"},{\"value\":\"option2\",\"text\":\"Option 2\",\"description\":\"Second choice description\"},{\"value\":\"option3\",\"text\":\"Option 3\",\"description\":\"Third choice description\"}]" @translatable */
    mantine_radio_options?: IContentField<string>;
    /** @type select @default "default" */
    mantine_radio_variant?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @translatable */
    mantine_tooltip_label?: IContentField<string>;
    /** @type select @default "top" */
    mantine_tooltip_position?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_use_input_wrapper?: IContentField<'0' | '1'>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IRangeSliderFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select @default "100" */
    mantine_numeric_max?: IContentField<string>;
    /** @type select @default "0" */
    mantine_numeric_min?: IContentField<string>;
    /** @type select @default "1" */
    mantine_numeric_step?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_range_slider_inverted?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_range_slider_labels_always_on?: IContentField<'0' | '1'>;
    /** @type textarea @default "" @translatable */
    mantine_range_slider_marks_values?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_range_slider_show_label?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface IRatingFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type color-picker @default "yellow" */
    mantine_color?: IContentField<string>;
    /** @type slider @default "5" */
    mantine_rating_count?: IContentField<string>;
    /** @type select-icon */
    mantine_rating_empty_icon?: IContentField<string>;
    /** @type slider @default "1" */
    mantine_rating_fractions?: IContentField<string>;
    /** @type select-icon */
    mantine_rating_full_icon?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_rating_highlight_selected_only?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_rating_use_smiles?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "0" */
    readonly?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IRefContainerFields {

}

export interface IRegisterFields {
    /** @type text @translatable */
    alert_fail?: IContentField<string>;
    /** @type text @translatable */
    alert_success?: IContentField<string>;
    /** @type markdown @default "Please describe the process to the user" @translatable */
    anonymous_users_registration?: IContentField<string>;
    /** @type select-group @default "3" */
    group?: IContentField<string>;
    /** @type text @translatable */
    label_pw?: IContentField<string>;
    /** @type text @default "Select security question 1" @translatable */
    label_security_question_1?: IContentField<string>;
    /** @type text @default "Select security question 2" @translatable */
    label_security_question_2?: IContentField<string>;
    /** @type text @translatable */
    label_submit?: IContentField<string>;
    /** @type text @translatable */
    label_user?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "0" */
    open_registration?: IContentField<'0' | '1'>;
    /** @type text @translatable */
    success?: IContentField<string>;
    /** @type markdown-inline @translatable */
    title?: IContentField<string>;
    /** @type style-bootstrap @default "success" */
    type?: IContentField<string>;
}

export interface IResetPasswordFields {
    /** @type text @translatable */
    alert_success?: IContentField<string>;
    /** @type email @translatable */
    email_user?: IContentField<string>;
    /** @type checkbox @default "0" */
    is_html?: IContentField<'0' | '1'>;
    /** @type text @translatable */
    label_pw_reset?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type text @translatable */
    placeholder?: IContentField<string>;
    /** @type text @translatable */
    subject_user?: IContentField<string>;
    /** @type markdown @translatable */
    text_md?: IContentField<string>;
    /** @type style-bootstrap */
    type?: IContentField<string>;
}

export interface IRichTextEditorFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_rich_text_editor_bubble_menu?: IContentField<'0' | '1'>;
    /** @type text @default "Start writing..." @translatable */
    mantine_rich_text_editor_placeholder?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_rich_text_editor_task_list?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_rich_text_editor_text_color?: IContentField<'0' | '1'>;
    /** @type segment @default "default" */
    mantine_rich_text_editor_variant?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "0" */
    translatable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IScrollAreaFields {
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_scroll_area_offset_scrollbars?: IContentField<'0' | '1'>;
    /** @type select @default "1000" */
    mantine_scroll_area_scroll_hide_delay?: IContentField<string>;
    /** @type select @default "8" */
    mantine_scroll_area_scrollbar_size?: IContentField<string>;
    /** @type segment @default "hover" */
    mantine_scroll_area_type?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ISegmentedControlFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type segment @default "horizontal" */
    mantine_orientation?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type textarea @default "[{\"value\":\"option1\",\"label\":\"Option 1\"},{\"value\":\"option2\",\"label\":\"Option 2\"},{\"value\":\"option3\",\"label\":\"Option 3\"}]" @translatable */
    mantine_segmented_control_data?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_segmented_control_item_border?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "0" */
    readonly?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface ISelectFields {
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_multiple?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type textarea @translatable */
    mantine_multi_select_data?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_select_clearable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_select_searchable?: IContentField<'0' | '1'>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type number */
    max?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type json @default "[{\"value\":\"option1\",\"label\":\"Option 1\"}, {\"value\":\"option2\",\"label\":\"Option 2\"}]" @translatable */
    options?: IContentField<string>;
    /** @type text @default "Select an option" @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "1" */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface ISimpleGridFields {
    /** @type slider */
    mantine_breakpoints?: IContentField<string>;
    /** @type slider @default "3" */
    mantine_cols?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type slider */
    mantine_vertical_spacing?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ISliderFields {
    /** @type textarea @default "" @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @default "" @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select @default "100" */
    mantine_numeric_max?: IContentField<string>;
    /** @type select @default "0" */
    mantine_numeric_min?: IContentField<string>;
    /** @type select @default "1" */
    mantine_numeric_step?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_slider_inverted?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    mantine_slider_labels_always_on?: IContentField<'0' | '1'>;
    /** @type textarea @default "" @translatable */
    mantine_slider_marks_values?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_slider_required?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    mantine_slider_show_label?: IContentField<'0' | '1'>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "" */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text @default "" */
    value?: IContentField<string>;
}

export interface ISpaceFields {
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type segment @default "vertical" */
    mantine_space_direction?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ISpoilerFields {
    /** @type select @default "200" */
    mantine_height?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type text @default "Hide" @translatable */
    mantine_spoiler_hide_label?: IContentField<string>;
    /** @type text @default "Show more" @translatable */
    mantine_spoiler_show_label?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IStackFields {
    /** @type select */
    mantine_align?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_gap?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select */
    mantine_justify?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ISwitchFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type segment @default "left" */
    mantine_label_position?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type text @default "Off" @translatable */
    mantine_switch_off_label?: IContentField<string>;
    /** @type text @default "On" @translatable */
    mantine_switch_on_label?: IContentField<string>;
    /** @type text @default "1" */
    mantine_switch_on_value?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_use_input_wrapper?: IContentField<'0' | '1'>;
    /** @type text */
    name?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface ITabFields {
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_tab_disabled?: IContentField<'0' | '1'>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITabsFields {
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select */
    mantine_height?: IContentField<string>;
    /** @type segment @default "horizontal" */
    mantine_orientation?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "default" */
    mantine_tabs_variant?: IContentField<string>;
    /** @type select */
    mantine_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITextFields {
    /** @type color-picker @default "" */
    mantine_color?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type segment @default "left" */
    mantine_text_align?: IContentField<string>;
    /** @type segment @default "normal" */
    mantine_text_font_style?: IContentField<string>;
    /** @type select */
    mantine_text_font_weight?: IContentField<string>;
    /** @type json */
    mantine_text_gradient?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_text_inherit?: IContentField<'0' | '1'>;
    /** @type select */
    mantine_text_line_clamp?: IContentField<string>;
    /** @type checkbox @default "0" */
    mantine_text_span?: IContentField<'0' | '1'>;
    /** @type segment @default "none" */
    mantine_text_text_decoration?: IContentField<string>;
    /** @type segment @default "none" */
    mantine_text_text_transform?: IContentField<string>;
    /** @type segment */
    mantine_text_truncate?: IContentField<string>;
    /** @type segment @default "default" */
    mantine_text_variant?: IContentField<string>;
    /** @type textarea @translatable */
    text?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITextInputFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type segment @default "default" */
    mantine_text_input_variant?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type text @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "0" */
    translatable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface ITextareaFields {
    /** @type textarea @translatable */
    description?: IContentField<string>;
    /** @type checkbox @default "0" */
    disabled?: IContentField<'0' | '1'>;
    /** @type checkbox @default "0" */
    is_required?: IContentField<'0' | '1'>;
    /** @type markdown-inline @translatable */
    label?: IContentField<string>;
    /** @type checkbox @default "0" */
    locked_after_submit?: IContentField<'0' | '1'>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type select-icon */
    mantine_right_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_textarea_autosize?: IContentField<'0' | '1'>;
    /** @type select @default "8" */
    mantine_textarea_max_rows?: IContentField<string>;
    /** @type select @default "3" */
    mantine_textarea_min_rows?: IContentField<string>;
    /** @type segment @default "none" */
    mantine_textarea_resize?: IContentField<string>;
    /** @type select @default "4" */
    mantine_textarea_rows?: IContentField<string>;
    /** @type segment @default "default" */
    mantine_textarea_variant?: IContentField<string>;
    /** @type select @default "default" */
    mantine_variant?: IContentField<string>;
    /** @type text */
    name?: IContentField<string>;
    /** @type text @translatable */
    placeholder?: IContentField<string>;
    /** @type checkbox @default "0" */
    translatable?: IContentField<'0' | '1'>;
    /** @type checkbox @default "1" */
    use_mantine_style?: IContentField<'0' | '1'>;
    /** @type text */
    value?: IContentField<string>;
}

export interface IThemeIconFields {
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_left_icon?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_variant?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITimelineFields {
    /** @type color-picker @default "blue" */
    mantine_color?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select @default "0" */
    mantine_timeline_active?: IContentField<string>;
    /** @type segment @default "left" */
    mantine_timeline_align?: IContentField<string>;
    /** @type select @default "24" */
    mantine_timeline_bullet_size?: IContentField<string>;
    /** @type select @default "2" */
    mantine_timeline_line_width?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITimelineItemFields {
    /** @type color-picker @default "gray" */
    mantine_color?: IContentField<string>;
    /** @type select-icon */
    mantine_timeline_item_bullet?: IContentField<string>;
    /** @type select @default "solid" */
    mantine_timeline_item_line_variant?: IContentField<string>;
    /** @type markdown-inline @translatable */
    title?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITitleFields {
    /** @type textarea @translatable */
    content?: IContentField<string>;
    /** @type slider @default "lg" */
    mantine_size?: IContentField<string>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select */
    mantine_title_line_clamp?: IContentField<string>;
    /** @type segment @default "1" */
    mantine_title_order?: IContentField<string>;
    /** @type segment @default "wrap" */
    mantine_title_text_wrap?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface ITwoFactorAuthFields {
    /** @type text @default "Invalid verification code. Please try again." @translatable */
    alert_fail?: IContentField<string>;
    /** @type markdown-inline @default "Two-Factor Authentication" @translatable */
    label?: IContentField<string>;
    /** @type markdown-inline @default "Code expires in" @translatable */
    label_expiration_2fa?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type markdown @default "Please enter the 6-digit code sent to your email" @translatable */
    text_md?: IContentField<string>;
}

export interface ITypographyFields {
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IValidateFields {
    /** @type text @default "Validation failed. Please check your information and try again." @translatable */
    alert_fail?: IContentField<string>;
    /** @type text @default "Account validated successfully! Welcome to our platform." @translatable */
    alert_success?: IContentField<string>;
    /** @type markdown @default "This name will be visible to other users" @translatable */
    anonymous_user_name_description?: IContentField<string>;
    /** @type select-page-keyword */
    btn_cancel_url?: IContentField<string>;
    /** @type text @default "Activate Account" @translatable */
    label_activate?: IContentField<string>;
    /** @type text @default "Cancel" @translatable */
    label_cancel?: IContentField<string>;
    /** @type text @default "Name" @translatable */
    label_name?: IContentField<string>;
    /** @type text @default "Password" @translatable */
    label_pw?: IContentField<string>;
    /** @type text @default "Confirm Password" @translatable */
    label_pw_confirm?: IContentField<string>;
    /** @type text @default "Save" @translatable */
    label_save?: IContentField<string>;
    /** @type text @default "Timezone" @translatable */
    label_timezone?: IContentField<string>;
    /** @type text @default "Update" @translatable */
    label_update?: IContentField<string>;
    /** @type checkbox @default "1" */
    mantine_border?: IContentField<'0' | '1'>;
    /** @type color-picker @default "gray" */
    mantine_btn_cancel_color?: IContentField<string>;
    /** @type color-picker @default "blue" */
    mantine_btn_save_color?: IContentField<string>;
    /** @type segment @default "save-cancel" */
    mantine_buttons_order?: IContentField<string>;
    /** @type select @default "space-between" */
    mantine_buttons_position?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_radius?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_buttons_size?: IContentField<string>;
    /** @type select @default "filled" */
    mantine_buttons_variant?: IContentField<string>;
    /** @type slider @default "lg" */
    mantine_card_padding?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_card_shadow?: IContentField<string>;
    /** @type slider @default "sm" */
    mantine_radius?: IContentField<string>;
    /** @type mantine_spacing_margin_padding @default "" */
    mantine_spacing_margin_padding?: IContentField<string>;
    /** @type text @default "validate_form" */
    name?: IContentField<string>;
    /** @type markdown-inline @translatable */
    name_description?: IContentField<string>;
    /** @type text @default "Enter your full name" @translatable */
    name_placeholder?: IContentField<string>;
    /** @type text @default "Enter your password" @translatable */
    pw_placeholder?: IContentField<string>;
    /** @type select-page-keyword @default "login" */
    redirect_at_end?: IContentField<string>;
    /** @type text @default "Please complete your account setup to activate your account" @translatable */
    subtitle?: IContentField<string>;
    /** @type markdown-inline @default "Account Validation" @translatable */
    title?: IContentField<string>;
    /** @type checkbox @default "1" @hidden */
    use_mantine_style?: IContentField<'0' | '1'>;
}

export interface IVersionFields {

}

export interface IVideoFields {
    /** @type text @translatable */
    alt?: IContentField<string>;
    /** @type checkbox @default "1" */
    is_fluid?: IContentField<'0' | '1'>;
    /** @type mantine_spacing_margin @default "" */
    mantine_spacing_margin?: IContentField<string>;
    /** @type select-video */
    video_src?: IContentField<string>;
}

// --- Runtime default-value map -----------------------------------------
export const STYLE_FIELD_DEFAULTS: Record<TStyleNameFromDb, Record<string, string | null>> = {
    "accordion": {
        mantine_accordion_chevron_position: "right",
        mantine_accordion_chevron_size: "16",
        mantine_accordion_default_value: null,
        mantine_accordion_disable_chevron_rotation: "0",
        mantine_accordion_loop: "1",
        mantine_accordion_multiple: "0",
        mantine_accordion_transition_duration: "200",
        mantine_accordion_variant: "default",
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "accordion-item": {
        disabled: "0",
        label: null,
        mantine_accordion_item_icon: null,
        mantine_accordion_item_value: null,
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "action-icon": {
        disabled: "0",
        is_link: "0",
        mantine_action_icon_loading: "0",
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_variant: "subtle",
        open_in_new_tab: "0",
        page_keyword: "#",
        use_mantine_style: "1",
    },
    "alert": {
        content: null,
        mantine_alert_title: null,
        mantine_alert_with_close_button: "0",
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_size: "md",
        mantine_spacing_margin_padding: "",
        mantine_variant: "light",
        mantine_with_close_button: "0",
        use_mantine_style: "1",
        value: null,
    },
    "aspect-ratio": {
        mantine_aspect_ratio: "16/9",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
    },
    "audio": {
        alt: null,
        mantine_spacing_margin: "",
        sources: null,
    },
    "avatar": {
        alt: "Avatar",
        img_src: null,
        mantine_avatar_initials: "U",
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_radius: "50%",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_variant: "light",
        use_mantine_style: "1",
    },
    "background-image": {
        img_src: null,
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "badge": {
        label: null,
        mantine_auto_contrast: "0",
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_radius: "xl",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_variant: "filled",
        use_mantine_style: "1",
    },
    "blockquote": {
        cite: null,
        content: null,
        mantine_color: "gray",
        mantine_icon_size: "20",
        mantine_left_icon: null,
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "box": {
        content: "",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "button": {
        confirmation_continue: "OK",
        confirmation_message: "Do you want to continue?",
        confirmation_title: "",
        disabled: "0",
        is_link: "0",
        label: null,
        label_cancel: "",
        mantine_auto_contrast: "0",
        mantine_color: "blue",
        mantine_compact: "0",
        mantine_fullwidth: "0",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_variant: "filled",
        open_in_new_tab: "0",
        page_keyword: "#",
        use_mantine_style: "1",
    },
    "card": {
        mantine_border: "0",
        mantine_card_padding: "sm",
        mantine_card_shadow: "sm",
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "card-segment": {
        mantine_spacing_margin_padding: "",
    },
    "carousel": {
        drag_free: "0",
        has_controls: "1",
        has_indicators: "1",
        mantine_carousel_align: "start",
        mantine_carousel_contain_scroll: "trimSnaps",
        mantine_carousel_controls_offset: "sm",
        mantine_carousel_duration: "25",
        mantine_carousel_embla_options: null,
        mantine_carousel_in_view_threshold: "0",
        mantine_carousel_next_control_icon: null,
        mantine_carousel_previous_control_icon: null,
        mantine_carousel_slide_gap: "sm",
        mantine_carousel_slide_size: "100",
        mantine_control_size: "26",
        mantine_height: null,
        mantine_loop: "0",
        mantine_orientation: "horizontal",
        mantine_spacing_margin_padding: "",
        skip_snaps: "0",
        use_mantine_style: "1",
    },
    "center": {
        mantine_center_inline: "0",
        mantine_height: null,
        mantine_mah: null,
        mantine_maw: null,
        mantine_mih: null,
        mantine_miw: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
    },
    "checkbox": {
        checkbox_value: "1",
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        locked_after_submit: "0",
        mantine_checkbox_checked: "0",
        mantine_checkbox_icon: null,
        mantine_checkbox_indeterminate: "0",
        mantine_checkbox_labelPosition: "right",
        mantine_color: null,
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_use_input_wrapper: "0",
        name: null,
        toggle_switch: "0",
        use_mantine_style: "1",
        value: null,
    },
    "chip": {
        chip_checked: "0",
        chip_off_value: "0",
        chip_on_value: "1",
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_chip_variant: "filled",
        mantine_color: "blue",
        mantine_icon_size: "16",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_tooltip_position: "top",
        name: null,
        use_mantine_style: "1",
        value: null,
    },
    "code": {
        content: null,
        mantine_code_block: "0",
        mantine_color: "gray",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "color-input": {
        description: "",
        disabled: "0",
        is_required: "0",
        label: "",
        mantine_color_format: "hex",
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: "",
        placeholder: "Pick a color",
        use_mantine_style: "1",
        value: "",
    },
    "color-picker": {
        description: "",
        is_required: "0",
        label: "",
        mantine_color_format: "hex",
        mantine_color_picker_alpha_label: "Alpha",
        mantine_color_picker_hue_label: "Hue",
        mantine_color_picker_saturation_label: "Saturation",
        mantine_color_picker_swatches: "[\"#2e2e2e\", \"#868e96\", \"#fa5252\", \"#e64980\", \"#be4bdb\", \"#7950f2\", \"#4c6ef5\", \"#228be6\"]",
        mantine_color_picker_swatches_per_row: "7",
        mantine_fullwidth: "0",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: "",
        use_mantine_style: "1",
        value: "",
    },
    "combobox": {
        description: "",
        disabled: "0",
        is_required: "0",
        label: "",
        mantine_combobox_clearable: "0",
        mantine_combobox_creatable: "0",
        mantine_combobox_multi_select: "0",
        mantine_combobox_options: "[{\"value\":\"option1\",\"text\":\"Option 1\"},{\"value\":\"option2\",\"text\":\"Option 2\"}]",
        mantine_combobox_searchable: "1",
        mantine_combobox_separator: " ",
        mantine_multi_select_max_values: null,
        mantine_spacing_margin: "",
        name: "",
        placeholder: "Select option",
        use_mantine_style: "1",
        value: "",
    },
    "container": {
        mantine_fluid: "0",
        mantine_px: null,
        mantine_py: null,
        mantine_size: null,
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "dataContainer": {
        scope: "",
    },
    "datepicker": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_datepicker_allow_deseselect: "0",
        mantine_datepicker_clearable: "0",
        mantine_datepicker_consistent_weeks: "0",
        mantine_datepicker_date_format: "YYYY-MM-DD",
        mantine_datepicker_first_day_of_week: "1",
        mantine_datepicker_format: null,
        mantine_datepicker_hide_outside_dates: "0",
        mantine_datepicker_hide_weekends: "0",
        mantine_datepicker_locale: "en",
        mantine_datepicker_max_date: null,
        mantine_datepicker_min_date: null,
        mantine_datepicker_placeholder: null,
        mantine_datepicker_readonly: "0",
        mantine_datepicker_time_format: "24",
        mantine_datepicker_time_grid_config: null,
        mantine_datepicker_time_step: "15",
        mantine_datepicker_type: "date",
        mantine_datepicker_weekend_days: "[0,6]",
        mantine_datepicker_with_seconds: "0",
        mantine_datepicker_with_time_grid: "0",
        mantine_spacing_margin: "",
        name: null,
        value: null,
    },
    "divider": {
        mantine_color: "gray",
        mantine_divider_label: null,
        mantine_divider_label_position: "center",
        mantine_divider_variant: "solid",
        mantine_orientation: "horizontal",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
    },
    "entryList": {
        data_table: "",
        filter: null,
        load_as_table: "0",
        own_entries_only: "1",
        scope: "",
    },
    "entryRecord": {
        data_table: "",
        filter: null,
        own_entries_only: "1",
        scope: "",
        url_param: "record_id",
    },
    "entryRecordDelete": {
        confirmation_cancel: "",
        confirmation_continue: "OK",
        confirmation_message: "Do you want to continue?",
        confirmation_title: "",
        label_delete: "Delete",
        own_entries_only: "1",
        type: "danger",
    },
    "fieldset": {
        disabled: "0",
        label: null,
        mantine_fieldset_variant: "default",
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "figure": {
        caption: null,
        caption_title: null,
        mantine_spacing_margin: "",
    },
    "file-input": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_file_input_accept: null,
        mantine_file_input_clearable: "1",
        mantine_file_input_drag_drop: "0",
        mantine_file_input_max_files: null,
        mantine_file_input_max_size: null,
        mantine_file_input_multiple: "0",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: null,
        placeholder: "Select files",
        use_mantine_style: "1",
    },
    "flex": {
        mantine_align: null,
        mantine_direction: "row",
        mantine_gap: "sm",
        mantine_height: null,
        mantine_justify: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
        mantine_wrap: "nowrap",
        use_mantine_style: "1",
    },
    "form-log": {
        alert_error: "An error occurred while submitting the form",
        alert_success: "",
        btn_cancel_label: "Cancel",
        btn_cancel_url: null,
        btn_save_label: "Save",
        is_log: "1",
        mantine_btn_cancel_color: "gray",
        mantine_btn_save_color: "blue",
        mantine_buttons_order: "save-cancel",
        mantine_buttons_position: "space-between",
        mantine_buttons_radius: "sm",
        mantine_buttons_size: "sm",
        mantine_buttons_variant: "filled",
        mantine_spacing_margin_padding: "",
        name: null,
        redirect_at_end: null,
        use_mantine_style: "1",
    },
    "form-record": {
        alert_error: "An error occurred while saving the record",
        alert_success: "",
        btn_cancel_label: "Cancel",
        btn_cancel_url: null,
        btn_save_label: "Save",
        btn_update_label: "Update",
        is_log: "0",
        mantine_btn_cancel_color: "gray",
        mantine_btn_save_color: "blue",
        mantine_btn_update_color: "orange",
        mantine_buttons_order: "save-cancel",
        mantine_buttons_position: "space-between",
        mantine_buttons_radius: "sm",
        mantine_buttons_size: "sm",
        mantine_buttons_variant: "filled",
        mantine_spacing_margin_padding: "",
        name: null,
        redirect_at_end: null,
        use_mantine_style: "1",
    },
    "grid": {
        mantine_align: null,
        mantine_cols: "12",
        mantine_gap: "sm",
        mantine_grid_overflow: "visible",
        mantine_height: null,
        mantine_justify: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "grid-column": {
        mantine_grid_grow: "0",
        mantine_grid_offset: "0",
        mantine_grid_order: null,
        mantine_grid_span: "1",
        mantine_height: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "group": {
        mantine_align: null,
        mantine_gap: "sm",
        mantine_group_grow: "0",
        mantine_group_wrap: "0",
        mantine_height: null,
        mantine_justify: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "highlight": {
        mantine_color: "yellow",
        mantine_highlight_highlight: "highlight",
        mantine_spacing_margin_padding: "",
        text: "Highlight some text in this content",
        use_mantine_style: "1",
    },
    "html-tag": {
        html_tag: "div",
        html_tag_content: null,
    },
    "image": {
        alt: null,
        img_src: null,
        is_fluid: "1",
        mantine_height: null,
        mantine_image_alt: null,
        mantine_image_fit: "contain",
        mantine_image_src: null,
        mantine_radius: "0",
        mantine_spacing_margin: "",
        mantine_width: null,
        title: null,
        use_mantine_style: "1",
    },
    "indicator": {
        label: "",
        mantine_border: "0",
        mantine_color: "red",
        mantine_indicator_disabled: "0",
        mantine_indicator_inline: "0",
        mantine_indicator_offset: "0",
        mantine_indicator_position: "top-end",
        mantine_indicator_processing: "0",
        mantine_indicator_size: "10",
        mantine_radius: "xl",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
    },
    "input": {
        disabled: "0",
        is_required: "0",
        label: null,
        locked_after_submit: "0",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_variant: "default",
        max: null,
        min: null,
        name: null,
        placeholder: null,
        translatable: "0",
        type_input: "text",
        use_mantine_style: "1",
        value: null,
    },
    "kbd": {
        label: "",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
    },
    "link": {
        label: null,
        mantine_spacing_margin: "",
        open_in_new_tab: null,
        url: null,
    },
    "list": {
        mantine_list_center: "0",
        mantine_list_icon: null,
        mantine_list_list_style_type: "disc",
        mantine_list_spacing: "md",
        mantine_list_type: "unordered",
        mantine_list_with_padding: "0",
        mantine_size: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "list-item": {
        mantine_list_item_content: null,
        mantine_list_item_icon: null,
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "login": {
        alert_fail: null,
        label_login: null,
        label_pw: null,
        label_pw_reset: null,
        label_user: null,
        login_title: null,
        mantine_spacing_margin: "",
        type: "dark",
    },
    "loop": {
        loop: null,
        scope: "",
    },
    "notification": {
        content: null,
        mantine_border: "0",
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_notification_loading: "0",
        mantine_notification_with_close_button: "1",
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        title: null,
        use_mantine_style: "1",
    },
    "number-input": {
        description: "",
        disabled: "0",
        is_required: "0",
        label: "",
        mantine_number_input_clamp_behavior: "strict",
        mantine_number_input_decimal_scale: "2",
        mantine_numeric_max: null,
        mantine_numeric_min: null,
        mantine_numeric_step: "1",
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: "",
        placeholder: "Enter number",
        use_mantine_style: "1",
        value: "",
    },
    "paper": {
        mantine_border: "0",
        mantine_paper_shadow: "sm",
        mantine_px: null,
        mantine_py: null,
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "profile": {
        mantine_spacing_margin_padding: "",
        profile_accordion_default_opened: "user_info",
        profile_accordion_multiple: "1",
        profile_account_info_title: "Account Information",
        profile_columns: "2",
        profile_delete_alert_text: "This action cannot be undone. All your data will be permanently deleted.",
        profile_delete_button: "Delete Account",
        profile_delete_description: "<p>Permanently delete your account and all associated data. This action cannot be undone.</p>",
        profile_delete_error_email_mismatch: "Email does not match your account email",
        profile_delete_error_email_required: "Email confirmation is required",
        profile_delete_error_general: "Failed to delete account. Please try again.",
        profile_delete_label_email: "Confirm Email",
        profile_delete_modal_warning: "<p>Deleting your account will permanently remove all your data, including profile information, preferences, and any content you have created.</p>",
        profile_delete_placeholder_email: "Enter your email to confirm",
        profile_delete_success: "Account deleted successfully.",
        profile_delete_title: "Delete Account",
        profile_gap: "md",
        profile_label_created: "Account Created",
        profile_label_email: "Email",
        profile_label_last_login: "Last Login",
        profile_label_name: "Full Name",
        profile_label_timezone: "Timezone",
        profile_label_username: "Username",
        profile_name_change_button: "Update Display Name",
        profile_name_change_description: "<p>Update your display name. This will be visible to other users.</p>",
        profile_name_change_error_general: "Failed to update display name. Please try again.",
        profile_name_change_error_invalid: "Display name contains invalid characters",
        profile_name_change_error_required: "Display name is required",
        profile_name_change_label: "New Display Name",
        profile_name_change_placeholder: "Enter new display name",
        profile_name_change_success: "Display name updated successfully!",
        profile_name_change_title: "Change Display Name",
        profile_password_reset_button: "Update Password",
        profile_password_reset_description: "<p>Set a new password for your account. Make sure it is strong and secure.</p>",
        profile_password_reset_error_confirm_required: "Password confirmation is required",
        profile_password_reset_error_current_required: "Current password is required",
        profile_password_reset_error_current_wrong: "Current password is incorrect",
        profile_password_reset_error_general: "Failed to update password. Please try again.",
        profile_password_reset_error_mismatch: "New passwords do not match",
        profile_password_reset_error_new_required: "New password is required",
        profile_password_reset_error_weak: "Password is too weak. Please choose a stronger password.",
        profile_password_reset_label_confirm: "Confirm New Password",
        profile_password_reset_label_current: "Current Password",
        profile_password_reset_label_new: "New Password",
        profile_password_reset_placeholder_confirm: "Confirm new password",
        profile_password_reset_placeholder_current: "Enter current password",
        profile_password_reset_placeholder_new: "Enter new password",
        profile_password_reset_success: "Password updated successfully!",
        profile_password_reset_title: "Change Password",
        profile_radius: "sm",
        profile_shadow: "sm",
        profile_title: "My Profile",
        profile_use_accordion: "0",
        profile_variant: "default",
        use_mantine_style: "1",
    },
    "progress": {
        mantine_color: "blue",
        mantine_progress_animated: "0",
        mantine_progress_striped: "0",
        mantine_progress_transition_duration: "200",
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
        value: "0",
    },
    "progress-root": {
        mantine_progress_auto_contrast: "0",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        use_mantine_style: "1",
    },
    "progress-section": {
        label: null,
        mantine_color: "blue",
        mantine_progress_animated: "0",
        mantine_progress_striped: "0",
        mantine_spacing_margin: "",
        mantine_tooltip_label: null,
        mantine_tooltip_position: "top",
        use_mantine_style: "1",
        value: "0",
    },
    "radio": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        locked_after_submit: "0",
        mantine_color: "blue",
        mantine_orientation: "vertical",
        mantine_radio_card: "0",
        mantine_radio_label_position: "right",
        mantine_radio_options: "[{\"value\":\"option1\",\"text\":\"Option 1\",\"description\":\"First choice description\"},{\"value\":\"option2\",\"text\":\"Option 2\",\"description\":\"Second choice description\"},{\"value\":\"option3\",\"text\":\"Option 3\",\"description\":\"Third choice description\"}]",
        mantine_radio_variant: "default",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_tooltip_label: null,
        mantine_tooltip_position: "top",
        mantine_use_input_wrapper: "1",
        name: null,
        use_mantine_style: "1",
        value: null,
    },
    "range-slider": {
        description: "",
        disabled: "0",
        label: "",
        mantine_color: "blue",
        mantine_numeric_max: "100",
        mantine_numeric_min: "0",
        mantine_numeric_step: "1",
        mantine_radius: "sm",
        mantine_range_slider_inverted: "0",
        mantine_range_slider_labels_always_on: "0",
        mantine_range_slider_marks_values: "",
        mantine_range_slider_show_label: "1",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: "",
        use_mantine_style: "1",
        value: "",
    },
    "rating": {
        description: null,
        disabled: "0",
        label: null,
        mantine_color: "yellow",
        mantine_rating_count: "5",
        mantine_rating_empty_icon: null,
        mantine_rating_fractions: "1",
        mantine_rating_full_icon: null,
        mantine_rating_highlight_selected_only: "0",
        mantine_rating_use_smiles: "0",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: null,
        readonly: "0",
        use_mantine_style: "1",
        value: null,
    },
    "refContainer": {
    },
    "register": {
        alert_fail: null,
        alert_success: null,
        anonymous_users_registration: "Please describe the process to the user",
        group: "3",
        label_pw: null,
        label_security_question_1: "Select security question 1",
        label_security_question_2: "Select security question 2",
        label_submit: null,
        label_user: null,
        mantine_spacing_margin_padding: "",
        open_registration: "0",
        success: null,
        title: null,
        type: "success",
    },
    "resetPassword": {
        alert_success: null,
        email_user: null,
        is_html: "0",
        label_pw_reset: null,
        mantine_spacing_margin_padding: "",
        placeholder: null,
        subject_user: null,
        text_md: null,
        type: null,
    },
    "rich-text-editor": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_rich_text_editor_bubble_menu: "0",
        mantine_rich_text_editor_placeholder: "Start writing...",
        mantine_rich_text_editor_task_list: "0",
        mantine_rich_text_editor_text_color: "0",
        mantine_rich_text_editor_variant: "default",
        mantine_spacing_margin: "",
        name: null,
        translatable: "0",
        use_mantine_style: "1",
        value: null,
    },
    "scroll-area": {
        mantine_height: null,
        mantine_scroll_area_offset_scrollbars: "0",
        mantine_scroll_area_scroll_hide_delay: "1000",
        mantine_scroll_area_scrollbar_size: "8",
        mantine_scroll_area_type: "hover",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "segmented-control": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_color: "blue",
        mantine_orientation: "horizontal",
        mantine_radius: "sm",
        mantine_segmented_control_data: "[{\"value\":\"option1\",\"label\":\"Option 1\"},{\"value\":\"option2\",\"label\":\"Option 2\"},{\"value\":\"option3\",\"label\":\"Option 3\"}]",
        mantine_segmented_control_item_border: "0",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        name: null,
        readonly: "0",
        use_mantine_style: "1",
        value: null,
    },
    "select": {
        disabled: "0",
        is_multiple: "0",
        is_required: "0",
        label: null,
        locked_after_submit: "0",
        mantine_multi_select_data: null,
        mantine_radius: "sm",
        mantine_select_clearable: "0",
        mantine_select_searchable: "0",
        mantine_size: "sm",
        max: null,
        name: null,
        options: "[{\"value\":\"option1\",\"label\":\"Option 1\"}, {\"value\":\"option2\",\"label\":\"Option 2\"}]",
        placeholder: "Select an option",
        use_mantine_style: "1",
        value: null,
    },
    "simple-grid": {
        mantine_breakpoints: null,
        mantine_cols: "3",
        mantine_height: null,
        mantine_spacing_margin_padding: "",
        mantine_vertical_spacing: null,
        mantine_width: null,
        use_mantine_style: "1",
    },
    "slider": {
        description: "",
        disabled: "0",
        is_required: "0",
        label: "",
        locked_after_submit: "0",
        mantine_color: "blue",
        mantine_numeric_max: "100",
        mantine_numeric_min: "0",
        mantine_numeric_step: "1",
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_slider_inverted: "0",
        mantine_slider_labels_always_on: "0",
        mantine_slider_marks_values: "",
        mantine_slider_required: "0",
        mantine_slider_show_label: "1",
        mantine_spacing_margin: "",
        name: "",
        use_mantine_style: "1",
        value: "",
    },
    "space": {
        mantine_size: "sm",
        mantine_space_direction: "vertical",
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "spoiler": {
        mantine_height: "200",
        mantine_spacing_margin_padding: "",
        mantine_spoiler_hide_label: "Hide",
        mantine_spoiler_show_label: "Show more",
        use_mantine_style: "1",
    },
    "stack": {
        mantine_align: null,
        mantine_gap: "sm",
        mantine_height: null,
        mantine_justify: null,
        mantine_spacing_margin_padding: "",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "switch": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_color: "blue",
        mantine_label_position: "left",
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_switch_off_label: "Off",
        mantine_switch_on_label: "On",
        mantine_switch_on_value: "1",
        mantine_use_input_wrapper: "0",
        name: null,
        use_mantine_style: "1",
        value: null,
    },
    "tab": {
        label: null,
        mantine_height: null,
        mantine_left_icon: null,
        mantine_right_icon: null,
        mantine_spacing_margin: "",
        mantine_tab_disabled: "0",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "tabs": {
        mantine_color: "blue",
        mantine_height: null,
        mantine_orientation: "horizontal",
        mantine_radius: "sm",
        mantine_spacing_margin: "",
        mantine_tabs_variant: "default",
        mantine_width: null,
        use_mantine_style: "1",
    },
    "text": {
        mantine_color: "",
        mantine_size: "sm",
        mantine_spacing_margin_padding: "",
        mantine_text_align: "left",
        mantine_text_font_style: "normal",
        mantine_text_font_weight: null,
        mantine_text_gradient: null,
        mantine_text_inherit: "0",
        mantine_text_line_clamp: null,
        mantine_text_span: "0",
        mantine_text_text_decoration: "none",
        mantine_text_text_transform: "none",
        mantine_text_truncate: null,
        mantine_text_variant: "default",
        text: null,
        use_mantine_style: "1",
    },
    "text-input": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_text_input_variant: "default",
        name: null,
        placeholder: null,
        translatable: "0",
        use_mantine_style: "1",
        value: null,
    },
    "textarea": {
        description: null,
        disabled: "0",
        is_required: "0",
        label: null,
        locked_after_submit: "0",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_right_icon: null,
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_textarea_autosize: "1",
        mantine_textarea_max_rows: "8",
        mantine_textarea_min_rows: "3",
        mantine_textarea_resize: "none",
        mantine_textarea_rows: "4",
        mantine_textarea_variant: "default",
        mantine_variant: "default",
        name: null,
        placeholder: null,
        translatable: "0",
        use_mantine_style: "1",
        value: null,
    },
    "theme-icon": {
        mantine_color: "blue",
        mantine_left_icon: null,
        mantine_radius: "sm",
        mantine_size: "sm",
        mantine_spacing_margin: "",
        mantine_variant: "filled",
        use_mantine_style: "1",
    },
    "timeline": {
        mantine_color: "blue",
        mantine_spacing_margin: "",
        mantine_timeline_active: "0",
        mantine_timeline_align: "left",
        mantine_timeline_bullet_size: "24",
        mantine_timeline_line_width: "2",
        use_mantine_style: "1",
    },
    "timeline-item": {
        mantine_color: "gray",
        mantine_timeline_item_bullet: null,
        mantine_timeline_item_line_variant: "solid",
        title: null,
        use_mantine_style: "1",
    },
    "title": {
        content: null,
        mantine_size: "lg",
        mantine_spacing_margin: "",
        mantine_title_line_clamp: null,
        mantine_title_order: "1",
        mantine_title_text_wrap: "wrap",
        use_mantine_style: "1",
    },
    "twoFactorAuth": {
        alert_fail: "Invalid verification code. Please try again.",
        label: "Two-Factor Authentication",
        label_expiration_2fa: "Code expires in",
        mantine_spacing_margin_padding: "",
        text_md: "Please enter the 6-digit code sent to your email",
    },
    "typography": {
        mantine_spacing_margin_padding: "",
        use_mantine_style: "1",
    },
    "validate": {
        alert_fail: "Validation failed. Please check your information and try again.",
        alert_success: "Account validated successfully! Welcome to our platform.",
        anonymous_user_name_description: "This name will be visible to other users",
        btn_cancel_url: null,
        label_activate: "Activate Account",
        label_cancel: "Cancel",
        label_name: "Name",
        label_pw: "Password",
        label_pw_confirm: "Confirm Password",
        label_save: "Save",
        label_timezone: "Timezone",
        label_update: "Update",
        mantine_border: "1",
        mantine_btn_cancel_color: "gray",
        mantine_btn_save_color: "blue",
        mantine_buttons_order: "save-cancel",
        mantine_buttons_position: "space-between",
        mantine_buttons_radius: "sm",
        mantine_buttons_size: "sm",
        mantine_buttons_variant: "filled",
        mantine_card_padding: "lg",
        mantine_card_shadow: "sm",
        mantine_radius: "sm",
        mantine_spacing_margin_padding: "",
        name: "validate_form",
        name_description: null,
        name_placeholder: "Enter your full name",
        pw_placeholder: "Enter your password",
        redirect_at_end: "login",
        subtitle: "Please complete your account setup to activate your account",
        title: "Account Validation",
        use_mantine_style: "1",
    },
    "version": {
    },
    "video": {
        alt: null,
        is_fluid: "1",
        mantine_spacing_margin: "",
        video_src: null,
    },
};

// --- Relationship maps ------------------------------------------------
export const STYLE_ALLOWED_CHILDREN: Record<TStyleNameFromDb, readonly string[]> = {
    "accordion": [] as const,
    "accordion-item": [] as const,
    "action-icon": [] as const,
    "alert": [] as const,
    "aspect-ratio": [] as const,
    "audio": [] as const,
    "avatar": [] as const,
    "background-image": [] as const,
    "badge": [] as const,
    "blockquote": [] as const,
    "box": [] as const,
    "button": [] as const,
    "card": [] as const,
    "card-segment": [] as const,
    "carousel": [] as const,
    "center": [] as const,
    "checkbox": [] as const,
    "chip": [] as const,
    "code": [] as const,
    "color-input": [] as const,
    "color-picker": [] as const,
    "combobox": [] as const,
    "container": [] as const,
    "dataContainer": [] as const,
    "datepicker": [] as const,
    "divider": [] as const,
    "entryList": [] as const,
    "entryRecord": [] as const,
    "entryRecordDelete": [] as const,
    "fieldset": [] as const,
    "figure": [] as const,
    "file-input": [] as const,
    "flex": [] as const,
    "form-log": [] as const,
    "form-record": [] as const,
    "grid": ["grid-column"] as const,
    "grid-column": [] as const,
    "group": [] as const,
    "highlight": [] as const,
    "html-tag": [] as const,
    "image": [] as const,
    "indicator": [] as const,
    "input": [] as const,
    "kbd": [] as const,
    "link": [] as const,
    "list": ["list-item"] as const,
    "list-item": [] as const,
    "login": [] as const,
    "loop": [] as const,
    "notification": [] as const,
    "number-input": [] as const,
    "paper": [] as const,
    "profile": [] as const,
    "progress": [] as const,
    "progress-root": ["progress-section"] as const,
    "progress-section": [] as const,
    "radio": [] as const,
    "range-slider": [] as const,
    "rating": [] as const,
    "refContainer": [] as const,
    "register": [] as const,
    "resetPassword": [] as const,
    "rich-text-editor": [] as const,
    "scroll-area": [] as const,
    "segmented-control": [] as const,
    "select": [] as const,
    "simple-grid": [] as const,
    "slider": [] as const,
    "space": [] as const,
    "spoiler": [] as const,
    "stack": [] as const,
    "switch": [] as const,
    "tab": [] as const,
    "tabs": ["tab"] as const,
    "text": [] as const,
    "text-input": [] as const,
    "textarea": [] as const,
    "theme-icon": [] as const,
    "timeline": ["timeline-item"] as const,
    "timeline-item": [] as const,
    "title": [] as const,
    "twoFactorAuth": [] as const,
    "typography": [] as const,
    "validate": [] as const,
    "version": [] as const,
    "video": [] as const,
};

export const STYLE_ALLOWED_PARENTS: Record<TStyleNameFromDb, readonly string[]> = {
    "accordion": [] as const,
    "accordion-item": ["accordion"] as const,
    "action-icon": [] as const,
    "alert": [] as const,
    "aspect-ratio": [] as const,
    "audio": [] as const,
    "avatar": [] as const,
    "background-image": [] as const,
    "badge": [] as const,
    "blockquote": [] as const,
    "box": [] as const,
    "button": [] as const,
    "card": [] as const,
    "card-segment": ["card"] as const,
    "carousel": [] as const,
    "center": [] as const,
    "checkbox": [] as const,
    "chip": [] as const,
    "code": [] as const,
    "color-input": [] as const,
    "color-picker": [] as const,
    "combobox": [] as const,
    "container": [] as const,
    "dataContainer": [] as const,
    "datepicker": [] as const,
    "divider": [] as const,
    "entryList": [] as const,
    "entryRecord": [] as const,
    "entryRecordDelete": [] as const,
    "fieldset": [] as const,
    "figure": [] as const,
    "file-input": [] as const,
    "flex": [] as const,
    "form-log": [] as const,
    "form-record": [] as const,
    "grid": [] as const,
    "grid-column": ["grid"] as const,
    "group": [] as const,
    "highlight": [] as const,
    "html-tag": [] as const,
    "image": [] as const,
    "indicator": [] as const,
    "input": [] as const,
    "kbd": [] as const,
    "link": [] as const,
    "list": [] as const,
    "list-item": ["list"] as const,
    "login": [] as const,
    "loop": [] as const,
    "notification": [] as const,
    "number-input": [] as const,
    "paper": [] as const,
    "profile": [] as const,
    "progress": [] as const,
    "progress-root": [] as const,
    "progress-section": ["progress-root"] as const,
    "radio": [] as const,
    "range-slider": [] as const,
    "rating": [] as const,
    "refContainer": [] as const,
    "register": [] as const,
    "resetPassword": [] as const,
    "rich-text-editor": [] as const,
    "scroll-area": [] as const,
    "segmented-control": [] as const,
    "select": [] as const,
    "simple-grid": [] as const,
    "slider": [] as const,
    "space": [] as const,
    "spoiler": [] as const,
    "stack": [] as const,
    "switch": [] as const,
    "tab": ["tabs"] as const,
    "tabs": [] as const,
    "text": [] as const,
    "text-input": [] as const,
    "textarea": [] as const,
    "theme-icon": [] as const,
    "timeline": [] as const,
    "timeline-item": ["timeline"] as const,
    "title": [] as const,
    "twoFactorAuth": [] as const,
    "typography": [] as const,
    "validate": [] as const,
    "version": [] as const,
    "video": [] as const,
};
