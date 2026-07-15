/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import {
    Stack,
    Title,
    Text,
    Button,
    Group,
    Table,
    Badge,
    Anchor,
    Alert,
    Box,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { IconPlus, IconExternalLink, IconTrash, IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { useCmsAppsQuery } from '../../../../hooks/useCmsApps';
import { useAuth } from '../../../../hooks/useAuth';
import { CreateCmsAppModal } from './CreateCmsAppModal';
import { DeleteCmsAppModal } from './DeleteCmsAppModal';
import { EmptyState } from '../../shared/common/EmptyState';
import { adminTableClasses as tableStyles } from '../shared/admin-table';

export function CmsAppsPage() {
    const { permissionChecker } = useAuth();
    const { data: apps = [], isLoading, error } = useCmsAppsQuery(
        permissionChecker?.canReadCmsApps() ?? false
    );
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{
        id: number;
        name: string;
        slug: string;
    } | null>(null);

    if (error) {
        return (
            <Alert color="red" title="Failed to load CMS apps">
                {(error as Error).message}
            </Alert>
        );
    }

    return (
        <Stack gap="md">
            <Group justify="space-between" align="flex-start">
                <div>
                    <Title order={2}>CMS Apps</Title>
                    <Text c="dimmed" size="sm">
                        Structure authoring only. Editors manage records at{' '}
                        <CodeLike>/cms/&lt;app&gt;</CodeLike> via the site shell.
                    </Text>
                </div>
                {permissionChecker?.canCreateCmsApps() && (
                    <Button leftSection={<IconPlus size="1rem" />} onClick={() => setCreateOpen(true)}>
                        Create app
                    </Button>
                )}
            </Group>

            <div className={tableStyles.tableWrapper}>
                <Box className={tableStyles.tableScrollContainer}>
                    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th className={tableStyles.tableHeader}>Name</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Slug</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Pages</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Manage content</Table.Th>
                                <Table.Th className={tableStyles.tableHeader} w={110}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {apps.map((app) => (
                                <Table.Tr key={app.id}>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Anchor component={Link} href={`/admin/cms-apps/${app.slug}`} fw={500}>
                                            {app.name}
                                        </Anchor>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Badge variant="light">{app.slug}</Badge>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>{app.page_count}</Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        {app.cms_list_keyword || app.id_cms_list_page ? (
                                            <Anchor
                                                component={Link}
                                                href={`/admin/cms-apps/${encodeURIComponent(app.slug)}/content`}
                                                size="sm"
                                            >
                                                <Group gap={4}>
                                                    <IconExternalLink size="0.85rem" />
                                                    Manage content
                                                </Group>
                                            </Anchor>
                                        ) : (
                                            <Text size="sm" c="dimmed">—</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Group gap={2} wrap="nowrap" justify="flex-end" className={tableStyles.actionsCell}>
                                            {app.public_list_keyword && (
                                                <Tooltip label="Live preview (public list)">
                                                    <ActionIcon
                                                        component="a"
                                                        href={`/admin/preview/${app.public_list_keyword}`}
                                                        target="_blank"
                                                        variant="subtle"
                                                        color="gray"
                                                        size="sm"
                                                        aria-label={`Live preview ${app.name}`}
                                                    >
                                                        <IconEye size="1rem" />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                            {permissionChecker?.canDeleteCmsApps() && (
                                                <Tooltip label="Delete shell">
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="sm"
                                                        aria-label={`Delete app ${app.name}`}
                                                        onClick={() =>
                                                            setDeleteTarget({
                                                                id: app.id,
                                                                name: app.name,
                                                                slug: app.slug,
                                                            })
                                                        }
                                                    >
                                                        <IconTrash size="1rem" />
                                                    </ActionIcon>
                                                </Tooltip>
                                            )}
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>

                {/* Empty / loading state — below the header row. */}
                {isLoading ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">Loading…</Text>
                ) : apps.length === 0 ? (
                    <EmptyState
                        title="No CMS apps yet"
                        description="Create an empty shell, then scaffold or import a template."
                    />
                ) : null}
            </div>

            <CreateCmsAppModal opened={createOpen} onClose={() => setCreateOpen(false)} />
            {deleteTarget && (
                <DeleteCmsAppModal
                    opened
                    onClose={() => setDeleteTarget(null)}
                    appId={deleteTarget.id}
                    appName={deleteTarget.name}
                    appSlug={deleteTarget.slug}
                />
            )}
        </Stack>
    );
}

function CodeLike({ children }: { children: React.ReactNode }) {
    return (
        <Text span ff="monospace" size="sm">
            {children}
        </Text>
    );
}
