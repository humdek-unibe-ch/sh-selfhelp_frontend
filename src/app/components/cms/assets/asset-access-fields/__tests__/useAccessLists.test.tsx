/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../../../hooks/useGroups', () => ({ useAllGroups: vi.fn() }));
vi.mock('../../../../../../hooks/useRoles', () => ({ useAllRoles: vi.fn() }));
vi.mock('../../../../../../hooks/useUserData', () => ({ useAuthUser: vi.fn() }));

import { useAllGroups } from '../../../../../../hooks/useGroups';
import { useAllRoles } from '../../../../../../hooks/useRoles';
import { useAuthUser } from '../../../../../../hooks/useUserData';
import { useAccessLists } from '../AssetAccessFields';

const role = (id: number, name: string, is_superuser: boolean) => ({
  id,
  name,
  description: null,
  is_superuser,
  permissions: [],
  users_count: 0,
  permissions_count: 0,
});

function setup(callerRoles: Array<{ id: number; name: string; is_superuser: boolean }>) {
  vi.mocked(useAllGroups).mockReturnValue({ data: { groups: [] }, isLoading: false, isError: false } as never);
  vi.mocked(useAllRoles).mockReturnValue({
    data: { roles: [role(1, 'Owners', true), role(2, 'admin', false), role(3, 'editors', false)] },
    isLoading: false,
    isError: false,
  } as never);
  vi.mocked(useAuthUser).mockReturnValue({
    user: { roles: callerRoles.map((r) => ({ ...r, description: null })) },
  } as never);
  return renderHook(() => useAccessLists(true)).result.current;
}

beforeEach(() => vi.clearAllMocks());

describe('useAccessLists superuser flag (rule 4.11, F10)', () => {
  it('hides a superuser role named Owners and makes its holder the admin', () => {
    const lists = setup([{ id: 1, name: 'Owners', is_superuser: true }]);
    expect(lists.roleOptions.map((o) => o.label)).toEqual(['admin', 'editors']);
    expect(lists.callerIsAdmin).toBe(true);
  });

  it('offers a plain role named admin and does not make its holder the admin', () => {
    const lists = setup([{ id: 2, name: 'admin', is_superuser: false }]);
    expect(lists.roleOptions.map((o) => o.label)).toContain('admin');
    expect(lists.callerIsAdmin).toBe(false);
  });
});
