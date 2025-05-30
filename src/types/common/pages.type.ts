/**
 * Type definitions for page field structures returned by the admin API
 */

export interface IPageField {
  id: number;
  name: string;
  id_styles: number;
  style_name: string;
  position: number;
  level: number;
  path: string;
  children: IPageField[];
}

export interface IPageFieldsResponse {
  status: number;
  message: string;
  error: null | string;
  logged_in: boolean;
  meta: {
    version: string;
    timestamp: string;
  };
  data: IPageField[];
}
