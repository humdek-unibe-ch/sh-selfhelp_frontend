#!/usr/bin/env node
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Builds the six CMS-in-CMS example bundles from one description per template.
 *
 * One logical dataset, two surfaces, no duplicated input definition:
 *
 *  - CMS surface: one page `cms-<slug>` (role `cms_list`) holding an
 *    `entry-form-list`. The form (`form-record`) is a child of the list and is
 *    the only place the inputs are defined; the data table is the table of that
 *    form. The list adds, edits, deletes, acts (quick actions) and restores
 *    (history) the records.
 *  - Public surface: a read-only `data-view` with the layout `custom` (events,
 *    contacts, testimonials: its child sections are the card of ONE record, which
 *    the server draws once per record, so search, filters and paging stay the
 *    visitor's) or a composition of `entry-list` / `entry-record` sections (news,
 *    FAQ, team) that read the SAME table through the owner token `@section:<slug>-form`.
 *
 * The script is idempotent: it reads the bundle on disk (sample rows, the
 * public composition and the inputs it does not redefine), writes it again in
 * the new structure and can run any number of times. With `--check` it writes
 * nothing and fails when a bundle on disk differs from what it would write.
 *
 * Usage:
 *   node scripts/build-cms-example-bundles.mjs              # rewrite the frontend bundles
 *   node scripts/build-cms-example-bundles.mjs --backend    # and copy them to the backend fixtures
 *   node scripts/build-cms-example-bundles.mjs --check      # CI: fail when a bundle is out of date
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'examples', 'cms-in-cms');
const BACKEND_DIR = join(HERE, '..', '..', 'sh-selfhelp_backend', 'tests', 'fixtures', 'examples');
const args = new Set(process.argv.slice(2));

const DE = 'de-CH';
const EN = 'en-GB';

// ---------------------------------------------------------------------------
// building blocks
// ---------------------------------------------------------------------------

/** A translatable field value: one entry per content language. */
const tr = (de, en) => ({ [DE]: { content: de }, [EN]: { content: en } });
/** A property field value (not translatable). */
const prop = (value) => ({ all: { content: String(value) } });
const json = (value) => JSON.stringify(value);

function section(name, style, fields = {}, children = null, globals = null) {
    const node = { section_name: name, style_name: style, fields };
    if (globals) node.global_fields = globals;
    if (children) node.children = children;
    return node;
}

/**
 * An option catalog with its translated labels. Stored data holds the option code (a short, stable
 * value of letters and digits); the labels are added while the page renders (`{{scope._field_label}}`).
 */
function choices(items) {
    return {
        options: prop(json(items.map((item, index) => ({ value: item.value, sort: index + 1 })))),
        option_labels: {
            [DE]: { content: json(Object.fromEntries(items.map((item) => [item.value, item.de]))) },
            [EN]: { content: json(Object.fromEntries(items.map((item) => [item.value, item.en]))) },
        },
    };
}

/** One form input. `key` is the suffix of the section name. */
function input(slug, key, style, name, label, extra = {}) {
    return section(`${slug}-form-${key}`, style, { name: prop(name), label: tr(...label), ...extra });
}

const REQUIRED = { is_required: prop('1') };
const TRANSLATABLE = { translatable: prop('1') };

