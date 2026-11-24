/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { ImpersonationBanner } from '../ImpersonationBanner';
import type * as MantineHooks from '@mantine/hooks';

const auth = vi.hoisted(() => ({ isImpersonating: true, targetUser: { email: 'qa.user@selfhelp.test' } }));

vi.mock('../../../../../hooks/useAuth', () => ({ useAuth: () => auth }));
vi.mock('../../../../../hooks/useUsers', () => ({
    useStopImpersonate: () => ({ mutate: vi.fn(), isPending: false }),
}));
// jsdom has no layout: the banner measures 62px high.
vi.mock('@mantine/hooks', async (importOriginal) => ({
    ...(await importOriginal<typeof MantineHooks>()),
    useElementSize: () => ({ ref: () => undefined, width: 320, height: 62 }),
}));

/**
 * The floating banner covered whatever sat in the bottom right corner
 * (the SurveyJS designer's side buttons). While it shows, the page gets
 * room at the bottom so that content can be scrolled clear of it.
 */
describe('ImpersonationBanner', () => {
    beforeEach(() => {
        document.body.style.paddingBottom = '';
        auth.isImpersonating = true;
    });

    it('gives the page room at the bottom while impersonating and takes it back after', () => {
        const { rerender } = renderWithProviders(<ImpersonationBanner />);

        expect(screen.getByText('qa.user@selfhelp.test')).toBeInTheDocument();
        expect(document.body.style.paddingBottom).toBe('102px');

        auth.isImpersonating = false;
        rerender(<ImpersonationBanner />);

        expect(screen.queryByText('qa.user@selfhelp.test')).not.toBeInTheDocument();
        expect(document.body.style.paddingBottom).toBe('');
    });
});
