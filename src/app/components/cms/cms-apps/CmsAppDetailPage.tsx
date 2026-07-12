/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useEffect, useMemo, useState } from 'react';
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
    Select,
    TextInput,
    Paper,
    Code,
    Loader,
    Center,
} from '@mantine/core';
import {
    IconExternalLink,
    IconEye,
    IconWand,
    IconArrowLeft,
    IconTrash,
    IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    useAssignCmsAppPageMutation,
    useChangeCmsAppPageRoleMutation,
    useCmsAppBySlugQuery,
    useUnassignCmsAppPageMutation,
    useUpdateCmsAppMutation,
} from '../../../../hooks/useCmsApps';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useAuth } from '../../../../hooks/useAuth';
import { CMS_APP_ROLES, type TCmsAppRole } from '../../../../types/requests/admin/cms-app.types';
import { ScaffoldCmsAppModal } from './ScaffoldCmsAppModal';
import { DeleteCmsAppModal } from './DeleteCmsAppModal';

interface ICmsAppDetailPageProps {
    slug: string;
}

const ROLE_OPTIONS = CMS_APP_ROLES.map((role) => ({ value: role, label: role }));

export function CmsAppDetailPage({ slug }: ICmsAppDetailPageProps) {
    const router = useRouter();
    const { permissionChecker } = useAuth();
    const canUpdate = permissionChecker?.canUpdateCmsApps() ?? false;
    const canDelete = permissionChecker?.canDeleteCmsApps() ?? false;

    const { data: app, isLoading, error, refetch } = useCmsAppBySlugQuery(slug);
    const { pages: allPages } = useAdminPages();

    const [scaffoldOpen, setScaffoldOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    /** Local metadata draft; cleared when it no longer matches the loaded app id. */
    const [metadataDraft, setMetadataDraft] = useState<{
        appId: number;
        name: string;
        slug: string;
        description: string;
    } | null>(null);
    const [assignPageId, setAssignPageId] = useState<string | null>(null);
    const [assignRole, setAssignRole] = useState<TCmsAppRole>('other');

    useEffect(() => {
        if (app && app.slug !== slug) {
            router.replace(`/admin/cms-apps/${app.slug}`);
        }
    }, [app, slug, router]);

    const updateMutation = useUpdateCmsAppMutation(app?.id ?? 0);
    const assignMutation = useAssignCmsAppPageMutation(app?.id ?? 0);
    const changeRoleMutation = useChangeCmsAppPageRoleMutation(app?.id ?? 0);
    const unassignMutation = useUnassignCmsAppPageMutation(app?.id ?? 0);

    const unassignedPages = useMemo(() => {
        const assignedIds = new Set((app?.pages ?? []).map((page) => page.page_id));
        return allPages
            .filter((page) => !page.cms_app_id && !assignedIds.has(page.id_pages))
            .map((page) => ({
                value: String(page.id_pages),
                label: `${page.keyword} (${page.url ?? '—'})`,
            }));
    }, [allPages, app?.pages]);

    if (isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (error || !app) {
        return (
            <Alert color="red" title="CMS app not found">
                {(error as Error | undefined)?.message ?? `No app with slug “${slug}”.`}
            </Alert>
        );
    }

    const name =
        metadataDraft?.appId === app.id ? metadataDraft.name : app.name;
    const appSlug =
        metadataDraft?.appId === app.id ? metadataDraft.slug : app.slug;
    const description =
        metadataDraft?.appId === app.id
            ? metadataDraft.description
            : (app.description ?? '');

    const setName = (value: string) =>
        setMetadataDraft({ appId: app.id, name: value, slug: appSlug, description });
    const setAppSlug = (value: string) =>
        setMetadataDraft({ appId: app.id, name, slug: value, description });
    const setDescription = (value: string) =>
        setMetadataDraft({ appId: app.id, name, slug: appSlug, description: value });

    const formPage = app.pages.find((page) => page.cms_app_role === 'form');

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Group gap="sm">
                    <Button
                        variant="subtle"
                        component={Link}
                        href="/admin/cms-apps"
                        leftSection={<IconArrowLeft size="1rem" />}
                    >
                        All apps
                    </Button>
                    <Title order={2}>{app.name}</Title>
                    <Badge variant="light">id {app.id}</Badge>
                </Group>
                <Group gap="xs">
                    {(app.cms_list_keyword || app.id_cms_list_page) && (
                        <Button
                            component={Link}
                            href={`/admin/cms-apps/${encodeURIComponent(app.slug)}/content`}
                            leftSection={<IconExternalLink size="1rem" />}
                        >
                            Manage content
                        </Button>
                    )}
                    {app.public_list_keyword && (
                        <Button
                            component="a"
                            href={`/admin/preview/${app.public_list_keyword}`}
                            target="_blank"
                            variant="light"
                            leftSection={<IconEye size="1rem" />}
                        >
                            Live preview
                        </Button>
                    )}
                    {canUpdate && (
                        <Button
                            variant="light"
                            leftSection={<IconWand size="1rem" />}
                            onClick={() => setScaffoldOpen(true)}
                        >
                            Scaffold
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            color="red"
                            variant="light"
                            leftSection={<IconTrash size="1rem" />}
                            onClick={() => setDeleteOpen(true)}
                        >
                            Delete shell
                        </Button>
                    )}
                </Group>
            </Group>

            <Text size="sm" c="dimmed">
                Host Admin authors structure. Editors manage records under{' '}
                <Code>CMS Apps → {app.name}</Code> (admin content host). Public list/detail pages
                remain on the website. Deleting the shell does not delete pages, form sections,
                tables, or records.
            </Text>

            <Paper withBorder p="md">
                <Stack gap="sm">
                    <Title order={4}>Metadata</Title>
                    <Group grow>
                        <TextInput
                            label="Name"
                            value={name}
                            disabled={!canUpdate}
                            onChange={(event) => setName(event.currentTarget.value)}
                        />
                        <TextInput
                            label="Slug"
                            value={appSlug}
                            disabled={!canUpdate}
                            onChange={(event) => setAppSlug(event.currentTarget.value)}
                        />
                    </Group>
                    <TextInput
                        label="Description"
                        value={description}
                        disabled={!canUpdate}
                        onChange={(event) => setDescription(event.currentTarget.value)}
                    />
                    {canUpdate && (
                        <Button
                            w="fit-content"
                            loading={updateMutation.isPending}
                            onClick={() =>
                                updateMutation.mutate(
                                    {
                                        name: name.trim(),
                                        slug: appSlug.trim(),
                                        description: description.trim() || null,
                                    },
                                    {
                                        onSuccess: () => {
                                            setMetadataDraft(null);
                                            void refetch();
                                        },
                                    }
                                )
                            }
                        >
                            Save metadata
                        </Button>
                    )}
                </Stack>
            </Paper>

            {formPage && (
                <Alert color="grape" title="Form structure">
                    Edit form fields (add/remove inputs) on{' '}
                    <Anchor component={Link} href={`/admin/pages/${formPage.keyword}`}>
                        {formPage.keyword}
                    </Anchor>
                    .
                </Alert>
            )}

            <Paper withBorder p="md">
                <Stack gap="sm">
                    <Group justify="space-between">
                        <Title order={4}>Assigned pages</Title>
                        {app.pages.length === 0 && canUpdate && (
                            <Text size="sm" c="dimmed">Empty — scaffold or assign pages below.</Text>
                        )}
                    </Group>
                    <Table withTableBorder>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Keyword</Table.Th>
                                <Table.Th>URL</Table.Th>
                                <Table.Th>Role</Table.Th>
                                <Table.Th />
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {app.pages.map((page) => (
                                <Table.Tr key={page.page_id}>
                                    <Table.Td>
                                        <Anchor component={Link} href={`/admin/pages/${page.keyword}`}>
                                            {page.keyword}
                                        </Anchor>
                                    </Table.Td>
                                    <Table.Td>
                                        <Code>{page.url ?? '—'}</Code>
                                    </Table.Td>
                                    <Table.Td>
                                        {canUpdate ? (
                                            <Select
                                                data={ROLE_OPTIONS}
                                                value={page.cms_app_role}
                                                allowDeselect={false}
                                                w={160}
                                                onChange={(value) => {
                                                    if (!value) return;
                                                    changeRoleMutation.mutate(
                                                        { pageId: page.page_id, role: value as TCmsAppRole },
                                                        { onSuccess: () => void refetch() }
                                                    );
                                                }}
                                            />
                                        ) : (
                                            <Badge>{page.cms_app_role}</Badge>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {canUpdate && (
                                            <Button
                                                size="compact-xs"
                                                variant="subtle"
                                                color="red"
                                                loading={unassignMutation.isPending}
                                                onClick={() =>
                                                    unassignMutation.mutate(page.page_id, {
                                                        onSuccess: () => void refetch(),
                                                    })
                                                }
                                            >
                                                Unassign
                                            </Button>
                                        )}
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>

                    {canUpdate && (
                        <Group align="flex-end" grow>
                            <Select
                                label="Assign existing page"
                                placeholder="Select a page"
                                data={unassignedPages}
                                searchable
                                clearable
                                value={assignPageId}
                                onChange={setAssignPageId}
                            />
                            <Select
                                label="Role"
                                data={ROLE_OPTIONS}
                                value={assignRole}
                                allowDeselect={false}
                                onChange={(value) => value && setAssignRole(value as TCmsAppRole)}
                            />
                            <Button
                                leftSection={<IconPlus size="1rem" />}
                                disabled={!assignPageId}
                                loading={assignMutation.isPending}
                                onClick={() => {
                                    if (!assignPageId) return;
                                    assignMutation.mutate(
                                        { page_id: Number(assignPageId), role: assignRole },
                                        {
                                            onSuccess: () => {
                                                setAssignPageId(null);
                                                void refetch();
                                            },
                                        }
                                    );
                                }}
                            >
                                Assign
                            </Button>
                        </Group>
                    )}
                </Stack>
            </Paper>

            <ScaffoldCmsAppModal
                opened={scaffoldOpen}
                onClose={() => {
                    setScaffoldOpen(false);
                    void refetch();
                }}
                appId={app.id}
                defaultBaseName={app.slug}
            />
            <DeleteCmsAppModal
                opened={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                appId={app.id}
                appName={app.name}
                appSlug={app.slug}
                onDeleted={() => router.push('/admin/cms-apps')}
            />
        </Stack>
    );
}
