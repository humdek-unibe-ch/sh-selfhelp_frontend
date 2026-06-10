/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Modal, Stack, TextInput, Textarea, Button, Group, Text, Alert, List, Loader } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconAlertTriangle } from '@tabler/icons-react';
import type { ISectionPage } from '../../../../../types/responses/admin/section-utility.types';

interface IPublishVersionModalProps {
    opened: boolean;
    onClose: () => void;
    onPublish: (data: { version_name?: string; metadata?: { description?: string } }) => void;
    isLoading?: boolean;
    affectedPublishedPages?: ISectionPage[];
    isCheckingAffectedPages?: boolean;
}

interface IPublishFormValues {
    versionName: string;
    description: string;
}

export function PublishVersionModal({ opened, onClose, onPublish, isLoading, affectedPublishedPages, isCheckingAffectedPages }: IPublishVersionModalProps) {
    const form = useForm<IPublishFormValues>({
        initialValues: {
            versionName: '',
            description: '',
        },
    });

    function handleSubmit(values: IPublishFormValues) {
        const data = {
            version_name: values.versionName || undefined,
            metadata: values.description ? { description: values.description } : undefined,
        };
        
        onPublish(data);
        form.reset();
    }

    function handleClose() {
        form.reset();
        onClose();
    }

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Publish New Version"
            size="md"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Create a new published version from the current page state. This will snapshot
                        all content, sections, and configurations.
                    </Text>

                    {isCheckingAffectedPages && (
                        <Group gap="xs">
                            <Loader size="xs" />
                            <Text size="sm" c="dimmed">Checking for affected pages...</Text>
                        </Group>
                    )}

                    {!isCheckingAffectedPages && affectedPublishedPages && affectedPublishedPages.length > 0 && (
                        <Alert
                            color="yellow"
                            title="Republish required on other pages"
                            icon={<IconAlertTriangle size={16} />}
                        >
                            <Stack gap="xs">
                                <Text size="sm">
                                    This page contains reference container{affectedPublishedPages.length > 1 ? 's' : ''} also used on the following published page{affectedPublishedPages.length > 1 ? 's' : ''}. To make your changes visible there, those pages will need to be republished.
                                </Text>
                                <List size="sm" withPadding>
                                    {affectedPublishedPages.map((page) => (
                                        <List.Item key={page.id}>
                                            <Text
                                                size="sm"
                                                fw={500}
                                                component="a"
                                                href={`/admin/pages/${page.keyword}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                            >
                                                {page.keyword}
                                            </Text>
                                        </List.Item>
                                    ))}
                                </List>
                            </Stack>
                        </Alert>
                    )}

                    <TextInput
                        label="Version Name"
                        placeholder="e.g., Homepage Update v2.1"
                        description="Optional: Give this version a meaningful name"
                        {...form.getInputProps('versionName')}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Describe the changes in this version..."
                        description="Optional: Document what changed in this version"
                        minRows={3}
                        maxRows={6}
                        {...form.getInputProps('description')}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button 
                            variant="subtle" 
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            leftSection={<IconDeviceFloppy size={16} />}
                            loading={isLoading}
                        >
                            Publish Version
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}

