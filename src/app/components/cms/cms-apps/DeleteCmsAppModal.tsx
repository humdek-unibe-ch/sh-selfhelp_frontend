/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Confirm deleting a CMS app shell (pages and records are kept).
 */

import { Alert, Stack, Text, Code } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import { useDeleteCmsAppMutation } from '../../../../hooks/useCmsApps';

interface IDeleteCmsAppModalProps {
    opened: boolean;
    onClose: () => void;
    appId: number;
    appName: string;
    appSlug: string;
    onDeleted?: () => void;
}

export function DeleteCmsAppModal({
    opened,
    onClose,
    appId,
    appName,
    appSlug,
    onDeleted,
}: IDeleteCmsAppModalProps) {
    const deleteMutation = useDeleteCmsAppMutation();

    const handleDelete = () => {
        deleteMutation.mutate(appId, {
            onSuccess: () => {
                onClose();
                onDeleted?.();
            },
        });
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={onClose}
            title={`Delete app “${appName}”?`}
            size="md"
            onDelete={handleDelete}
            deleteLabel="Delete shell"
            isLoading={deleteMutation.isPending}
        >
            <Stack gap="md">
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    title="Removes the CMS Apps listing only"
                    color="red"
                    variant="light"
                >
                    <Text size="sm">
                        The app shell <Code>{appSlug}</Code> will be removed from{' '}
                        <strong>CMS Apps</strong>. Assigned pages return to Content Pages.
                    </Text>
                </Alert>
                <Text size="sm" c="dimmed">
                    Pages, form sections, data tables, and member/post records are{' '}
                    <strong>not</strong> deleted. You can reopen Manage content via those pages
                    or assign them to a new app later.
                </Text>
            </Stack>
        </ModalWrapper>
    );
}
