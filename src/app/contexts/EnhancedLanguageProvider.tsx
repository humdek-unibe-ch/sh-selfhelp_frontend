'use client';

import { useEffect, useRef } from 'react';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useLanguages } from '../../hooks/useLanguages';
import { useAuth } from '../../hooks/useAuth';
import { useLanguageContext } from './LanguageContext';
import { LANGUAGE_STORAGE_KEY } from '../../constants/language.constants';
import { debug } from '../../utils/debug-logger';

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
    const { user, isLoading: isAuthLoading } = useAuth();
    const { setCurrentLanguageId, setLanguages, currentLanguageId } = useLanguageContext();
    
    // Track if we've synced language from JWT to prevent loops
    const hasInitializedFromJWT = useRef(false);
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

    // Handle authentication changes and JWT language sync
    useEffect(() => {
        if (isAuthLoading || languagesLoading) return;

        // Reset initialization flag when user changes
        if (user?.id !== lastUserId.current) {
            hasInitializedFromJWT.current = false;
            lastUserId.current = user?.id || null;
            debug('User changed, resetting JWT language sync', 'EnhancedLanguageProvider', { 
                newUserId: user?.id,
                oldUserId: lastUserId.current
            });
        }

        if (user && user.languageId && !hasInitializedFromJWT.current) {
            // Clear localStorage when user logs in
            if (typeof window !== 'undefined') {
                localStorage.removeItem(LANGUAGE_STORAGE_KEY);
            }
            
            // Use language from JWT token
            const languageId = typeof user.languageId === 'number' 
                ? user.languageId 
                : parseInt(String(user.languageId), 10);
            
            debug('Syncing language from JWT', 'EnhancedLanguageProvider', {
                jwtLanguageId: languageId,
                currentLanguageId,
                willUpdate: languageId !== currentLanguageId
            });
            
            // Only update if different from current
            if (languageId !== currentLanguageId) {
                setCurrentLanguageId(languageId);
            }
            
            // Mark as initialized to prevent loops
            hasInitializedFromJWT.current = true;
        } else if (!user && languages.length > 0) {
            // Non-authenticated user - validate stored preference
            const validLanguageIds = languages.map(lang => lang.id);
            if (!validLanguageIds.includes(currentLanguageId)) {
                // Current language ID is not valid, use first language
                debug('Invalid language ID for non-authenticated user', 'EnhancedLanguageProvider', {
                    currentLanguageId,
                    validLanguageIds,
                    defaultLanguageId: languages[0].id
                });
                setCurrentLanguageId(languages[0].id);
            }
        }
    }, [user, isAuthLoading, setCurrentLanguageId, languages, currentLanguageId, languagesLoading]);

    return <>{children}</>;
} 