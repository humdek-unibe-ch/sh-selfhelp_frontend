/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The client fetch of a page counts the view (`X-Page-View`, C7) once per visit of a path: the
 * first fetch after another page was shown. A refetch of the page on screen never does, and
 * neither does preview.
 */
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { resolveMock } = vi.hoisted(() => ({ resolveMock: vi.fn() }));

vi.mock('../../api/page.api', () => ({ PageApi: { resolvePageByPath: resolveMock } }));
vi.mock('../../app/components/contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

import { usePageContentByPath } from '../usePageContentByPath';
import { markPageViewed, claimPageView, resetPageViewForTests } from '../../utils/page-view.utils';

function wrapperFor(client: QueryClient) {
    return function Wrapper({ children }: { children: ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

beforeEach(() => {
    resolveMock.mockReset();
    resolveMock.mockResolvedValue({ id: 1, sections: [] });
    resetPageViewForTests();
});

describe('page view bookkeeping', () => {
    it('claims a path once until another page was shown (P4-A6)', () => {
        expect(claimPageView('/impressum')).toBe(true);
        expect(claimPageView('/impressum')).toBe(false);
        expect(claimPageView('/impressum/')).toBe(false);
        expect(claimPageView('/contact')).toBe(true);
        expect(claimPageView('/impressum')).toBe(true);
    });

    it('the server render that delivered the page counts as the view', () => {
        markPageViewed('/impressum');

        expect(claimPageView('/impressum')).toBe(false);
    });
});

describe('usePageContentByPath and the page view (P4-A6)', () => {
    it('the first fetch counts the view, a refetch of the same page does not', async () => {
        const client = newClient();
        const { result } = renderHook(() => usePageContentByPath('/impressum'), { wrapper: wrapperFor(client) });
        await waitFor(() => expect(result.current.content).not.toBeNull());

        expect(resolveMock).toHaveBeenCalledTimes(1);
        expect(resolveMock).toHaveBeenLastCalledWith('/impressum', 1, false, { countView: true });

        await client.refetchQueries({ queryKey: ['page-by-keyword'] });

        expect(resolveMock).toHaveBeenCalledTimes(2);
        expect(resolveMock).toHaveBeenLastCalledWith('/impressum', 1, false, { countView: false });
    });

    it('a page the server already counted is fetched without the view', async () => {
        markPageViewed('/impressum');
        const { result } = renderHook(() => usePageContentByPath('/impressum'), { wrapper: wrapperFor(newClient()) });
        await waitFor(() => expect(result.current.content).not.toBeNull());

        expect(resolveMock).toHaveBeenLastCalledWith('/impressum', 1, false, { countView: false });
    });

    it('preview never counts a view', async () => {
        const { result } = renderHook(() => usePageContentByPath('/impressum', { preview: true }), {
            wrapper: wrapperFor(newClient()),
        });
        await waitFor(() => expect(result.current.content).not.toBeNull());

        expect(resolveMock).toHaveBeenLastCalledWith('/impressum', 1, true, { countView: false });
    });
});
