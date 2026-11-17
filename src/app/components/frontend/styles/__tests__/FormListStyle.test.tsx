/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { useEffect, useState } from 'react';
import { MantineThemeProvider } from '@mantine/core';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFormListRow, IFormListSelected, IFormListState } from '../../../../../shared';
import { theme } from '../../../../../../theme';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IDataViewStyle, IEntryFormListStyle } from '../../../../../types/common/styles.types';
import { normalizedOwnQuery } from '../../../../../utils/form-list.utils';
import { FormListSsrProvider } from '../form-list/FormListSsrContext';
import { useFormListForm } from '../form-list/FormListFormContext';
import FormListStyle from '../form-list/FormListStyle';
import rowConditions from './fixtures/form-list-row-conditions.json';

// -- what the list talks to ---------------------------------------------------------

const nav = vi.hoisted(() => ({ listeners: new Set<() => void>() }));
const auth = vi.hoisted(() => ({ user: { id: 5 } as { id: number } | null }));

vi.mock('next/navigation', async () => {
    const react = await import('react');
    return {
        usePathname: () => '/events',
        useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
        // Like Next.js: the search params follow the live URL, which the list changes with the history API.
        useSearchParams: () => {
            const search = react.useSyncExternalStore(
                (notify) => {
                    nav.listeners.add(notify);
                    window.addEventListener('popstate', notify);
                    return () => {
                        nav.listeners.delete(notify);
                        window.removeEventListener('popstate', notify);
                    };
                },
                () => window.location.search,
                () => '',
            );
            return react.useMemo(() => new URLSearchParams(search), [search]);
        },
    };
});

vi.mock('next/link', async () => {
    const react = await import('react');
    return {
        default: react.forwardRef<HTMLAnchorElement, { href: string; children?: React.ReactNode }>(function Link({ href, children, ...rest }, ref) {
            return <a ref={ref} href={href} {...rest}>{children}</a>;
        }),
    };
});

vi.mock('../../../../../hooks/useUserData', () => ({ useAuthUser: () => ({ user: auth.user }) }));
/** The page the list is on: its id and the route parameters it was resolved with (`/events/{record_id}`). */
const page = vi.hoisted(() => ({ route: undefined as Record<string, string> | undefined }));

vi.mock('../../../../../hooks/usePageContentValue', () => ({ usePageContentValue: () => ({ id: 11, route_params: page.route }) }));
vi.mock('../../../contexts/LanguageContext', () => ({ useLanguageContext: () => ({ currentLanguageId: 1 }) }));

const api = vi.hoisted(() => ({
    getState: vi.fn(),
    deleteForm: vi.fn(),
    runQuickAction: vi.fn(),
}));

vi.mock('../../../../../api/frontend/form-list.api', () => ({
    FormListApi: {
        getState: api.getState,
        runQuickAction: api.runQuickAction,
        getHistory: vi.fn(),
        getVersion: vi.fn(),
        compare: vi.fn(),
        restore: vi.fn(),
        fileHref: (sectionId: number, recordId: number, field: string, index: number) => `/files/${sectionId}/${recordId}/${field}/${index}`,
        versionFileHref: () => '/files/version',
    },
}));
vi.mock('../../../../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { deleteForm: api.deleteForm, submitForm: vi.fn(), updateForm: vi.fn() },
}));

/** What the inline form does when it is saved; each test sets it. */
const save = vi.hoisted(() => ({ outcome: 'saved' as 'saved' | 'stale', sentWithVersion: [] as Array<number | null> }));

// Every section style is tested on its own. Here a stand-in: the inline form talks to the list through the
// same context the real one uses (saved, stale, cancel, unsaved input); any other section shows its text, so
// the sections a data view draws per record can be told apart.
interface IFakeSection {
    id: number;
    style_name: string;
    content?: { content?: string };
    text?: { content?: string };
    children?: IFakeSection[];
}

vi.mock('../BasicStyle', () => ({
    default: function FakeBasicStyle({ style }: { style: IFakeSection }) {
        // Like the real renderer, a section draws its own text and then its children.
        return style.style_name === 'form-record'
            ? <FakeInlineForm />
            : (
                <div data-testid={`section-${style.id}`}>
                    {style.content?.content ?? style.text?.content}
                    {(style.children ?? []).map((child) => <FakeBasicStyle key={child.id} style={child} />)}
                </div>
            );
    },
}));

function FakeInlineForm() {
    const list = useFormListForm();
    const initial = 'Write report';
    const [title, setTitle] = useState(list?.recordId ? initial : '');
    useEffect(() => {
        list?.registerDirtyCheck(() => title !== (list.recordId ? initial : ''));
        return () => list?.registerDirtyCheck(null);
    }, [list, title]);
    return (
        <form
            aria-label="Entry form"
            onSubmit={(event) => {
                event.preventDefault();
                save.sentWithVersion.push(list?.expectedVersion ?? null);
                if (save.outcome === 'stale') {
                    list?.onStale({ reason: 'stale_version', record_id: list.recordId ?? 0, expected_version: list.expectedVersion ?? 0, current_version: (list.expectedVersion ?? 0) + 1 });
                } else {
                    list?.onSaved({ recordId: list.recordId ?? 9, version: (list.expectedVersion ?? 0) + 1, created: list.recordId === null });
                }
            }}
        >
            <label>
                Title
                <input value={title} onChange={(event) => setTitle(event.currentTarget.value)} />
            </label>
            <button type="submit">Save entry</button>
            <button type="button" onClick={() => list?.onCancel()}>Cancel entry</button>
        </form>
    );
}

