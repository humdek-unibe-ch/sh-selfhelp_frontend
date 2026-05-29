/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import {
    Stack,
    Card,
    Group,
    Button,
    Table,
    TableThead,
    TableTbody,
    TableTr,
    TableTh,
    TableTd,
    Text,
    Badge,
    ActionIcon,
    Tooltip,
    LoadingOverlay,
    Modal,
    TextInput,
    Select,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useRegistrationCodes, useCreateRegistrationCode, useDeleteRegistrationCode } from '../../../../hooks/useRegistrationCodes';
import { useGroups } from '../../../../hooks/useGroups';
import { PageHeader } from '../../shared/common/PageHeader';
import { EmptyState } from '../../shared/common/EmptyState';
import type { IRegistrationCode } from '../../../../types/responses/admin/registration-codes.types';

export function RegistrationCodesPage() {
    const { data, isFetching, error } = useRegistrationCodes();
    const { data: groupsData } = useGroups({ page: 1, pageSize: 1000 });
    const createCode = useCreateRegistrationCode();
    const deleteCode = useDeleteRegistrationCode();

    const [createModalOpened, setCreateModalOpened] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<IRegistrationCode | null>(null);
    const [newCode, setNewCode] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const groupOptions = (groupsData?.groups ?? []).map(g => ({
        value: String(g.id),
        label: g.name,
    }));

    const handleCreate = () => {
        if (!newCode.trim() || !selectedGroupId) return;

        createCode.mutate(
            { code: newCode.trim(), id_groups: Number(selectedGroupId) },
            {
                onSuccess: () => {
                    setCreateModalOpened(false);
                    setNewCode('');
                    setSelectedGroupId(null);
                },
            }
        );
    };

    const handleCloseCreate = () => {
        setCreateModalOpened(false);
        setNewCode('');
        setSelectedGroupId(null);
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        deleteCode.mutate(deleteTarget.code, {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    if (error) {
        return (
            <Card>
                <Text c="red" ta="center">Failed to load registration codes. Please try again.</Text>
            </Card>
        );
    }

    const codes = data?.codes ?? [];

    return (
        <>
            <Card>
                <Stack gap="md">
                    <PageHeader
                        title="Registration Codes"
                        subtitle="Manage invitation codes required for user registration"
                    >
                        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpened(true)}>
                            Add Code
                        </Button>
                    </PageHeader>

                    <div style={{ position: 'relative' }}>
                        <LoadingOverlay visible={isFetching} />

                        <Table striped highlightOnHover>
                            <TableThead>
                                <TableTr>
                                    <TableTh>Code</TableTh>
                                    <TableTh>Group</TableTh>
                                    <TableTh>Status</TableTh>
                                    <TableTh>Created</TableTh>
                                    <TableTh>Consumed</TableTh>
                                    <TableTh>Actions</TableTh>
                                </TableTr>
                            </TableThead>
                            <TableTbody>
                                {codes.map(item => (
                                    <TableTr key={item.code}>
                                        <TableTd>
                                            <Text size="sm" ff="monospace" fw={500}>{item.code}</Text>
                                        </TableTd>
                                        <TableTd>
                                            <Badge variant="light" color="blue">{item.group_name}</Badge>
                                        </TableTd>
                                        <TableTd>
                                            <Badge variant="light" color={item.is_consumed ? 'gray' : 'green'}>
                                                {item.is_consumed ? 'Used' : 'Available'}
                                            </Badge>
                                        </TableTd>
                                        <TableTd>
                                            <Text size="sm" c="dimmed">
                                                {new Date(item.created_at).toLocaleString()}
                                            </Text>
                                        </TableTd>
                                        <TableTd>
                                            {item.consumed_at ? (
                                                <Text size="sm" c="dimmed">
                                                    {new Date(item.consumed_at).toLocaleString()}
                                                </Text>
                                            ) : null}
                                        </TableTd>
                                        <TableTd>
                                            <Tooltip label="Delete code">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="red"
                                                    size="sm"
                                                    onClick={() => setDeleteTarget(item)}
                                                    aria-label={`Delete code ${item.code}`}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </TableTd>
                                    </TableTr>
                                ))}
                            </TableTbody>
                        </Table>

                        {!isFetching && codes.length === 0 && (
                            <EmptyState
                                title="No registration codes"
                                description="Add a code to allow users to register with an invitation"
                            />
                        )}
                    </div>
                </Stack>
            </Card>

            {/* Create modal */}
            <Modal
                opened={createModalOpened}
                onClose={handleCloseCreate}
                title="Add Registration Code"
                centered
                size="sm"
            >
                <Stack gap="md">
                    <TextInput
                        label="Code"
                        placeholder="Enter invitation code (max 16 chars)"
                        value={newCode}
                        onChange={e => setNewCode(e.currentTarget.value)}
                        maxLength={16}
                        required
                    />
                    <Select
                        label="Group"
                        placeholder="Select a group"
                        data={groupOptions}
                        value={selectedGroupId}
                        onChange={setSelectedGroupId}
                        searchable
                        required
                    />
                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={handleCloseCreate}>Cancel</Button>
                        <Button
                            onClick={handleCreate}
                            loading={createCode.isPending}
                            disabled={!newCode.trim() || !selectedGroupId}
                        >
                            Create
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Delete confirmation modal */}
            <Modal
                opened={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Registration Code"
                centered
                size="sm"
            >
                <Stack gap="md">
                    <Text size="sm">
                        Are you sure you want to delete the code{' '}
                        <Text component="span" ff="monospace" fw={600}>{deleteTarget?.code}</Text>?
                        This action cannot be undone.
                    </Text>
                    <Group justify="flex-end" gap="sm">
                        <Button variant="light" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                        <Button
                            color="red"
                            onClick={handleConfirmDelete}
                            loading={deleteCode.isPending}
                        >
                            Delete
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
