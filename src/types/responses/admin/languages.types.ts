/**
 * TypeScript interfaces for admin languages API responses.
 * 
 * @module types/responses/admin/languages.types
 */

import { IBaseApiResponse } from '../common/response-envelope.types';

export interface ILanguage {
    id: number;
    locale: string;
    language: string;
    csvSeparator: string;
}

export type TLanguagesResponse = IBaseApiResponse<ILanguage[]>; 