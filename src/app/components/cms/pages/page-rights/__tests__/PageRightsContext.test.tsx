/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IPageRights } from '../../../../../../types/common/pages.type';

/**
 * The page editor draws what the server says about the open page (`rights`):
 * without the update right it says why it is read-only and disables the fields.
 */
const state = vi.hoisted(() => ({
    rights: undefined as IPageRights | undefined,
    held: new Set<string>(),
    lock: {
        phase: 'holding',
        holder: null,
        reason: null,
        watchOnly: false,
        isWorking: false,
        takeOver: vi.fn(async () => undefined),
        retry: vi.fn(async () => undefined),
    } as IPageEditLock,
    lockHook: vi.fn(),
}));

vi.mock('../../../../../../hooks/usePageDetails', () => ({
    usePageFields: () => ({ data: state.rights ? { page: {}, fields: [], rights: state.rights } : undefined }),
}));
vi.mock('../../../../../../hooks/usePageEditLock', () => ({
    usePageEditLock: (
        pageId: number | null | undefined,
        enabled: boolean,
        options?: { watchOnly?: boolean },
    ) => {
        state.lockHook(pageId, enabled, options);
        if (!enabled) {
            return { ...state.lock, phase: 'off', holder: null, reason: null, watchOnly: false };
        }
        return { ...state.lock, watchOnly: options?.watchOnly === true };
    },
}));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

import type { IPageEditLock } from '../../../../../../hooks/usePageEditLock';
import {
    PageReadOnlyBanner,
    PageRightsProvider,
    ReadOnlyFieldset,
    lockPauseLabel,
    usePageEditRights,
} from '../PageRightsContext';

function Editor() {
    const { canUpdate, canDelete, canPublish, allowDelete, allowPublish, lock } = usePageEditRights();
    return (
        <>
            <PageReadOnlyBanner />
            <output aria-label="flags">
                {JSON.stringify({ canUpdate, canDelete, canPublish, allowDelete, allowPublish, watchOnly: lock.watchOnly })}
            </output>
            <ReadOnlyFieldset readOnly={!canUpdate}>
                <input aria-label="Title" />
            </ReadOnlyFieldset>
        </>
    );
}

const renderEditor = () => renderWithProviders(<PageRightsProvider pageId={94}><Editor /></PageRightsProvider>);
const NONE: IPageRights = { can_update: false, can_delete: false, can_publish: false };