// -- fixtures -----------------------------------------------------------------------

function row(id: number, title: string, status: string, overrides: Partial<IFormListRow> = {}): IFormListRow {
    return {
        record_id: id,
        entry_date: `2026-01-0${id} 10:00:00`,
        version: 1,
        values: { title, status },
        is_own: true,
        can_update: true,
        can_delete: true,
        can_view_history: false,
        quick_actions: [],
        detail_url: null,
        ...overrides,
    };
}

function selected(id: number, title: string, overrides: Partial<IFormListSelected> = {}): IFormListSelected {
    return {
        record_id: id,
        mode: 'view',
        entry_date: `2026-01-0${id} 10:00:00`,
        version: 1,
        values: { title, status: 'open' },
        is_own: true,
        can_update: true,
        can_delete: true,
        can_view_history: false,
        quick_actions: [],
        detail_url: null,
        form_values: { title },
        ...overrides,
    };
}

function listState(overrides: Partial<IFormListState> = {}): IFormListState {
    return {
        list: { section_id: 21, page_id: 11, key: 'news', style: 'entry-form-list', layout: 'table', form_presentation: 'modal', form_section_id: 22, table_exists: true, labels: {}, row_css: '', has_template: false },
        columns: [
            { field: 'title', label: 'Title', format: 'text', sortable: true, searchable: true },
            { field: 'status', label: 'Status', format: 'text', sortable: true, searchable: false },
        ],
        controls: [],
        state: { page: 1, page_size: 25, q: null, sort: [{ field: 'entry_date', direction: 'desc' }], filters: {}, record: null, mode: null, query: {} },
        capabilities: { create: true, search: true, history: false, quick_actions: [] },
        rows: [row(1, 'Write report', 'open'), row(2, 'Review PR', 'done')],
        pagination: { page: 1, page_size: 25, total: 2, total_pages: 1 },
        selected: null,
        ...overrides,
    };
}

function entryListStyle(overrides: Record<string, unknown> = {}): IEntryFormListStyle {
    return {
        id: 21,
        style_name: 'entry-form-list',
        css: '',
        css_mobile: '',
        list_key: { content: 'news' },
        title: { content: 'News' },
        show_history: { content: '0' },
        form_presentation: { content: 'modal' },
        children: [{ id: 22, style_name: 'form-record', children: [] }],
        ...overrides,
    } as unknown as IEntryFormListStyle;
}

function dataViewStyle(): IDataViewStyle {
    return {
        id: 21,
        style_name: 'data-view',
        css: '',
        css_mobile: '',
        list_key: { content: 'news' },
        title: { content: 'Events' },
        children: [],
    } as unknown as IDataViewStyle;
}

/** A section the server rendered for one record of a custom layout. */
function section(id: number, text: string): NonNullable<IFormListRow['sections']>[number] {
    return { id, style_name: 'text', css: '', css_mobile: '', content: { content: text }, children: [] } as unknown as NonNullable<IFormListRow['sections']>[number];
}

function staleError(recordId: number, expected: number, current: number) {
    return { response: { status: 409, data: { message: 'conflict', data: { reason: 'stale_version', record_id: recordId, expected_version: expected, current_version: current } } } };
}

/** The server's answer to `GET /lists/21/state` for a list query: the list, or the list with a record open. */
function stateFor(listQuery: string): IFormListState {
    const params = new URLSearchParams(listQuery);
    const record = params.get('news.record');
    const mode = params.get('news.mode');
    if (record !== null && mode !== null) {
        const id = Number(record);
        const openMode = mode as 'view' | 'edit' | 'history';
        return listState({
            state: { page: 1, page_size: 25, q: null, sort: [], filters: {}, record: id, mode: openMode, query: {} },
            selected: selected(id, id === 1 ? 'Write report' : 'Review PR', {
                mode: openMode,
                can_view_history: openMode === 'history' || undefined,
            }),
            capabilities: {
                create: true,
                search: true,
                history: openMode === 'history',
                quick_actions: [],
            },
        });
    }
    if (mode === 'create') {
        return listState({ state: { page: 1, page_size: 25, q: null, sort: [], filters: {}, record: null, mode: 'create', query: {} } });
    }
    return listState();
}

interface IRenderOptions {
    style?: IEntryFormListStyle | IDataViewStyle;
    seed?: IFormListState | null;
    seedError?: { status: number; message: string; reason?: string };
    url?: string;
    /** The person looks at the draft of the page (an editor in preview mode). */
    previewMode?: boolean;
}

