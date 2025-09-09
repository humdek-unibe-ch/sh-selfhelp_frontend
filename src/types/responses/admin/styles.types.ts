import { IBaseApiResponse } from '../common/response-envelope.types';

export interface IStyleRelationship {
    id: number;
    name: string;
}

export interface IStyleRelationships {
    allowedChildren: IStyleRelationship[];
    allowedParents: IStyleRelationship[];
}

export interface IStyle {
    id: number;
    name: string;
    description: string | null;
    typeId: number;
    type: string;
    relationships: IStyleRelationships;
}

export interface IStyleGroup {
    id: number;
    name: string;
    description: string | null;
    position: number;
    styles: IStyle[];
}

export type TStyleGroupsResponse = IBaseApiResponse<IStyleGroup[]>; 