describe('page editor rights', () => {
    beforeEach(() => {
        state.rights = undefined;
        state.held = new Set([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PAGE_READ]);
        state.lock = {
            ...state.lock,
            phase: 'holding',
            holder: null,
            reason: null,
            watchOnly: false,
            isWorking: false,
        };
        state.lock.takeOver = vi.fn(async () => undefined);
        state.lock.retry = vi.fn(async () => undefined);
        state.lockHook.mockReset();
    });

    it('without admin.page.update: read-only banner names the permission and the fields are disabled', () => {
        state.rights = NONE;
        renderEditor();

        expect(screen.getByText('Read only')).toBeInTheDocument();
        expect(screen.getByText(/needs the permission admin\.page\.update/)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });

    it('with admin.page.update but no grant on this page: the banner points to the page access', () => {
        state.rights = NONE;
        state.held.add(PERMISSIONS.ADMIN_PAGE_UPDATE);
        renderEditor();

        expect(screen.getByText(/no update grant on this page/)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });

    it('with the update right: no banner and the fields can be edited', () => {
        state.rights = { can_update: true, can_delete: false, can_publish: false };
        renderEditor();

        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeEnabled();
    });

    it('before the page is read (or from a backend without rights): no banner, nothing allowed', () => {
        renderEditor();

        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });
});

const ALL: IPageRights = { can_update: true, can_delete: true, can_publish: true };
const flags = () => JSON.parse(screen.getByLabelText('flags').textContent ?? '{}');

describe('page edit lock in the editor (live sync C9)', () => {
    it('takes part in the lock only when the caller may update', () => {
        state.rights = ALL;
        renderEditor();
        expect(state.lockHook).toHaveBeenLastCalledWith(94, true, { watchOnly: false });
    });

    it('a caller who only reads sees no lock controls and the lock is not asked for', () => {
        state.rights = NONE;
        renderEditor();

        expect(state.lockHook).toHaveBeenLastCalledWith(94, false, { watchOnly: false });
        expect(screen.queryByTestId('page-lock-banner')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Take over' })).not.toBeInTheDocument();
    });

    it('holding the lock: everything the rights allow stays allowed', () => {
        state.rights = ALL;
        renderEditor();

        expect(flags()).toEqual({
            canUpdate: true,
            canDelete: true,
            canPublish: true,
            allowDelete: true,
            allowPublish: true,
            watchOnly: false,
        });
        expect(screen.queryByTestId('page-lock-banner')).not.toBeInTheDocument();
    });

    it('while the lock is being taken: read-only, without a banner', () => {
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'checking' };
        renderEditor();

        expect(flags()).toMatchObject({ canUpdate: false, canDelete: false, canPublish: false });
        expect(screen.queryByTestId('page-lock-banner')).not.toBeInTheDocument();
        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });

    it('someone else holds the lock: read-only, banner with the name and a take-over button', () => {
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'held_by_other', holder: { id: 4, name: 'Ada Lovelace' } };
        renderEditor();

        expect(screen.getByText('Ada Lovelace is editing this page')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Take over' })).toBeInTheDocument();
        expect(flags()).toMatchObject({
            canUpdate: false,
            canDelete: false,
            canPublish: false,
            allowDelete: true,
            allowPublish: true,
        });
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
    });

    it('take over asks for a confirmation first, and only then takes over', async () => {
        const user = userEvent.setup();
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'held_by_other', holder: { id: 4, name: 'Ada Lovelace' } };
        renderEditor();

        await user.click(screen.getByRole('button', { name: 'Take over' }));
        expect(await screen.findByText(/they can no longer save their changes/)).toBeInTheDocument();
        expect(state.lock.takeOver).not.toHaveBeenCalled();

        const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: 'Take over' });
        await user.click(confirm);
        await waitFor(() => expect(state.lock.takeOver).toHaveBeenCalledTimes(1));
    });

    it('cancelling the confirmation takes nothing over', async () => {
        const user = userEvent.setup();
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'held_by_other', holder: { id: 4, name: 'Ada Lovelace' } };
        renderEditor();

        await user.click(screen.getByRole('button', { name: 'Take over' }));
        await user.click(await screen.findByRole('button', { name: 'Cancel' }));

        expect(state.lock.takeOver).not.toHaveBeenCalled();
    });

    it('the lock was taken over: the banner says by whom', () => {
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'taken_over', holder: { id: 4, name: 'Ada Lovelace' } };
        renderEditor();

        expect(screen.getByText('Ada Lovelace took over editing this page')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Take over' })).toBeInTheDocument();
    });

    it('the lock ended after being idle: the banner says why and offers Continue editing (take-over)', async () => {
        const user = userEvent.setup();
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'idle', holder: null };
        renderEditor();

        expect(screen.getByText('Your editing session ended')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Continue editing' }));
        expect(state.lock.takeOver).toHaveBeenCalledTimes(1);
    });

    it('a delete-only caller watches the lock: banner without Take over, canDelete false while held, true when free', async () => {
        state.rights = { can_update: false, can_delete: true, can_publish: false };
        state.lock = {
            ...state.lock,
            phase: 'blocked',
            reason: 'held_by_other',
            holder: { id: 4, name: 'Ada Lovelace' },
            watchOnly: true,
        };
        const { rerender } = renderWithProviders(
            <PageRightsProvider pageId={94}><Editor /></PageRightsProvider>,
        );

        expect(state.lockHook).toHaveBeenLastCalledWith(94, true, { watchOnly: true });
        expect(screen.getByTestId('page-lock-banner')).toBeInTheDocument();
        expect(screen.getByText(/Publishing and deleting are paused/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Take over' })).not.toBeInTheDocument();
        expect(flags()).toMatchObject({ canDelete: false, allowDelete: true, watchOnly: true });

        state.lock = { ...state.lock, phase: 'off', holder: null, reason: null, watchOnly: true };
        rerender(<PageRightsProvider pageId={94}><Editor /></PageRightsProvider>);

        expect(flags()).toMatchObject({ canDelete: true, allowDelete: true, watchOnly: true });
        expect(screen.queryByTestId('page-lock-banner')).not.toBeInTheDocument();
    });

    it('a publish-only caller watches the lock: canPublish follows the lock without a reload', () => {
        state.rights = { can_update: false, can_delete: false, can_publish: true };
        state.lock = {
            ...state.lock,
            phase: 'blocked',
            reason: 'held_by_other',
            holder: { id: 4, name: 'Ada Lovelace' },
            watchOnly: true,
        };
        const { rerender } = renderWithProviders(
            <PageRightsProvider pageId={94}><Editor /></PageRightsProvider>,
        );

        expect(flags()).toMatchObject({ canPublish: false, allowPublish: true, watchOnly: true });

        state.lock = { ...state.lock, phase: 'off', holder: null, reason: null, watchOnly: true };
        rerender(<PageRightsProvider pageId={94}><Editor /></PageRightsProvider>);

        expect(flags()).toMatchObject({ canPublish: true, allowPublish: true });
    });

    it('nobody holds the lock any more: the banner offers to start editing', () => {
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'free', holder: null };
        renderEditor();

        expect(screen.getByText('Nobody is editing this page now')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start editing' })).toBeInTheDocument();
    });

    it('a holder without a name is called someone', () => {
        state.rights = ALL;
        state.lock = { ...state.lock, phase: 'blocked', reason: 'held_by_other', holder: null };
        renderEditor();

        expect(screen.getByText('Someone is editing this page')).toBeInTheDocument();
    });
});

describe('tooltip of the controls the lock pauses (lockPauseLabel)', () => {
    const ADA = { id: 4, name: 'Ada Lovelace' };

    it('names the person who is editing, whether they hold it or took it over', () => {
        expect(lockPauseLabel({ phase: 'blocked', reason: 'held_by_other', holder: ADA })).toBe('Ada Lovelace is editing this page');
        expect(lockPauseLabel({ phase: 'blocked', reason: 'taken_over', holder: ADA })).toBe('Ada Lovelace is editing this page');
        expect(lockPauseLabel({ phase: 'blocked', reason: 'held_by_other', holder: null })).toBe('Someone is editing this page');
    });

    it('when the caller\'s own session ended, it does not claim that someone is editing', () => {
        const label = lockPauseLabel({ phase: 'blocked', reason: 'idle', holder: null });

        expect(label).toBe('Your editing session ended. Continue editing to publish or delete.');
        expect(label).not.toMatch(/Someone/);
    });

    it('when nobody holds the page, it says so and how to continue', () => {
        expect(lockPauseLabel({ phase: 'blocked', reason: 'free', holder: null }))
            .toBe('Nobody is editing this page now. Start editing to publish or delete.');
    });

    it('is null while nothing is paused (holding, checking, off)', () => {
        for (const phase of ['holding', 'checking', 'off'] as const) {
            expect(lockPauseLabel({ phase, reason: null, holder: null })).toBeNull();
        }
    });
});
