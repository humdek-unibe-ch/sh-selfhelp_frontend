/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Exact versions of everything this platform runs on, for the admin System page.
 *
 * - Backend frameworks and libraries come from `GET /admin/system/version`,
 *   which only callers with `admin.system.read` can reach, so the versions are
 *   always exact here.
 * - The website list is generated from this app's own installed dependencies
 *   (`scripts/generate-web-libraries.mjs`); nothing is typed by hand.
 *
 * Visitors see the same lists without versions in the public "about this
 * platform" block; the server decides that, not this page.
 */
'use client';

import { Code, Grid, Paper, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import type { IAboutItem } from '../../../../../shared';
import { WEB_LIBRARIES } from '../../../../../utils/web-libraries.utils';

interface IComponentListCardProps {
    title: string;
    items: readonly IAboutItem[];
    emptyText: string;
    testId: string;
}

function ComponentListCard({ title, items, emptyText, testId }: IComponentListCardProps) {
    return (
        <Paper p="md" radius="md" withBorder data-testid={testId}>
            <Title order={4} mb="sm">{title}</Title>
            {items.length === 0 ? (
                <Text size="sm" c="dimmed">{emptyText}</Text>
            ) : (
                <ScrollArea.Autosize mah={360} type="auto">
                    <Table verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th className={tableStyles.tableHeader}>Name</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Version</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Licence</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {items.map((item) => (
                                <Table.Tr key={item.name}>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Text size="sm">{item.name}</Text>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        {item.version ? (
                                            <Code>{item.version}</Code>
                                        ) : (
                                            <Text size="sm" c="dimmed">unknown</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Text size="sm" c="dimmed">{item.license ?? ''}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea.Autosize>
            )}
        </Paper>
    );
}

interface IPlatformInventoryCardsProps {
    /** Backend frameworks from the version endpoint; `undefined` while it loads or on an older backend. */
    frameworks: readonly IAboutItem[] | undefined;
    /** Backend libraries from the version endpoint; `undefined` while it loads or on an older backend. */
    libraries: readonly IAboutItem[] | undefined;
}

export function PlatformInventoryCards({ frameworks, libraries }: IPlatformInventoryCardsProps) {
    return (
        <Grid>
            {frameworks && libraries && (
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Stack gap="md">
                        <ComponentListCard
                            title="Backend frameworks"
                            items={frameworks}
                            emptyText="The backend reported no frameworks."
                            testId="system-backend-frameworks"
                        />
                        <ComponentListCard
                            title="Backend libraries"
                            items={libraries}
                            emptyText="The backend reported no libraries."
                            testId="system-backend-libraries"
                        />
                    </Stack>
                </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
                <ComponentListCard
                    title="Website libraries"
                    items={WEB_LIBRARIES}
                    emptyText="This build has no generated library list."
                    testId="system-web-libraries"
                />
            </Grid.Col>
        </Grid>
    );
}
