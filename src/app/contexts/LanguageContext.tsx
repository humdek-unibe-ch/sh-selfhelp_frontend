'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ILanguage } from '../../types/responses/admin/languages.types';
import { LANGUAGE_STORAGE_KEY } from '../../constants/language.constants';

interface ILanguageContextValue {
    currentLanguageId: number;
    setCurrentLanguageId: (languageId: number) => void;
    languages: ILanguage[];
    setLanguages: (languages: ILanguage[]) => void;
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
    const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
    const [languages, setLanguages] = useState<ILanguage[]>([]);
    
    // Initialize language ID from localStorage or default to 1
    const [currentLanguageId, setCurrentLanguageIdState] = useState<number>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (stored) {
                const parsed = parseInt(stored, 10);
                if (!isNaN(parsed)) {
                    return parsed;
                }
            }
        }
        return 1; // Default language ID
    });

    const setCurrentLanguageId = (languageId: number) => {
        setIsUpdatingLanguage(true);
        setCurrentLanguageIdState(languageId);
        
        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, languageId.toString());
        }
        
        // Reset updating state after a short delay
        setTimeout(() => setIsUpdatingLanguage(false), 100);
    };

    const contextValue: ILanguageContextValue = {
        currentLanguageId,
        setCurrentLanguageId,
        languages,
        setLanguages,
        isUpdatingLanguage
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