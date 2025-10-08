"use client";

import { useState } from 'react';
import {
    Modal,
    Stack,
    TextInput,
    Button,
    Group,
    Text,
    Alert,
    LoadingOverlay,
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';

interface IDeleteLanguageModalProps {
    opened: boolean;
    onClose: () => void;
    onConfirm: () => void;
    languageName: string;
    languageLocale: string;
    isLoading?: boolean;
}

export function DeleteLanguageModal({
    opened,
    onClose,
    onConfirm,
    languageName,
    languageLocale,
    isLoading = false,
}: IDeleteLanguageModalProps) {
    const [confirmText, setConfirmText] = useState('');

    const handleClose = () => {
        setConfirmText('');
        onClose();
    };

    const handleConfirm = () => {
        if (confirmText === languageName) {
            onConfirm();
            setConfirmText('');
        }
    };

    const isValidConfirmation = confirmText === languageName;

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="xs">
                    <IconAlertTriangle size={20} color="red" />
                    <Text size="lg" fw={600} c="red">
                        Delete Language
                    </Text>
                </Group>
            }
            centered
            size="md"
        >
            <LoadingOverlay visible={isLoading} />

            <Stack gap="md">
                <Alert color="red" variant="light">
                    <Text size="sm">
                        <strong>Warning:</strong> This action cannot be undone. Deleting this language may affect existing content and user preferences.
                    </Text>
                </Alert>

                <div>
                    <Text size="sm" mb="xs">
                        You are about to delete the language: <strong>{languageName} ({languageLocale})</strong>
                    </Text>
                    <Text size="sm" c="dimmed">
                        To confirm deletion, please type the language name below:
                    </Text>
                </div>

                <TextInput
                    label="Confirm Language Name"
                    placeholder={languageName}
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.currentTarget.value)}
                    error={confirmText && !isValidConfirmation ? 'Language name does not match' : null}
                />

                <Group justify="flex-end" gap="sm">
                    <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={handleConfirm}
                        disabled={!isValidConfirmation || isLoading}
                        loading={isLoading}
                    >
                        Delete Language
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
