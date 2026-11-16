/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ listeners: new Set<() => void>() }));

vi.mock('next/navigation', async () => {
    const react = await import('react');
    return {
        usePathname: () => '/contacts',
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

import { useFormListUrlState } from '../useFormListUrlState';

beforeEach(() => {
    window.history.replaceState(null, '', '/');
});

describe('useFormListUrlState', () => {
    it('keeps filters from the URL when no control rules are given', () => {
        window.history.replaceState(null, '', '/contacts?contacts.f.department=Study%20Coordination');

        const { result } = renderHook(() => useFormListUrlState('contacts'));

        expect(result.current.urlError).toBeNull();
        expect(result.current.urlState.filters).toEqual({ department: 'Study Coordination' });
    });

    it('refuses an unknown filter only when control ids are declared', () => {
        window.history.replaceState(null, '', '/contacts?contacts.f.secret=1');

        const withRules = renderHook(() => useFormListUrlState('contacts', { controls: ['department'] }));
        expect(withRules.result.current.urlError?.reason).toBe('unknown_list_parameter');
        expect(withRules.result.current.urlState.filters).toEqual({});

        const withoutRules = renderHook(() => useFormListUrlState('contacts'));
        expect(withoutRules.result.current.urlError).toBeNull();
        expect(withoutRules.result.current.urlState.filters).toEqual({ secret: '1' });
    });
});
