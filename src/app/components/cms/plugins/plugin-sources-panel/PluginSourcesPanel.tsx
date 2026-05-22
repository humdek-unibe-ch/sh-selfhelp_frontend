/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginSourcesPanel` — admin UI to manage plugin registry sources
 * (public + private). Used inside `PluginsPage`'s Sources tab.
 */

import { useState } from 'react';
import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Loader,
    Modal,
    Select,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import {
    useAdminPluginSourceCreate,
    useAdminPluginSourceDelete,
    useAdminPluginSourceUpdate,
    useAdminPluginSources,
} from '../hooks/useAdminPlugins';
import type { IAdminPluginSource } from '../../../../../types/responses/admin/plugins.types';

type TKind = 'public' | 'private' | 'self-hosted';

const KIND_OPTIONS: { value: TKind; label: string }[] = [
    { value: 'public', label: 'Public (no auth)' },
    { value: 'private', label: 'Private (auth header)' },
    { value: 'self-hosted', label: 'Self-hosted' },
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
}

const EMPTY_FORM: ISourceFormState = {
    name: '',
    kind: 'public',
    url: '',
    channel: 'stable',
    authHeaderName: '',
    authSecretEnvVar: '',
    enabled: true,
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
        });
        setModalOpen(true);
    };

    const onSubmit = async () => {
        if (!form.name || !form.url) {
            notifications.show({ color: 'red', title: 'Validation', message: 'Name and URL are required.' });
            return;
        }
        try {
            if (form.id) {
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
                        <Table.Th>Auth</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {(sources ?? []).map((source) => (
                        <Table.Tr key={source.id}>
                            <Table.Td><strong>{source.name}</strong></Table.Td>
                            <Table.Td><Badge>{source.kind}</Badge></Table.Td>
                            <Table.Td>
                                <Text size="xs" style={{ wordBreak: 'break-all' }}>{source.url}</Text>
                            </Table.Td>
                            <Table.Td>{source.channel ?? 'stable'}</Table.Td>
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
                                    <ActionIcon variant="light" onClick={() => openEdit(source)}>
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="light" color="red" onClick={() => onDelete(source)}>
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                    {(sources ?? []).length === 0 && (
                        <Table.Tr>
                            <Table.Td colSpan={7}>
                                <Text c="dimmed" ta="center" py="md">No plugin sources configured.</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>

            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? 'Edit source' : 'Add source'}>
                <Stack gap="sm">
                    <TextInput
                        label="Name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
                    />
                    <Select
                        label="Kind"
                        required
                        data={KIND_OPTIONS}
                        value={form.kind}
                        onChange={(value) => setForm({ ...form, kind: (value ?? 'public') as TKind })}
                        disabled={Boolean(form.id)}
                    />
                    <TextInput
                        label="URL"
                        required
                        value={form.url}
                        onChange={(e) => setForm({ ...form, url: e.currentTarget.value })}
                    />
                    <Select
                        label="Channel"
                        data={[
                            { value: 'stable', label: 'stable' },
                            { value: 'beta', label: 'beta' },
                            { value: 'rc', label: 'rc' },
                            { value: 'dev', label: 'dev' },
                        ]}
                        value={form.channel ?? 'stable'}
                        onChange={(value) => setForm({ ...form, channel: value ?? 'stable' })}
                    />
                    <TextInput
                        label="Auth header name (optional)"
                        placeholder="X-Plugin-Token"
                        value={form.authHeaderName}
                        onChange={(e) => setForm({ ...form, authHeaderName: e.currentTarget.value })}
                    />
                    <TextInput
                        label="Auth secret env var name (optional)"
                        placeholder="PLUGIN_REGISTRY_TOKEN"
                        value={form.authSecretEnvVar}
                        onChange={(e) => setForm({ ...form, authSecretEnvVar: e.currentTarget.value })}
                    />
                    <Switch
                        label="Enabled"
                        checked={form.enabled}
                        onChange={(e) => setForm({ ...form, enabled: e.currentTarget.checked })}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button loading={createMutation.isPending || updateMutation.isPending} onClick={onSubmit}>
                            {form.id ? 'Save' : 'Create'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
