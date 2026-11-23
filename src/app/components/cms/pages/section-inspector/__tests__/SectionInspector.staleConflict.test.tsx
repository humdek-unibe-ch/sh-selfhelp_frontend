/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live sync C8: when a write was refused as stale, the draft is read again but the inspector
 * keeps the values the person typed (P6-A2). Without that refusal the inspector follows the
 * server as before.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSyncExternalStore } from 'react';
import { act } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

const state = vi.hoisted(() => ({
    details: undefined as unknown,
    listeners: new Set<() => void>(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('../../../../../../hooks/useSectionDetails', () => ({
    // Subscribes like a query would, so a new answer re-renders the (memoised) inspector.
    useSectionDetails: () => ({
        data: useSyncExternalStore(
            (listener) => {
                state.listeners.add(listener);
                return () => state.listeners.delete(listener);
            },
            () => state.details,
        ),
        isLoading: false,
        error: null,
    }),
}));
vi.mock('../../../../../../hooks/useSectionDataVariables', () => ({
    useSectionDataVariables: () => ({ data: {} }),
}));
vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [{ id: 1, language: 'English', locale: 'en' }], isLoading: false }),
}));
vi.mock('../../../../../../hooks/mutations', () => ({
    useUpdateSectionMutation: () => ({ isPending: false, mutateAsync: vi.fn() }),
    useDeleteSectionMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock('../../../../../../hooks/useSectionUtility', () => ({ useSectionPages: () => ({ data: [], isLoading: false }) }));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: () => true } }),
}));
vi.mock('../../../shared/field-components/form-list/useLiveFormListSource', () => ({
    useLiveFormListSource: () => undefined,
}));
vi.mock('../../../shared/inspector-layout/InspectorLayout', () => ({
    InspectorLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../SectionInspectorHeader', () => ({ SectionInspectorHeader: () => null }));
vi.mock('../SectionFieldPanels', () => ({ SectionFieldPanels: () => null }));
vi.mock('../section-field-groups', () => ({ SectionInfoPanel: () => null }));
vi.mock('../../page-rights/PageRightsContext', () => ({
    usePageEditRights: () => ({ canUpdate: true, canDelete: true, canPublish: true, isKnown: true }),
}));

import { SectionInspector } from '../SectionInspector';
import { useSectionFormStore } from '../../../../../store/sectionFormStore';
import {
    clearStaleConflict,
    holdStaleConflict,
    resetPageEditConflictsForTests,
} from '../../../../../../utils/page-edit-conflict.utils';

const PAGE_ID = 12;

function details(name: string) {
    return {
        section: {
            id: 5,
            name,
            style: { name: 'text', canHaveChildren: false, typeId: 1 },
            global_fields: { condition: null, data_config: null, css: '', css_mobile: '', debug: false },
        },
        fields: [],
    };
}

function renderInspector() {
    return renderWithProviders(<SectionInspector pageId={PAGE_ID} sectionId={5} />);
}

/** The server answers with other data: the draft was read again. */
function serverAnswers(data: unknown) {
    act(() => {
        state.details = data;
        state.listeners.forEach((listener) => listener());
    });
}

beforeEach(() => {
    resetPageEditConflictsForTests();
    state.details = details('from-server-1');
});

afterEach(() => {
    resetPageEditConflictsForTests();
});

describe('SectionInspector after a stale refusal (C8)', () => {
    it('follows the server when the draft is read again and nothing was refused', () => {
        renderInspector();
        expect(useSectionFormStore.getState().sectionName).toBe('from-server-1');

        act(() => useSectionFormStore.setState({ sectionName: 'typed-by-the-person' }));
        serverAnswers(details('from-server-2'));

        expect(useSectionFormStore.getState().sectionName).toBe('from-server-2');
    });

    it('keeps what the person typed when the draft is read again after a stale refusal', () => {
        renderInspector();
        act(() => useSectionFormStore.setState({ sectionName: 'typed-by-the-person' }));

        holdStaleConflict(PAGE_ID);
        serverAnswers(details('from-server-2'));

        expect(useSectionFormStore.getState().sectionName).toBe('typed-by-the-person');
    });

    it('follows the server again once the hold is cleared (a write went through)', () => {
        renderInspector();
        act(() => useSectionFormStore.setState({ sectionName: 'typed-by-the-person' }));
        holdStaleConflict(PAGE_ID);
        serverAnswers(details('from-server-2'));

        clearStaleConflict(PAGE_ID);
        serverAnswers(details('saved-by-the-person'));

        expect(useSectionFormStore.getState().sectionName).toBe('saved-by-the-person');
    });

    it('a refusal for another page does not hold this inspector', () => {
        renderInspector();
        act(() => useSectionFormStore.setState({ sectionName: 'typed-by-the-person' }));

        holdStaleConflict(99);
        serverAnswers(details('from-server-2'));

        expect(useSectionFormStore.getState().sectionName).toBe('from-server-2');
    });
});
