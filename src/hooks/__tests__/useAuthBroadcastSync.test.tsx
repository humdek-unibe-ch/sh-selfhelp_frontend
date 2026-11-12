/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * When another tab logs out, an admin tab bounces to the login page and must
 * leave its return address under `redirectTo`, the name the login and 2FA
 * screens read. It used to write `redirect`, which nothing read, so the user
 * landed on the home page after signing in again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../test-utils/renderWithProviders';

const { router, broadcast } = vi.hoisted(() => ({
    router: { replace: vi.fn() },
    broadcast: { listener: null as null | ((message: { type: 'logged-in' | 'logged-out' }) => void) },
}));

vi.mock('next/navigation', () => ({ useRouter: () => router }));
vi.mock('../../utils/auth-broadcast', () => ({
    subscribeAuthBroadcast: (listener: (message: { type: 'logged-in' | 'logged-out' }) => void) => {
        broadcast.listener = listener;
        return () => {
            broadcast.listener = null;
        };
    },
}));
vi.mock('../../api/permission-wrapper.api', () => ({ permissionManager: { clearPermissions: vi.fn() } }));

import { useAuthBroadcastSync } from '../useAuthBroadcastSync';

function renderSync() {
    const client = createTestQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    renderHook(() => useAuthBroadcastSync(), { wrapper });
}

describe('useAuthBroadcastSync', () => {
    beforeEach(() => {
        router.replace.mockClear();
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
    });

    it('sends an admin tab to the login page with its address in redirectTo when another tab logs out', () => {
        window.history.pushState({}, '', '/admin/pages?page=2');
        renderSync();

        act(() => broadcast.listener?.({ type: 'logged-out' }));

        expect(router.replace).toHaveBeenCalledWith('/login?redirectTo=%2Fadmin%2Fpages%3Fpage%3D2');
    });

    it('leaves a public page where it is', () => {
        window.history.pushState({}, '', '/home');
        renderSync();

        act(() => broadcast.listener?.({ type: 'logged-out' }));

        expect(router.replace).not.toHaveBeenCalled();
    });
});
