/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
import { Button, Paper, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { PageHeader } from '../../../shared/common/PageHeader';
import { useAuthUser } from '../../../../../hooks/useUserData';
import { PERMISSIONS } from '../../../../../types/auth/jwt-payload.types';

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

    const { languages } = useAdminLanguages();
    // admin.language.update covers create, update and delete; without it the screen is read-only.
    const { permissionChecker } = useAuthUser();
    const canChange = permissionChecker?.hasPermission(PERMISSIONS.ADMIN_LANGUAGE_UPDATE) ?? false;

    // Mutations
    const _createLanguageMutation = useCreateLanguageMutation();
    const _updateLanguageMutation = useUpdateLanguageMutation();
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
      <Paper radius="md">
        <Stack gap="md">
          {/* Standardized Header */}
          <PageHeader
            title="Languages"
            subtitle="Manage available languages and locales"
            badge={languages?.length ?? 0}
            badgeAriaLabel="languages"
          >
            {canChange && (
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={handleCreateLanguage}
              >
                Add Language
              </Button>
            )}
          </PageHeader>
          <LanguagesList
            onCreateLanguage={canChange ? handleCreateLanguage : undefined}
            onEditLanguage={canChange ? handleEditLanguage : undefined}
            onDeleteLanguage={canChange ? handleDeleteLanguage : undefined}
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
