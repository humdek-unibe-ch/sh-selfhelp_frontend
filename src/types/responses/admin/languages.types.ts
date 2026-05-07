/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * TypeScript interfaces for admin languages API responses.
 *
 * @module types/responses/admin/languages.types
 */

import type { IBaseApiResponse, ILanguage } from '../../../shared';

export type { ILanguage } from '../../../shared';

export type TLanguagesResponse = IBaseApiResponse<ILanguage[]>;
export type TLanguageResponse = IBaseApiResponse<ILanguage>; 