function renderList(options: IRenderOptions = {}) {
    const { style = entryListStyle(), seed = listState(), seedError, url = '/events', previewMode = false } = options;
    window.history.replaceState(null, '', url);
    const listKey = (style.list_key?.content ?? 'news').trim() || 'news';
    const search = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    const value = {
        renderedAt: Date.now(),
        // Match the URL the page was opened with, the way the slug page builds SSR seeds.
        seeds: [{ sectionId: 21, query: normalizedOwnQuery(search, listKey), state: seedError ? null : seed, error: seedError ?? null }],
    };
    // The app theme changes how every modal behaves (Escape is off unless a modal opts in), so the list is drawn with it.
    return renderWithProviders(
        <MantineThemeProvider theme={theme}>
            <FormListSsrProvider value={value}>
                <FormListStyle style={style} />
            </FormListSsrProvider>
        </MantineThemeProvider>,
        { previewMode },
    );
}

/** Lets time pass inside act(), so what the page does meanwhile is part of the test and not a stray update. */
async function pause(ms: number): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => window.setTimeout(resolve, ms));
    });
}

beforeEach(() => {
    auth.user = { id: 5 };
    page.route = undefined;
    save.outcome = 'saved';
    save.sentWithVersion = [];
    api.getState.mockImplementation((_sectionId: number, options: { listQuery: string }) => Promise.resolve(stateFor(options.listQuery)));
    api.deleteForm.mockResolvedValue({ data: { record_id: 1 } });

    const push = window.history.pushState.bind(window.history);
    const replace = window.history.replaceState.bind(window.history);
    vi.spyOn(window.history, 'pushState').mockImplementation((data, unused, target) => {
        push(data, unused, target);
        nav.listeners.forEach((notify) => notify());
    });
    vi.spyOn(window.history, 'replaceState').mockImplementation((data, unused, target) => {
        replace(data, unused, target);
        nav.listeners.forEach((notify) => notify());
    });
});

afterEach(async () => {
    vi.useRealTimers();
    // Answers still on their way (a list read started by the last click) arrive inside act(), not after the test.
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
    // Unmount before the URL is reset: the list reads the URL, and nothing should redraw for the reset.
    cleanup();
    window.history.replaceState(null, '', '/');
});

// -- the list ------------------------------------------------------------------------

describe('first paint', () => {
    it('draws the rows the server rendered and asks the server for nothing', async () => {
        renderList();

        expect(screen.getByRole('heading', { name: 'News' })).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByText('Write report')).toBeInTheDocument();
        expect(screen.getByText('Review PR')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument();
        // Hydration reuses the server's answer: no duplicate initial fetch.
        await act(async () => {
            await Promise.resolve();
        });
        expect(api.getState).not.toHaveBeenCalled();
    });

    it('reads the state once when the server rendered none', async () => {
        const view = renderWithProviders(<FormListStyle style={entryListStyle()} />);

        expect(screen.getByTestId('form-list-loading')).toBeInTheDocument();
        expect(await screen.findByText('Write report')).toBeInTheDocument();
        expect(api.getState).toHaveBeenCalledTimes(1);
        view.unmount();
    });

    it('tells the visitor why there is no list, with the way out, instead of an empty page', () => {
        renderList({ seedError: { status: 403, message: 'no', reason: 'operation_disabled' } });

        expect(screen.getByText('You may not use this list.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Show the whole list' })).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('says so when the list has no entries, and offers the add button when the visitor may add', () => {
        renderList({ seed: listState({ rows: [], pagination: { page: 1, page_size: 25, total: 0, total_pages: 1 } }) });

        expect(screen.getByText('No entries yet.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument();
    });

    it('shows no add button to a visitor who may not create', () => {
        renderList({ seed: listState({ capabilities: { create: false, search: true, history: false, quick_actions: [] } }) });

        expect(screen.queryByRole('button', { name: 'Add entry' })).not.toBeInTheDocument();
    });
});

describe('the page URL is the state of the list', () => {
    it('writes the search to its own parameter once after a pause and keeps every other parameter', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        renderList({ url: '/events?utm=spring&other.q=keep' });

        fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'sleep' } });
        expect(window.location.search).not.toContain('news.q');
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        const search = new URLSearchParams(window.location.search);
        expect(search.get('news.q')).toBe('sleep');
        expect(search.get('utm')).toBe('spring');
        expect(search.get('other.q')).toBe('keep');
    });

    it('does not send a search that is too short', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        renderList();

        fireEvent.change(screen.getByRole('searchbox', { name: 'Search' }), { target: { value: 'a' } });
        await act(async () => {
            vi.advanceTimersByTime(400);
        });

        expect(window.location.search).toBe('');
        expect(screen.getByText('Type at least 2 characters to search.')).toBeInTheDocument();
    });

    it('sorts by a column header: the first click on a column sorts ascending', async () => {
        renderList();

        await userEvent.click(screen.getByRole('button', { name: /Title/ }));

        expect(new URLSearchParams(window.location.search).get('news.sort')).toBe('title:asc');
    });

    it('goes to another page through the URL', async () => {
        renderList({ seed: listState({ pagination: { page: 1, page_size: 25, total: 60, total_pages: 3 } }) });

        await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));

        expect(new URLSearchParams(window.location.search).get('news.page')).toBe('2');
        await waitFor(() => expect(api.getState).toHaveBeenCalledTimes(1));
        expect(api.getState.mock.calls[0]?.[1]).toMatchObject({ listQuery: 'news.page=2', pageId: 11 });
    });

    it('opens the state a link describes, the way a refresh or a shared link does', async () => {
        renderList({ url: '/events?news.record=1&news.mode=view', seed: stateFor('news.record=1&news.mode=view') });

        const panel = await screen.findByTestId('form-list-record-view-panel');

        expect(within(panel).getByText('Write report')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows a filter from the URL in its control and offers a way to clear it', async () => {
        // Regression: without rules the hook used to pass controls:[] to the parser,
        // which refused every *.f.* parameter and left the select empty with no reset.
        renderList({
            url: '/events?news.f.status=open',
            seed: listState({
                controls: [{
                    id: 'status',
                    type: 'select',
                    field: 'status',
                    label: 'Status',
                    options: [
                        { value: 'open', label: 'open', count: null },
                        { value: 'done', label: 'done', count: null },
                    ],
                }],
                state: {
                    page: 1,
                    page_size: 25,
                    q: null,
                    sort: [],
                    filters: { status: 'open' },
                    record: null,
                    mode: null,
                    query: { 'news.f.status': 'open' },
                },
                rows: [row(1, 'Write report', 'open')],
                pagination: { page: 1, page_size: 25, total: 1, total_pages: 1 },
            }),
        });

        expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('open');
        expect(screen.getByRole('button', { name: 'Reset search and filters' })).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Reset search and filters' }));
        expect(new URLSearchParams(window.location.search).get('news.f.status')).toBeNull();
    });

    it('opens the history tab from a deep link without a list_error', async () => {
        renderList({
            url: '/events?news.record=1&news.mode=history',
            seed: stateFor('news.record=1&news.mode=history'),
            style: entryListStyle({ show_history: { content: '1' } }),
        });

        const panel = await screen.findByTestId('form-list-record-view-panel');
        expect(within(panel).getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
        expect(screen.queryByText(/does not describe a valid list state/i)).not.toBeInTheDocument();
    });

    it('opens a record from its row and closes it with Back', async () => {
        renderList();

        await userEvent.click(screen.getByRole('button', { name: 'View Review PR' }));

        const search = new URLSearchParams(window.location.search);
        expect(search.get('news.record')).toBe('2');
        expect(search.get('news.mode')).toBe('view');
        expect(await screen.findByTestId('form-list-record-view-panel')).toBeInTheDocument();

        await act(async () => {
            window.history.back();
        });
    });

    it('closes an opened record with the Escape key, like the close button does', async () => {
        renderList();

        const opener = screen.getByRole('button', { name: 'View Review PR' });
        await userEvent.click(opener);
        await screen.findByTestId('form-list-record-view-panel');

        await userEvent.keyboard('{Escape}');

        await waitFor(() => expect(new URLSearchParams(window.location.search).get('news.mode')).toBeNull());
        await waitFor(() => expect(screen.queryByTestId('form-list-record-view-panel')).not.toBeInTheDocument());
    });
});

