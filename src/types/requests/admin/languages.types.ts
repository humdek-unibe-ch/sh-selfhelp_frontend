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
