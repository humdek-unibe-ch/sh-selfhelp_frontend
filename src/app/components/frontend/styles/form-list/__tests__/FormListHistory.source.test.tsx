/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { IFormListHistoryData, IFormListRevision } from '../../../../../../shared';

const history: { data: IFormListHistoryData } = { data: { items: [], total: 0, page: 1, page_size: 20, current_version: 2 } };

vi.mock('../../../../../../hooks/useFormList', () => ({
    useFormListHistory: () => ({ data: history.data, isLoading: false, error: null }),
    useFormListVersion: () => ({ data: undefined, isLoading: false, error: null }),
    useFormListCompare: () => ({ data: undefined, isLoading: false, error: null }),
    useFormListRestoreMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../../../../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: false }),
}));

import { FormListHistory } from '../FormListHistory';

function revision(version: number, source: IFormListRevision['source']): IFormListRevision {
    return {
        version,
        created_at: '2026-11-27T10:00:00+00:00',
        operation: 'update',
        source,
        actor: { id: 7, name: 'Ada' },
        impersonated_by: null,
        restored_from_version: null,
        changed_fields: 1,
        is_checkpoint: false,
        content_ref: null,
    };
}

describe('FormListHistory source words', () => {
    it('names a revision written by a plugin "via plugin"', () => {
        history.data = { ...history.data, items: [revision(2, 'plugin'), revision(1, 'form')], total: 2 };

        render(
            <MantineProvider>
                <FormListHistory pageId={1} sectionId={2} recordId={3} canRestore={false} onRestored={vi.fn()} />
            </MantineProvider>,
        );

        expect(screen.getByText('Updated by Ada via plugin')).toBeInTheDocument();
        expect(screen.getByText('Updated by Ada via form')).toBeInTheDocument();
    });
});
