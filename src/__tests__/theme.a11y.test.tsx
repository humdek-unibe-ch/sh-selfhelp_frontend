/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, CloseButton, MantineProvider, Modal, Pagination } from '@mantine/core';
import { theme } from '../../theme';

/** A1: Mantine's icon-only close and pagination buttons get a name from the app theme. */
describe('theme accessible names', () => {
    const renderWithTheme = (ui: React.ReactNode) => render(<MantineProvider theme={theme}>{ui}</MantineProvider>);

    it('names close buttons, including the ones inside modals and alerts', () => {
        renderWithTheme(
            <>
                <CloseButton />
                <Alert withCloseButton title="Notice" onClose={() => {}}>Body</Alert>
                <Modal opened onClose={() => {}} title="Dialog">Body</Modal>
            </>,
        );

        expect(screen.getAllByRole('button', { name: 'Close', hidden: true })).toHaveLength(3);
    });

    it('names the pagination arrows', () => {
        renderWithTheme(<Pagination total={5} value={2} onChange={() => {}} withEdges />);

        for (const name of ['First page', 'Previous page', 'Next page', 'Last page']) {
            expect(screen.getByRole('button', { name })).toBeInTheDocument();
        }
    });
});
