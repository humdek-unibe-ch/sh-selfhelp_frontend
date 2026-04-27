'use client';

import { Select, Group, Text, Loader } from '@mantine/core';
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
    const handleLanguageChange = useCallback(async (value: string | null) => {
        if (!value) return;

        const languageId = parseInt(value, 10);

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
    
    // Don't show if languages are empty
    if (languages.length === 0) {
        return null;
    }

    // Spinner is tied strictly to the preference mutation, not to any ambient
    // page refetch. Navigating to a new page may briefly mark
    // `['page-by-keyword']` as fetching, but that has nothing to do with the
    // language selector and flashing a spinner there is noise.
    const isUpdating = updateLanguageMutation.isPending;
    
    // Use language ID as value and language name as label
    const languageOptions = languages.map(lang => ({
        value: lang.id.toString(),
        label: lang.language
    }));
    
    return (
        <Group gap="xs">
            <Text size="sm" c="dimmed">
                Language:
            </Text>
            <Select
                data={languageOptions}
                value={currentLanguageId.toString()}
                onChange={handleLanguageChange}
                size="sm"
                w={150}
                placeholder="Select language"
                searchable={false}
                clearable={false}
                disabled={isUpdating}
                rightSection={isUpdating ? <Loader size="xs" /> : undefined}
            />
        </Group>
    );
} 