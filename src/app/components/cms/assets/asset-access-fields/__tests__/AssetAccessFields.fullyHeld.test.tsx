/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

vi.mock('../../../../../../hooks/useGroups', () => ({ useAllGroups: vi.fn() }));
vi.mock('../../../../../../hooks/useRoles', () => ({ useAllRoles: vi.fn() }));
vi.mock('../../../../../../hooks/useUserData', () => ({ useAuthUser: vi.fn() }));

import { useAllGroups } from '../../../../../../hooks/useGroups';
import { useAllRoles } from '../../../../../../hooks/useRoles';
import { useAuthUser } from '../../../../../../hooks/useUserData';
import { ROLE_NOT_HELD, WhoCanManageField, useAccessLists, type IAccessLists } from '../AssetAccessFields';

/**
 * The "Who can manage it" picker of the asset dialogs (upload, edit, folder
 * access) draws what the server says per caller: a role whose rights the caller
 * does not all hold (`fully_held: false`, rule 4.6f) is shown disabled with the
 * reason as plain text, and one already on the asset stays ticked and cannot be
 * removed (rule 4.6e). `AssetFormModal` and `AssetFolderAccessModal` both draw
 * the picker from `WhoCanManageField` and `useAccessLists`, so they are covered here.
 */
const role = (id: number, name: string, fully_held: boolean) => ({
  id,
  name,
  description: null,
  is_superuser: false,
  permissions: [],
  users_count: 0,
  permissions_count: 0,
  can_update: true,
  can_delete: true,
  fully_held,
});

function mockLists(roles: ReturnType<typeof role>[]) {
  vi.mocked(useAllGroups).mockReturnValue({ data: { groups: [] }, isLoading: false, isError: false } as never);
  vi.mocked(useAllRoles).mockReturnValue({ data: { roles }, isLoading: false, isError: false } as never);
  vi.mocked(useAuthUser).mockReturnValue({ user: { roles: [] } } as never);
}

const ROLES = [role(2, 'held_role', true), role(3, 'not_held_role', false)];

function listsFor(current: { roles?: { id: number; name: string }[] } = {}): IAccessLists {
  mockLists(ROLES);
  return renderHook(() => useAccessLists(true, current)).result.current;
}

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

describe('useAccessLists role options (rule 4.6f)', () => {
  it('disables exactly the roles the caller does not fully hold', () => {
    const lists = listsFor();
    expect(lists.roleOptions).toEqual([
      { value: '2', label: 'held_role', disabled: false },
      { value: '3', label: 'not_held_role', disabled: true },
    ]);
  });

  it('keeps a role the server sent without the flag selectable', () => {
    mockLists([{ ...role(4, 'unflagged', true), fully_held: undefined } as never]);
    const lists = renderHook(() => useAccessLists(true)).result.current;
    expect(lists.roleOptions[0].disabled).toBe(false);
  });
});

describe('WhoCanManageField with a role the caller does not fully hold', () => {
  it('shows the role disabled, with the reason as text next to it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WhoCanManageField lists={listsFor()} value={[]} onChange={vi.fn()} />);

    await user.click(screen.getByLabelText(/Who can manage it/, { selector: 'input' }));

    const locked = await screen.findByRole('option', { name: /not_held_role/, hidden: true });
    expect(locked).toHaveAttribute('data-combobox-disabled', 'true');
    // The reason is text inside the option, so it is part of the option's name and not colour only.
    expect(locked).toHaveTextContent(ROLE_NOT_HELD);
    const free = screen.getByRole('option', { name: /^held_role/, hidden: true });
    expect(free).not.toHaveAttribute('data-combobox-disabled');
    expect(free).not.toHaveTextContent(ROLE_NOT_HELD);
  });

  it('cannot add the disabled role, and still adds a held one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<WhoCanManageField lists={listsFor()} value={[]} onChange={onChange} />);

    await user.click(screen.getByLabelText(/Who can manage it/, { selector: 'input' }));
    await user.click(await screen.findByRole('option', { name: /not_held_role/, hidden: true }));
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('option', { name: /^held_role/, hidden: true }));
    expect(onChange).toHaveBeenCalledWith(['2']);
  });

  it('keeps a current role that is not fully held ticked: it cannot be removed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lists = listsFor({ roles: [{ id: 3, name: 'not_held_role' }] });
    renderWithProviders(<WhoCanManageField lists={lists} value={['3']} onChange={onChange} />);

    // The role is still shown on the asset, by name.
    expect(screen.getAllByText('not_held_role').length).toBeGreaterThan(0);

    // Backspace in the field and the clear button both try to drop it.
    await user.click(screen.getByLabelText(/Who can manage it/, { selector: 'input' }));
    await user.keyboard('{Backspace}');

    for (const call of onChange.mock.calls) expect(call[0]).toContain('3');
    // The reason is visible in the dialog.
    expect(screen.getByText(new RegExp(`${ROLE_NOT_HELD}.*cannot be added or removed`))).toBeInTheDocument();
  });

  it('removes a held role as before', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const lists = listsFor({ roles: [{ id: 2, name: 'held_role' }] });
    renderWithProviders(<WhoCanManageField lists={lists} value={['2']} onChange={onChange} />);

    await user.click(screen.getByLabelText(/Who can manage it/, { selector: 'input' }));
    await user.keyboard('{Backspace}');

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
