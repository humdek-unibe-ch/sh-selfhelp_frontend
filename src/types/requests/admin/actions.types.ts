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
  id_action_trigger_types: number | string; // matches backend create_action schema
  id_data_tables: number; // required per schema
  config?: any; // JSON object built from schema
  translations?: IActionTranslationRequest[]; // optional translations array
}

export interface IUpdateActionRequest {
  name?: string;
  id_action_trigger_types?: number | string;
  config?: any;
  id_data_tables?: number | null;
  translations?: IActionTranslationRequest[]; // optional translations array
}


