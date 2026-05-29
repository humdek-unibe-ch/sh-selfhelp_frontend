/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginSourcesPanel` — admin UI to manage plugin registry sources
 * (public + private). Used inside `PluginsPage`'s Sources tab.
 *
 * The component uses the shared `ModalWrapper` (per the frontend modal
 * rule in `AGENTS.md`) and renders system-managed rows (e.g. the
 * default `humdek-public` registry) as read-only — only the `enabled`
 * toggle remains editable on those.
 */

import { useState } from 'react';
import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    Group,
    Loader,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconLock, IconTrash } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import {
    useAdminPluginSourceCreate,
    useAdminPluginSourceDelete,
    useAdminPluginSourceUpdate,
    useAdminPluginSources,
} from '../hooks/useAdminPlugins';
import type { IAdminPluginSource } from '../../../../../types/responses/admin/plugins.types';

type TKind = NonNullable<IAdminPluginSource['kind']>;

const KIND_OPTIONS: { value: TKind; label: string }[] = [
    { value: 'public-registry', label: 'Public registry (no auth)' },
    { value: 'private-registry', label: 'Private registry (auth header)' },
    { value: 'git', label: 'Git repository' },
    { value: 'local', label: 'Local manifest file' },
];

interface ISourceFormState {
    id?: number;
    name: string;
    kind: TKind;
    url: string;
    channel?: string;
    authHeaderName?: string;
    authSecretEnvVar?: string;
    enabled: boolean;
    isSystem?: boolean;
}

const EMPTY_FORM: ISourceFormState = {
    name: '',
    kind: 'public-registry',
    url: '',
    channel: 'stable',
    authHeaderName: '',
    authSecretEnvVar: '',
    enabled: true,
    isSystem: false,
};

export function PluginSourcesPanel() {
    const { data: sources, isLoading } = useAdminPluginSources();
    const createMutation = useAdminPluginSourceCreate();
    const updateMutation = useAdminPluginSourceUpdate();
    const deleteMutation = useAdminPluginSourceDelete();
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<ISourceFormState>(EMPTY_FORM);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (source: IAdminPluginSource) => {
        setForm({
            id: source.id,
            name: source.name,
            kind: source.kind,
            url: source.url,
            channel: source.channel ?? 'stable',
            authHeaderName: source.authHeaderName ?? '',
            authSecretEnvVar: source.authSecretEnvVar ?? '',
            enabled: source.enabled,
            isSystem: source.isSystem ?? false,
        });
        setModalOpen(true);
    };

    const onSubmit = async () => {
        if (!form.id) {
            if (!form.name || !form.url) {
                notifications.show({ color: 'red', title: 'Validation', message: 'Name and URL are required.' });
                return;
            }
        }
        try {
            if (form.id) {
                if (form.isSystem) {
                    // System sources: only `enabled` is mutable. The
                    // backend would reject anything else, so we keep
                    // the payload minimal client-side too.
                    await updateMutation.mutateAsync({
                        sourceId: form.id,
                        body: { enabled: form.enabled },
                    });
                } else {
                    await updateMutation.mutateAsync({
                        sourceId: form.id,
                        body: {
                            name: form.name,
                            url: form.url,
                            channel: form.channel,
                            authHeaderName: form.authHeaderName || undefined,
                            authSecretEnvVar: form.authSecretEnvVar || undefined,
                            enabled: form.enabled,
                        },
                    });
                }
                notifications.show({ color: 'green', title: 'Source updated', message: form.name });
            } else {
                await createMutation.mutateAsync({
                    name: form.name,
                    kind: form.kind,
                    url: form.url,
                    channel: form.channel,
                    authHeaderName: form.authHeaderName || undefined,
                    authSecretEnvVar: form.authSecretEnvVar || undefined,
                    enabled: form.enabled,
                });
                notifications.show({ color: 'green', title: 'Source created', message: form.name });
            }
            setModalOpen(false);
        } catch (err) {
            notifications.show({ color: 'red', title: 'Save failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    const onDelete = async (source: IAdminPluginSource) => {
        if (source.isSystem) {
            notifications.show({
                color: 'yellow',
                title: 'Cannot delete a system source',
                message: 'Disable it instead if you do not want to use it.',
            });
            return;
        }
        try {
            await deleteMutation.mutateAsync(source.id);
            notifications.show({ color: 'green', title: 'Source deleted', message: source.name });
        } catch (err) {
            notifications.show({ color: 'red', title: 'Delete failed', message: err instanceof Error ? err.message : String(err) });
        }
    };

    if (isLoading) {
        return (
            <Stack align="center" mt="md">
                <Loader />
                <Text>Loading sources…</Text>
            </Stack>
        );
    }

    const isSystemForm = Boolean(form.isSystem);

    return (
        <Stack gap="md">
            <Group justify="flex-end">
                <Button onClick={openCreate}>Add source</Button>
            </Group>

            <Table withTableBorder striped>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Kind</Table.Th>
                        <Table.Th>URL</Table.Th>
                        <Table.Th>Channel</Table.Th>
                        <Table.Th>Trust</Table.Th>
                        <Table.Th>Auth</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {(sources ?? []).map((source) => (
                        <Table.Tr key={source.id}>
                            <Table.Td>
                                <Group gap="xs" wrap="nowrap">
                                    {source.isSystem && (
                                        <Tooltip label="Host-managed (read-only)"><IconLock size={14} /></Tooltip>
                                    )}
                                    <Text fw={600}>{source.name}</Text>
                                </Group>
                            </Table.Td>
                            <Table.Td><Badge>{source.kind}</Badge></Table.Td>
                            <Table.Td>
                                <Text size="xs" style={{ wordBreak: 'break-all' }}>{source.url}</Text>
                            </Table.Td>
                            <Table.Td>{source.channel ?? 'stable'}</Table.Td>
                            <Table.Td>
                                <Badge variant="light" color={
                                    source.trustLevel === 'official'
                                        ? 'green'
                                        : source.trustLevel === 'reviewed'
                                            ? 'blue'
                                            : 'gray'
                                }>
                                    {source.trustLevel ?? 'untrusted'}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                {source.authHeaderName
                                    ? `${source.authHeaderName} via ${source.authSecretEnvVar ?? 'env'}`
                                    : 'none'}
                            </Table.Td>
                            <Table.Td>
                                <Badge color={source.enabled ? 'green' : 'gray'}>
                                    {source.enabled ? 'enabled' : 'disabled'}
                                </Badge>
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    <Tooltip label={source.isSystem ? 'Edit (toggle enabled only)' : 'Edit source'}>
                                        <ActionIcon variant="light" onClick={() => openEdit(source)}>
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label={source.isSystem ? 'System source cannot be deleted' : 'Delete source'}>
                                        <ActionIcon
                                            variant="light"
                                            color="red"
                                            disabled={source.isSystem}
                                            onClick={() => onDelete(source)}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                    {(sources ?? []).length === 0 && (
                        <Table.Tr>
                            <Table.Td colSpan={8}>
                                <Text c="dimmed" ta="center" py="md">No plugin sources configured.</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>

            <ModalWrapper
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={form.id ? (isSystemForm ? `Edit "${form.name}" (system)` : 'Edit source') : 'Add source'}
                size="lg"
                scrollAreaHeight={520}
                onSave={!form.id ? onSubmit : undefined}
                onUpdate={form.id ? onSubmit : undefined}
                onCancel={() => setModalOpen(false)}
                saveLabel="Create"
                updateLabel="Save"
                isLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Stack gap="sm">
                    <TextInput
                        label="Name"
                        required
                        description="Unique label that appears in the Sources list. Used by the host log; doesn't need to match the registry URL."
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                        disabled={isSystemForm}
                    />
                    <Select
                        label="Kind"
                        required
                        description="Choose Public registry for an unauthenticated public catalogue (default for the official Humdek registry), Private registry to send an auth header, Git to point at a Git URL, or Local to consume a manifest file on disk."
                        data={KIND_OPTIONS}
                        value={form.kind}
                        onChange={(value) => setForm({ ...form, kind: (value ?? 'public-registry') as TKind })}
                        disabled={Boolean(form.id) || isSystemForm}
                    />
                    <TextInput
                        label="URL"
                        required
                        description="Base URL of the registry. The host fetches <URL>/registry.json. Example for a private GitHub Pages mirror: https://your-org.github.io/your-plugin-registry/"
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.currentTarget.value })}
                        disabled={isSystemForm}
                    />
                    <Select
                        label="Channel"
                        description="Restrict to registry entries whose `channel` matches. Use stable for production, beta/rc for pre-releases, dev for bleeding edge."
                        data={[
                            { value: 'stable', label: 'stable' },
                            { value: 'beta', label: 'beta' },
                            { value: 'rc', label: 'rc' },
                            { value: 'dev', label: 'dev' },
                        ]}
                        value={form.channel ?? 'stable'}
                        onChange={(value) => setForm({ ...form, channel: value ?? 'stable' })}
                        disabled={isSystemForm}
                    />
                    <Alert color="gray" variant="light" title="Authentication (only for private registries)">
                        Leave both Auth fields empty for public registries — including the official Humdek registry.
                        Fill them in only when your private registry requires an authentication header (e.g. a GitHub
                        Personal Access Token or a self-hosted token). The token value itself is <strong>never stored
                        here</strong>: write the token to your server&apos;s environment as the env var named below;
                        the host reads it from the environment at fetch time.
                    </Alert>
                    <TextInput
                        label="Auth header name (optional)"
                        placeholder="X-Plugin-Token"
                        description="HTTP header name the host should send. Typical values: Authorization, X-Plugin-Token, X-API-Key."
                        value={form.authHeaderName}
                        onChange={(e) => setForm({ ...form, authHeaderName: e.currentTarget.value })}
                        disabled={isSystemForm}
                    />
                    <TextInput
                        label="Auth secret env var name (optional)"
                        placeholder="PLUGIN_REGISTRY_TOKEN"
                        description="Name of the server-side environment variable holding the actual token. Set the variable in .env.local / your deployment secrets — the host reads it at request time."
                        value={form.authSecretEnvVar}
                        onChange={(e) => setForm({ ...form, authSecretEnvVar: e.currentTarget.value })}
                        disabled={isSystemForm}
                    />
                    <Switch
                        label="Enabled"
                        description={isSystemForm ? 'You may still toggle this on a system source.' : 'Disable to temporarily hide this registry from the Available tab without deleting it.'}
                        checked={form.enabled}
                        onChange={(e) => setForm({ ...form, enabled: e.currentTarget.checked })}
                    />
                </Stack>
            </ModalWrapper>
        </Stack>
    );
}
