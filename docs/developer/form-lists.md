# Entry lists and data views (frontend)

Audience: frontend developers.
Status: active.
Applies to: frontend 0.1.71 with core 0.1.44 and later, `@selfhelp/shared` 1.24.0.
Last verified: 2026-11-14.
Source of truth: `src/app/components/frontend/styles/form-list/`, `src/hooks/useFormList.ts`, `src/hooks/useFormListUrlState.ts`, `src/hooks/useUnsavedChangesGuard.ts`, `src/utils/form-list*.ts`, the list editors under `src/app/components/cms/shared/field-components/form-list/`, and the backend contract in `sh-selfhelp_backend/docs/reference/api/22-form-lists.md`.

The styles `entry-form-list` (create, view, edit, delete over the generic data store) and `data-view` (the same list, read only) are drawn by one component, `FormListStyle`. The server decides everything a person may see and do (rows, columns, buttons, history); this code draws what the server sent and never evaluates access. Backend concepts: `sh-selfhelp_backend/docs/developer/form-lists.md`, `data-query-engine.md` and `record-history.md`; the person-facing description is `sh-selfhelp_backend/docs/user/entry-lists.md`.

## Where things live

| Part | Files |
| --- | --- |
| Renderer | `styles/form-list/FormListStyle.tsx` (state, panels, dialogs), `FormListToolbar`, `FormListRows` (table, cards and the record template of the `custom` layout), `FormListCell`, `FormListRowActions`, `FormListRecord` and `FormListRecordView` (dialog or page panel), `FormListHistory` and `FormListChanges`, `FormListConfirmDialog`, `FormListErrorState`, `FormList.module.css` |
| Dispatch | `BasicStyle.tsx` and `SelfHelpStyles.ts` (both style names), `src/types/common/styles.types.ts` |
| Server reads | `src/api/frontend/form-list.api.ts` (BFF `/api/lists/...`), routes in `src/config/api.config.ts` (`FORM_LIST_*`, taken from the shared map) |
| State and cache | `src/hooks/useFormList.ts`, `useFormListUrlState.ts`, `src/utils/form-list.utils.ts`, `form-list-cache.utils.ts`, `REACT_QUERY_CONFIG` (`FORM_LIST` tier, `FORM_LIST_*` keys) |
| Unsaved input | `FormStyle.tsx` (dirty tracking, list context), `FormListFormContext.tsx`, `src/hooks/useUnsavedChangesGuard.ts` |
| Authoring | `field-components/form-list/` (rows editors for columns, order, controls, fixed filter, quick actions), `FieldRenderer.tsx`, `SectionInspector.tsx`, `src/utils/form-list-config-problems.utils.ts` |
| Tests | `styles/__tests__/FormListStyle.test.tsx`, `hooks/__tests__/useUnsavedChangesGuard.test.tsx`, `utils/__tests__/form-list*.test.ts`, `field-components/__tests__/FormListFieldEditor.test.tsx`, `e2e/golden/form-list.spec.ts` |

## First paint and hydration

The slug page passes the page URL's own list parameters (`pickFormListQuery`) to `GET /pages/resolve`, so the server renders every list of the page for exactly that URL. The page payload carries `list_state` (or `list_error`) on each list section. `src/app/[[...slug]]/page.tsx` wraps the page in `FormListSsrProvider` (built by `buildFormListSsrValue`) and removes the lists from the dehydrated page payload (`stripFormListState`) so they travel once.

`useFormListSeed` decides what a list starts from: a server render for exactly this URL state (trusted, age = render time, nothing is fetched), else the page payload's list when the URL has no list parameters (shown, read once), else nothing (read once, shows a loading state). A hydrated list performs no duplicate initial fetch; this is a tested behaviour (`the first paint is server-rendered and hydration reads nothing again`).

## The record template (`custom` layout)

