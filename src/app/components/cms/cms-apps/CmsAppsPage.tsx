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
    Paper,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import { IconPlus, IconApps, IconExternalLink, IconTrash, IconEye } from '@tabler/icons-react';
import Link from 'next/link';
import { useCmsAppsQuery } from '../../../../hooks/useCmsApps';
import { useAuth } from '../../../../hooks/useAuth';
import { CreateCmsAppModal } from './CreateCmsAppModal';
import { DeleteCmsAppModal } from './DeleteCmsAppModal';

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

            <Paper withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Name</Table.Th>
                            <Table.Th>Slug</Table.Th>
                            <Table.Th>Pages</Table.Th>
                            <Table.Th>Manage content</Table.Th>
                            <Table.Th w={110}>Actions</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Text size="sm" c="dimmed">Loading…</Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : apps.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={5}>
                                    <Group gap="xs" p="md">
                                        <IconApps size="1rem" />
                                        <Text size="sm" c="dimmed">
                                            No CMS apps yet. Create an empty shell, then scaffold or import a template.
                                        </Text>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            apps.map((app) => (
                                <Table.Tr key={app.id}>
                                    <Table.Td>
                                        <Anchor component={Link} href={`/admin/cms-apps/${app.slug}`} fw={500}>
                                            {app.name}
                                        </Anchor>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{app.slug}</Badge>
                                    </Table.Td>
                                    <Table.Td>{app.page_count}</Table.Td>
                                    <Table.Td>
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
                                    <Table.Td>
                                        <Group gap={4} wrap="nowrap">
                                            {app.public_list_keyword && (
                                                <Tooltip label="Live preview (public list)">
                                                    <ActionIcon
                                                        component="a"
                                                        href={`/admin/preview/${app.public_list_keyword}`}
                                                        target="_blank"
                                                        variant="subtle"
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
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Paper>

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