describe('creating, editing and cancelling', () => {
    it('adds an entry in a dialog and closes it after the save, then reads the list again', async () => {
        renderList();

        await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
        expect(new URLSearchParams(window.location.search).get('news.mode')).toBe('create');
        const form = await screen.findByRole('form', { name: 'Entry form' });

        await userEvent.type(within(form).getByLabelText('Title'), 'New thing');
        await userEvent.click(within(form).getByRole('button', { name: 'Save entry' }));

        await waitFor(() => expect(window.location.search).toBe(''));
        await waitFor(() => expect(api.getState).toHaveBeenCalled());
    });

    it('asks before throwing away what was typed, and keeps the form when the person says keep editing', async () => {
        renderList();
        await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
        const form = await screen.findByRole('form', { name: 'Entry form' });
        await userEvent.type(within(form).getByLabelText('Title'), 'Half written');

        await userEvent.click(within(form).getByRole('button', { name: 'Cancel entry' }));

        const discard = await screen.findByText('Discard your changes?');
        expect(discard).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
        expect(screen.getByRole('form', { name: 'Entry form' })).toBeInTheDocument();
        expect(within(screen.getByRole('form', { name: 'Entry form' })).getByLabelText('Title')).toHaveValue('Half written');
        expect(new URLSearchParams(window.location.search).get('news.mode')).toBe('create');

        await userEvent.click(within(screen.getByRole('form', { name: 'Entry form' })).getByRole('button', { name: 'Cancel entry' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));
        await waitFor(() => expect(window.location.search).toBe(''));
    });

    it('asks before closing with Escape when something was typed, and the question stays until it is answered', async () => {
        renderList();
        await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
        const form = await screen.findByRole('form', { name: 'Entry form' });
        await userEvent.type(within(form).getByLabelText('Title'), 'Half written');

        await userEvent.keyboard('{Escape}');

        const question = await screen.findByRole('dialog', { name: 'Discard your changes?' });
        // The key press that opened the question is still being delivered to the other dialogs of the
        // page; it must not also close the question the moment it appeared. (jsdom delivers one key press
        // inside one act() and cannot show that race; e2e/golden/form-list.spec.ts does, in a real browser.)
        await pause(60);
        expect(question).toBeInTheDocument();
        expect(new URLSearchParams(window.location.search).get('news.mode')).toBe('create');

        // Escape on the question is the same as "Keep editing": the form and the text stay.
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Discard your changes?' })).not.toBeInTheDocument());
        await pause(60);
        expect(screen.queryByRole('dialog', { name: 'Discard your changes?' })).not.toBeInTheDocument();
        expect(within(screen.getByRole('form', { name: 'Entry form' })).getByLabelText('Title')).toHaveValue('Half written');
        expect(new URLSearchParams(window.location.search).get('news.mode')).toBe('create');

        // Escape again asks again; this time the person discards.
        await userEvent.keyboard('{Escape}');
        await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));
        await waitFor(() => expect(window.location.search).toBe(''));
    });

    it('leaves an untouched form without asking', async () => {
        renderList();
        await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
        const form = await screen.findByRole('form', { name: 'Entry form' });

        await userEvent.click(within(form).getByRole('button', { name: 'Cancel entry' }));

        await waitFor(() => expect(window.location.search).toBe(''));
        expect(screen.queryByText('Discard your changes?')).not.toBeInTheDocument();
    });

    it('keeps what the person typed when somebody else saved first, and saves over only on purpose', async () => {
        save.outcome = 'stale';
        renderList({ url: '/events?news.record=1&news.mode=edit', seed: stateFor('news.record=1&news.mode=edit') });
        const form = await screen.findByRole('form', { name: 'Entry form' });
        const title = within(form).getByLabelText('Title');
        await userEvent.clear(title);
        await userEvent.type(title, 'My edit');

        await userEvent.click(within(form).getByRole('button', { name: 'Save entry' }));

        const conflict = await screen.findByTestId('form-list-conflict');
        expect(conflict).toHaveTextContent('Someone else changed this entry');
        expect(within(screen.getByRole('form', { name: 'Entry form' })).getByLabelText('Title')).toHaveValue('My edit');
        // The save was based on the version the person saw.
        expect(save.sentWithVersion).toEqual([1]);

        await userEvent.click(within(conflict).getByRole('button', { name: 'Keep my changes and save over theirs' }));
        save.outcome = 'saved';
        await userEvent.click(within(screen.getByRole('form', { name: 'Entry form' })).getByRole('button', { name: 'Save entry' }));

        // The second save is explicitly based on the newer version the server reported.
        expect(save.sentWithVersion).toEqual([1, 2]);
        await waitFor(() => expect(window.location.search).toBe(''));
    });
});