A `data-view` whose layout is `custom` draws `row.sections`: the sections its author placed inside
the view, drawn by the server once per record (the tokens are already replaced). `FormListCustom`
(in `FormListRows.tsx`) renders each record's sections with the ordinary `BasicStyle` renderer inside
a holder whose classes are `list.row_css` (`list_row_css`, web only; the audit script
`scripts/audit-cms-css-classes.mjs` checks it with `css` and `css_mobile`). A `custom` list without
`has_template` falls back to cards. The page payload carries no children for a data view, so the
renderer never sees an unreplaced template. Tests: `FormListStyle.test.tsx`; the shipped templates are
checked by `src/config/__tests__/cms-app-template-forms.test.ts` (every token is a column of the view).

## The URL is the list state

The grammar lives in `@selfhelp/shared` (`formListState.ts`), shared with mobile and mirrored by the backend parser:

```text
<key>.page=2   <key>.q=anna   <key>.sort=title:asc   <key>.f.<id>=value   <key>.record=17   <key>.mode=view|edit|create
```

`<key>` is the list's `list_key` (default `list`; a lowercase letter first, at most 32 lowercase letters, digits or underscores; unique on the page, which the server checks), so two lists on a page do not disturb each other. `useFormListUrlState` reads the live URL and writes through the History API (`pushState` for a new place the person can go Back from, `replaceState` for typing in the search box). Parameters outside the namespace (language, preview, other lists, campaigns) are kept untouched. The search waits 400 ms after typing and ignores one character. A malformed or foreign parameter in the list's namespace is refused by the server with a message the list shows; it never silently turns into something else.

## Cache identity

A list's state is cached under `formListCacheKey` (shared): API base, account or `guest`, language, platform, page, section and the normalized own parameters. The same address shows different records to different people, so:

- login, logout (also when another tab signs in or out, `useAuthBroadcastSync`) and a change of the person or their roles (`useAclVersionWatcher`) clear or invalidate the `form-list` and `form-list-history` roots (`clearFormListCaches`, `invalidateFormList`); impersonation reloads the page, which empties every cache;
- a write by the list invalidates its own list; a form write elsewhere invalidates every list.

## Writes

The list does not have a write API. The one inline form is a normal child of the list section (`entry-record-form`, `form-record` or `form-log`) and keeps its inputs, validation and submit pipeline (`FormStyle`). Inside a list `FormStyle` reads `FormListFormContext`:

- it edits the record the list opened (or creates a new one) and prefills it from `selected.form_values`;
- it sends `expected_version` with an update; the server answers `409 stale_version` when somebody else changed the record meanwhile (`getFormStaleVersion`), nothing is written and the draft stays (the list shows reload, compare, or save over theirs);
- it reports `onSaved` / `onStale` / `onCancel` to the list instead of resetting, redirecting or closing a modal on its own;
- a second submit while one is in flight is ignored (`submittingRef`), so a double click writes once.

Delete and quick actions use the existing delete endpoint and `POST /lists/{section}/records/{record}/actions/{action}`. The server refuses what the person may not do, whatever the page shows.

## Unsaved input

`FormStyle` registers an `isDirty` check (the serialized form value compared with the value at the first interaction, or any real user input). `FormListStyle` asks "Discard your changes?" (Keep editing / Discard changes) before it leaves: the Cancel button, the dialog's close button, Escape, a click outside the dialog (off by default), and Back.

Back is the hard one. Next.js patches `history.pushState/replaceState` and registers its own `popstate` listener inside the router; listeners of one target run in registration order, so the guard has to be registered **before** the router's. `useUnsavedChangesGuard.ts` registers one capture listener when the module is evaluated and `providers.tsx` imports it for that reason; do not remove the import. A blocked Back puts the form's address back and offers the question; confirming replays the step.

Escape needs care: Mantine closes modals with a window-level key listener, and the one Escape that opens the question would reach the question's own modal in the same key press and close it again. The question handles Escape itself (`FormListConfirmDialog`), and the record dialog turns its own Escape off while a question is open. jsdom cannot show this race; the browser test does.

