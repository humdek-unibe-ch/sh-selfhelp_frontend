/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

const FALLBACK_LANGUAGE_ID = 1;

export function readLanguageIdFromSearchParams(searchParams: URLSearchParams): number | null {
  const raw = searchParams.get('languageId');
  if (!raw) {
    return null;
  }
  const parsed = parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Explicit URL/filter selection wins; otherwise use CMS `default_language_id`.
 */
export function resolveDataAdminLanguageId(
  explicitLanguageId: number | null | undefined,
  cmsDefaultLanguageId: number | undefined,
): number {
  if (explicitLanguageId != null && !Number.isNaN(explicitLanguageId)) {
    return explicitLanguageId;
  }
  return cmsDefaultLanguageId ?? FALLBACK_LANGUAGE_ID;
}

export function shouldPersistLanguageIdInUrl(
  languageId: number,
  cmsDefaultLanguageId: number,
): boolean {
  return languageId !== cmsDefaultLanguageId;
}
