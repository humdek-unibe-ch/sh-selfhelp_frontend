export interface ICreateActionRequest {
  name: string;
  id_actionTriggerTypes: number | string; // backend accepts id
  config?: any; // JSON object built from schema
  id_dataTables?: number | null;
}

export interface IUpdateActionRequest {
  name?: string;
  id_actionTriggerTypes?: number | string;
  config?: any;
  id_dataTables?: number | null;
}


