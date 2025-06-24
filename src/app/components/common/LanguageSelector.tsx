'use client';

import { Select, Group, Text } from '@mantine/core';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { usePublicLanguages } from '../../../hooks/usePublicLanguages';
import { useAuth } from '../../../hooks/useAuth';

export function LanguageSelector() {
    const { languages, isLoading, defaultLanguage } = usePublicLanguages();
    const { user, isLoading: isAuthLoading } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    // Wait for authentication check to complete
    if (isAuthLoading) {
        return null;
    }
    
    // Don't show language selector if user is logged in
    if (user) {
        return null;
    }
    
    // Don't show if languages are loading or empty
    if (isLoading || languages.length === 0) {
        return null;
    }
    
    // Use locale instead of language code, default to first language's locale
    const currentLanguage = searchParams.get('language') || defaultLanguage?.locale || '';
    
    const handleLanguageChange = (value: string | null) => {
        if (!value) return;
        
        const params = new URLSearchParams(searchParams);
        params.set('language', value);
        
        const newUrl = `${pathname}?${params.toString()}`;
        router.push(newUrl);
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
                value={currentLanguage}
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