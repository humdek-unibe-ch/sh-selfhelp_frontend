/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Select } from '@mantine/core';
import type { TUserStatusFilter } from '../../../../../types/responses/admin/users.types';

type TUserStatus = Exclude<TUserStatusFilter, 'all'>;

/** Display names of the status buckets the users list can filter by. */
export const USER_STATUS_LABELS: Record<TUserStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  imported: 'Imported',
  blocked: 'Blocked',
};

const OPTIONS = [
  { value: 'all', label: 'All' },
  ...Object.entries(USER_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

interface IUserStatusFilterSelectProps {
  /** `undefined` = all statuses (the API omits the param). */
  value: TUserStatus | undefined;
  onChange: (status: TUserStatus | undefined) => void;
}

/** The "Status" filter of the users list and the member dialogs. */
export function UserStatusFilterSelect({ value, onChange }: IUserStatusFilterSelectProps) {
  return (
    <Select
      label="Status"
      value={value ?? 'all'}
      onChange={(next) => onChange(next && next !== 'all' ? (next as TUserStatus) : undefined)}
      data={OPTIONS}
      withCheckIcon={false}
      allowDeselect={false}
      w={160}
    />
  );
}