const DATE_PICKER = (type) => ({
    web_datepicker_type: prop(type),
    web_datepicker_format: prop(type === 'datetime' ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD'),
    datepicker_placeholder: prop(type === 'datetime' ? '2026-07-06 14:30' : '2026-07-06'),
});

function pageFields(de, en) {
    return [{ name: 'title', display: true, translations: [{ language_code: DE, content: de }, { language_code: EN, content: en }] }];
}

function route(path, requirements = null, canonical = true) {
    return { path_pattern: path, requirements, is_canonical: canonical, is_active: true, priority: 0 };
}

function page(keyword, surface, url, role, titles, sections, routes = null) {
    return {
        keyword,
        surface,
        page_access_type: 'mobile_and_web',
        headless: false,
        open_access: false,
        url,
        parent_keyword: null,
        is_system: false,
        fields: pageFields(...titles),
        routes: routes ?? [route(url)],
        cms_app_role: role,
        sections,
    };
}

const RECORD_ROUTE = (base) => route(`/${base}/{record_id}`, { record_id: '\\d+' });

// ---------------------------------------------------------------------------
// the public design family (one look for all templates; accents differ per domain)
// ---------------------------------------------------------------------------

const PAGE_SPACING = prop(json({ pt: 'xl', pb: 'xl', ps: 'md', pe: 'md' }));

const HERO_CSS =
    'relative overflow-hidden rounded-3xl px-6 py-10 md:px-10 md:py-14 bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950 border border-sky-100/80 dark:border-slate-800 shadow-sm';
const HERO_TITLE_CSS = 'tracking-tight text-4xl md:text-5xl font-semibold text-slate-900 dark:text-white max-w-3xl';
const HERO_TEXT_CSS = 'max-w-2xl text-slate-600 dark:text-slate-300 leading-relaxed';
/** The wrapper of a public data-view: the list draws itself, the wrapper only gives it room. */
const VIEW_WRAP_CSS = 'mt-2';

/** The header of every public page: eyebrow, title, subtitle. */
function hero(slug, { eyebrow, title, subtitle, color = 'blue' }) {
    return section(
        `${slug}-hero`,
        'stack',
        { gap: prop('sm'), spacing: prop(json({ mb: 'xl' })) },
        [
            section(`${slug}-hero-eyebrow`, 'badge', {
                label: tr(...eyebrow),
                variant: prop('light'),
                color: prop(color),
                size: prop('sm'),
                radius: prop('xl'),
            }),
            section(`${slug}-hero-title`, 'title', { content: tr(...title), title_order: prop('1') }, null, { css: HERO_TITLE_CSS }),
            section(`${slug}-hero-subtitle`, 'text', { text: tr(...subtitle), size: prop('lg') }, null, { css: HERO_TEXT_CSS }),
        ],
        { css: HERO_CSS, css_mobile: 'flex flex-col gap-2 mb-6' },
    );
}

/** The container every public page sits in. */
function pageContainer(name, children) {
    return section(name, 'container', { size: prop('lg'), spacing: PAGE_SPACING }, children, { css_mobile: 'px-4 py-6' });
}

// ---------------------------------------------------------------------------
// the CMS surface: one entry-form-list holding the form
// ---------------------------------------------------------------------------

/**
 * The CMS page of an app: one `entry-form-list`; the form is its child and owns the table.
 * `form` is the `form-record` section (inputs inside).
 */
function cmsPage(t, form) {
    const list = section(
        `${t.slug}-cms-list`,
        'entry-form-list',
        {
            title: tr(...t.cms.title),
            list_key: prop(t.listKey ?? t.slug.replace(/-/g, '_')),
            list_layout: prop('table'),
            form_presentation: prop('modal'),
            page_size: prop('25'),
            list_columns: prop(json(t.cms.columns)),
            list_sort: prop(json(t.cms.sort)),
            list_controls: prop(json(t.cms.controls)),
            quick_actions: prop(json(t.cms.actions ?? [])),
            own_entries_only: prop('0'),
            allow_create: prop('1'),
            allow_update: prop('1'),
            allow_delete: prop('1'),
            show_history: prop('1'),
            label_add: tr(...t.cms.add),
            label_empty: tr(...t.cms.empty),
            label_search: tr(...t.cms.search),
            label_confirm_delete: tr(...t.cms.confirmDelete),
        },
        [form],
    );

    return page(`cms-${t.slug}`, 'cms', `/cms/${t.slug}`, 'cms_list', t.cms.pageTitle, [list]);
}

/** The inline form: `form-record` with the inputs of the template, in the order of the template. */
function formSection(t, inputs) {
    return section(
        `${t.slug}-form`,
        'form-record',
        {
            alert_success: tr(...t.cms.saved),
            btn_save_label: tr('Speichern', 'Save'),
            btn_update_label: tr('Aktualisieren', 'Update'),
        },
        inputs,
    );
}

// ---------------------------------------------------------------------------
// the public surface
// ---------------------------------------------------------------------------

/** A public read-only data-view page (hero + the view). */
function dataViewPage(t, view) {
    const fields = {
        list_key: prop(t.listKey ?? t.slug.replace(/-/g, '_')),
        list_layout: prop(view.layout),
        page_size: prop(String(view.pageSize ?? 12)),
        list_columns: prop(json(view.columns)),
        list_sort: prop(json(view.sort)),
        list_controls: prop(json(view.controls ?? [])),
        own_entries_only: prop('0'),
        label_empty: tr(...view.empty),
        label_search: tr(...view.search),
        data_table: prop(`@section:${t.slug}-form`),
    };
    if (view.fixedFilter) fields.list_fixed_filter = prop(json(view.fixedFilter));
    if (view.detailUrl) fields.detail_url = prop(view.detailUrl);
    // The layout `custom`: the sections inside the view are the card of one record; `rowCss` is the
    // element that holds the records (a responsive grid).
    if (view.layout === 'custom') fields.list_row_css = prop(view.rowCss ?? '');

    return page(t.slug, 'public', `/${t.slug}`, 'public_list', t.public.pageTitle, [
        pageContainer(`${t.slug}-page`, [
            hero(t.slug, t.public.hero),
            section(`${t.slug}-view`, 'data-view', fields, view.template ?? null, { css: VIEW_WRAP_CSS }),
        ]),
    ]);
}

// ---------------------------------------------------------------------------
// the record cards of the data views (the row template: drawn once per record by the server)
// ---------------------------------------------------------------------------

const RECORD_CARD_CSS =
    'h-full flex flex-col transition duration-300 ease-out hover:-translate-y-1 hover:shadow-xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm';

/** An event: date and status, title, place, a teaser and the way to the event page. */
function eventCard() {
    const id = 'events-view-card';
    return section(
        id,
        'card',
        { border: prop('1'), radius: prop('xl'), web_card_shadow: prop('md') },
        [
            section(
                `${id}-head`,
                'group',
                { gap: prop('sm'), align: prop('center'), justify: prop('space-between'), web_group_wrap: prop('wrap') },
                [
                    section(`${id}-date`, 'badge', {
                        label: tr('{{event_date}}', '{{event_date}}'),
                        variant: prop('light'),
                        color: prop('violet'),
                        radius: prop('xl'),
                    }),
                    section(`${id}-status`, 'badge', {
                        label: tr('{{_status_label}}', '{{_status_label}}'),
                        variant: prop('outline'),
                        color: prop('gray'),
                        size: prop('sm'),
                        radius: prop('xl'),
                    }),
                ],
                { css_mobile: 'flex flex-row items-center justify-between gap-3' },
            ),
            section(
                `${id}-title`,
                'title',
                { content: tr('{{title}}', '{{title}}'), title_order: prop('3'), spacing: prop(json({ mt: 'sm' })) },
                null,
                { css: 'tracking-tight', css_mobile: 'mt-3' },
            ),
            section(`${id}-location`, 'text', { text: tr('{{location}}', '{{location}}'), size: prop('sm'), color: prop('gray') }, null, { css_mobile: 'mt-1' }),
            section(
                `${id}-teaser`,
                'text',
                { text: tr('{{description}}', '{{description}}'), size: prop('sm'), web_text_line_clamp: prop('3'), spacing: prop(json({ mt: 'sm' })) },
                null,
                { css_mobile: 'mt-3' },
            ),
            section(
                `${id}-open`,
                'button',
                {
                    label: tr('Details ansehen', 'View details'),
                    is_link: prop('1'),
                    url: prop('/events/{{record_id}}'),
                    variant: prop('light'),
                    size: prop('sm'),
                    color: prop('violet'),
                    radius: prop('xl'),
                    spacing: prop(json({ mt: 'md' })),
                },
                null,
                { css_mobile: 'mt-4' },
            ),
        ],
        { css: `${RECORD_CARD_CSS} border-t-4 border-t-violet-400`, css_mobile: 'mb-4 px-4 py-4' },
    );
}

/** A contact: initials, name, department, and the phone and mail links. */
function contactCard() {
    const id = 'contacts-view-card';
    return section(
        id,
        'card',
        { border: prop('1'), radius: prop('xl'), web_card_shadow: prop('sm') },
        [
            section(
                `${id}-head`,
                'group',
                { gap: prop('sm'), align: prop('center'), web_group_wrap: prop('nowrap') },
                [
                    section(
                        `${id}-avatar`,
                        'avatar',
                        { name: prop('{{name}}'), color: prop('initials'), size: prop('lg'), radius: prop('50%') },
                        null,
                        { css: 'ring-2 ring-cyan-100 dark:ring-cyan-900' },
                    ),
                    section(
                        `${id}-head-text`,
                        'stack',
                        { gap: prop('xs') },
                        [
                            section(`${id}-name`, 'title', { content: tr('{{name}}', '{{name}}'), title_order: prop('4') }, null, { css: 'tracking-tight' }),
                            section(`${id}-department`, 'badge', {
                                label: tr('{{department}}', '{{department}}'),
                                variant: prop('light'),
                                color: prop('cyan'),
                                size: prop('sm'),
                                radius: prop('xl'),
                            }),
                        ],
                        { css_mobile: 'flex-1 flex flex-col items-start gap-2' },
                    ),
                ],
                { css_mobile: 'flex flex-row items-center gap-3' },
            ),
            section(`${id}-divider`, 'divider', { spacing: prop(json({ mt: 'sm', mb: 'sm' })) }, null, { css_mobile: 'mt-3 mb-3' }),
            section(
                `${id}-links`,
                'stack',
                { gap: prop('xs') },
                [
                    section(`${id}-phone`, 'link', { label: tr('{{phone}}', '{{phone}}'), url: prop('tel:{{phone}}') }),
                    section(`${id}-email`, 'link', { label: tr('{{email}}', '{{email}}'), url: prop('mailto:{{email}}') }),
                ],
                { css_mobile: 'flex flex-col gap-2' },
            ),
        ],
        { css: `${RECORD_CARD_CSS} border-t-4 border-t-cyan-400`, css_mobile: 'mb-4 px-4 py-4' },
    );
}

/** A testimonial: the quote, then who said it. */
function testimonialCard() {
    const id = 'testimonials-view-card';
    return section(
        id,
        'card',
        { border: prop('1'), radius: prop('xl'), web_card_shadow: prop('sm') },
        [
            section(`${id}-quote`, 'blockquote', {
                blockquote_content: tr('{{quote}}', '{{quote}}'),
                web_left_icon: prop('IconQuote'),
            }),
            section(
                `${id}-author`,
                'group',
                { gap: prop('sm'), align: prop('center'), web_group_wrap: prop('nowrap'), spacing: prop(json({ mt: 'sm' })) },
                [
                    section(`${id}-avatar`, 'avatar', {
                        name: prop('{{author}}'),
                        color: prop('initials'),
                        size: prop('md'),
                        radius: prop('50%'),
                    }),
                    section(
                        `${id}-author-text`,
                        'stack',
                        { gap: prop('xs') },
                        [
                            section(`${id}-author-name`, 'text', {
                                text: tr('{{author}}', '{{author}}'),
                                size: prop('sm'),
                                web_text_font_weight: prop('600'),
                            }),
                            section(`${id}-author-role`, 'text', {
                                text: tr('{{role}}', '{{role}}'),
                                size: prop('xs'),
                                color: prop('gray'),
                            }),
                        ],
                        { css_mobile: 'flex-1 flex flex-col items-start gap-1' },
                    ),
                ],
                { css_mobile: 'flex flex-row items-center gap-3 mt-2' },
            ),
        ],
        {
            css: `${RECORD_CARD_CSS} bg-gradient-to-br from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 border-amber-100 dark:border-slate-800`,
            css_mobile: 'flex flex-col mb-4 px-4 py-4 gap-3',
        },
    );
}

// ---------------------------------------------------------------------------
// reading what is on disk
// ---------------------------------------------------------------------------

function read(file) {
    return JSON.parse(readFileSync(join(OUT_DIR, file), 'utf8'));
}

function walk(sections, visit) {
    for (const node of sections ?? []) {
        visit(node);
        walk(node.children, visit);
    }
}

function findSection(bundle, name) {
    let found = null;
    for (const p of bundle.pages) {
        walk(p.sections, (node) => {
            if (node.section_name === name) found = node;
        });
    }
    return found;
}

function findPage(bundle, role) {
    return bundle.pages.find((p) => p.cms_app_role === role) ?? null;
}

/** The input sections of the form on disk, by input name (any earlier structure). */
function harvestInputs(bundle, slug) {
    const form = findSection(bundle, `${slug}-form`);
    const byName = new Map();
    for (const child of form?.children ?? []) {
        const name = child.fields?.name?.all?.content;
        if (typeof name === 'string') byName.set(name, child);
    }
    return byName;
}

// ---------------------------------------------------------------------------
// the six templates
// ---------------------------------------------------------------------------

const NEWS_CATEGORIES = [
    { value: 'Release', de: 'Freigabe', en: 'Release' },
    { value: 'Feature', de: 'Funktion', en: 'Feature' },
    { value: 'Notice', de: 'Hinweis', en: 'Notice' },
];
const FAQ_CATEGORIES = [
    { value: 'Account', de: 'Konto', en: 'Account' },
    { value: 'Mobile', de: 'Mobile Nutzung', en: 'Mobile use' },
    { value: 'Privacy', de: 'Datenschutz', en: 'Privacy' },
    { value: 'Studies', de: 'Studienteilnahme', en: 'Study participation' },
    { value: 'Compatibility', de: 'Kompatibilität', en: 'Compatibility' },
];
const TEAM_ROLES = [
    { value: 'Lead', de: 'Leitende Entwicklung', en: 'Lead Engineer' },
    { value: 'Researcher', de: 'Forschung', en: 'Researcher' },
    { value: 'Pioneer', de: 'Compiler-Pionierin', en: 'Compiler Pioneer' },
    { value: 'Analyst', de: 'Trajektorienanalyse', en: 'Trajectory Analyst' },
    { value: 'Director', de: 'Softwareleitung', en: 'Software Director' },
    { value: 'Architect', de: 'Web-Architektur', en: 'Web Architect' },
];
const EVENT_STATUS = [
    { value: 'Scheduled', de: 'Geplant', en: 'Scheduled' },
    { value: 'Cancelled', de: 'Abgesagt', en: 'Cancelled' },
];
const PUBLISH_STATUS = [
    { value: 'draft', de: 'Entwurf', en: 'Draft' },
    { value: 'published', de: 'Veröffentlicht', en: 'Published' },
];
const TESTIMONIAL_STATUS = [
    { value: 'Pending', de: 'Zu prüfen', en: 'Pending' },
    { value: 'Approved', de: 'Freigegeben', en: 'Approved' },
    { value: 'Hidden', de: 'Ausgeblendet', en: 'Hidden' },
];

/** Option codes of earlier bundles -> the code of today (idempotent for the new codes). */
const CODE_TEXT = {
    release: 'Release', feature: 'Feature', notice: 'Notice',
    account: 'Account', mobile: 'Mobile', privacy: 'Privacy', studies: 'Studies', compatibility: 'Compatibility',
    'lead-engineer': 'Lead', researcher: 'Researcher', 'compiler-pioneer': 'Pioneer',
    'trajectory-analyst': 'Analyst', 'software-director': 'Director', 'web-architect': 'Architect',
};

/**
 * Free text per language that earlier bundles stored as a code of a select. A list or a data view shows the
 * stored value as it is, so what a visitor reads there is text, not a code.
 */
const LOCATION_TEXT = {
    'online-zoom': tr('Online (Zoom)', 'Online (Zoom)'),
    'university-bern-a102': tr('Universität Bern, Raum A102', 'University of Bern, Room A102'),
    'inselspital-lab-3': tr('Inselspital, Laborgebäude 3', 'Inselspital, Lab Building 3'),
    'kursaal-bern': tr('Kursaal Bern', 'Kursaal Bern'),
};
const DEPARTMENT_TEXT = {
    'study-coordination': tr('Studienkoordination', 'Study Coordination'),
    'it-support': tr('IT-Support', 'IT Support'),
    'data-protection': tr('Datenschutz', 'Data Protection'),
    'lab-scheduling': tr('Laborplanung', 'Lab Scheduling'),
    'participant-care': tr('Teilnehmendenbetreuung', 'Participant Care'),
    finance: tr('Finanzen', 'Finance'),
};
const ROLE_COMPANY_TEXT = {
    'participant-wave-2': tr('Studienteilnehmerin, Welle 2', 'Study participant, wave 2'),
    'principal-investigator-cardiology': tr('Hauptprüferin Kardiologie', 'Principal Investigator, cardiology'),
    'research-coordinator': tr('Studienkoordinatorin', 'Research coordinator'),
    'it-services': tr('IT-Support-Leitung', 'IT support lead'),
    'participant-pilot': tr('Studienteilnehmende, Pilotgruppe', 'Study participant, pilot group'),
    'research-group-head': tr('Forschungsgruppenleitung', 'Head of research group'),
};

/** Map one cell of a sample row; values that are already in the new form pass through. */
function mapped(value, table) {
    if (typeof value === 'string' && Object.hasOwn(table, value)) {
        const text = table[value];
        return typeof text === 'string' ? text : Object.fromEntries(Object.entries(text).map(([locale, v]) => [locale, v.content]));
    }
    return value;
}

const TEMPLATES = [
    // -- news --------------------------------------------------------------
    {
        file: 'news.bundle.json',
        slug: 'news',
        title: 'News & updates',
        description: 'Publish posts with category, date and a translatable body: an editorial list and article page for visitors, and a managed list (add, edit, delete, history) for editors.',
        tags: ['cms-in-cms', 'list + detail', 'blog', 'translatable'],
        comment: 'CMS-in-CMS template: a News & Updates app in three pages. PUBLIC: /news lists posts as cards (category badge, date, summary) and /news/{record_id} renders the full article; both read the table of the form through the owner token "@section:news-form". CMS: /cms/news is ONE entry-form-list that holds the form: it lists, searches, sorts and filters the posts, adds and edits them in a dialog, deletes them and restores earlier versions. The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). Title, summary and body are translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'Editorial news with an article page and a managed list.',
        listKey: 'news',
        rowMap: (row) => ({ ...row, category: mapped(row.category, CODE_TEXT), status: row.status ?? 'published' }),
        inputs: (old) => [
            input('news', 'title', 'text-input', 'title', ['Titel', 'Title'], { ...REQUIRED, ...TRANSLATABLE }),
            input('news', 'category', 'select', 'category', ['Kategorie', 'Category'], { ...choices(NEWS_CATEGORIES), value: prop('Release') }),
            old.get('tags') ?? input('news', 'tags', 'select', 'tags', ['Schlagwörter', 'Tags']),
            input('news', 'published-on', 'datepicker', 'published_on', ['Datum', 'Date'], DATE_PICKER('date')),
            input('news', 'image', 'file-input', 'image', ['Bild', 'Image'], {
                files_public: prop('1'),
                web_file_input_accept: prop('image/jpeg,image/png,image/webp,image/gif'),
                web_file_input_max_files: prop('1'),
            }),
            input('news', 'attachments', 'file-input', 'attachments', ['Dateien', 'Downloads'], {
                files_public: prop('1'),
                web_file_input_multiple: prop('1'),
                web_file_input_max_files: prop('10'),
            }),
            input('news', 'status', 'select', 'status', ['Status', 'Status'], {
                ...REQUIRED,
                ...choices(PUBLISH_STATUS),
                value: prop('draft'),
                clearable: prop('0'),
            }),
            old.get('summary'),
            old.get('body'),
        ],
        cms: {
            title: ['Beiträge', 'Posts'],
            pageTitle: ['Beiträge verwalten', 'Manage posts'],
            add: ['Beitrag hinzufügen', 'Add post'],
            empty: ['Noch keine Beiträge.', 'No posts yet.'],
            search: ['Beiträge durchsuchen', 'Search posts'],
            confirmDelete: ['Diesen Beitrag löschen?', 'Delete this post?'],
            saved: ['Beitrag gespeichert.', 'Post saved.'],
            columns: [
                { field: 'image', label: { [DE]: 'Bild', [EN]: 'Image' }, format: 'image' },
                { field: 'title', label: { [DE]: 'Titel', [EN]: 'Title' }, sortable: true, searchable: true },
                { field: 'category', label: { [DE]: 'Kategorie', [EN]: 'Category' }, sortable: true, format: 'badge' },
                { field: 'published_on', label: { [DE]: 'Datum', [EN]: 'Date' }, sortable: true, format: 'date' },
                { field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, sortable: true, format: 'badge' },
                { field: 'summary', label: { [DE]: 'Zusammenfassung', [EN]: 'Summary' }, searchable: true },
            ],
            actions: [
                { id: 'publish', label: { [DE]: 'Veröffentlichen', [EN]: 'Publish' }, set: { status: 'published' }, when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'draft' }] } },
                { id: 'unpublish', label: { [DE]: 'Zurückziehen', [EN]: 'Unpublish' }, set: { status: 'draft' }, when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'published' }] } },
            ],
            sort: [{ field: 'published_on', direction: 'desc' }],
            controls: [
                { id: 'category', type: 'select', field: 'category', label: { [DE]: 'Kategorie', [EN]: 'Category' }, options_from: 'data' },
                { id: 'published', type: 'date_range', field: 'published_on', label: { [DE]: 'Datum', [EN]: 'Date' } },
            ],
        },
        public: {
            kind: 'composition',
            pageTitle: ['Neuigkeiten', 'News'],
            hero: {
                eyebrow: ['Neuigkeiten', 'What is new'],
                title: ['Neuigkeiten', 'News and updates'],
                subtitle: ['Was sich auf der Plattform ändert: Releases, Funktionen und Hinweise.', 'What changes on the platform: releases, features and notices.'],
            },
            detailTitle: ['Beitrag', 'Post'],
        },
    },
    // -- events ------------------------------------------------------------
    {
        file: 'events.bundle.json',
        slug: 'events',
        title: 'Events',
        description: 'Upcoming events with date, location and status: a filterable card list and a detail page for visitors, and a managed list with cancel/reopen actions for editors.',
        tags: ['cms-in-cms', 'list + detail', 'quick actions', 'translatable'],
        comment: 'CMS-in-CMS template: an Events app in three pages. PUBLIC: /events is a read-only data view (cards, search, filters by location and date, paging) and /events/{record_id} renders the full event page; both read the table of the form through "@section:events-form". CMS: /cms/events is ONE entry-form-list that holds the form: add and edit events in a dialog, delete them, restore earlier versions, and cancel or reopen an event with one click (quick actions that change the status). The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). Title, location and description are translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'Events with a filterable public list, detail pages and cancel/reopen actions.',
        listKey: 'events',
        rowMap: (row) => ({
            ...row,
            location: mapped(row.location, LOCATION_TEXT),
            status: row.status ?? 'Scheduled',
        }),
        inputs: (old) => [
            input('events', 'title', 'text-input', 'title', ['Titel', 'Title'], { ...REQUIRED, ...TRANSLATABLE }),
            input('events', 'date', 'datepicker', 'event_date', ['Datum und Zeit', 'Date and time'], { ...REQUIRED, ...DATE_PICKER('datetime') }),
            input('events', 'location', 'text-input', 'location', ['Ort', 'Location'], TRANSLATABLE),
            input('events', 'status', 'select', 'status', ['Status', 'Status'], { ...choices(EVENT_STATUS), value: prop('Scheduled') }),
            old.get('description'),
        ],
        cms: {
            title: ['Veranstaltungen', 'Events'],
            pageTitle: ['Veranstaltungen verwalten', 'Manage events'],
            add: ['Veranstaltung hinzufügen', 'Add event'],
            empty: ['Noch keine Veranstaltungen.', 'No events yet.'],
            search: ['Veranstaltungen durchsuchen', 'Search events'],
            confirmDelete: ['Diese Veranstaltung löschen?', 'Delete this event?'],
            saved: ['Veranstaltung gespeichert.', 'Event saved.'],
            columns: [
                { field: 'title', label: { [DE]: 'Titel', [EN]: 'Title' }, sortable: true, searchable: true },
                { field: 'event_date', label: { [DE]: 'Datum', [EN]: 'Date' }, sortable: true, format: 'datetime' },
                { field: 'location', label: { [DE]: 'Ort', [EN]: 'Location' }, sortable: true, searchable: true },
                { field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, sortable: true, format: 'badge' },
            ],
            sort: [{ field: 'event_date', direction: 'asc' }],
            controls: [
                { id: 'status', type: 'select', field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, options: [
                    { value: 'Scheduled', label: { [DE]: 'Geplant', [EN]: 'Scheduled' } },
                    { value: 'Cancelled', label: { [DE]: 'Abgesagt', [EN]: 'Cancelled' } },
                ] },
                { id: 'date', type: 'date_range', field: 'event_date', label: { [DE]: 'Datum', [EN]: 'Date' } },
            ],
            actions: [
                {
                    id: 'cancel',
                    label: { [DE]: 'Absagen', [EN]: 'Cancel event' },
                    confirm: { [DE]: 'Diese Veranstaltung absagen?', [EN]: 'Cancel this event?' },
                    set: { status: 'Cancelled' },
                    when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'Scheduled' }] },
                },
                {
                    id: 'reopen',
                    label: { [DE]: 'Wieder öffnen', [EN]: 'Reopen' },
                    set: { status: 'Scheduled' },
                    when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'Cancelled' }] },
                },
            ],
        },
        public: {
            kind: 'data-view',
            pageTitle: ['Veranstaltungen', 'Events'],
            hero: {
                eyebrow: ['Termine', 'Calendar'],
                title: ['Veranstaltungen', 'Events'],
                subtitle: ['Webinare, Workshops und Treffen rund um die Studie.', 'Webinars, workshops and meetups around the study.'],
                color: 'violet',
            },
            view: {
                layout: 'custom',
                rowCss: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
                template: [eventCard()],
                pageSize: 6,
                columns: [
                    { field: 'title', label: { [DE]: 'Titel', [EN]: 'Title' }, sortable: true, searchable: true },
                    { field: 'event_date', label: { [DE]: 'Datum', [EN]: 'Date' }, sortable: true, format: 'datetime' },
                    { field: 'location', label: { [DE]: 'Ort', [EN]: 'Location' }, sortable: true, searchable: true },
                    { field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, format: 'badge' },
                    { field: 'description', label: { [DE]: 'Beschreibung', [EN]: 'Description' } },
                ],
                sort: [{ field: 'event_date', direction: 'asc' }],
                controls: [
                    { id: 'location', type: 'select', field: 'location', label: { [DE]: 'Ort', [EN]: 'Location' }, options_from: 'data' },
                    { id: 'date', type: 'date_range', field: 'event_date', label: { [DE]: 'Datum', [EN]: 'Date' } },
                ],
                empty: ['Keine Veranstaltungen gefunden.', 'No events found.'],
                search: ['Veranstaltungen suchen', 'Search events'],
                detailUrl: '/events/{record_id}',
            },
            detailTitle: ['Veranstaltung', 'Event'],
        },
    },
    // -- faq ---------------------------------------------------------------
    {
        file: 'faq.bundle.json',
        slug: 'faq',
        title: 'FAQ accordion',
        description: 'Frequently asked questions as an accessible accordion for visitors, managed in a list with categories, search and history for editors.',
        tags: ['cms-in-cms', 'accordion', 'list only', 'translatable'],
        comment: 'CMS-in-CMS template: an FAQ app in two pages. PUBLIC: /faq renders every question as an accordion item (one item per record through entry-list); the category label is translated through the option labels of the form. CMS: /cms/faq is ONE entry-form-list that holds the form: filter by category, search, add and edit questions in a dialog, delete them and restore earlier versions. The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). Question and answer are translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'An accordion FAQ with categories and a managed list.',
        listKey: 'faq',
        rowMap: (row) => ({ ...row, category: mapped(row.category, CODE_TEXT) }),
        inputs: (old) => [
            input('faq', 'category', 'select', 'category', ['Kategorie', 'Category'], { ...REQUIRED, ...choices(FAQ_CATEGORIES), value: prop('Account') }),
            old.get('question'),
            old.get('answer'),
        ],
        cms: {
            title: ['Fragen', 'Questions'],
            pageTitle: ['FAQ verwalten', 'Manage FAQ'],
            add: ['Frage hinzufügen', 'Add question'],
            empty: ['Noch keine Fragen.', 'No questions yet.'],
            search: ['Fragen durchsuchen', 'Search questions'],
            confirmDelete: ['Diese Frage löschen?', 'Delete this question?'],
            saved: ['Frage gespeichert.', 'Question saved.'],
            columns: [
                { field: 'category', label: { [DE]: 'Kategorie', [EN]: 'Category' }, sortable: true, format: 'badge' },
                { field: 'question', label: { [DE]: 'Frage', [EN]: 'Question' }, sortable: true, searchable: true },
                { field: 'answer', label: { [DE]: 'Antwort', [EN]: 'Answer' }, searchable: true },
            ],
            sort: [{ field: 'category', direction: 'asc' }, { field: 'question', direction: 'asc' }],
            controls: [
                { id: 'category', type: 'select', field: 'category', label: { [DE]: 'Kategorie', [EN]: 'Category' }, options_from: 'data' },
            ],
        },
        public: {
            kind: 'composition',
            pageTitle: ['Häufige Fragen', 'FAQ'],
            hero: {
                eyebrow: ['Hilfe', 'Help'],
                title: ['Häufige Fragen', 'Frequently asked questions'],
                subtitle: ['Antworten auf die häufigsten Fragen, gepflegt im Admin-Bereich.', 'Answers to the most common questions, maintained in the admin area.'],
                color: 'teal',
            },
        },
    },
    // -- team members ------------------------------------------------------
    {
        file: 'team-members.bundle.json',
        slug: 'team-members',
        title: 'Team members',
        description: 'A polished team directory: portrait cards and profile pages for visitors, and a managed list with portrait upload for editors.',
        tags: ['cms-in-cms', 'list + detail', 'file upload', 'translatable'],
        comment: 'Flagship CMS-in-CMS template: a Team Members app in three pages. PUBLIC: /team-members renders a responsive card grid (portrait or initials, role badge, bio, contact links) and /team-members/{record_id} a shareable profile page; both read the table of the form through "@section:team-members-form". CMS: /cms/team-members is ONE entry-form-list that holds the form: search, filter by role, add and edit members in a dialog (including the portrait upload, which is public so the pages can show it), delete them and restore earlier versions. The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). The bio is translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'Modern public team directory with profiles and portraits, managed in a list.',
        listKey: 'team',
        rowMap: (row) => ({ ...row, role: mapped(row.role, CODE_TEXT), status: row.status ?? 'published' }),
        inputs: (old) => [
            input('team-members', 'name', 'text-input', 'name', ['Name', 'Name'], { ...REQUIRED, placeholder: tr('Vor- und Nachname', 'First and last name') }),
            input('team-members', 'role', 'select', 'role', ['Rolle', 'Role'], { ...choices(TEAM_ROLES), value: prop('Researcher') }),
            old.get('email'),
            old.get('bio'),
            input('team-members', 'status', 'select', 'status', ['Status', 'Status'], {
                ...REQUIRED,
                ...choices(PUBLISH_STATUS),
                value: prop('draft'),
                clearable: prop('0'),
            }),
            input('team-members', 'portrait', 'file-input', 'portrait', ['Porträt', 'Portrait'], {
                files_public: prop('1'),
                web_file_input_accept: prop('image/jpeg,image/png,image/webp,image/gif'),
                description: tr('Optionales Bild (JPG oder PNG). Es ist öffentlich sichtbar.', 'Optional picture (JPG or PNG). It is publicly visible.'),
            }),
        ],
        cms: {
            title: ['Teammitglieder', 'Team members'],
            pageTitle: ['Team verwalten', 'Manage team'],
            add: ['Mitglied hinzufügen', 'Add member'],
            empty: ['Noch keine Teammitglieder.', 'No team members yet.'],
            search: ['Team durchsuchen', 'Search team'],
            confirmDelete: ['Dieses Mitglied löschen?', 'Delete this member?'],
            saved: ['Mitglied gespeichert.', 'Member saved.'],
            columns: [
                { field: 'name', label: { [DE]: 'Name', [EN]: 'Name' }, sortable: true, searchable: true },
                { field: 'role', label: { [DE]: 'Rolle', [EN]: 'Role' }, sortable: true, format: 'badge' },
                { field: 'email', label: { [DE]: 'E-Mail', [EN]: 'Email' }, searchable: true },
                { field: 'portrait', label: { [DE]: 'Porträt', [EN]: 'Portrait' }, format: 'image' },
                { field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, sortable: true, format: 'badge' },
            ],
            actions: [
                { id: 'publish', label: { [DE]: 'Veröffentlichen', [EN]: 'Publish' }, set: { status: 'published' }, when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'draft' }] } },
                { id: 'unpublish', label: { [DE]: 'Zurückziehen', [EN]: 'Unpublish' }, set: { status: 'draft' }, when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'published' }] } },
            ],
            sort: [{ field: 'name', direction: 'asc' }],
            controls: [
                { id: 'role', type: 'select', field: 'role', label: { [DE]: 'Rolle', [EN]: 'Role' }, options_from: 'data' },
            ],
        },
        public: {
            kind: 'composition',
            pageTitle: ['Unser Team', 'Our team'],
            hero: {
                eyebrow: ['Menschen & Expertise', 'People & craft'],
                title: ['Unser Team', 'Meet the people building it'],
                subtitle: ['Forscherinnen, Ingenieurinnen und Architektinnen: öffnen Sie ein Profil für die ganze Geschichte.', 'Researchers, engineers and builders: open any profile for the full story.'],
            },
            detailTitle: ['Teamprofil', 'Team profile'],
        },
    },
    // -- contact directory -------------------------------------------------
    {
        file: 'contact-directory.bundle.json',
        slug: 'contacts',
        title: 'Contact directory',
        description: 'A searchable contact table for visitors (filter by department, tap to call or mail), and a managed list for editors.',
        tags: ['cms-in-cms', 'list only', 'directory', 'translatable'],
        comment: 'CMS-in-CMS template: a Contact Directory in two pages (list only, no detail page). PUBLIC: /contacts is a read-only data view as a table (search in name, department and mail, sort, filter by department, paging) of the table of the form "@section:contacts-form". CMS: /cms/contacts is ONE entry-form-list that holds the form: add and edit contacts in a dialog, delete them and restore earlier versions. The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). The department is translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'A searchable contact directory with a managed list.',
        listKey: 'contacts',
        rowMap: (row) => ({ ...row, department: mapped(row.department, DEPARTMENT_TEXT) }),
        inputs: (old) => [
            input('contacts', 'name', 'text-input', 'name', ['Name', 'Name'], REQUIRED),
            input('contacts', 'department', 'text-input', 'department', ['Abteilung', 'Department'], TRANSLATABLE),
            old.get('phone'),
            old.get('email'),
        ],
        cms: {
            title: ['Kontakte', 'Contacts'],
            pageTitle: ['Kontakte verwalten', 'Manage contacts'],
            add: ['Kontakt hinzufügen', 'Add contact'],
            empty: ['Noch keine Kontakte.', 'No contacts yet.'],
            search: ['Kontakte durchsuchen', 'Search contacts'],
            confirmDelete: ['Diesen Kontakt löschen?', 'Delete this contact?'],
            saved: ['Kontakt gespeichert.', 'Contact saved.'],
            columns: [
                { field: 'name', label: { [DE]: 'Name', [EN]: 'Name' }, sortable: true, searchable: true },
                { field: 'department', label: { [DE]: 'Abteilung', [EN]: 'Department' }, sortable: true, searchable: true },
                { field: 'phone', label: { [DE]: 'Telefon', [EN]: 'Phone' } },
                { field: 'email', label: { [DE]: 'E-Mail', [EN]: 'Email' }, searchable: true },
            ],
            sort: [{ field: 'name', direction: 'asc' }],
            controls: [
                { id: 'department', type: 'select', field: 'department', label: { [DE]: 'Abteilung', [EN]: 'Department' }, options_from: 'data' },
            ],
        },
        public: {
            kind: 'data-view',
            pageTitle: ['Kontakte', 'Contacts'],
            hero: {
                eyebrow: ['Verzeichnis', 'Directory'],
                title: ['Ansprechpersonen', 'Who to contact'],
                subtitle: ['Finden Sie die richtige Person für Ihr Anliegen: suchen oder nach Abteilung filtern.', 'Find the right person for your question: search or filter by department.'],
                color: 'cyan',
            },
            view: {
                layout: 'custom',
                rowCss: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
                template: [contactCard()],
                pageSize: 12,
                columns: [
                    { field: 'name', label: { [DE]: 'Name', [EN]: 'Name' }, sortable: true, searchable: true },
                    { field: 'department', label: { [DE]: 'Abteilung', [EN]: 'Department' }, sortable: true, searchable: true },
                    { field: 'phone', label: { [DE]: 'Telefon', [EN]: 'Phone' } },
                    { field: 'email', label: { [DE]: 'E-Mail', [EN]: 'Email' }, searchable: true },
                ],
                sort: [{ field: 'name', direction: 'asc' }],
                controls: [
                    { id: 'department', type: 'select', field: 'department', label: { [DE]: 'Abteilung', [EN]: 'Department' }, options_from: 'data' },
                ],
                empty: ['Keine Kontakte gefunden.', 'No contacts found.'],
                search: ['Kontakte suchen', 'Search contacts'],
            },
        },
    },
    // -- testimonials ------------------------------------------------------
    {
        file: 'testimonials.bundle.json',
        slug: 'testimonials',
        title: 'Testimonials',
        description: 'A quote wall: only approved quotes are public; editors review them in a managed list with approve and hide actions.',
        tags: ['cms-in-cms', 'list only', 'moderation', 'quick actions', 'translatable'],
        comment: 'CMS-in-CMS template: a Testimonials wall in two pages (list only). PUBLIC: /testimonials is a read-only data view (cards) of the table of the form "@section:testimonials-form"; a fixed filter limits it to approved quotes, so a quote that is pending or hidden never reaches a visitor, whatever the address says. CMS: /cms/testimonials is ONE entry-form-list that holds the form: review the quotes, approve or hide one with a click (quick actions that change the status), add and edit quotes in a dialog, delete them and restore earlier versions. The inputs are defined once, in the form inside the list. data_tables[] carries the columns and sample rows (import with options.importData=true). The quote and the role are translatable. Content locales: de-CH + en-GB. Pages are not open to guests until you set their access. Import via Admin > CMS Apps > Import template. NOT auto-seeded.',
        appDescription: 'A moderated quote wall: only approved testimonials are public.',
        listKey: 'testimonials',
        rowMap: (row) => {
            const { role_company: roleCompany, ...rest } = row;
            return {
                ...rest,
                role: mapped(row.role ?? roleCompany, ROLE_COMPANY_TEXT),
                status: row.status ?? (row.author === 'Camille Rochat' ? 'Pending' : 'Approved'),
            };
        },
        inputs: (old) => [
            input('testimonials', 'author', 'text-input', 'author', ['Autorin / Autor', 'Author'], REQUIRED),
            input('testimonials', 'role', 'text-input', 'role', ['Rolle', 'Role'], TRANSLATABLE),
            old.get('quote'),
            input('testimonials', 'status', 'select', 'status', ['Status', 'Status'], { ...choices(TESTIMONIAL_STATUS), value: prop('Pending') }),
        ],
        cms: {
            title: ['Zitate', 'Testimonials'],
            pageTitle: ['Zitate verwalten', 'Manage testimonials'],
            add: ['Zitat hinzufügen', 'Add testimonial'],
            empty: ['Noch keine Zitate.', 'No testimonials yet.'],
            search: ['Zitate durchsuchen', 'Search testimonials'],
            confirmDelete: ['Dieses Zitat löschen?', 'Delete this testimonial?'],
            saved: ['Zitat gespeichert.', 'Testimonial saved.'],
            columns: [
                { field: 'author', label: { [DE]: 'Autorin / Autor', [EN]: 'Author' }, sortable: true, searchable: true },
                { field: 'role', label: { [DE]: 'Rolle', [EN]: 'Role' }, searchable: true },
                { field: 'quote', label: { [DE]: 'Zitat', [EN]: 'Quote' }, searchable: true },
                { field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, sortable: true, format: 'badge' },
            ],
            sort: [{ field: 'entry_date', direction: 'desc' }],
            controls: [
                { id: 'status', type: 'select', field: 'status', label: { [DE]: 'Status', [EN]: 'Status' }, options: [
                    { value: 'Pending', label: { [DE]: 'Zu prüfen', [EN]: 'Pending' } },
                    { value: 'Approved', label: { [DE]: 'Freigegeben', [EN]: 'Approved' } },
                    { value: 'Hidden', label: { [DE]: 'Ausgeblendet', [EN]: 'Hidden' } },
                ] },
            ],
            actions: [
                {
                    id: 'approve',
                    label: { [DE]: 'Freigeben', [EN]: 'Approve' },
                    confirm: { [DE]: 'Dieses Zitat veröffentlichen?', [EN]: 'Publish this testimonial?' },
                    set: { status: 'Approved' },
                    when: { mode: 'or', children: [
                        { column: 'status', operator: 'eq', value: 'Pending' },
                        { column: 'status', operator: 'eq', value: 'Hidden' },
                    ] },
                },
                {
                    id: 'hide',
                    label: { [DE]: 'Ausblenden', [EN]: 'Hide' },
                    set: { status: 'Hidden' },
                    when: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'Approved' }] },
                },
            ],
        },
        public: {
            kind: 'data-view',
            pageTitle: ['Stimmen', 'Voices'],
            hero: {
                eyebrow: ['Stimmen', 'Voices'],
                title: ['Was andere sagen', 'What people say'],
                subtitle: ['Erfahrungen aus der Studie, in den Worten der Beteiligten.', 'Experiences from the study, in the words of the people involved.'],
                color: 'orange',
            },
            view: {
                layout: 'custom',
                rowCss: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                template: [testimonialCard()],
                pageSize: 6,
                columns: [
                    { field: 'quote', label: { [DE]: 'Zitat', [EN]: 'Quote' } },
                    { field: 'author', label: { [DE]: 'Von', [EN]: 'From' }, sortable: true },
                    { field: 'role', label: { [DE]: 'Rolle', [EN]: 'Role' } },
                ],
                sort: [{ field: 'entry_date', direction: 'desc' }],
                controls: [],
                empty: ['Noch keine Zitate.', 'No testimonials yet.'],
                search: ['Zitate suchen', 'Search testimonials'],
                fixedFilter: { mode: 'and', children: [{ column: 'status', operator: 'eq', value: 'Approved' }] },
            },
        },
    },
];

