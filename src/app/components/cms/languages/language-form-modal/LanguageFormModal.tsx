"use client";

import { useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
    Stack,
    TextInput,
    Text,
} from '@mantine/core';
import { useCreateLanguageMutation, useUpdateLanguageMutation } from '../../../../../hooks/mutations/useLanguageMutations';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { ModalWrapper } from '../../../shared';

interface ILanguageFormModalProps {
    opened: boolean;
    onClose: () => void;
    languageId?: number | null;
    mode: 'create' | 'edit';
}

interface ILanguageFormValues {
    locale: string;
    language: string;
    csvSeparator: string;
}

export function LanguageFormModal({ opened, onClose, languageId, mode }: ILanguageFormModalProps) {
    // Mutations
    const createLanguageMutation = useCreateLanguageMutation({
        onSuccess: () => {
            form.reset();
            onClose();
        },
    });
    const updateLanguageMutation = useUpdateLanguageMutation({
        onSuccess: () => {
            form.reset();
            onClose();
        },
    });

    // Get language details for editing
    const { languages } = useAdminLanguages();
    const languageDetails = languageId ? languages?.find(lang => lang.id === languageId) : null;

    // Form
    const form = useForm<ILanguageFormValues>({
        initialValues: {
            locale: '',
            language: '',
            csvSeparator: ',',
        },
        validate: {
            locale: (value) => {
                if (!value) return 'Locale is required';
                if (!/^[a-z]{2}-[A-Z]{2}$/.test(value)) return 'Locale must be in format: xx-XX (e.g., en-US, de-CH)';
                return null;
            },
            language: (value) => (!value ? 'Language name is required' : null),
            csvSeparator: (value) => (!value ? 'CSV separator is required' : null),
        },
    });

    // Load language data for editing
    useEffect(() => {
        if (mode === 'edit' && languageDetails) {
            form.setValues({
                locale: languageDetails.locale,
                language: languageDetails.language,
                csvSeparator: languageDetails.csvSeparator,
            });
        } else if (mode === 'create') {
            form.reset();
        }
    }, [mode, languageDetails]);

    // Handle form submission
    const handleSubmit = (values: ILanguageFormValues) => {
        if (mode === 'create') {
            createLanguageMutation.mutate(values);
        } else if (mode === 'edit' && languageId) {
            updateLanguageMutation.mutate({ languageId, languageData: values });
        }
    };

    const isLoading = createLanguageMutation.isPending || updateLanguageMutation.isPending;

    const handleSave = () => {
        form.onSubmit(handleSubmit)();
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={onClose}
            title={mode === 'create' ? 'Create Language' : 'Edit Language'}
            size="md"
            onSave={handleSave}
            onCancel={onClose}
            isLoading={isLoading}
            saveLabel={mode === 'create' ? 'Create Language' : 'Update Language'}
            cancelLabel="Cancel"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <TextInput
                        label="Locale"
                        placeholder="e.g., en-US, de-CH, fr-FR"
                        description="Language locale in format: xx-XX"
                        {...form.getInputProps('locale')}
                        required
                    />

                    <TextInput
                        label="Language Name"
                        placeholder="e.g., English (US), Deutsch (Schweiz), Français (France)"
                        description="Human-readable language name"
                        {...form.getInputProps('language')}
                        required
                    />

                    <TextInput
                        label="CSV Separator"
                        placeholder="e.g., ,, ;"
                        description="Character used to separate CSV values"
                        {...form.getInputProps('csvSeparator')}
                        required
                    />

                    <Text size="sm" c="dimmed">
                        {mode === 'create'
                            ? 'Create a new language that can be used throughout the application.'
                            : 'Update the language details. Changes will be reflected immediately.'
                        }
                    </Text>
                </Stack>
            </form>
        </ModalWrapper>
    );
}
