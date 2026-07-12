/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePagePrefetch } from '../usePagePrefetch';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

const resolvePageByPath = vi.fn();

vi.mock('../../api/page.api', () => ({
    PageApi: {
        resolvePageByPath: (...args: unknown[]) => resolvePageByPath(...args),
        getPageByKeyword: vi.fn(),
    },
}));

vi.mock('../../app/components/contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 2 }),
}));

function wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('usePagePrefetch', () => {
    beforeEach(() => {
        resolvePageByPath.mockReset();
        resolvePageByPath.mockResolvedValue({ keyword: 'home' });
    });

    it('warms PAGE_BY_PATH via resolvePageByPath', async () => {
        const { result } = renderHook(() => usePagePrefetch(), { wrapper });

        await act(async () => {
            await result.current.prefetchPageByPath('/team');
        });

        expect(resolvePageByPath).toHaveBeenCalledWith('/team', 2, false);
        expect(REACT_QUERY_CONFIG.QUERY_KEYS.PAGE_BY_PATH('/team', 2, false)).toEqual([
            'page-by-keyword',
            '__path__',
            '/team',
            2,
            'published',
        ]);
    });

    it('skips parameterized path patterns that cannot resolve yet', async () => {
        const { result } = renderHook(() => usePagePrefetch(), { wrapper });

        await act(async () => {
            await result.current.prefetchPageByPath('/team/{record_id}');
        });

        expect(resolvePageByPath).not.toHaveBeenCalled();
    });
});