describe('the form on the page itself (form presentation "page")', () => {
    const asPage = (state: IFormListState): IFormListState => ({ ...state, list: { ...state.list, form_presentation: 'page' } });

    function renderPageList(url = '/events') {
        const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
        return renderList({ style: entryListStyle({ form_presentation: { content: 'page' } }), seed: asPage(stateFor(query)), url });
    }

    beforeEach(() => {
        api.getState.mockImplementation((_sectionId: number, options: { listQuery: string }) => Promise.resolve(asPage(stateFor(options.listQuery))));
    });

    it('shows the form on the page in place of the list, without a dialog, and returns to the list after the save', async () => {
        renderPageList();

        await userEvent.click(screen.getByRole('button', { name: 'Add entry' }));
        const record = await screen.findByTestId('form-list-record-page');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await userEvent.type(within(record).getByLabelText('Title'), 'New thing');
        await userEvent.click(within(record).getByRole('button', { name: 'Save entry' }));

        await waitFor(() => expect(screen.queryByTestId('form-list-record-page')).not.toBeInTheDocument());
        expect(window.location.search).toBe('');
        expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument();
    });

    it('views a record on the page and goes back to the list with the way back it offers', async () => {
        renderPageList();

        await userEvent.click(screen.getByRole('button', { name: 'View Review PR' }));
        const record = await screen.findByTestId('form-list-record-page');
        expect(within(record).getByTestId('form-list-record-view-panel')).toBeInTheDocument();
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await userEvent.click(within(record).getByRole('button', { name: 'Back to the list' }));

        await waitFor(() => expect(screen.queryByTestId('form-list-record-page')).not.toBeInTheDocument());
        expect(window.location.search).toBe('');
    });

    it('edits a record on the page and asks before going back from what was typed', async () => {
        renderPageList('/events?news.record=1&news.mode=edit');
        const record = await screen.findByTestId('form-list-record-page');
        await userEvent.type(within(record).getByLabelText('Title'), ' and more');

        await userEvent.click(within(record).getByRole('button', { name: 'Back to the list' }));
        expect(await screen.findByText('Discard your changes?')).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
        expect(within(screen.getByTestId('form-list-record-page')).getByLabelText('Title')).toHaveValue('Write report and more');

        await userEvent.click(within(screen.getByTestId('form-list-record-page')).getByRole('button', { name: 'Back to the list' }));
        await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));

        await waitFor(() => expect(window.location.search).toBe(''));
        expect(screen.queryByTestId('form-list-record-page')).not.toBeInTheDocument();
    });

    it('goes back from an untouched edit without asking, and saves an edit and returns to the list', async () => {
        renderPageList('/events?news.record=1&news.mode=edit');
        const record = await screen.findByTestId('form-list-record-page');

        await userEvent.click(within(record).getByRole('button', { name: 'Back to the list' }));
        await waitFor(() => expect(window.location.search).toBe(''));
        expect(screen.queryByText('Discard your changes?')).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Edit Write report' }));
        const again = await screen.findByTestId('form-list-record-page');
        await userEvent.type(within(again).getByLabelText('Title'), '!');
        await userEvent.click(within(again).getByRole('button', { name: 'Save entry' }));

        expect(save.sentWithVersion).toEqual([1]);
        await waitFor(() => expect(window.location.search).toBe(''));
        await waitFor(() => expect(screen.queryByTestId('form-list-record-page')).not.toBeInTheDocument());
    });

    it('deletes the viewed record after asking, with the version the person saw, and returns to the list', async () => {
        renderPageList('/events?news.record=1&news.mode=view');
        const record = await screen.findByTestId('form-list-record-page');

        await userEvent.click(within(record).getByRole('button', { name: 'Delete' }));
        const dialog = await screen.findByRole('dialog');
        expect(api.deleteForm).not.toHaveBeenCalled();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(api.deleteForm).toHaveBeenCalledWith({ record_id: 1, page_id: 11, section_id: 21, expected_version: 1 }));
        await waitFor(() => expect(screen.queryByTestId('form-list-record-page')).not.toBeInTheDocument());
    });
});

