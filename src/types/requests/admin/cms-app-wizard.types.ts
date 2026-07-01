/**
 * Types for the CMS-in-CMS "Create list + detail pages" wizard
 * (issue #30, Phase 6). Mirrors the backend `create_cms_app` request schema
 * and the `CmsAppWizardService::createCmsApp` response shape.
 */

/** Input styles the wizard form-field builder can scaffold. */
export type TCmsAppFormFieldStyle =
    | 'text-input'
    | 'textarea'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'number-input';

/** A single field defined in the wizard's multi-field builder. */
export interface ICmsAppFormField {
    /** Snake_case field name (becomes the input name + data table column). */
    name: string;
    /** Input style to scaffold. */
    style: TCmsAppFormFieldStyle;
    /** Optional label (defaults to a title-cased name). */
    label?: string;
}

export interface ICreateCmsAppRequest {
    /** Lowercase keyword base for the generated pages and URLs (e.g. "team-members"). */
    base_name: string;
    /**
     * Name of the existing data table the generated pages bind to. Required only
     * when `create_form` is false (binding to a pre-existing table).
     */
    data_table?: string;
    /**
     * When true, the wizard also scaffolds an admin create-form page that OWNS a
     * fresh data table (no pre-existing table needed); the list/detail pages bind
     * to that table. This is the default flow.
     */
    create_form?: boolean;
    /** Snake_case name of the default form input created with `create_form` (default "title"). Ignored when form_fields is provided. */
    form_field_name?: string;
    /** Optional label for the default form input (defaults to a title-cased `form_field_name`). */
    form_field_label?: string;
    /**
     * Multi-field builder: one input per entry is scaffolded into the new form,
     * and the list/detail pages get an editable interpolation block listing every
     * field. Falls back to `form_field_name` when omitted/empty.
     */
    form_fields?: ICmsAppFormField[];
    /** Create the public list (/<base>) + detail (/<base>/{record_id}) pair. */
    create_public?: boolean;
    /** Create the admin CMS list (/cms/<base>) + detail pair. */
    create_admin?: boolean;
    /** Snake_case name of the detail route parameter. Default "record_id". */
    record_id_param?: string;
    /** Optional heading for the list pages. */
    list_title?: string;
    /** Optional heading for the detail pages. */
    detail_title?: string;
    /** Optional group ids granted access (in addition to surface defaults). */
    access_groups?: number[];
}

export interface ICreatedCmsAppPage {
    keyword: string;
    page_id: number;
    surface: string;
    role: string;
}

export interface ICreateCmsAppResult {
    created: ICreatedCmsAppPage[];
}
