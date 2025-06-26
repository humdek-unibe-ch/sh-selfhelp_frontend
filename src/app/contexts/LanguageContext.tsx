'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ILanguage } from '../../types/responses/admin/languages.types';
import { debug } from '../../utils/debug-logger';

interface ILanguageContextValue {
    currentLanguage: ILanguage | null;
    currentLanguageId: number | null;
    setCurrentLanguage: (languageId: number) => void;
    languages: ILanguage[];
    defaultLanguage: ILanguage | null;
    isLoading: boolean;
    isUpdatingLanguage: boolean;
}

const LanguageContext = createContext<ILanguageContextValue | null>(null);

interface ILanguageProviderProps {
    children: ReactNode;
}

/**
 * Basic Language Provider that doesn't depend on authentication
 * This provides a minimal language context that can be used by navigation
 * Auth-dependent language features are handled in a separate enhanced provider
 */
export function LanguageProvider({ children }: ILanguageProviderProps) {
    const [currentLanguageId, setCurrentLanguageIdState] = useState<number | null>(1); // Default to language ID 1
    const [languages] = useState<ILanguage[]>([]); // Empty initially, will be populated by enhanced provider
    
    // Basic default language fallback
    const defaultLanguage: ILanguage | null = {
        id: 1,
        language: 'Default',
        locale: 'en-US',
        csvSeparator: ','
    };

    const currentLanguage = currentLanguageId ? 
        languages.find(lang => lang.id === currentLanguageId) || defaultLanguage : 
        defaultLanguage;

    const setCurrentLanguage = (languageId: number) => {
        setCurrentLanguageIdState(languageId);
        debug('Basic language context: Language changed', 'LanguageProvider', { languageId });
    };

    // Initialize with default language
    useEffect(() => {
        if (currentLanguageId === null) {
            setCurrentLanguageIdState(1);
        }
    }, [currentLanguageId]);

    const contextValue: ILanguageContextValue = {
        currentLanguage,
        currentLanguageId,
        setCurrentLanguage,
        languages,
        defaultLanguage,
        isLoading: false, // Basic provider is never loading
        isUpdatingLanguage: false
    };

    return (
        <LanguageContext.Provider value={contextValue}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguageContext(): ILanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguageContext must be used within a LanguageProvider');
    }
    return context;
} 