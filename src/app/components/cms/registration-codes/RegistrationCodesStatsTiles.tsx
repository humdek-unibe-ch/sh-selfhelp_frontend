/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Alert, Card, Group, SimpleGrid, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleDashed,
  IconTicket,
  type IconProps,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';
import type {
  IRegistrationCodesStats,
  TRegistrationCodeStatusFilter,
} from '../../../../types/responses/admin/registration-codes.types';
import classes from './RegistrationCodesStatsTiles.module.css';

interface IRegistrationCodesStatsTilesProps {
  stats?: IRegistrationCodesStats;
  isLoading: boolean;
  /** True when the counts could not be loaded. Tiles then show "—", never 0:
   *  a confident zero is indistinguishable from "you have no codes". */
  isError?: boolean;
  /** Applied status filter — the matching tile is outlined so the tiles read
   *  as a display of the current filter, which the Status select owns. */
  activeStatus: TRegistrationCodeStatusFilter;
}

interface ITile {
  status: TRegistrationCodeStatusFilter;
  label: string;
  color: string;
  icon: ComponentType<IconProps>;
}

const TILES: ITile[] = [
  { status: 'all', label: 'Total codes', color: 'blue', icon: IconTicket },
  { status: 'available', label: 'Available', color: 'green', icon: IconCircleCheck },
  { status: 'used', label: 'Used', color: 'gray', icon: IconCircleDashed },
];

/**
 * The three count tiles above the registration-codes table. Read-only:
 * filtering is the Status select's job (it goes through Apply Filters like
 * every other backend query param), and the tiles highlight whichever status
 * is applied.
 *
 * `available` + `used` sum to `total` (a code is exactly one or the other),
 * so these are a genuine breakdown of the whole set.
 */
export function RegistrationCodesStatsTiles({
  stats,
  isLoading,
  isError = false,
  activeStatus,
}: IRegistrationCodesStatsTilesProps) {
  // Never fall back to 0 when the counts are missing — an admin cannot tell a
  // failed request from a genuinely empty system, and 0 reads as fact.
  const valueFor = (status: TRegistrationCodeStatusFilter) => {
    if (!stats) return '—';
    if (status === 'all') return stats.total;
    return stats[status];
  };

  return (
    <Stack gap="xs">
      {isError && (
        <Alert color="orange" icon={<IconAlertTriangle size={16} />} py="xs">
          Could not load the code counts. The numbers below are unavailable — the
          table itself is unaffected.
        </Alert>
      )}

      <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="md">
        {TILES.map((tile) => {
          const isActive = activeStatus === tile.status;
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
    </Stack>
  );
}
