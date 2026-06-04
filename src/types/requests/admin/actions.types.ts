/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
export interface IActionTranslationRequest {
  translation_key: string;
  id_languages: number;
  content: string;
}

export interface ICreateActionRequest {
  name: string;
  id_action_trigger_types: number | string;
  id_data_tables: number;
  config?: any;
  translations?: IActionTranslationRequest[];
}

export interface IUpdateActionRequest {
  name?: string;
  id_action_trigger_types?: number | string;
  config?: any;
  id_data_tables?: number | null;
  translations?: IActionTranslationRequest[];
}


