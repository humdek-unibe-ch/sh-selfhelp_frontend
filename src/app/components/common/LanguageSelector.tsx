'use client';

import { Select, Group, Text, Loader } from '@mantine/core';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';
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
    
    // Use current language ID, fallback to default language's ID
    const selectedLanguageId = currentLanguageId || defaultLanguage?.id || null;
    
    // Define the callback before any conditional returns
    const handleLanguageChange = useCallback((value: string | null) => {
        if (!value) return;
        
        const languageId = parseInt(value, 10);
        
        // Update the language context (this will affect API calls)
        setCurrentLanguage(languageId);
    }, [setCurrentLanguage]);
    
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
    
    // Only show for non-authenticated users (frontend pages)
    if (user) {
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
                disabled={isUpdatingLanguage}
                rightSection={isUpdatingLanguage ? <Loader size="xs" /> : undefined}
            />
        </Group>
    );
} 