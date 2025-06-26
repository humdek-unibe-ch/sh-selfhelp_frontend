'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useLanguages } from '../../hooks/useLanguages';
import { useAuth } from '../../hooks/useAuth';
import { ILanguage } from '../../types/responses/admin/languages.types';
import { useUpdateLanguagePreferenceMutation } from '../../hooks/mutations/useUpdateLanguagePreferenceMutation';
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

export function LanguageProvider({ children }: ILanguageProviderProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    
    // Use different language hooks based on authentication status
    const { languages: publicLanguages, defaultLanguage: publicDefaultLanguage, isLoading: publicLanguagesLoading } = usePublicLanguages();
    const { languages: adminLanguages, isLoading: adminLanguagesLoading } = useLanguages();
    
    const [currentLanguageId, setCurrentLanguageIdState] = useState<number | null>(null);
    const initializedRef = useRef(false);

    // Determine which language data to use
    const languages = user ? adminLanguages : publicLanguages;
    const defaultLanguage = user ? (adminLanguages[0] || null) : publicDefaultLanguage;
    const languagesLoading = user ? adminLanguagesLoading : publicLanguagesLoading;

    // Find current language object from ID
    const currentLanguage = currentLanguageId ? languages.find(lang => lang.id === currentLanguageId) || null : null;

    // Mutation for updating authenticated user's language preference
    const updateLanguageMutation = useUpdateLanguagePreferenceMutation();

    // Initialize language state based on user authentication status
    useEffect(() => {
        if (isAuthLoading || languagesLoading) return;
        
        // Prevent re-initialization if already done
        if (initializedRef.current) return;

        if (user) {
            // For authenticated users, use language from JWT token
            if (user.languageId) {
                // Ensure languageId is a number
                const languageId = typeof user.languageId === 'number' ? user.languageId : parseInt(String(user.languageId), 10);
                setCurrentLanguageIdState(languageId);
                initializedRef.current = true;
                debug('Language context: Using authenticated user preferred language', 'LanguageProvider', { 
                    userEmail: user.email,
                    languageId: languageId,
                    originalLanguageId: user.languageId,
                    languageIdType: typeof user.languageId,
                    languageLocale: user.languageLocale
                });
            } else if (defaultLanguage) {
                // Fallback to default language if user has no preference set
                setCurrentLanguageIdState(defaultLanguage.id);
                initializedRef.current = true;
                debug('Language context: Using default language for authenticated user', 'LanguageProvider', { 
                    userEmail: user.email,
                    defaultLanguageId: defaultLanguage.id,
                    defaultLanguageLocale: defaultLanguage.locale
                });
            }
        } else {
            // For non-authenticated users, use default language if not already set
            if (defaultLanguage) {
                setCurrentLanguageIdState(defaultLanguage.id);
                initializedRef.current = true;
                debug('Language context: Using default language for non-authenticated user', 'LanguageProvider', { 
                    defaultLanguageId: defaultLanguage.id,
                    defaultLanguageLocale: defaultLanguage.locale
                });
            }
        }
    }, [user, isAuthLoading, defaultLanguage, languagesLoading]);

    // Reset initialization when user changes (login/logout)
    useEffect(() => {
        initializedRef.current = false;
    }, [user?.id]);

    const setCurrentLanguage = (languageId: number) => {
        if (user) {
            // For authenticated users, update preference via API
            debug('Language context: Updating authenticated user language preference', 'LanguageProvider', { 
                userEmail: user.email,
                newLanguageId: languageId 
            });
            updateLanguageMutation.mutate(languageId);
            // Optimistically update the current language
            setCurrentLanguageIdState(languageId);
        } else {
            // For non-authenticated users, just update local state
            setCurrentLanguageIdState(languageId);
            debug('Language context: Updated non-authenticated user language', 'LanguageProvider', { 
                languageId 
            });
        }
    };

    const contextValue: ILanguageContextValue = {
        currentLanguage,
        currentLanguageId,
        setCurrentLanguage,
        languages,
        defaultLanguage,
        isLoading: isAuthLoading || languagesLoading,
        isUpdatingLanguage: updateLanguageMutation.isPending
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