describe('deleting', () => {
    it('asks first, sends the version the person saw and reads the list again', async () => {
        renderList();

        await userEvent.click(screen.getByRole('button', { name: 'Delete Write report' }));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/Delete this entry/)).toBeInTheDocument();
        expect(api.deleteForm).not.toHaveBeenCalled();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(api.deleteForm).toHaveBeenCalledTimes(1));
        expect(api.deleteForm).toHaveBeenCalledWith({ record_id: 1, page_id: 11, section_id: 21, expected_version: 1 });
        await waitFor(() => expect(api.getState).toHaveBeenCalled());
    });

    it('sends one delete when the button is pressed again while the request is on its way', async () => {
        let answer: (value: unknown) => void = () => undefined;
        api.deleteForm.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        renderList();

        await userEvent.click(screen.getByRole('button', { name: 'Delete Write report' }));
        const dialog = await screen.findByRole('dialog');
        const confirm = within(dialog).getByRole('button', { name: 'Delete' });
        await userEvent.dblClick(confirm);
        await userEvent.click(confirm);

        expect(api.deleteForm).toHaveBeenCalledTimes(1);
        await act(async () => {
            answer({ data: { record_id: 1 } });
        });
    });

    it('does not delete a record somebody else changed and explains why', async () => {
        api.deleteForm.mockRejectedValue(staleError(1, 1, 2));
        renderList();

        await userEvent.click(screen.getByRole('button', { name: 'Delete Write report' }));
        const dialog = await screen.findByRole('dialog');
        await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

        expect(await within(dialog).findByText(/was changed by someone else/)).toBeInTheDocument();
        expect(within(dialog).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('does not offer delete on a row the visitor may not delete', () => {
        renderList({ seed: listState({ rows: [row(1, 'Write report', 'open', { can_delete: false, can_update: false })] }) });

        expect(screen.queryByRole('button', { name: 'Delete Write report' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit Write report' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View Write report' })).toBeInTheDocument();
    });
});

describe('quick actions', () => {
    const withAction = () =>
        listState({
            capabilities: { create: true, search: true, history: false, quick_actions: [{ id: 'done', label: 'Mark done', confirm: 'Mark this entry done?' }] },
            rows: [row(1, 'Write report', 'open', { quick_actions: ['done'] }), row(2, 'Review PR', 'done')],
        });

    it('offers an action only on the rows that list it, confirms, and sends the version seen', async () => {
        api.runQuickAction.mockResolvedValue({ record_id: 1, version: 2, action: 'done' });
        renderList({ seed: withAction() });

        expect(screen.getByRole('button', { name: 'Mark done Write report' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Mark done Review PR' })).not.toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Mark done Write report' }));
        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText(/Mark this entry done/)).toBeInTheDocument();
        await userEvent.click(within(dialog).getByRole('button', { name: 'Mark done' }));

        await waitFor(() => expect(api.runQuickAction).toHaveBeenCalledWith(21, 1, 'done', { page_id: 11, expected_version: 1 }));
    });

    it('runs an action once when the confirm button is pressed again while the request is on its way', async () => {
        let answer: (value: unknown) => void = () => undefined;
        api.runQuickAction.mockReturnValue(new Promise((resolve) => { answer = resolve; }));
        renderList({ seed: withAction() });

        await userEvent.click(screen.getByRole('button', { name: 'Mark done Write report' }));
        const dialog = await screen.findByRole('dialog');
        const confirm = within(dialog).getByRole('button', { name: 'Mark done' });
        await userEvent.dblClick(confirm);
        await userEvent.click(confirm);

        expect(api.runQuickAction).toHaveBeenCalledTimes(1);
        await act(async () => {
            answer({ record_id: 1, version: 2, action: 'done' });
        });
    });
});

