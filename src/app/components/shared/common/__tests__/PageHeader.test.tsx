/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
    it('pills the item count next to the title', () => {
        renderWithProviders(<PageHeader title="Groups Management" badge={248} badgeAriaLabel="groups" />);
        expect(screen.getByLabelText('248 groups')).toHaveTextContent('248');
    });

    it('still shows the badge when the count is zero', () => {
        renderWithProviders(<PageHeader title="Groups Management" badge={0} badgeAriaLabel="groups" />);
        expect(screen.getByLabelText('0 groups')).toHaveTextContent('0');
    });

    it('omits the badge when no count is given', () => {
        renderWithProviders(<PageHeader title="Groups Management" />);
        expect(screen.queryByLabelText(/groups$/)).not.toBeInTheDocument();
    });

    it('falls back to the title when no badge aria-label is given', () => {
        renderWithProviders(<PageHeader title="Languages" badge={3} />);
        expect(screen.getByLabelText('3 Languages')).toBeInTheDocument();
    });
});
