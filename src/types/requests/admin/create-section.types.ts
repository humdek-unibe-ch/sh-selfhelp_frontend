/**
 * Type definitions for section creation and management requests
 */

// Base interfaces for section operations
export interface IAddSectionToPageData {
    position: number;
    oldParentPageId?: number | null; // Page ID where section was previously located
    oldParentSectionId?: number | null; // Section ID where section was previously located
}

export interface IAddSectionToSectionData {
    position: number;
    oldParentPageId?: number | null; // Page ID where section was previously located
    oldParentSectionId?: number | null; // Section ID where section was previously located
}

export interface ICreateSectionInPageData {
    styleId: number;
    position: number;
}

export interface ICreateSectionInSectionData {
    styleId: number;
    position: number;
}

export interface IUpdateSectionInPageData {
    position: number;
}

export interface IUpdateSectionInSectionData {
    position: number;
}

// Legacy interface for backwards compatibility
export interface ICreateSectionRequest {
    styleId: number;
    name?: string;
    position?: number;
}

// Variables interfaces for mutations
export interface ICreateSectionInPageVariables {
    keyword: string;
    sectionData: ICreateSectionInPageData;
}

export interface ICreateSectionInSectionVariables {
    parentSectionId: number;
    sectionData: ICreateSectionInSectionData;
} 