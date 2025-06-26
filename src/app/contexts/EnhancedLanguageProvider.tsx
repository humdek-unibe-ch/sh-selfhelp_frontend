'use client';

import { useEffect, useRef } from 'react';
import { usePublicLanguages } from '../../hooks/usePublicLanguages';
import { useLanguages } from '../../hooks/useLanguages';
import { useAuth } from '../../hooks/useAuth';
import { useUpdateLanguagePreferenceMutation } from '../../hooks/mutations/useUpdateLanguagePreferenceMutation';
import { useLanguageContext } from './LanguageContext';
import { debug } from '../../utils/debug-logger';

interface IEnhancedLanguageProviderProps {
    children: React.ReactNode;
}

/**
 * Enhanced Language Provider that handles auth-dependent language features
 * This component enhances the basic LanguageProvider with authentication-aware functionality
 * Must be used after Refine is initialized
 */
export function EnhancedLanguageProvider({ children }: IEnhancedLanguageProviderProps) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { setCurrentLanguage, languages: contextLanguages, setLanguages, currentLanguageId } = useLanguageContext();
    
    // Use different language hooks based on authentication status
    const { languages: publicLanguages, defaultLanguage: publicDefaultLanguage, isLoading: publicLanguagesLoading } = usePublicLanguages();
    const { languages: adminLanguages, isLoading: adminLanguagesLoading } = useLanguages();
    
    const initializedRef = useRef(false);

    // Determine which language data to use
    const languages = user ? adminLanguages : publicLanguages;
    const defaultLanguage = user ? (adminLanguages[0] || null) : publicDefaultLanguage;
    const languagesLoading = user ? adminLanguagesLoading : publicLanguagesLoading;

    // Mutation for updating authenticated user's language preference
    const updateLanguageMutation = useUpdateLanguagePreferenceMutation();

    // Populate languages in the context when they are loaded
    useEffect(() => {
        if (languages.length > 0 && contextLanguages.length === 0) {
            setLanguages(languages);
            debug('Languages loaded and populated in context', 'EnhancedLanguageProvider', { 
                languagesCount: languages.length,
                contextLanguagesCount: contextLanguages.length
            });
        }
    }, [languages, contextLanguages, setLanguages]);

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
                setCurrentLanguage(languageId);
                initializedRef.current = true;
                debug('Enhanced language context: Using authenticated user preferred language', 'EnhancedLanguageProvider', { 
                    userEmail: user.email,
                    languageId: languageId,
                    originalLanguageId: user.languageId,
                    languageIdType: typeof user.languageId
                });
            } else if (defaultLanguage) {
                // Fallback to default language if user has no preference set
                setCurrentLanguage(defaultLanguage.id);
                initializedRef.current = true;
                debug('Enhanced language context: Using default language for authenticated user', 'EnhancedLanguageProvider', { 
                    userEmail: user.email,
                    defaultLanguageId: defaultLanguage.id
                });
            }
        } else {
            // For non-authenticated users, use default language
            if (defaultLanguage) {
                setCurrentLanguage(defaultLanguage.id);
                initializedRef.current = true;
                debug('Enhanced language context: Using default language for non-authenticated user', 'EnhancedLanguageProvider', { 
                    defaultLanguageId: defaultLanguage.id
                });
            }
        }
    }, [user, isAuthLoading, defaultLanguage, languagesLoading, setCurrentLanguage]);

    // Update language when user's language preference changes (e.g., after API update)
    useEffect(() => {
        if (!user || isAuthLoading || languagesLoading || !initializedRef.current) return;

        const userLanguageId = user.languageId ? (typeof user.languageId === 'number' ? user.languageId : parseInt(String(user.languageId), 10)) : null;
        
        // Only update if the user's language preference is different from the current context language
        if (userLanguageId && userLanguageId !== currentLanguageId) {
            setCurrentLanguage(userLanguageId);
            debug('Enhanced language context: Updated language from user preference change', 'EnhancedLanguageProvider', { 
                userEmail: user.email,
                newLanguageId: userLanguageId,
                previousLanguageId: currentLanguageId
            });
        }
    }, [user?.languageId, currentLanguageId, isAuthLoading, languagesLoading, setCurrentLanguage, user?.email]);

    // Reset initialization when user changes (login/logout)
    useEffect(() => {
        initializedRef.current = false;
    }, [user?.id]);

    // Override the setCurrentLanguage function to handle API updates for authenticated users
    useEffect(() => {
        // This effect doesn't need to do anything - it's just ensuring the enhanced provider is active
        debug('Enhanced language provider active', 'EnhancedLanguageProvider', { 
            hasUser: !!user,
            languagesCount: languages.length 
        });
    }, [user, languages.length]);

    return <>{children}</>;
} 