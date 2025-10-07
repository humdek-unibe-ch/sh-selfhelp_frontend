import React, { useState, useEffect } from 'react';
import { Tabs, Text, Box } from '@mantine/core';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';

/**
 * Props interface for LanguageTabsWrapper component
 */
interface ILanguageTabsWrapperProps {
    /** Whether the field supports translations */
    translatable: boolean;
    /** The field name for form submission */
    name: string;
    /** The current value(s) - can be string or array of language values */
    value: string | Array<{ language_id: number; value: string }> | null;
    /** Callback when value changes */
    onChange: (name: string, value: string | Array<{ language_id: number; value: string }> | null) => void;
    /** The child component to render for each language */
    children: (language: ILanguage, currentValue: string, onValueChange: (value: string) => void) => React.ReactNode;
    /** Optional className for styling */
    className?: string;
    /** Optional style props for Mantine components */
    styleProps?: Record<string, any>;
}

/**
 * LanguageTabsWrapper component provides multi-language tab interface for translatable fields
 * When translatable is false, renders the child component directly
 * When translatable is true, wraps children in language tabs and manages multi-language data
 */
const LanguageTabsWrapper: React.FC<ILanguageTabsWrapperProps> = ({
    translatable,
    name,
    value,
    onChange,
    children,
    className,
    styleProps
}) => {
    const { languages, isLoading } = usePublicLanguages();
    const [activeTab, setActiveTab] = useState<string>('');

    // Initialize active tab when languages are loaded
    useEffect(() => {
        if (languages.length > 0 && !activeTab) {
            // Use first public language (excluding internal language id: 1)
            const firstPublicLanguage = languages.find(lang => lang.id !== 1);
            if (firstPublicLanguage) {
                setActiveTab(firstPublicLanguage.locale);
            }
        }
    }, [languages, activeTab]);

    // Parse the value to handle both single string and multi-language array formats
    const parseValue = (): Array<{ language_id: number; value: string }> => {
        if (!value) return [];

        if (typeof value === 'string') {
            if (!translatable) {
                // For non-translatable fields with string value, return empty array
                return [];
            } else {
                // For translatable fields with string value, initialize all public languages (excluding internal language_id: 1)
                return languages
                    .filter(lang => lang.id !== 1) // Exclude internal language
                    .map(lang => ({
                        language_id: lang.id,
                        value: value
                    }));
            }
        }

        // Filter out internal language from existing values too
        return (value as Array<{ language_id: number; value: string }>).filter(lang => lang.language_id !== 1);
    };

    const [languageValues, setLanguageValues] = useState<Array<{ language_id: number; value: string }>>([]);

    // Initialize language values when languages are loaded or value changes
    useEffect(() => {
        const parsed = parseValue();
        setLanguageValues(parsed);
    }, [languages, value, translatable]);

    // Handle value change for a specific language
    const handleLanguageValueChange = (languageId: number, newValue: string) => {
        if (!translatable) {
            // For non-translatable fields, just pass the value as string
            onChange(name, newValue);
            return;
        }

        // For translatable fields, update the array
        const updatedValues = [...languageValues];
        const existingIndex = updatedValues.findIndex(v => v.language_id === languageId);

        if (existingIndex >= 0) {
            updatedValues[existingIndex] = { language_id: languageId, value: newValue };
        } else {
            updatedValues.push({ language_id: languageId, value: newValue });
        }

        setLanguageValues(updatedValues);
        onChange(name, updatedValues);
    };

    // Get current value for a specific language
    const getLanguageValue = (languageId: number): string => {
        if (!translatable) {
            // For non-translatable fields, return the string value
            return (value as string) || '';
        }

        // For translatable fields, find the specific language value
        const langValue = languageValues.find(v => v.language_id === languageId);
        return langValue?.value || '';
    };

    // If not translatable, render single language version
    if (!translatable) {
        return (
            <Box className={className} {...(styleProps || {})}>
                {children(languages[0] || { id: 1, locale: 'en', language: 'English', csvSeparator: ',' },
                         typeof value === 'string' ? value : '',
                         (newValue) => onChange(name, newValue))}
                {/* Hidden input for form submission - single language */}
                <input
                    type="hidden"
                    name={name}
                    value={(value as string) || ''}
                />
            </Box>
        );
    }

    // Loading state
    if (isLoading) {
        return <Text>Loading languages...</Text>;
    }

    // Filter out internal language (id: 1) for display
    const publicLanguages = languages.filter(lang => lang.id !== 1);

    // No public languages available
    if (publicLanguages.length === 0) {
        return <Text>No languages available</Text>;
    }

    return (
        <Box className={className} {...(styleProps || {})}>
            <Tabs value={activeTab} onChange={(value) => setActiveTab(value || publicLanguages[0].locale)}>
                <Tabs.List>
                    {publicLanguages.map(lang => (
                        <Tabs.Tab key={lang.id} value={lang.locale}>
                            {lang.locale.toUpperCase()}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                {publicLanguages.map(lang => (
                    <Tabs.Panel key={lang.id} value={lang.locale} pt="md">
                        {children(
                            lang,
                            getLanguageValue(lang.id),
                            (newValue) => handleLanguageValueChange(lang.id, newValue)
                        )}
                    </Tabs.Panel>
                ))}
            </Tabs>

            {/* Hidden input for form submission - contains JSON string of multi-language data */}
            <input
                type="hidden"
                name={name}
                value={translatable && languageValues.length > 0 ? JSON.stringify(languageValues) : (value as string) || ''}
            />
        </Box>
    );
};

export default LanguageTabsWrapper;
