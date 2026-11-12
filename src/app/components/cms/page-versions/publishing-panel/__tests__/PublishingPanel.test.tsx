/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IPageVersion } from '../../../../../../types/responses/admin/page-version.types';

/** L5: before the first publish there is nothing to compare the draft with. */
vi.mock('../../../../../../hooks/useUnpublishedChanges', () => ({
    useUnpublishedChanges: () => ({ data: { has_unpublished_changes: true }, isLoading: false }),
}));
vi.mock('../../../../../../hooks/useSectionUtility', () => ({
    useSectionPages: () => ({ data: [], isLoading: false }),
}));
vi.mock('../../../../../../hooks/usePageDetails', () => ({
    usePageSections: () => ({ data: { sections: [] } }),
}));

import { PublishingPanel } from '../PublishingPanel';

const version: IPageVersion = {
    id: 9,
    id_pages: 1,
    version_number: 1,
    version_name: null,
    created_by: null,
    created_at: '2026-11-06T10:00:00+00:00',
    published_at: '2026-11-06T10:00:00+00:00',
    metadata: null,
};

function renderPanel(versions: IPageVersion[], currentPublishedVersionId: number | null) {
    renderWithProviders(
        <PublishingPanel
            pageId={1}
            versions={versions}
            currentPublishedVersionId={currentPublishedVersionId}
            isLoading={false}
            error={null}
            onPublishNew={vi.fn()}
            onPublishSpecific={vi.fn()}
            onDelete={vi.fn()}
            isPublishing={false}
        />,
    );
}

describe('PublishingPanel', () => {
    it('offers no draft comparison on a page that was never published', () => {
        renderPanel([], null);

        expect(screen.queryByRole('button', { name: /Compare Draft vs Published/ })).not.toBeInTheDocument();
        expect(screen.getByText(/Not published yet/)).toBeInTheDocument();
        expect(screen.queryByText('Changes detected since last publish')).not.toBeInTheDocument();
    });

    it('compares the draft with the published version once there is one', () => {
        renderPanel([version], 9);

        expect(screen.getByRole('button', { name: /Compare Draft vs Published/ })).toBeInTheDocument();
        expect(screen.getByText('Changes detected since last publish')).toBeInTheDocument();
    });
});
