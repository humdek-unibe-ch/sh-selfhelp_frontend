'use client';

import { useState } from 'react';
import {
    Modal,
    Stack,
    Alert,
    Text,
    Group,
    Button
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { IPageSectionWithFields } from '../../../../../types/common/pages.type';

interface IRemoveSectionModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    section: IPageSectionWithFields;
    isLoading?: boolean;
}

export function RemoveSectionModal({ opened, onClose, onConfirm, section, isLoading = false }: IRemoveSectionModalProps) {

    if (!section) return null;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Remove Section"
            centered
        >
            <Stack gap="md">
                <Alert 
                    color="blue" 
                    title="Remove Section" 
                    icon={<IconInfoCircle size={16} />}
                >
                    This will remove the section from this page/parent, but the section will not be deleted permanently. 
                    You can add it back later from the unused sections.
                    {section.children && section.children.length > 0 && (
                        <Text size="sm" mt="xs">
                            <strong>Note:</strong> This section has {section.children.length} child section(s) that will also be removed.
                        </Text>
                    )}
                </Alert>
                
                <Text size="sm">
                    Are you sure you want to remove section: <Text span fw={700}>{section.section_name}</Text>?
                </Text>
                
                <Group justify="flex-end" gap="sm">
                    <Button
                        variant="light"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="orange"
                        onClick={onConfirm}
                        loading={isLoading}
                    >
                        Remove Section
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
} 