import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/base.api';
import { IBaseApiResponse } from '../types/responses/common/response-envelope.types';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

export interface IActionTranslation {
    id: number;
    id_actions: number;
    translation_key: string;
    id_languages: number;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface ICreateActionTranslationRequest {
    translation_key: string;
    id_languages: number;
    content: string;
}

export interface IUpdateActionTranslationRequest {
    content: string;
}

export interface IBulkActionTranslationRequest {
    translations: ICreateActionTranslationRequest[];
}

export interface IActionTranslationListResponse extends IBaseApiResponse<IActionTranslation[]> { }

export interface IActionTranslationMissingResponse extends IBaseApiResponse<string[]> { }

export function useActionTranslations(actionId: number) {
    const queryClient = useQueryClient();

    // Get all translations for an action
    const translationsQuery = useQuery<IActionTranslation[]>({
        queryKey: ['action-translations', actionId],
        queryFn: async (): Promise<IActionTranslation[]> => {
            const response = await apiClient.get<IBaseApiResponse<IActionTranslation[]>>(
                `/admin/actions/${actionId}/translations`
            );
            return (response.data || []) as unknown as IActionTranslation[];
        },
        enabled: !!actionId,
        staleTime: 30000, // 30 seconds
    });

    // Get translations for specific language
    const translationsByLanguageQuery = (languageId: number) => useQuery<IActionTranslation[]>({
        queryKey: ['action-translations', actionId, 'language', languageId],
        queryFn: async (): Promise<IActionTranslation[]> => {
            const response = await apiClient.get<IBaseApiResponse<IActionTranslation[]>>(
                `/admin/actions/${actionId}/translations?language_id=${languageId}`
            );
            return (response.data || []) as unknown as IActionTranslation[];
        },
        enabled: !!actionId && !!languageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });

    // Get missing translations for a language
    const missingTranslationsQuery = (languageId: number) => useQuery<string[]>({
        queryKey: ['action-translations', actionId, 'missing', languageId],
        queryFn: async (): Promise<string[]> => {
            const response = await apiClient.get<IBaseApiResponse<string[]>>(
                `/admin/actions/${actionId}/translations/missing?language_id=${languageId}`
            );
            return (response.data || []) as unknown as string[];
        },
        enabled: !!actionId && !!languageId,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });

    // Create or update single translation
    const createMutation = useMutation({
        mutationFn: async (data: ICreateActionTranslationRequest) => {
            const response = await apiClient.post<IBaseApiResponse<IActionTranslation>>(
                `/admin/actions/${actionId}/translations`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['action-translations', actionId] });
        },
    });

    // Update existing translation
    const updateMutation = useMutation({
        mutationFn: async ({ translationId, data }: { translationId: number; data: IUpdateActionTranslationRequest }) => {
            const response = await apiClient.put<IBaseApiResponse<IActionTranslation>>(
                `/admin/actions/${actionId}/translations/${translationId}`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['action-translations', actionId] });
        },
    });

    // Delete translation
    const deleteMutation = useMutation({
        mutationFn: async (translationId: number) => {
            await apiClient.delete(`/admin/actions/${actionId}/translations/${translationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['action-translations', actionId] });
        },
    });

    // Bulk create/update translations
    const bulkMutation = useMutation({
        mutationFn: async (data: IBulkActionTranslationRequest) => {
            const response = await apiClient.post<IBaseApiResponse<IActionTranslation[]>>(
                `/admin/actions/${actionId}/translations/bulk`,
                data
            );
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['action-translations', actionId] });
        },
    });

    // Helper function to get translation for a specific key and language
    const getTranslation = (translationKey: string, languageId: number): string | undefined => {
        const translation = translationsQuery.data?.find(
            (t: IActionTranslation) => t.translation_key === translationKey && t.id_languages === languageId
        );
        return translation?.content;
    };

    // Helper function to get translation with fallback logic
    const getTranslationWithFallback = (
        translationKey: string,
        primaryLanguageId: number,
        fallbackLanguageId: number = 1 // 'all' locale
    ): string => {
        // Try primary language first
        let translation = getTranslation(translationKey, primaryLanguageId);
        if (translation) return translation;

        // Try fallback language
        translation = getTranslation(translationKey, fallbackLanguageId);
        if (translation) return translation;

        // Return translation key as final fallback
        return translationKey;
    };

    return {
        // Queries
        data: translationsQuery.data,
        isLoading: translationsQuery.isLoading,
        error: translationsQuery.error,
        refetch: translationsQuery.refetch,

        // Specialized queries
        translationsByLanguage: translationsByLanguageQuery,
        missingTranslations: missingTranslationsQuery,

        // Mutations
        createMutation,
        updateMutation,
        deleteMutation,
        bulkMutation,

        // Helper functions
        getTranslation,
        getTranslationWithFallback,
    };
}
