export interface ICreateSectionRequest {
    styleId: number;
    name?: string;
    position?: number;
}

export interface ICreateSectionInPageVariables {
    keyword: string;
    sectionData: ICreateSectionRequest;
}

export interface ICreateSectionInSectionVariables {
    parentSectionId: number;
    sectionData: ICreateSectionRequest;
} 