## Layout and accessibility

- A table scrolls sideways inside its own box (`Table.ScrollContainer`, `position: relative` so the visually hidden captions cannot widen the page); cards wrap. Long labels and values break (`overflow-wrap: anywhere`). No page-wide horizontal scroll at 390 px or 1366 px.
- Rows are a real `<table>` with a caption, `aria-sort` on sortable headers and a name on every icon button (`View <row>`). The record dialog traps focus and returns it to the control that opened it. Status messages (saved, deleted, loading) go through one polite live region.
- Inside a list, the theme's dimmed grey is one step darker (`FormList.module.css`) so counts, labels and hints pass 4.5:1. The remaining axe finding on a list page is the theme's primary button colour (`color-contrast`, tracked debt in `e2e/utils/a11y.ts`).

## Authoring

The section editor edits the five JSON fields of the two styles (`list_columns`, `list_sort`, `list_controls`, `list_fixed_filter`, `quick_actions`) as rows (`isFormListEditorField`). The rows use the data table's columns, which the admin section details deliver as `list_source` (columns with type, the row fields `entry_date` and `record_id`, the form section). Problems the server would refuse on save (`FormListConfigValidator`) are shown next to the field first (`form-list-config-problems.utils.ts`). Raw JSON stays available behind each editor as a fallback.

## Tests and commands

```text
npm test -- src/app/components/frontend/styles/__tests__/FormListStyle.test.tsx src/hooks/__tests__/useUnsavedChangesGuard.test.tsx
npm run lint
npm run tsc
npm run build
npm run test:e2e -- e2e/golden/form-list.spec.ts e2e/golden/form-list-wide.spec.ts e2e/golden/form-list-builder.spec.ts e2e/golden/cms-app-team-members.spec.ts --project=chromium --workers=1
```

The browser spec runs against the backend fixture `QaFormListFixture` (pages `/qa-entries` and `/qa-events`) and the seeded personas `qa.user`, `qa.editor` and `qa.guest`; it needs a QA stack and `BASE_URL`. Specs that make a context by hand must pass `baseURL` and a locale (`en-GB`): a context made with `browser.newContext()` does not inherit the project's options. The first page after signing in is drawn twice (the page content is redrawn in the account's language); `waitUntilSettled` in `e2e/utils/formList.ts` waits for that before a test types into a form.

The four specs:

- `form-list.spec.ts`: the participant workflow (add, search, quick action, edit, delete, history, conflict) and the public data view, plus the size test of the ordinary pages.
- `form-list-wide.spec.ts`: the backend fixture page `/qa-wide` (two lists whose form has 24 inputs with sentence-long labels, one unbroken 70-character run in each, and 12 columns with long headers) at 1366x768 and 390x844: the list, the modal form (every input reached by Tab in order, focus always on screen, Save and Cancel reachable), the errors (the browser's own required check, the form summary that names the inputs), a saved record (view, edit, the history details and the comparison) and the form on a page. Axe runs on each view. Without the `overflow-wrap` rule on `.record` in `FormList.module.css` the dialog is wider than the screen (760 px against 620 and 390 px). The fixture never requires a checkbox: the stock `checkbox` style without an input wrapper renders an `<input>` without a `name`, so a browser post carries no value for it and a required one could not be satisfied.
- `form-list-builder.spec.ts`: an author builds an entry list from an empty page with the page editor's builders (page wizard, list, form, two inputs, columns, a filter control, a quick action that applies to matching records only, page size, title), reopens the editor to see the saved values, and a participant then uses the list; the page and every record are removed at the end. A column the form does not have is refused with a message that names it.
- `cms-app-team-members.spec.ts`: the generated Team members app (`entry-form-list` for the team, `data-view` for the public page) used by an author and a visitor.
