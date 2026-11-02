/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, Pagination, Text } from '@mantine/core';
import classes from './AdminTable.module.css';

interface IAdminTableFooterProps {
  totalCount: number;
  /** Plural noun for the summary, e.g. "users", "groups". */
  itemLabel: string;
  /** Paging state. Omit for unpaginated lists: the footer then shows only the
   *  total count and renders no pager. */
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

/** Shared admin-table footer: count/range summary on the left, pager on the
 *  right. Sits inside `.tableWrapper`, below the table. Rows-per-page is a
 *  backend query param, so it stays in the filter toolbar with Apply/Reset. */
export function AdminTableFooter({
  totalCount,
  itemLabel,
  pagination,
}: IAdminTableFooterProps) {
  const strong = (value: number) => (
    <Text span fw={700} c="var(--mantine-color-text)" inherit>
      {value}
    </Text>
  );

  let summary;
  if (totalCount === 0) {
    summary = `No ${itemLabel}`;
  } else if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize + 1;
    const to = Math.min(pagination.page * pagination.pageSize, totalCount);
    summary = (
      <>
        Showing{' '}
        <Text span fw={700} c="var(--mantine-color-text)" inherit>
          {from}&ndash;{to}
        </Text>{' '}
        of {strong(totalCount)} {itemLabel}
      </>
    );
  } else {
    summary = (
      <>
        Showing {strong(totalCount)} {itemLabel}
      </>
    );
  }

  return (
    <Group justify="space-between" wrap="wrap" gap="sm" className={classes.tableFooter}>
      <Text size="sm" c="dimmed">
        {summary}
      </Text>

      {pagination && (
        <Pagination
          value={pagination.page}
          onChange={pagination.onPageChange}
          total={Math.max(pagination.totalPages, 1)}
          size="sm"
          withEdges={false}
          siblings={1}
          boundaries={1}
        />
      )}
    </Group>
  );
}
