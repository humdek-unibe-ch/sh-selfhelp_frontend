'use client';

import { Select, Group, Text, Loader } from '@mantine/core';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useUpdateLanguagePreferenceMutation } from '../../../hooks/mutations/useUpdateLanguagePreferenceMutation';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function LanguageSelector() {
    const { user } = useAuth();
    const { 
        currentLanguageId,
        setCurrentLanguageId, 
        languages, 
        isUpdatingLanguage
    } = useLanguageContext();
    
    const queryClient = useQueryClient();
    const updateLanguageMutation = useUpdateLanguagePreferenceMutation();
    
    const handleLanguageChange = useCallback(async (value: string | null) => {
        if (!value) return;
        
        const languageId = parseInt(value, 10);
        
        // Don't do anything if it's the same language
        if (languageId === currentLanguageId) return;
        
        // Update the context immediately
        setCurrentLanguageId(languageId);
        
        if (user) {
            // For authenticated users, update preference via API
            updateLanguageMutation.mutate(languageId, {
                onError: () => {
                    // On error, revert to the user's current language from JWT token
                    if (user.languageId) {
                        const userLanguageId = typeof user.languageId === 'number' 
                            ? user.languageId 
                            : parseInt(String(user.languageId), 10);
                        setCurrentLanguageId(userLanguageId);
                    }
                }
            });
        } else {
            // For non-authenticated users, invalidate queries to refresh with new language
            await queryClient.invalidateQueries({ queryKey: ['page-content'] });
            await queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
        }
    }, [user, updateLanguageMutation, setCurrentLanguageId, currentLanguageId, queryClient]);
    
    // Don't show if languages are empty
    if (languages.length === 0) {
        return null;
    }
    
    // Check if currently updating
    const isUpdating = isUpdatingLanguage || updateLanguageMutation.isPending;
    
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