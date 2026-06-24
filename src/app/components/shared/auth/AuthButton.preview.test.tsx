/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Inside the CMS Live Preview the public site is rendered INLINE. The avatar
 * menu's profile navigation must therefore drive the preview (so the profile
 * page shows in BOTH the web pane and the mobile frame) instead of calling the
 * global router and navigating the whole admin app away from
 * `/admin/preview/...` (which would unmount the preview / mobile frame).
 *
 * Outside the preview (no provider) it must keep navigating normally.
 */
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock, replace: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@refinedev/core', () => ({
    useLogout: () => ({ mutate: vi.fn() }),
}));
vi.mock('../../../../hooks/useUserData', () => ({
    useAuthStatus: () => ({ isAuthenticated: true, isLoading: false }),
    useAuthUser: () => ({ user: { name: 'QA Admin', email: 'qa.admin@selfhelp.test' } }),
}));
vi.mock('../../../../hooks/useAppNavigation', () => ({
    // Empty list → AuthButton renders its synthesized "Profile" fallback item,
    // which navigates to ROUTES.PROFILE ('/profile').
    useAppNavigation: () => ({ profilePages: [] }),
}));
vi.mock('../common/ThemeToggle', () => ({ ThemeToggle: () => null }));

import { renderWithProviders } from '../../../../test-utils/renderWithProviders';
import { PreviewNavigationProvider } from '../../cms/live-preview/PreviewNavigationContext';
import { AuthButton } from './AuthButton';

describe('AuthButton preview navigation', () => {
    beforeEach(() => {
        pushMock.mockClear();
    });

    it('drives the preview for profile navigation instead of leaving the admin app', async () => {
        const navigate = vi.fn();
        const user = userEvent.setup();
        renderWithProviders(
            <PreviewNavigationProvider value={{ navigate }}>
                <AuthButton />
            </PreviewNavigationProvider>,
        );

        await user.click(screen.getByRole('button', { name: 'QA Admin' }));
        await user.click(await screen.findByText('Profile'));

        expect(navigate).toHaveBeenCalledWith('/profile');
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('navigates normally (router) when not inside the preview', async () => {
        const user = userEvent.setup();
        renderWithProviders(<AuthButton />);

        await user.click(screen.getByRole('button', { name: 'QA Admin' }));
        await user.click(await screen.findByText('Profile'));

        expect(pushMock).toHaveBeenCalledWith('/profile');
    });
});
