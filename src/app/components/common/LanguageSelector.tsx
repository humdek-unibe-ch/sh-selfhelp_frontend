'use client';

import { Select, Group, Text, Loader } from '@mantine/core';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
import { useUpdateLanguagePreferenceMutation } from '../../../hooks/mutations/useUpdateLanguagePreferenceMutation';
import { useCallback } from 'react';

export function LanguageSelector() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { 
        currentLanguage,
        currentLanguageId,
        setCurrentLanguage, 
        languages, 
        defaultLanguage, 
        isLoading,
        isUpdatingLanguage
    } = useLanguageContext();
    
    // Mutation for updating authenticated user's language preference
    const updateLanguageMutation = useUpdateLanguagePreferenceMutation();
    
    // Use current language ID, fallback to default language's ID
    const selectedLanguageId = currentLanguageId || defaultLanguage?.id || null;
    
    // Check if currently updating language (either context or mutation)
    const isUpdating = isUpdatingLanguage || updateLanguageMutation.isPending;
    
    // Define the callback before any conditional returns
    const handleLanguageChange = useCallback((value: string | null) => {
        if (!value) return;
        
        const languageId = parseInt(value, 10);
        
        if (user) {
            // For authenticated users, update preference via API
            // This will automatically update the JWT token and refresh the user data
            updateLanguageMutation.mutate(languageId, {
                onSuccess: () => {
                    // The mutation's onSuccess handler will invalidate queries
                    // which will cause the user data to be refetched with the new language
                    // The EnhancedLanguageProvider will then update the context
                }
            });
        } else {
            // For non-authenticated users, just update the local context
            setCurrentLanguage(languageId);
        }
    }, [user, updateLanguageMutation, setCurrentLanguage]);
    
    // Wait for authentication check to complete
    if (isAuthLoading || isLoading) {
        return (
            <Group gap="xs">
                <Text size="sm" c="dimmed">Language:</Text>
                <Loader size="sm" />
            </Group>
        );
    }
    
    // Don't show if languages are empty
    if (languages.length === 0) {
        return null;
    }
    
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
                value={selectedLanguageId?.toString() || ''}
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