describe('the route of the page', () => {
    it('reads the list for the route the page was resolved with', async () => {
        page.route = { record_id: '3' };
        const view = renderWithProviders(<FormListStyle style={entryListStyle()} />);

        expect(await screen.findByText('Write report')).toBeInTheDocument();
        expect(api.getState).toHaveBeenCalledTimes(1);
        expect(api.getState).toHaveBeenCalledWith(21, expect.objectContaining({ pageId: 11, route: { record_id: '3' } }));
        view.unmount();
    });

    it('sends no route for a page that has none', async () => {
        const view = renderWithProviders(<FormListStyle style={entryListStyle()} />);

        expect(await screen.findByText('Write report')).toBeInTheDocument();
        expect(api.getState).toHaveBeenCalledWith(21, expect.objectContaining({ route: null }));
        view.unmount();
    });

    it('never shows the rows of one route while the list of another route is read', async () => {
        page.route = { record_id: '3' };
        api.getState.mockImplementation((_sectionId: number, options: { route?: { record_id?: string } | null }) =>
            options.route?.record_id === '4'
                ? new Promise(() => undefined)
                : Promise.resolve(listState({ rows: [row(1, 'Row of route 3', 'open')] })));
        const view = renderWithProviders(<FormListStyle style={entryListStyle()} />);
        expect(await screen.findByText('Row of route 3')).toBeInTheDocument();

        page.route = { record_id: '4' };
        view.rerender(<FormListStyle style={entryListStyle()} />);

        await waitFor(() => expect(api.getState).toHaveBeenCalledWith(21, expect.objectContaining({ route: { record_id: '4' } })));
        expect(screen.queryByText('Row of route 3')).not.toBeInTheDocument();
        expect(screen.getByTestId('form-list-loading')).toBeInTheDocument();
        view.unmount();
    });

    it('draws the rows the server rendered for the route of the page without asking again', async () => {
        page.route = { record_id: '3' };
        const withSections = listState({
            list: { ...listState().list, style: 'data-view', layout: 'custom', has_template: true, form_section_id: null },
            rows: [row(1, 'Card', 'open', { sections: [section(31, 'Route 3 card')] })],
        });
        renderList({ style: dataViewStyle(), seed: withSections });

        expect(screen.getByTestId('section-31')).toHaveTextContent('Route 3 card');
        await act(async () => {
            await Promise.resolve();
        });
        expect(api.getState).not.toHaveBeenCalled();
    });
});

describe('the draft of the page', () => {
    const withAction = () =>
        listState({
            capabilities: { create: true, search: true, history: false, quick_actions: [{ id: 'done', label: 'Mark done', confirm: 'Mark this entry done?' }] },
            rows: [row(1, 'Write report', 'open', { quick_actions: ['done'] })],
        });

    it('reads the list state of the draft, and of the published page otherwise', async () => {
        renderList({ seed: null, previewMode: true });
        await waitFor(() => expect(api.getState).toHaveBeenCalledTimes(1));
        expect(api.getState.mock.calls[0]?.[1]).toMatchObject({ pageId: 11, preview: true });
        cleanup();

        api.getState.mockClear();
        renderList({ seed: null });
        await waitFor(() => expect(api.getState).toHaveBeenCalledTimes(1));
        expect(api.getState.mock.calls[0]?.[1]).toMatchObject({ preview: false });
    });

    it('deletes and runs a quick action on the draft, so the server judges them like the list it showed', async () => {
        api.runQuickAction.mockResolvedValue({ record_id: 1, version: 2, action: 'done' });
        renderList({ seed: withAction(), previewMode: true });

        await userEvent.click(screen.getByRole('button', { name: 'Mark done Write report' }));
        await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Mark done' }));
        await waitFor(() => expect(api.runQuickAction).toHaveBeenCalledWith(21, 1, 'done', { page_id: 11, expected_version: 1, preview: true }));

        await userEvent.click(screen.getByRole('button', { name: 'Delete Write report' }));
        await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));
        await waitFor(() => expect(api.deleteForm).toHaveBeenCalledWith({ record_id: 1, page_id: 11, section_id: 21, expected_version: 1, preview: true }));
    });

    it('names no draft for a person who looks at the published page', async () => {
        renderList({ seed: withAction() });

        await userEvent.click(screen.getByRole('button', { name: 'Delete Write report' }));
        await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(api.deleteForm).toHaveBeenCalledTimes(1));
        expect(api.deleteForm.mock.calls[0]?.[0]).not.toHaveProperty('preview');
    });
});

