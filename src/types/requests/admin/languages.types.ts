/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * TypeScript interfaces for admin languages API requests.
 *
 * @module types/requests/admin/languages.types
 */

export interface ICreateLanguageRequest {
  locale: string;
  language: string;
  csvSeparator: string;
}

export interface IUpdateLanguageRequest {
  locale?: string;
  language?: string;
  csvSeparator?: string;
}
