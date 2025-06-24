'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useAuth } from '../../hooks/useAuth';
import { ILanguage } from '../../types/responses/admin/languages.types';
import { debug } from '../../utils/debug-logger';

interface ILanguageContextValue {
    currentLanguage: string | null;
    setCurrentLanguage: (language: string) => void;
    languages: ILanguage[];
    defaultLanguage: ILanguage | null;
    isLoading: boolean;
}

const LanguageContext = createContext<ILanguageContextValue | null>(null);

interface ILanguageProviderProps {
    children: ReactNode;
}

export function LanguageProvider({ children }: ILanguageProviderProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { languages, defaultLanguage, isLoading: languagesLoading } = usePublicLanguages();
    const [currentLanguage, setCurrentLanguageState] = useState<string | null>(null);

    // Initialize language state
    useEffect(() => {
        if (isAuthLoading || languagesLoading) return;

        // For authenticated users, don't use language parameter (backend handles user's preferred language)
        if (user) {
            setCurrentLanguageState(null);
            debug('Language context: Authenticated user, using backend default', 'LanguageProvider', { user: user.email });
            return;
        }

        // For non-authenticated users, use default language if not already set
        if (!user && defaultLanguage && !currentLanguage) {
            setCurrentLanguageState(defaultLanguage.locale);
            debug('Language context: Non-authenticated user, setting default language', 'LanguageProvider', { 
                defaultLanguage: defaultLanguage.locale 
            });
        }
    }, [user, isAuthLoading, defaultLanguage, languagesLoading, currentLanguage]);

    const setCurrentLanguage = (language: string) => {
        if (!user) {
            setCurrentLanguageState(language);
            debug('Language context: Language changed', 'LanguageProvider', { language });
        }
    };

    const contextValue: ILanguageContextValue = {
        currentLanguage,
        setCurrentLanguage,
        languages,
        defaultLanguage,
        isLoading: isAuthLoading || languagesLoading
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