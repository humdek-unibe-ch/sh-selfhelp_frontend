'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { ILanguage } from '../../../types/responses/admin/languages.types';

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
    initialData?: {
        userData: any;
        languages: any;
    };
}

/**
 * Language Provider optimized for server-side data hydration
 * Initializes with server-fetched data to eliminate loading states
 */
export function LanguageProvider({ children, initialData }: ILanguageProviderProps) {
    const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
    
    // Initialize languages from server data
    const [languages, setLanguages] = useState<ILanguage[]>(initialData?.languages || []);
    
    // Initialize language ID from server user data or default to 1
    const [currentLanguageId, setCurrentLanguageIdState] = useState<number>(() => {
        if (initialData?.userData?.language?.id) {
            return initialData.userData.language.id;
        }
        return 1; // Default language ID
    });

    const setCurrentLanguageId = useCallback((languageId: number) => {
        setIsUpdatingLanguage(true);
        setCurrentLanguageIdState(languageId);

        // Reset updating state after a short delay
        setTimeout(() => setIsUpdatingLanguage(false), 100);
    }, []);

    const contextValue = useMemo((): ILanguageContextValue => ({
        currentLanguageId,
        setCurrentLanguageId,
        languages,
        setLanguages,
        isUpdatingLanguage
    }), [currentLanguageId, setCurrentLanguageId, languages, isUpdatingLanguage]);

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