// ---------------------------------------------------------------------------
// public compositions (the part of a bundle that is not a data view)
// ---------------------------------------------------------------------------

/** Replace the hero of a composition page; keep everything else of the page as authored. */
function withHero(pageNode, t) {
    const container = pageNode.sections[0];
    container.children = (container.children ?? []).filter((child) => child.section_name !== `${t.slug}-hero`);
    container.children.unshift(hero(t.slug, t.public.hero));
    return pageNode;
}

/** The portrait of a team member: an image when the member has one, the initials otherwise. */
function withPortrait(bundle) {
    const portrait = (sectionName) => {
        const avatar = findSection(bundle, sectionName);
        if (avatar) {
            avatar.fields.img_src = prop('{{team_member.portrait__url}}');
            avatar.fields.alt = tr('Porträt von {{team_member.name}}', 'Portrait of {{team_member.name}}');
        }
    };
    portrait('team-members-list-card-avatar');
    portrait('team-members-detail-avatar');
}

/**
 * News public list cards and the article page show the image and a downloads
 * block via section-scoped `__url` / `__links` tokens (contract 3 + F176).
 */
function withNewsMedia(bundle) {
    // Scope on news entry-list / entry-record is `news_item` (not `news`).
    const listCard = findSection(bundle, 'news-list-card');
    if (listCard) {
        listCard.children = listCard.children ?? [];
        if (!listCard.children.some((c) => c.section_name === 'news-list-card-image')) {
            listCard.children.unshift(section('news-list-card-image', 'image', {
                img_src: prop('{{news_item.image__url}}'),
                alt: tr('{{news_item.title}}', '{{news_item.title}}'),
                is_fluid: prop('1'),
                web_image_fit: prop('cover'),
                spacing: prop(json({ mb: 'sm' })),
            }));
        } else {
            const img = listCard.children.find((c) => c.section_name === 'news-list-card-image');
            img.fields.img_src = prop('{{news_item.image__url}}');
            img.fields.alt = tr('{{news_item.title}}', '{{news_item.title}}');
        }
    }
    const detail = findSection(bundle, 'news-detail-container');
    if (detail) {
        detail.children = detail.children ?? [];
        if (!detail.children.some((c) => c.section_name === 'news-detail-image')) {
            const titleIdx = detail.children.findIndex((c) => c.section_name === 'news-detail-title');
            const at = titleIdx >= 0 ? titleIdx + 1 : 0;
            detail.children.splice(at, 0, section('news-detail-image', 'image', {
                img_src: prop('{{news_item.image__url}}'),
                alt: tr('{{news_item.title}}', '{{news_item.title}}'),
                is_fluid: prop('1'),
                web_image_fit: prop('contain'),
                spacing: prop(json({ mb: 'md' })),
            }));
        } else {
            const img = detail.children.find((c) => c.section_name === 'news-detail-image');
            img.fields.img_src = prop('{{news_item.image__url}}');
            img.fields.alt = tr('{{news_item.title}}', '{{news_item.title}}');
        }
        // `__links` is server-built HTML drawn by the existing `text` style.
        if (!detail.children.some((c) => c.section_name === 'news-detail-downloads')) {
            detail.children.push(section('news-detail-downloads', 'text', {
                text: tr(
                    'Downloads:<br>{{news_item.attachments__links}}',
                    'Downloads:<br>{{news_item.attachments__links}}',
                ),
                size: prop('sm'),
                spacing: prop(json({ mt: 'md' })),
            }));
        } else {
            const block = detail.children.find((c) => c.section_name === 'news-detail-downloads');
            block.fields.text = tr(
                'Downloads:<br>{{news_item.attachments__links}}',
                'Downloads:<br>{{news_item.attachments__links}}',
            );
        }
    }
}


