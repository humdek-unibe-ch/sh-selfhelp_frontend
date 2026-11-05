/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Badge } from '@mantine/core';
import { getUserStatusColor } from '../../../../../utils/status-color.utils';

interface IUserStatusBadgeProps {
  status: string;
  /** Blocked wins over any status, matching the backend status buckets. */
  blocked: boolean;
}

export function UserStatusBadge({ status, blocked }: IUserStatusBadgeProps) {
  return (
    <Badge
      variant="light"
      color={getUserStatusColor(blocked ? 'blocked' : status)}
      size="sm"
      radius="sm"
      styles={{ label: { textTransform: 'capitalize' } }}
    >
      {blocked ? 'Blocked' : status}
    </Badge>
  );
}
