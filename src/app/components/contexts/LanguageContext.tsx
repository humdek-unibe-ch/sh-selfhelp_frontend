'use client';

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useMemo,
    useCallback,
    useEffect,
    useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ILanguage } from '../../../types/responses/admin/languages.types';
import { useAuthUser } from '../../../hooks/useUserData';
import { usePublicLanguages } from '../../../hooks/useLanguages';
import { writeLangCookie } from '../../../utils/auth.utils';

/**
 * Language context.
 *
 * Source of truth priority:
 *   1. `initialLanguageId` prop (server → client, resolved by
 *      `resolveLanguageSSR` against the live `/languages` list).
 *   2. Authenticated user's language (via `useAuthUser`), applied once per
 *      user on login or account switch.
 *   3. First public language if the current id is not in the list.
 *
 * Every successful change writes the `sh_lang` cookie so subsequent server
 * renders and middleware see the new value without a round-trip, and
 * invalidates the language-scoped React Query caches
 * (`frontend-pages`, `page-by-keyword`).
 *
 * The provider does NOT expose an `isUpdatingLanguage` flag: consumers that
 * need a "loading during language switch" signal use
 * `useIsFetching({ queryKey: ['page-by-keyword'] })` directly from React
 * Query. That removes a redundant source of truth and keeps the flag in sync
 * with the actual network state.
 */
interface ILanguageContextValue {
    currentLanguageId: number;
    setCurrentLanguageId: (languageId: number) => void;
    languages: ILanguage[];
    setLanguages: (languages: ILanguage[]) => void;
}

const LanguageContext = createContext<ILanguageContextValue | null>(null);

interface ILanguageProviderProps {
    children: ReactNode;
    /**
     * Language id resolved on the server from the `sh_lang` cookie + live
     * languages list. `0` (or missing) means "unknown yet" — the client will
     * fall back to the first public language once `usePublicLanguages`
     * resolves.
     */
    initialLanguageId?: number;
    /**
     * Public languages list resolved by the server layout (hydrated into
     * `['public-languages']`). Passing it here lets the first paint render
     * the real language selector / default without waiting for a client
     * fetch. The `usePublicLanguages` query will still run and overwrite
     * this list once it settles.
     */
    initialLanguages?: ILanguage[];
}

export function LanguageProvider({ children, initialLanguageId, initialLanguages }: ILanguageProviderProps) {
    const queryClient = useQueryClient();
    const { user, isLoading: isAuthLoading } = useAuthUser();
    const { languages: publicLanguages } = usePublicLanguages();

    const [currentLanguageId, setCurrentLanguageIdState] = useState<number>(() => {
        if (initialLanguageId && Number.isFinite(initialLanguageId) && initialLanguageId > 0) {
            return initialLanguageId;
        }
        return 0;
    });

    const [languages, setLanguages] = useState<ILanguage[]>(() =>
        Array.isArray(initialLanguages) ? initialLanguages : []
    );

    useEffect(() => {
        if (publicLanguages && publicLanguages.length > 0) {
            setLanguages(publicLanguages);
        }
    }, [publicLanguages]);

    const setCurrentLanguageId = useCallback((languageId: number) => {
        setCurrentLanguageIdState((prev) => {
            if (prev === languageId) return prev;
            writeLangCookie(languageId);
            // Scope invalidation to language-dependent caches only. A global
            // invalidation would refetch unrelated entries (lookups,
            // admin-pages, user-data) and defeat the tiered caching.
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            return languageId;
        });
    }, [queryClient]);

    const lastSyncedUserRef = useRef<number | null>(null);
    useEffect(() => {
        if (isAuthLoading) return;
        if (!user) {
            lastSyncedUserRef.current = null;
            return;
        }
        if (lastSyncedUserRef.current === user.id) return;

        const userLangId =
            typeof user.languageId === 'number' ? user.languageId : parseInt(String(user.languageId), 10);
        if (Number.isFinite(userLangId) && userLangId !== currentLanguageId) {
            setCurrentLanguageId(userLangId);
        }
        lastSyncedUserRef.current = user.id;
    }, [user, isAuthLoading, currentLanguageId, setCurrentLanguageId]);

    useEffect(() => {
        if (user) return;
        if (!languages || languages.length === 0) return;
        if (!languages.some((lang) => lang.id === currentLanguageId)) {
            setCurrentLanguageId(languages[0].id);
        }
    }, [user, languages, currentLanguageId, setCurrentLanguageId]);

    const contextValue = useMemo<ILanguageContextValue>(
        () => ({
            currentLanguageId,
            setCurrentLanguageId,
            languages,
            setLanguages,
        }),
        [currentLanguageId, setCurrentLanguageId, languages]
    );

    return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguageContext(): ILanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguageContext must be used within a LanguageProvider');
    }
    return context;
}
