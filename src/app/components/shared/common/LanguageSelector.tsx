/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Menu, UnstyledButton, Group, Text, Loader } from '@mantine/core';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAuth } from '../../../../hooks/useAuth';
import { useUpdateLanguagePreferenceMutation } from '../../../../hooks/mutations/useUpdateLanguagePreferenceMutation';
import { useCallback } from 'react';

export function LanguageSelector() {
    const { user } = useAuth();
    const {
        currentLanguageId,
        setCurrentLanguageId,
        languages,
    } = useLanguageContext();

    const updateLanguageMutation = useUpdateLanguagePreferenceMutation();

    // The language-scoped query keys (`['frontend-pages', languageId]`,
    // `['page-by-keyword', kw, languageId, ...]`) all include `languageId`,
    // so changing the language state alone routes every active observer to
    // a different cache entry — no `invalidateQueries` fan-out is needed
    // here, and adding one would double-fetch the previous language under
    // React Strict Mode (the updater would run twice and queue two
    // refetches before the state has even committed).
    const handleLanguageChange = useCallback((languageId: number) => {
        if (languageId === currentLanguageId) return;

        setCurrentLanguageId(languageId);

        if (user) {
            updateLanguageMutation.mutate(languageId, {
                onError: () => {
                    if (user.languageId) {
                        const userLanguageId = typeof user.languageId === 'number'
                            ? user.languageId
                            : parseInt(String(user.languageId), 10);
                        setCurrentLanguageId(userLanguageId);
                    }
                }
            });
        }
    }, [user, updateLanguageMutation, setCurrentLanguageId, currentLanguageId]);

    if (languages.length === 0) {
        return null;
    }

    // Spinner is tied strictly to the preference mutation, not to any ambient
    // page refetch. Navigating to a new page may briefly mark
    // `['page-by-keyword']` as fetching, but that has nothing to do with the
    // language selector and flashing a spinner there is noise.
    const isUpdating = updateLanguageMutation.isPending;
    const currentLanguage = languages.find(l => l.id === currentLanguageId) ?? languages[0];

    const currentShort = currentLanguage.locale.split('-')[0].toUpperCase();

    return (
        <Menu position="bottom-end" withArrow>
            <Menu.Target>
                <UnstyledButton
                    disabled={isUpdating}
                    aria-label={`Select language (current: ${currentLanguage.language})`}
                >
                    <Group gap={6} wrap="nowrap">
                        <Text size="sm" fw={500}>{currentShort}</Text>
                        {isUpdating
                            ? <Loader size="xs" />
                            : <IconChevronDown size={14} aria-hidden="true" />
                        }
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                {languages.map(lang => {
                    const isActive = lang.id === currentLanguageId;
                    return (
                        <Menu.Item
                            key={lang.id}
                            leftSection={<Text size="sm" fw={600}>{lang.locale.split('-')[0].toUpperCase()}</Text>}
                            rightSection={isActive ? <IconCheck size={14} aria-hidden="true" /> : null}
                            fw={isActive ? 600 : undefined}
                            aria-current={isActive ? 'true' : undefined}
                            onClick={() => handleLanguageChange(lang.id)}
                        >
                            {lang.language}
                        </Menu.Item>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}
