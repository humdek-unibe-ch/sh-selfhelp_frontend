/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure helpers of the form lists (`entry-form-list` / `data-view`).
 *
 * The URL grammar, its parser and the cache-key normalization live in
 * `@selfhelp/shared` (the same code the mobile app runs); this file only adds
 * what the web renderer needs around them: reading a list's own parameters out
 * of a page URL, building links, drawing a cell as text and comparing the
 * state a server rendered with the state the URL now asks for.
 *
 * Nothing here decides access. The server decides, the client draws.
 */
import {
    FORM_LIST_SEARCH_MAX_LENGTH,
    FORM_LIST_SEARCH_MIN_LENGTH,
    emptyFormListUrlState,
    formListCacheKey,
    formListQueryString,
    isFormListParam,
    parseFormListQuery,
    type IFormListColumn,
    type IFormListError,
    type IFormListFilesCell,
    type IFormListState,
    type IFormListUrlRules,
    type IFormListUrlState,
    type TFormListCellValue,
    type TFormListUrlParse,
} from '../shared';

/** Only the key of a cache key is needed to normalize a query; the rest is a constant scope. */
const NORMALIZE_SCOPE = {
    apiBase: '',
    account: null,
    languageId: 0,
    platform: 'web',
    pageId: 0,
    sectionId: 0,
} as const;

function splitPairs(search: string): string[] {
    const query = search.startsWith('?') ? search.slice(1) : search;
    return query.split('&').filter((pair) => pair !== '');
}

/** A parameter name as the server reads it: percent-decoded, `+` is a space; malformed escapes stay as typed. */
function decodeName(pair: string): string {
    const equals = pair.indexOf('=');
    const raw = equals === -1 ? pair : pair.slice(0, equals);
    try {
        return decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
        return raw;
    }
}

/**
 * The raw `name=value` pairs of the list called `key`, exactly as the page URL
 * spells them. Unknown, repeated and malformed parameters stay in: the server
 * refuses them with a reason, a client never "repairs" them silently.
 */
export function ownListQuery(search: string, key: string): string {
    return splitPairs(search)
        .filter((pair) => isFormListParam(decodeName(pair), key))
        .join('&');
}

/**
 * The normalized form of a list's own parameters (decoded, sorted): two
 * spellings of one state give one string. This is the last part of the list's
 * cache key and the value a server-rendered state is compared by.
 */
export function normalizedOwnQuery(search: string, key: string): string {
    const parts = formListCacheKey({ ...NORMALIZE_SCOPE, key }, search);
    return String(parts[parts.length - 1] ?? '');
}

/** `<pathname>?<query>` of the page showing `state` of the list `key`, keeping every unrelated parameter. */
export function formListHref(pathname: string, search: string, key: string, state: IFormListUrlState): string {
    const query = formListQueryString(search, key, state);
    return query === '' ? pathname : `${pathname}?${query}`;
}

/** The URL state a page URL asks for; the empty state when the list has no parameter. */
export function readFormListUrlState(search: string, key: string, rules: IFormListUrlRules = {}): TFormListUrlParse {
    return parseFormListQuery(search, key, rules);
}

/** The URL state, or the empty state when the URL is not a valid list state (the server then answers with the reason). */
export function readFormListUrlStateOrEmpty(search: string, key: string, rules: IFormListUrlRules = {}): IFormListUrlState {
    const parsed = parseFormListQuery(search, key, rules);
    return parsed.ok ? parsed.state : emptyFormListUrlState();
}

/** Whether a search term can be sent: 2 to 100 characters after trimming (the server refuses anything else). */
export function isSearchTermUsable(term: string): boolean {
    const trimmed = term.trim();
    return trimmed.length >= FORM_LIST_SEARCH_MIN_LENGTH && trimmed.length <= FORM_LIST_SEARCH_MAX_LENGTH;
}

/** True for the cell value of a file / image column (`{ files: [...] }`). */
export function isFileCell(value: TFormListCellValue | undefined): value is IFormListFilesCell {
    return !!value && typeof value === 'object' && !Array.isArray(value) && Array.isArray((value as { files?: unknown }).files);
}

const TRUE_WORDS = new Set(['1', 'true', 'yes', 'on']);

const DATE_ONLY = /^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?/;

/**
 * A cell as plain text, for table cells, cards and the list's accessible
 * names. Deterministic on server and client (no `Intl`, no time zone): a date
 * the server sent as `2026-11-13 09:12:00` is drawn from that text alone, so
 * hydration never disagrees with the server render.
 */
export function formatListCell(value: TFormListCellValue | undefined, format: IFormListColumn['format']): string {
    if (value === null || value === undefined || isFileCell(value)) {
        return '';
    }
    const text = String(value);
    if (text === '') {
        return '';
    }
    switch (format) {
        case 'boolean':
            return TRUE_WORDS.has(text.trim().toLowerCase()) ? 'Yes' : 'No';
        case 'date': {
            const match = DATE_ONLY.exec(text);
            return match ? match[1] : text;
        }
        case 'datetime': {
            const match = DATE_ONLY.exec(text);
            return match ? (match[2] ? `${match[1]} ${match[2]}` : match[1]) : text;
        }
        default:
            return text;
    }
}

