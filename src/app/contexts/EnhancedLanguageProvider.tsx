'use client';

import { useEffect, useRef } from 'react';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useLanguages } from '../../hooks/useLanguages';
import { useAuthUser } from '../../hooks/useUserData';
import { useLanguageContext } from './LanguageContext';

interface IEnhancedLanguageProviderProps {
    children: React.ReactNode;
}

/**
 * Enhanced Language Provider that handles auth-dependent language features
 * - Loads languages from API (public or admin based on auth status)
 * - Syncs language from JWT token for authenticated users
 * - Clears localStorage language preference when user logs in
 */
export function EnhancedLanguageProvider({ children }: IEnhancedLanguageProviderProps) {
    const { user, isLoading: isAuthLoading } = useAuthUser();
    const { setCurrentLanguageId, setLanguages, currentLanguageId } = useLanguageContext();
    
    // Track if we've synced language from user data to prevent loops
    const hasInitializedFromUserData = useRef(false);
    const lastUserId = useRef<number | null>(null);
    
    // Use different language hooks based on authentication status
    const { languages: publicLanguages, isLoading: publicLanguagesLoading } = usePublicLanguages();
    const { languages: adminLanguages, isLoading: adminLanguagesLoading } = useLanguages();
    
    // Determine which language data to use
    const languages = user ? adminLanguages : publicLanguages;
    const languagesLoading = user ? adminLanguagesLoading : publicLanguagesLoading;

    // Populate languages in context when loaded
    useEffect(() => {
        if (languages.length > 0) {
            setLanguages(languages);
        }
    }, [languages, setLanguages]);

    // Handle authentication changes and user data language sync
    useEffect(() => {
        if (isAuthLoading || languagesLoading) return;

        // Reset initialization flag when user changes
        if (user?.id !== lastUserId.current) {
            hasInitializedFromUserData.current = false;
            lastUserId.current = user?.id || null;
        }

        if (user && user.languageId && !hasInitializedFromUserData.current) {
            // Use language from user data
            const languageId = typeof user.languageId === 'number' 
                ? user.languageId 
                : parseInt(String(user.languageId), 10);
            
            
            // Only update if different from current
            if (languageId !== currentLanguageId) {
                setCurrentLanguageId(languageId);
            }
            
            // Mark as initialized to prevent loops
            hasInitializedFromUserData.current = true;
        } else if (!user && languages.length > 0) {
            // Non-authenticated user - validate current language
            const validLanguageIds = languages.map(lang => lang.id);
            if (!validLanguageIds.includes(currentLanguageId)) {
                // Current language ID is not valid, use first language
                setCurrentLanguageId(languages[0].id);
            }
        }
    }, [user, isAuthLoading, setCurrentLanguageId, languages, currentLanguageId, languagesLoading]);

    return <>{children}</>;
} 