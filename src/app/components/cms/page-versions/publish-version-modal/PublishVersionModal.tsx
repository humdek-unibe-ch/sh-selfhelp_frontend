'use client';

import { Modal, Stack, TextInput, Textarea, Button, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy } from '@tabler/icons-react';

interface IPublishVersionModalProps {
    opened: boolean;
    onClose: () => void;
    onPublish: (data: { version_name?: string; metadata?: { description?: string } }) => void;
    isLoading?: boolean;
}

interface IPublishFormValues {
    versionName: string;
    description: string;
}

export function PublishVersionModal({ opened, onClose, onPublish, isLoading }: IPublishVersionModalProps) {
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