/** Public composition lists/details only show published records (F161 / F166). */
function withPublishedFilter(bundle, slug) {
    const mark = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.style_name === 'entry-list' || node.style_name === 'entry-record' || node.style_name === 'data-view') {
            node.fields = node.fields || {};
            // data-view: typed list_fixed_filter. entry-list: author SQL filter
            // (same path PageService / current-file use). entry-record: typed
            // fixed_filter (F166) — never a section condition.
            if (node.style_name === 'data-view') {
                node.fields.list_fixed_filter = prop(json({
                    mode: 'and',
                    children: [{ column: 'status', operator: 'eq', value: 'published' }],
                }));
            }
            if (node.style_name === 'entry-list') {
                node.fields.filter = prop("status = 'published'");
            }
            if (node.style_name === 'entry-record') {
                delete node.fields.condition;
                node.fields.fixed_filter = prop(json({
                    mode: 'and',
                    children: [{ column: 'status', operator: 'eq', value: 'published' }],
                }));
            }
        }
        for (const child of node.children ?? []) mark(child);
        for (const child of node.sections ?? []) mark(child);
    };
    for (const pageNode of bundle.pages ?? []) {
        if (pageNode.cms_app_role === 'public_list' || pageNode.cms_app_role === 'public_detail') {
            mark(pageNode);
        }
    }
}

