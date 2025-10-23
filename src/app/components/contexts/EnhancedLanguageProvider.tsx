'use client';

import { useEffect, useRef } from 'react';
import { useLanguageContext } from './LanguageContext';
import { useAuthUser } from '../../../hooks/useUserData';
import { usePublicLanguages, useAdminLanguages } from '../../../hooks/useLanguages';

interface IEnhancedLanguageProviderProps {
    children: React.ReactNode;
}

/**
 * Enhanced Language Provider that handles auth-dependent language features
 * - Loads languages from API (public or admin based on auth status)
 * - Syncs language from JWT token for authenticated users
 * - Clears localStorage language preference when user logs in
 * - Uses specific language hooks (usePublicLanguages/useAdminLanguages) instead of deprecated useLanguages
 */
export function EnhancedLanguageProvider({ children }: IEnhancedLanguageProviderProps) {
    const { user, isLoading: isAuthLoading } = useAuthUser();
    const { setCurrentLanguageId, setLanguages, currentLanguageId } = useLanguageContext();
    
    // Track if we've synced language from user data to prevent loops
    const hasInitializedFromUserData = useRef(false);
    const lastUserId = useRef<number | null>(null);
    
    // Use specific language hooks
    const { languages: publicLanguages, isLoading: publicLanguagesLoading } = usePublicLanguages();
    const { languages: adminLanguages, isLoading: adminLanguagesLoading } = useAdminLanguages();

    // Determine which language data to use
    const languages = user ? adminLanguages : publicLanguages;
    const languagesLoading = user ? adminLanguagesLoading : publicLanguagesLoading;

    // Effect 1: Populate languages in context when loaded
    useEffect(() => {
        if (languages.length > 0) {
            setLanguages(languages);
        }
    }, [languages, setLanguages]);

    // Effect 2: Handle user ID changes - reset initialization flag
    useEffect(() => {
        if (user?.id !== lastUserId.current) {
            hasInitializedFromUserData.current = false;
            lastUserId.current = user?.id || null;
        }
    }, [user?.id]);

    // Effect 3: Sync language from authenticated user data (one-time initialization per user)
    useEffect(() => {
        // Skip if still loading, no user, or already initialized
        if (isAuthLoading || !user || hasInitializedFromUserData.current) return;
        
        // Skip if user doesn't have a language ID
        if (!user.languageId) return;
        
        const languageId = typeof user.languageId === 'number' 
            ? user.languageId 
            : parseInt(String(user.languageId), 10);
        
        // Only update if different from current language
        if (languageId !== currentLanguageId) {
            setCurrentLanguageId(languageId);
        }
        
        // Mark as initialized to prevent loops
        hasInitializedFromUserData.current = true;
    }, [user, isAuthLoading, currentLanguageId, setCurrentLanguageId]);

    // Effect 4: Validate language for non-authenticated users
    useEffect(() => {
        // Only run for non-authenticated users with loaded languages
        if (user || languagesLoading || languages.length === 0) return;
        
        const validLanguageIds = languages.map(lang => lang.id);
        if (!validLanguageIds.includes(currentLanguageId)) {
            // Current language ID is not valid, use first language
            setCurrentLanguageId(languages[0].id);
        }
    }, [user, languages, currentLanguageId, languagesLoading, setCurrentLanguageId]);

    return <>{children}</>;
} 