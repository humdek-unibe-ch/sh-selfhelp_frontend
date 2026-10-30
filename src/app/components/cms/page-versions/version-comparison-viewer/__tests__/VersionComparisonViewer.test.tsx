/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '../../../../../../test-utils/renderWithProviders';
import { theme } from '../../../../../../../theme';
import { VersionComparisonViewer } from '../VersionComparisonViewer';
import type { IPageVersion } from '../../../../../../types/responses/admin/page-version.types';

/**
 * M7: the Compare Versions dialog ignored Escape, stripped the side-by-side
 * HTML diff to raw text, and showed object diffs (json_patch) as `""`.
 */
const compareVersions = vi.fn();

vi.mock('../../../../../../api/admin/page-version.api', () => ({
    PageVersionApi: {
        compareVersions: (...args: unknown[]) => compareVersions(...args),
        compareDraftWithVersion: vi.fn(),
    },
}));

const versions = [
    { id: 4, version_number: 1, version_name: 'First' },
    { id: 5, version_number: 2, version_name: 'Second' },
] as unknown as IPageVersion[];

// The app theme turns Escape off for every Modal, so render with it.
function renderViewer(onClose = vi.fn()) {
    render(
        <MantineProvider theme={theme}>
            <QueryClientProvider client={createTestQueryClient()}>
                <VersionComparisonViewer opened onClose={onClose} pageId={479} versions={versions} initialVersion1Id={5} initialVersion2Id={4} />
            </QueryClientProvider>
        </MantineProvider>,
    );
    return onClose;
}

describe('VersionComparisonViewer', () => {
    // jsdom lacks scrollIntoView, which the Select dropdown calls.
    beforeAll(() => {
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('closes on Escape', async () => {
        compareVersions.mockResolvedValue({ format: 'side_by_side', diff: '' });
        const onClose = renderViewer();

        await screen.findByRole('dialog');
        await userEvent.keyboard('{Escape}');

        expect(onClose).toHaveBeenCalled();
    });

    it('renders the side-by-side diff as a table, not as raw markup', async () => {
        compareVersions.mockResolvedValue({
            format: 'side_by_side',
            diff: '<table class="diff-wrapper"><tbody><tr><td class="old">old text</td><td class="new">new text</td></tr></tbody></table><script>alert(1)</script>',
        });
        renderViewer();

        expect(await screen.findByRole('table')).toBeInTheDocument();
        expect(screen.getByText('new text')).toBeInTheDocument();
        expect(document.querySelector('[role="dialog"] script')).toBeNull();
    });

    it('pretty-prints an object diff instead of a double-escaped string', async () => {
        compareVersions.mockResolvedValue({ format: 'json_patch', diff: [{ op: 'add', path: '/page/title' }] });
        renderViewer();

        // Mantine labels both the input and its listbox; the input comes first.
        await userEvent.click((await screen.findAllByLabelText('Format'))[0]);
        await userEvent.click(await screen.findByRole('option', { name: 'JSON Patch', hidden: true }));

        await waitFor(() => expect(screen.getByText(/"op": "add"/)).toBeInTheDocument());
    });
});