// ---------------------------------------------------------------------------
// build
// ---------------------------------------------------------------------------

function build(t) {
    const old = read(t.file);
    const harvested = harvestInputs(old, t.slug);
    const inputs = t.inputs(harvested).filter(Boolean);
    const form = formSection(t, inputs);

    const pages = [cmsPage(t, form)];

    if (t.public.kind === 'data-view') {
        pages.push(dataViewPage(t, t.public.view));
        if (t.public.view.detailUrl) {
            pages.push(findPage(old, 'public_detail'));
        }
    } else {
        const list = findPage(old, 'public_list');
        const detail = findPage(old, 'public_detail');
        pages.push(withHero(list, t));
        if (detail) pages.push(detail);
    }


    const rows = (old.data_tables[0]?.rows ?? []).map((row) => t.rowMap(row));
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const bundle = {
        format: old.format,
        version: old.version,
        exported_at: old.exported_at,
        core_version: old.core_version,
        title: t.title,
        description: t.description,
        tags: t.tags,
        _comment: t.comment,
        data_tables: [{ owner_section_name: `${t.slug}-form`, columns: orderColumns(columns, inputs), rows }],
        pages,
        cms_app: { name: t.title, slug: t.slug, description: t.appDescription },
    };

    if (t.slug === 'team-members') withPortrait(bundle);
    if (t.slug === 'news') withNewsMedia(bundle);
    // Only templates with a `status` field and published sample rows (F161 / F166).
    // Events, FAQ, contact-directory and testimonials stay as before this task.
    if (t.slug === 'news' || t.slug === 'team-members') {
        withPublishedFilter(bundle, t.slug);
    }

    return bundle;
}