describe('a list that only shows', () => {
    it('has no write control at all and links to the detail page when the author set one', () => {
        const view = listState({
            list: { section_id: 21, page_id: 11, key: 'news', style: 'data-view', layout: 'table', form_presentation: 'page', form_section_id: null, table_exists: true, labels: {}, row_css: '', has_template: false },
            capabilities: { create: false, search: true, history: false, quick_actions: [] },
            rows: [row(1, 'Open day', 'public', { can_update: false, can_delete: false, detail_url: '/events/1' })],
        });
        renderList({ style: dataViewStyle(), seed: view });

        expect(screen.getByText('Open day')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Add entry' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^(Edit|Delete) /u })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'View Open day' })).toHaveAttribute('href', '/events/1');
    });
});

describe('a data view drawn from sections the author placed inside it', () => {
    /** The data view as the server renders it with the layout `custom`: every record carries its sections. */
    function customView(overrides: Partial<IFormListState['list']> = {}, rows?: IFormListRow[]): IFormListState {
        return listState({
            list: { section_id: 21, page_id: 11, key: 'news', style: 'data-view', layout: 'custom', form_presentation: 'page', form_section_id: null, table_exists: true, labels: {}, row_css: 'grid grid-cols-2 gap-4', has_template: true, ...overrides },
            capabilities: { create: false, search: true, history: false, quick_actions: [] },
            rows: rows ?? [
                row(1, 'Open day', 'public', { can_update: false, can_delete: false, sections: [section(101, 'Open day card'), section(102, 'Bern')] }),
                row(2, 'Lab tour', 'public', { can_update: false, can_delete: false, sections: [section(103, 'Lab tour card'), section(104, 'Zurich')] }),
            ],
        });
    }

    it('draws the sections the server rendered for every record, in a holder with the classes the author set', () => {
        renderList({ style: dataViewStyle(), seed: customView() });

        const holder = screen.getByTestId('form-list-custom');
        expect(holder).toHaveClass('grid', 'grid-cols-2', 'gap-4');
        expect(within(holder).getByTestId('section-101')).toHaveTextContent('Open day card');
        expect(within(holder).getByTestId('section-104')).toHaveTextContent('Zurich');
        const records = holder.querySelectorAll('[data-record-id]');
        expect(Array.from(records).map((record) => record.getAttribute('data-record-id'))).toEqual(['1', '2']);
        expect(within(records[0] as HTMLElement).getByTestId('section-102')).toHaveTextContent('Bern');
        // The layout is the author's: no table and no automatic cards around it.
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(screen.queryByTestId('form-list-cards')).not.toBeInTheDocument();
    });

    it('draws for every record exactly the sections the server chose for it and evaluates nothing', () => {
        // The shared fixture: the server decided, from the seats and the city of each record, which sections it draws
        // (the same file the backend asserts and the mobile app draws). Every section still carries its condition
        // as the author wrote it, with tokens a client cannot resolve; a client that tried would hide or lose some.
        const fixture = rowConditions as unknown as { drawn: string[][]; neverDrawn: string[]; state: IFormListState };
        renderList({ style: dataViewStyle(), seed: fixture.state });

        const holder = screen.getByTestId('form-list-custom');
        const records = Array.from(holder.querySelectorAll<HTMLElement>('[data-record-id]'));
        expect(records.map((record) => record.getAttribute('data-record-id'))).toEqual(['101', '103', '105']);
        const drawn = records.map((record) =>
            Array.from(record.querySelectorAll<HTMLElement>('[data-testid^="section-"]'))
                // The text sections of the card: the ones with a line of their own (the title is the card's first child).
                .filter((node) => node.children.length === 0 && node.textContent !== '' && !node.textContent?.startsWith('Event '))
                .map((node) => node.textContent ?? ''),
        );
        expect(drawn).toEqual(fixture.drawn);
        // The sections of one record never show up inside another record.
        const all = holder.textContent ?? '';
        for (const forbidden of fixture.neverDrawn) {
            expect(all).not.toContain(forbidden);
        }
        expect(within(records[0] as HTMLElement).queryByText('Roomy: 15 seats')).not.toBeInTheDocument();
        expect(within(records[1] as HTMLElement).getByText('Roomy: 15 seats')).toBeInTheDocument();
        expect(within(records[2] as HTMLElement).queryByText('Held in Basel')).not.toBeInTheDocument();
        // Nothing was asked of the server for this paint.
        expect(api.getState).not.toHaveBeenCalled();
    });

    it('stacks the records when the author set no classes', () => {
        renderList({ style: dataViewStyle(), seed: customView({ row_css: '' }) });

        const holder = screen.getByTestId('form-list-custom');
        expect(holder.className).not.toContain('grid');
        expect(holder.querySelectorAll('[data-record-id]')).toHaveLength(2);
    });

    it('falls back to cards when the author placed no sections in the view', () => {
        const rows = [row(1, 'Open day', 'public', { can_update: false, can_delete: false, sections: [] })];
        renderList({ style: dataViewStyle(), seed: customView({ has_template: false }, rows) });

        expect(screen.queryByTestId('form-list-custom')).not.toBeInTheDocument();
        expect(screen.getByTestId('form-list-cards')).toBeInTheDocument();
        expect(screen.getByText('Open day')).toBeInTheDocument();
    });

    it('keeps search, sorting and paging of the list around the records', async () => {
        const seed = customView();
        seed.pagination = { page: 1, page_size: 2, total: 5, total_pages: 3 };
        renderList({ style: dataViewStyle(), seed });

        expect(screen.getByRole('searchbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
        await waitFor(() => expect(api.getState).toHaveBeenCalled());
        expect(api.getState.mock.calls[0]?.[1]).toMatchObject({ listQuery: expect.stringContaining('news.page=2') });
    });
});

describe('who is signed in', () => {
    it('never shows one account the rows of another', async () => {
        const view = renderList();
        expect(screen.getByText('Write report')).toBeInTheDocument();

        auth.user = { id: 6 };
        api.getState.mockImplementation(() => Promise.resolve(listState({ rows: [row(7, 'Other person entry', 'open')] })));
        view.rerender(
            <FormListSsrProvider value={{ renderedAt: Date.now(), seeds: [] }}>
                <FormListStyle style={entryListStyle()} />
            </FormListSsrProvider>,
        );

        expect(screen.queryByText('Write report')).not.toBeInTheDocument();
        expect(await screen.findByText('Other person entry')).toBeInTheDocument();
        expect(screen.queryByText('Write report')).not.toBeInTheDocument();
    });
});
