/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { OPTION_STYLE_CONFIGS, resolveOptions, type TOptionStyleName } from '@selfhelp/shared';
import type { ISectionExportData } from '../../../../../api/admin/section.api';
import type { ILanguage } from '../../../../../types/responses/admin/languages.types';

export type TOptionLabelMaps = Record<string, Record<string, string>>;

export function isNumericDataTableName(tableName: string): boolean {
  return /^\d+$/.test(tableName) && parseInt(tableName, 10) > 0;
}

function exportFieldContent(
  section: ISectionExportData,
  fieldName: string,
  languageId: number,
  languages: ILanguage[],
): string | undefined {
  const field = section.fields?.[fieldName];
  if (!field) {
    return undefined;
  }

  const locale = languages.find((language) => language.id === languageId)?.locale;
  if (locale && field[locale]?.content?.trim()) {
    return field[locale].content;
  }
  if (field.all?.content?.trim()) {
    return field.all.content;
  }

  const fallbackLocale = languages.find((language) => language.id === 1)?.locale;
  if (fallbackLocale && field[fallbackLocale]?.content?.trim()) {
    return field[fallbackLocale].content;
  }

  for (const language of languages) {
    const content = field[language.locale]?.content;
    if (content?.trim()) {
      return content;
    }
  }

  for (const entry of Object.values(field)) {
    if (entry.content?.trim()) {
      return entry.content;
    }
  }

  return undefined;
}

function appendSectionOptionLabels(
  maps: TOptionLabelMaps,
  section: ISectionExportData,
  languageId: number,
  languages: ILanguage[],
): void {
  const styleName = section.style_name;
  if (!(styleName in OPTION_STYLE_CONFIGS)) {
    return;
  }

  const styleConfig = OPTION_STYLE_CONFIGS[styleName as TOptionStyleName];
  const fieldKey = exportFieldContent(section, 'name', languageId, languages)?.trim();
  const catalogRaw = exportFieldContent(section, styleConfig.catalogField, languageId, languages);
  if (!fieldKey || !catalogRaw) {
    return;
  }

  const optionLabelsRaw = exportFieldContent(section, 'option_labels', languageId, languages) ?? null;
  const resolved = resolveOptions(catalogRaw, optionLabelsRaw);
  if (resolved.length === 0) {
    return;
  }

  maps[fieldKey] ??= {};
  for (const option of resolved) {
    maps[fieldKey][option.value] = option.label;
  }
}

export function buildOptionLabelMapsFromExport(
  sections: ISectionExportData[],
  languageId: number,
  languages: ILanguage[],
): TOptionLabelMaps {
  const maps: TOptionLabelMaps = {};

  const walk = (nodes: ISectionExportData[]): void => {
    for (const section of nodes) {
      appendSectionOptionLabels(maps, section, languageId, languages);
      if (section.children?.length) {
        walk(section.children);
      }
    }
  };

  walk(sections);
  return maps;
}

export function resolveStoredCodesToLabels(
  storedValue: string,
  labelMap: Record<string, string> | undefined,
): string {
  if (!labelMap || storedValue.trim() === '') {
    return storedValue;
  }

  return storedValue
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code !== '')
    .map((code) => labelMap[code] ?? code)
    .join(', ');
}

/**
 * Admin data rows are keyed by immutable `section_<id>` field keys while option
 * catalogs are keyed by the form input name. Align maps onto column field keys.
 */
export function alignOptionLabelMapsToFieldKeys(
  maps: TOptionLabelMaps,
  columns: Array<{ fieldKey: string | null; displayName: string | null }>,
): TOptionLabelMaps {
  const aligned: TOptionLabelMaps = { ...maps };

  for (const column of columns) {
    const fieldKey = column.fieldKey;
    const displayName = column.displayName?.trim();
    if (!fieldKey || !displayName) {
      continue;
    }

    if (maps[displayName] && !aligned[fieldKey]) {
      aligned[fieldKey] = maps[displayName];
    }
    if (maps[fieldKey]) {
      aligned[fieldKey] = maps[fieldKey];
    }
  }

  return aligned;
}
