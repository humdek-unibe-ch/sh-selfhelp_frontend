"use client";

import { useState } from 'react';
import {
    useCreateLanguageMutation,
    useUpdateLanguageMutation,
    useDeleteLanguageMutation
} from '../../../../../hooks/mutations/useLanguageMutations';
import { LanguagesList } from '../languages-list/LanguagesList';
import { LanguageFormModal } from '../language-form-modal/LanguageFormModal';
import { DeleteLanguageModal } from '../delete-language-modal/DeleteLanguageModal';
import { Group, Container, Button, Text, Paper, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export function LanguagesPage() {
    const [languageFormModal, setLanguageFormModal] = useState<{
        opened: boolean;
        mode: 'create' | 'edit';
        languageId?: number;
    }>({
        opened: false,
        mode: 'create',
        languageId: undefined,
    });

    const [deleteModal, setDeleteModal] = useState<{
        opened: boolean;
        languageId?: number;
        languageName?: string;
        languageLocale?: string;
    }>({
        opened: false,
        languageId: undefined,
        languageName: undefined,
        languageLocale: undefined,
    });

    // Mutations
    const createLanguageMutation = useCreateLanguageMutation();
    const updateLanguageMutation = useUpdateLanguageMutation();
    const deleteLanguageMutation = useDeleteLanguageMutation();

    // Handle create language
    const handleCreateLanguage = () => {
        setLanguageFormModal({
            opened: true,
            mode: 'create',
            languageId: undefined,
        });
    };

    // Handle edit language
    const handleEditLanguage = (languageId: number) => {
        setLanguageFormModal({
            opened: true,
            mode: 'edit',
            languageId,
        });
    };

    // Handle delete language
    const handleDeleteLanguage = (languageId: number, languageName: string, languageLocale: string) => {
        setDeleteModal({
            opened: true,
            languageId,
            languageName,
            languageLocale,
        });
    };

    const handleConfirmDelete = () => {
        if (deleteModal.languageId) {
            deleteLanguageMutation.mutate(deleteModal.languageId, {
                onSuccess: () => {
                    setDeleteModal({
                        opened: false,
                        languageId: undefined,
                        languageName: undefined,
                        languageLocale: undefined,
                    });
                },
            });
        }
    };

    return (
      <Paper p="md" radius="md">
        <Stack gap="md">
          {/* Standardized Header */}
          <Group justify="space-between" align="center" wrap="wrap" gap="xs">
            <Group justify="space-between">
              <Container pl={0}>
                <Group gap={8} align="center">
                  <Text size="lg" fw={600}>
                    Languages
                  </Text>
                  {/* Optional: You can show total count here if you fetch it */}
                </Group>
                <Text size="sm" c="dimmed">
                  Manage available languages and locales
                </Text>
              </Container>
            </Group>

            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateLanguage}
            >
              Add Language
            </Button>
          </Group>
          <LanguagesList
            onCreateLanguage={handleCreateLanguage}
            onEditLanguage={handleEditLanguage}
            onDeleteLanguage={handleDeleteLanguage}
          />

          <LanguageFormModal
            opened={languageFormModal.opened}
            onClose={() =>
              setLanguageFormModal({
                opened: false,
                mode: "create",
                languageId: undefined,
              })
            }
            mode={languageFormModal.mode}
            languageId={languageFormModal.languageId}
          />

          <DeleteLanguageModal
            opened={deleteModal.opened}
            onClose={() =>
              setDeleteModal({
                opened: false,
                languageId: undefined,
                languageName: undefined,
                languageLocale: undefined,
              })
            }
            onConfirm={handleConfirmDelete}
            languageName={deleteModal.languageName || ""}
            languageLocale={deleteModal.languageLocale || ""}
            isLoading={deleteLanguageMutation.isPending}
          />
        </Stack>
      </Paper>
    );
}
