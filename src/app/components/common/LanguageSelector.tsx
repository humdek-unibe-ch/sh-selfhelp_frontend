'use client';

import { Select, Group, Text } from '@mantine/core';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { useAuth } from '../../../hooks/useAuth';

export function LanguageSelector() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { 
        currentLanguage, 
        setCurrentLanguage, 
        languages, 
        defaultLanguage, 
        isLoading 
    } = useLanguageContext();
    
    // Wait for authentication check to complete
    if (isAuthLoading || isLoading) {
        return null;
    }
    
    // Don't show language selector if user is logged in
    if (user) {
        return null;
    }
    
    // Don't show if languages are empty
    if (languages.length === 0) {
        return null;
    }
    
    // Use current language from context, fallback to default language's locale
    const selectedLanguage = currentLanguage || defaultLanguage?.locale || '';
    
    const handleLanguageChange = (value: string | null) => {
        if (!value) return;
        setCurrentLanguage(value);
    };
    
    // Use locale as value and language as label
    const languageOptions = languages.map(lang => ({
        value: lang.locale,
        label: lang.language
    }));
    
    return (
        <Group gap="xs">
            <Text size="sm" c="dimmed">Language:</Text>
            <Select
                data={languageOptions}
                value={selectedLanguage}
                onChange={handleLanguageChange}
                size="sm"
                w={150}
                placeholder="Select language"
                searchable={false}
                clearable={false}
            />
        </Group>
    );
} 