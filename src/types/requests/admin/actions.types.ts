export interface ICreateActionRequest {
  name: string;
  id_actionTriggerTypes: number | string; // backend accepts id
  id_dataTables: number; // required per schema
  config?: any; // JSON object built from schema
}

export interface IUpdateActionRequest {
  name?: string;
  id_actionTriggerTypes?: number | string;
  config?: any;
  id_dataTables?: number | null;
}


