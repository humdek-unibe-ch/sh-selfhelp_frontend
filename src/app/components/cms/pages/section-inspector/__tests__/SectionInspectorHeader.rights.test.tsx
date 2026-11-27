/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { SectionInspectorHeader } from '../SectionInspectorHeader';

/**
 * The section inspector passes Save and Delete only to a caller who may use
 * them; without the handlers the header draws neither, and Export stays.
 */
describe('SectionInspectorHeader rights', () => {
    const base = { title: 'text', idLabel: 'ID 5', badges: [], onExport: vi.fn() };

    it('draws no Save and no Delete for a read-only caller', () => {
        renderWithProviders(<SectionInspectorHeader {...base} />);

        expect(screen.queryByRole('button', { name: /Save/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete section' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export/ })).toBeInTheDocument();
    });

    it('draws Save and Delete when their handlers are passed', () => {
        renderWithProviders(<SectionInspectorHeader {...base} onSave={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete section' })).toBeInTheDocument();
    });
});