/** `entry_date` of a row as the date and time it is drawn with. */
export function formatEntryDate(entryDate: string): string {
    return formatListCell(entryDate, 'datetime');
}

/**
 * The field a column is read by in `values`. The server sends `values` keyed by
 * the column's `field`, so a renderer never guesses a key from a label.
 */
export function cellOf(values: Record<string, TFormListCellValue>, column: IFormListColumn): TFormListCellValue | undefined {
    return values[column.field];
}

/**
 * A short name for a record, for buttons and dialogs ("Edit Write report"): the
 * first column that has text, cut to 60 characters, else `Entry <id>`.
 */
export function rowLabel(
    row: { record_id: number; values: Record<string, TFormListCellValue> },
    columns: readonly IFormListColumn[],
): string {
    for (const column of columns) {
        const text = formatListCell(cellOf(row.values, column), column.format).trim();
        if (text !== '') {
            return text.length > 60 ? `${text.slice(0, 57)}...` : text;
        }
    }
    return `Entry ${row.record_id}`;
}

// -- server rendering ---------------------------------------------------------------

/** What the server rendered for one list: for exactly one URL state (`query`). */
export interface IFormListSsrSeed {
    sectionId: number;
    /** `normalizedOwnQuery` of the page URL the server rendered the list for. */
    query: string;
    state: IFormListState | null;
    error: IFormListError | null;
}

/** All the lists the server rendered for one page request, and when. */
export interface IFormListSsrValue {
    /** Milliseconds since the epoch at which the page was rendered. */
    renderedAt: number;
    seeds: IFormListSsrSeed[];
}

const LIST_STYLES: ReadonlySet<string> = new Set(['entry-form-list', 'data-view']);

interface ISectionLike {
    id?: unknown;
    style_name?: unknown;
    children?: unknown;
    list_state?: unknown;
    list_error?: unknown;
    list_key?: { content?: unknown } | null;
}

function isRecordObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The server-rendered state (or error) of every list in a page's sections,
 * paired with the URL state it was rendered for. `search` is the page URL's
 * query string as the visitor sent it.
 */
export function collectFormListSeeds(sections: unknown, search: string): IFormListSsrSeed[] {
    const seeds: IFormListSsrSeed[] = [];
    const visit = (nodes: unknown): void => {
        if (!Array.isArray(nodes)) {
            return;
        }
        for (const node of nodes) {
            if (!isRecordObject(node)) {
                continue;
            }
            const section = node as ISectionLike;
            if (typeof section.id === 'number' && typeof section.style_name === 'string' && LIST_STYLES.has(section.style_name)) {
                const state = isRecordObject(section.list_state) ? (section.list_state as unknown as IFormListState) : null;
                const error = isRecordObject(section.list_error) ? (section.list_error as unknown as IFormListError) : null;
                const configuredKey = section.list_key?.content;
                const key = state?.list.key ?? (typeof configuredKey === 'string' ? configuredKey : '');
                if (key !== '' && (state !== null || error !== null)) {
                    seeds.push({ sectionId: section.id, query: normalizedOwnQuery(search, key), state, error });
                }
            }
            visit(section.children);
        }
    };
    visit(sections);
    return seeds;
}

/**
 * The seeds and the render time of a page request: what `FormListSsrProvider`
 * hands to the lists so hydration shows the server's rows without fetching.
 */
export function buildFormListSsrValue(sections: unknown, search: string): IFormListSsrValue {
    return { renderedAt: Date.now(), seeds: collectFormListSeeds(sections, search) };
}

/**
 * A copy of a page payload without the lists' `list_state` / `list_error`. The
 * server-rendered states travel once, in {@link IFormListSsrValue}, so the
 * dehydrated page payload does not carry every list a second time.
 */
export function stripFormListState<T>(page: T): T {
    const strip = (node: unknown): unknown => {
        if (Array.isArray(node)) {
            return node.map(strip);
        }
        if (!isRecordObject(node)) {
            return node;
        }
        const copy: Record<string, unknown> = {};
        for (const [name, value] of Object.entries(node)) {
            if (name === 'list_state' || name === 'list_error') {
                continue;
            }
            copy[name] = name === 'sections' || name === 'children' ? strip(value) : value;
        }
        return copy;
    };

    return strip(page) as T;
}

/**
 * The query string of a Next.js `searchParams` object, repeated parameters as
 * repeated pairs: the server must see a duplicated list parameter as the
 * duplicate it is.
 */
export function searchParamsToQueryString(params: Record<string, string | string[] | undefined> | null | undefined): string {
    const search = new URLSearchParams();
    for (const [name, value] of Object.entries(params ?? {})) {
        if (Array.isArray(value)) {
            value.forEach((item) => search.append(name, item));
        } else if (value !== undefined) {
            search.append(name, value);
        }
    }
    return search.toString();
}
