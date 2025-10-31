import { useQuery } from '@tanstack/react-query';
import { permissionAwareApiClient } from '../api/base.api';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { IBaseApiResponse } from '../types/responses/common/response-envelope.types';

export interface IActionTranslation {
  id: number;
  id_actions: number;
  translation_key: string;
  id_languages: number;
  content: string;
  created_at: string;
  updated_at: string;
  language: {
    id: number;
    locale: string;
    language: string;
  };
}

export const ACTION_TRANSLATIONS_QUERY_KEYS = {
  all: ['action-translations'] as const,
  byAction: (actionId: number) => [...ACTION_TRANSLATIONS_QUERY_KEYS.all, 'action', actionId] as const,
};

export function useActionTranslations(actionId: number) {
  return useQuery<IActionTranslation[]>({
    queryKey: ACTION_TRANSLATIONS_QUERY_KEYS.byAction(actionId),
    queryFn: async (): Promise<IActionTranslation[]> => {
      if (!actionId) return [];

      const response = await permissionAwareApiClient.get<IBaseApiResponse<IActionTranslation[]>>(
        API_CONFIG.ENDPOINTS.ADMIN_ACTIONS_TRANSLATIONS_GET_ALL,
        actionId
      );
      return response.data.data || [];
    },
    enabled: !!actionId,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    select: (data) => data,
  });
}
