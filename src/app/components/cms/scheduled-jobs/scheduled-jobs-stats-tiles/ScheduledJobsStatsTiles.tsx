/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert, Card, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconListDetails,
  IconTrash,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import type { IScheduledJobsStats } from '../../../../../types/responses/admin/scheduled-jobs.types';
import classes from './ScheduledJobsStatsTiles.module.css';

/** Tile status keys. `all` is the total tile; the rest match the status lookup
 *  codes (`queued`/`done`/`failed`/`deleted`) the Status filter emits. */
type TScheduledJobsStatTile = 'all' | 'queued' | 'done' | 'failed' | 'deleted';

interface IScheduledJobsStatsTilesProps {
  stats?: IScheduledJobsStats;
  isLoading: boolean;
  isError?: boolean;
  activeStatus?: string;
}

interface ITile {
  status: TScheduledJobsStatTile;
  label: string;
  color: string;
  icon: ComponentType<IconProps>;
}

const TILES: ITile[] = [
  { status: 'all', label: 'Total jobs', color: 'blue', icon: IconListDetails },
  { status: 'queued', label: 'Queued', color: 'blue', icon: IconClock },
  { status: 'done', label: 'Done', color: 'green', icon: IconCircleCheck },
  { status: 'failed', label: 'Failed', color: 'red', icon: IconCircleX },
  { status: 'deleted', label: 'Deleted', color: 'gray', icon: IconTrash },
];

/**
 * The count tiles above the scheduled-jobs table. Read-only: filtering is the
 * Status select's job (it goes through Apply Filters like every other backend
 * query param), and the tiles highlight whichever status is applied.
 *
 * These are independent status counts, not a breakdown of `total`: a `deleted`
 * job still counts toward `total`, so never render these as parts of a whole
 * (stacked bar, % of total). `Failed` is the operationally important one and is
 * intentionally red.
 */
export function ScheduledJobsStatsTiles({
  stats,
  isLoading,
  isError = false,
  activeStatus,
}: IScheduledJobsStatsTilesProps) {
  // Never fall back to 0 when the counts are missing — an admin cannot tell a
  // failed request from a genuinely empty system, and 0 reads as fact.
  const valueFor = (status: TScheduledJobsStatTile) => {
    if (!stats) return '—';
    if (status === 'all') return stats.total;
    return stats[status];
  };

  return (
    <Stack gap="xs">
      {isError && (
        <Alert color="orange" icon={<IconAlertTriangle size={16} />} py="xs">
          Could not load the job counts. The numbers below are unavailable — the
          table itself is unaffected.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, xs: 2, md: 5 }} spacing="md">
        {TILES.map((tile) => {
          const isActive =
            tile.status === 'all' ? !activeStatus : activeStatus === tile.status;
          return (
            <Card
              key={tile.status}
              withBorder
              p="md"
              className={classes.tile}
              data-active={isActive || undefined}
            >
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon variant="light" color={tile.color} size={38} radius="md">
                  <tile.icon size={20} />
                </ThemeIcon>
                <div className={classes.tileText}>
                  {isLoading ? (
                    <Skeleton height={24} width={56} mb={6} />
                  ) : (
                    <Text fz={24} fw={700} lh={1.1}>
                      {valueFor(tile.status)}
                    </Text>
                  )}
                  <Text size="sm" c="dimmed">
                    {tile.label}
                  </Text>
                </div>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>

      <Text size="xs" c="dimmed">
        Across all jobs — not affected by the filters below.
      </Text>
    </Stack>
  );
}