function findDetailContainer(pageNode, name) {
    let found = null;
    walk(pageNode?.sections, (node) => {
        if (node.section_name === name) found = node;
    });
    return found;
}

/** Sample columns follow the order of the inputs. */
function orderColumns(columns, inputs) {
    const order = inputs.map((node) => node.fields.name.all.content);
    return [...columns].sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
}

function serialize(bundle) {
    return `${JSON.stringify(bundle, null, 4).replace(/\n/g, '\r\n')}\r\n`;
}

let failures = 0;
for (const t of TEMPLATES) {
    const target = join(OUT_DIR, t.file);
    const text = serialize(build(t));
    if (args.has('--check')) {
        const onDisk = existsSync(target) ? readFileSync(target, 'utf8') : '';
        if (onDisk !== text) {
            console.error(`out of date: examples/cms-in-cms/${t.file}`);
            failures += 1;
        }
        continue;
    }
    writeFileSync(target, text);
    if (args.has('--backend') && existsSync(BACKEND_DIR)) {
        writeFileSync(join(BACKEND_DIR, t.file), text);
    }
    console.log(`wrote examples/cms-in-cms/${t.file}${args.has('--backend') ? ' (+ backend fixture)' : ''}`);
}

if (failures > 0) {
    console.error('Run: node scripts/build-cms-example-bundles.mjs --backend');
    process.exit(1);
}
