/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Button, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconTool } from '@tabler/icons-react';
import { DEFAULT_MAINTENANCE_MESSAGE } from './maintenance';

/**
 * Hardcoded maintenance fallback — the maintenance counterpart of
 * `NotFoundClient`.
 *
 * Rendered by the slug page when the instance is in maintenance (Symfony 503)
 * but the seeded `maintenance` CMS page is missing or could not be fetched.
 * Self-contained (no CMS data, no nav) so it works even while the rest of the
 * API is returning 503. The "Try again" button simply reloads, which succeeds
 * once the operator has switched maintenance back off.
 */
export function MaintenanceClient({ message }: { message?: string }) {
    const body = message?.trim() ? message : DEFAULT_MAINTENANCE_MESSAGE;

    return (
        <Container size="sm" style={{ textAlign: 'center', paddingTop: '100px' }}>
            <Stack gap="md" align="center">
                <ThemeIcon size={64} radius="xl" variant="light" color="blue">
                    <IconTool size={36} />
                </ThemeIcon>
                <Title order={1}>We will be right back</Title>
                <Text c="dimmed">{body}</Text>
                <Button variant="light" onClick={() => window.location.reload()}>
                    Try again
                </Button>
            </Stack>
        </Container>
    );
}
