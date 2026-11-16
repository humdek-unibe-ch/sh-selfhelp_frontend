/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Create empty CMS app shell modal (name + slug only).
 */

import { TextInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { ModalWrapper } from '../../shared/common/CustomModal/CustomModal';
import { useCreateCmsAppShellMutation } from '../../../../hooks/useCmsApps';

interface ICreateCmsAppModalProps {
    opened: boolean;
    onClose: () => void;
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function CreateCmsAppModal({ opened, onClose }: ICreateCmsAppModalProps) {
    const router = useRouter();
    const createMutation = useCreateCmsAppShellMutation();
    // Mantine form v9 marks a field touched on every setFieldValue (touchTrigger: "change").
    // Track a real user edit of slug separately so name→slug auto-fill keeps working.
    const slugEditedByUser = useRef(false);

    const form = useForm({
        initialValues: { name: '', slug: '', description: '' },
        validate: {
            name: (value) => (value.trim() ? null : 'Name is required'),
            slug: (value) =>
                /^[a-z0-9-]+$/.test(value) ? null : 'Use lowercase letters, numbers and hyphens',
        },
    });

    const handleClose = () => {
        slugEditedByUser.current = false;
        form.reset();
        createMutation.reset();
        onClose();
    };

    const handleSave = () => {
        const validation = form.validate();
        if (validation.hasErrors) {
            return;
        }
        createMutation.mutate(
            {
                name: form.values.name.trim(),
                slug: form.values.slug.trim(),
                description: form.values.description.trim() || null,
            },
            {
                onSuccess: (app) => {
                    handleClose();
                    router.push(`/admin/cms-apps/${app.slug}`);
                },
            }
        );
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title="Create CMS app"
            size="md"
            onSave={handleSave}
            saveLabel="Create"
            isLoading={createMutation.isPending}
        >
            <Stack gap="sm">
                <TextInput
                    label="Name"
                    placeholder="Team Members"
                    withAsterisk
                    {...form.getInputProps('name')}
                    onChange={(event) => {
                        const name = event.currentTarget.value;
                        form.setFieldValue('name', name);
                        if (!slugEditedByUser.current) {
                            form.setFieldValue('slug', slugify(name));
                        }
                    }}
                />
                <TextInput
                    label="Slug"
                    description="Used in Host Admin URLs (lowercase letters, numbers, hyphens). Backend mutations use the numeric app id."
                    placeholder="team-members"
                    withAsterisk
                    {...form.getInputProps('slug')}
                    onChange={(event) => {
                        slugEditedByUser.current = true;
                        form.setFieldValue('slug', slugify(event.currentTarget.value));
                    }}
                />
                <TextInput
                    label="Description"
                    placeholder="Optional"
                    {...form.getInputProps('description')}
                />
            </Stack>
        </ModalWrapper>
    );
}
