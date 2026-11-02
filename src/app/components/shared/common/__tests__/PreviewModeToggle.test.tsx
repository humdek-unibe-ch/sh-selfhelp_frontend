/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { PreviewModeProvider } from '../../../contexts/PreviewModeContext';
import { PreviewModeToggle } from '../PreviewModeToggle';

function renderToggle(initialPreviewMode: boolean) {
    return renderWithProviders(
        <PreviewModeProvider initialPreviewMode={initialPreviewMode}>
            <PreviewModeToggle />
        </PreviewModeProvider>,
    );
}

describe('PreviewModeToggle', () => {
    it('reports that published content is shown when preview mode is off', () => {
        renderToggle(false);

        expect(screen.getByText('Showing published content')).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Preview Mode' })).not.toBeChecked();
    });

    it('reports that draft content is shown when preview mode is on', () => {
        renderToggle(true);

        expect(screen.getByText('Showing draft content')).toBeInTheDocument();
        expect(screen.getByRole('switch', { name: 'Preview Mode' })).toBeChecked();
    });

    it('swaps the status line in place when toggled, keeping a single status node', async () => {
        renderToggle(false);

        await userEvent.click(screen.getByRole('switch', { name: 'Preview Mode' }));

        expect(screen.getByText('Showing draft content')).toBeInTheDocument();
        expect(screen.queryByText('Showing published content')).toBeNull();
    });
});
