'use client';

import { useState } from 'react';
import {
    Modal,
    Stack,
    Alert,
    Text,
    TextInput,
    Group,
    Button
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { IPageField } from '../../../../../types/common/pages.type';
import { useDeleteSectionMutation } from '../../../../../hooks/mutations';

interface IDeleteSectionModalProps {
    opened: boolean;
    onClose: () => void;
    section: IPageField | null;
    keyword: string;
}

export function DeleteSectionModal({ opened, onClose, section, keyword }: IDeleteSectionModalProps) {
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const deleteSectionMutation = useDeleteSectionMutation({
        pageKeyword: keyword,
        onSuccess: () => {
            handleClose();
        },
        onError: () => {
            // Error handling is done by the mutation hook
        }
    });

    const handleClose = () => {
        setDeleteConfirmText('');
        onClose();
    };

    const handleDeleteSection = () => {
        if (section && deleteConfirmText === section.name) {
            deleteSectionMutation.mutate({
                keyword,
                sectionId: section.id
            });
        }
    };

    const getSectionTitle = (section: IPageField) => {
        const nameParts = section.name.split('-');
        return nameParts.length > 1 ? nameParts[1] : section.name;
    };

    if (!section) return null;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Delete Section"
            centered
        >
            <Stack gap="md">
                <Alert 
                    color="red" 
                    title="Warning" 
                    icon={<IconAlertTriangle size={16} />}
                >
                    This action cannot be undone. The section and all its content will be permanently deleted.
                    {section.children && section.children.length > 0 && (
                        <Text size="sm" mt="xs">
                            <strong>Note:</strong> This section has {section.children.length} child section(s) that will also be deleted.
                        </Text>
                    )}
                </Alert>
                
                <Text size="sm">
                    To confirm deletion, type the section name: <Text span fw={700}>{section.name}</Text>
                </Text>
                
                <TextInput
                    placeholder={`Type "${section.name}" to confirm`}
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    data-autofocus
                />
                
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="light"
                        onClick={handleClose}
                        disabled={deleteSectionMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleDeleteSection}
                        disabled={deleteConfirmText !== section.name}
                        loading={deleteSectionMutation.isPending}
                    >
                        Delete Section
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
} 