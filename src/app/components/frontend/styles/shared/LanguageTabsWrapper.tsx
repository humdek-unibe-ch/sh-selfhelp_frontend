import React, { useMemo, useState } from 'react';
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

type TLanguageEntry = { language_id: number; value: string };

/**
 * LanguageTabsWrapper component provides multi-language tab interface for translatable fields
 * When translatable is false, renders the child component directly
 * When translatable is true, wraps children in language tabs and manages multi-language data
 *
 * ## Why this component is `useMemo`-only (no `useEffect`-state-sync)
 *
 * Earlier versions mirrored the incoming `value` prop into local
 * `languageValues` state via a `useEffect`. That caused an infinite
 * render loop: the effect's deps were `[languages, value, translatable]`,
 * and `parseValue()` inside the effect always produced a new array
 * reference, which in turn caused `setState → render → effect → setState`.
 *
 * The fix here is pure derivation: `languageValues` is computed via
 * `useMemo` from `value`, so it has no write-back side-effect. We only
 * keep `activeTab` as real state (it is UI state, not derived from props).
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

    const publicLanguages = useMemo(
        () => languages.filter((lang) => lang.id !== 1),
        [languages]
    );

    const [activeTab, setActiveTab] = useState<string>('');

    const resolvedActiveTab = activeTab || publicLanguages[0]?.locale || '';

    const languageValues = useMemo<TLanguageEntry[]>(() => {
        if (!value) return [];

        if (typeof value === 'string') {
            if (!translatable) return [];
            return publicLanguages.map((lang) => ({
                language_id: lang.id,
                value,
            }));
        }

        return (value as TLanguageEntry[]).filter((lang) => lang.language_id !== 1);
    }, [value, translatable, publicLanguages]);

    const handleLanguageValueChange = (languageId: number, newValue: string) => {
        if (!translatable) {
            onChange(name, newValue);
            return;
        }

        const existingIndex = languageValues.findIndex((v) => v.language_id === languageId);
        const updatedValues = existingIndex >= 0
            ? languageValues.map((v, i) => (i === existingIndex ? { language_id: languageId, value: newValue } : v))
            : [...languageValues, { language_id: languageId, value: newValue }];

        onChange(name, updatedValues);
    };

    const getLanguageValue = (languageId: number): string => {
        if (!translatable) {
            return (value as string) || '';
        }
        return languageValues.find((v) => v.language_id === languageId)?.value ?? '';
    };

    if (!translatable) {
        const fallbackLang: ILanguage = languages[0] ?? { id: 1, locale: 'en', language: 'English', csvSeparator: ',' };
        return (
            <Box className={className} {...(styleProps || {})}>
                {children(
                    fallbackLang,
                    typeof value === 'string' ? value : '',
                    (newValue) => onChange(name, newValue)
                )}
                <input
                    type="hidden"
                    name={name}
                    value={(value as string) || ''}
                />
            </Box>
        );
    }

    if (isLoading) {
        return <Text>Loading languages...</Text>;
    }

    if (publicLanguages.length === 0) {
        return <Text>No languages available</Text>;
    }

    return (
        <Box className={className} {...(styleProps || {})}>
            <Tabs value={resolvedActiveTab} onChange={(v) => setActiveTab(v || publicLanguages[0].locale)}>
                <Tabs.List>
                    {publicLanguages.map((lang) => (
                        <Tabs.Tab key={lang.id} value={lang.locale}>
                            {lang.locale.toUpperCase()}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                {publicLanguages.map((lang) => (
                    <Tabs.Panel key={lang.id} value={lang.locale} pt="md">
                        {children(
                            lang,
                            getLanguageValue(lang.id),
                            (newValue) => handleLanguageValueChange(lang.id, newValue)
                        )}
                    </Tabs.Panel>
                ))}
            </Tabs>

            <input
                type="hidden"
                name={name}
                value={translatable && languageValues.length > 0 ? JSON.stringify(languageValues) : (value as string) || ''}
            />
        </Box>
    );
};

export default LanguageTabsWrapper;
