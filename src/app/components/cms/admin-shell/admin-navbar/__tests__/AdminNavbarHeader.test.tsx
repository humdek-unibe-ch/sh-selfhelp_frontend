/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PreviewModeProvider } from '../../../../contexts/PreviewModeContext';

vi.mock('../../../../shared/common/debug/DebugMenu', () => ({
    DebugMenu: ({ variant }: { variant?: string }) => (
        <button type="button" aria-label="Debug Menu" data-variant={variant}>
            bug
        </button>
    ),
}));

vi.mock('next/image', () => ({
    default: (props: { alt?: string }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={props.alt ?? ''} data-testid="selfhelp-logo-mark" />
    ),
}));

import { AdminNavbarHeader } from '../AdminNavbarHeader';

describe('AdminNavbarHeader', () => {
    it('renders logo mark + SelfHelp on the left and preview + debug on the right', () => {
        renderWithProviders(
            <PreviewModeProvider initialPreviewMode={false}>
                <AdminNavbarHeader />
            </PreviewModeProvider>,
        );

        expect(screen.getByTestId('admin-navbar-header')).toBeInTheDocument();
        expect(screen.getByText('SelfHelp')).toBeInTheDocument();
        expect(screen.getByTestId('selfhelp-logo-mark')).toHaveAttribute('alt', '');
        expect(
            screen.getByRole('button', {
                name: 'Showing published content, click to show draft',
            }),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Debug Menu' })).toHaveAttribute(
            'data-variant',
            'inline',
        );
        // Card variant status line must be gone.
        expect(screen.queryByText('Preview Mode')).not.toBeInTheDocument();
        expect(screen.queryByText('Showing published content')).not.toBeInTheDocument();
    });
});
