/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { useQuery } from '@tanstack/react-query';
import { AdminSectionApi, exportSection } from '../api/admin/section.api';
import {
  buildOptionLabelMapsFromExport,
  isNumericDataTableName,
  type TOptionLabelMaps,
} from '../app/components/cms/data/tables/data-table-option-labels.utils';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import type { ILanguage } from '../types/responses/admin/languages.types';
import { DATA_QUERY_KEYS } from './useData';

export function useDataTableOptionLabelMaps(
  tableName: string,
  languageId: number,
  languages: ILanguage[],
) {
  const enabled = isNumericDataTableName(tableName) && languages.length > 0;

  return useQuery<TOptionLabelMaps>({
    queryKey: [...DATA_QUERY_KEYS.all, 'option-label-maps', tableName, languageId],
    queryFn: async () => {
      const ownerSectionId = parseInt(tableName, 10);
      const pages = await AdminSectionApi.getSectionPages([ownerSectionId]);
      if (pages.length === 0) {
        return {};
      }

      const exported = await exportSection(pages[0].id, ownerSectionId);
      return buildOptionLabelMapsFromExport(
        exported.data.sectionsData,
        languageId,
        languages,
      );
    },
    enabled,
    staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.staleTime,
    gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.DEFAULT.gcTime,
  });
}
