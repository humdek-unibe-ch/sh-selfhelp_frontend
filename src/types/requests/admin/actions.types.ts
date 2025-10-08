export interface IActionTranslationRequest {
  translation_key: string;
  id_languages: number;
  content: string;
}

export interface ICreateActionRequest {
  name: string;
  id_actionTriggerTypes: number | string; // backend accepts id
  id_dataTables: number; // required per schema
  config?: any; // JSON object built from schema
  translations?: IActionTranslationRequest[]; // optional translations array
}

export interface IUpdateActionRequest {
  name?: string;
  id_actionTriggerTypes?: number | string;
  config?: any;
  id_dataTables?: number | null;
  translations?: IActionTranslationRequest[]; // optional translations array
}


