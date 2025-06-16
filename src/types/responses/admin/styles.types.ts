import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IStyle {
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    type: string;
}

export interface IStyleGroup {
    id: number;
    name: string;
    description: string | null;
    position: number;
    styles: IStyle[];
}

export type TStyleGroupsResponse = IBaseApiResponse<IStyleGroup[]>; 