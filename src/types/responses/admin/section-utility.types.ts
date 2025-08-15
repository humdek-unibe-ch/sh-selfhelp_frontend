import { IBaseApiResponse } from '../common/response-envelope.types';

/**
 * Unused Section Item
 * Represents a section that is not in hierarchy and not assigned to pages
 */
export interface IUnusedSection {
    /** Section ID */
    id: number;
    /** Section name */
    name: string;
    /** Style ID */
    idStyles: number;
    /** Style name (can be null) */
    styleName: string | null;
}

/**
 * RefContainer Section Item
 * Represents a section with refContainer style
 */
export interface IRefContainerSection {
    /** Section ID */
    id: number;
    /** Section name */
    name: string;
    /** Style ID */
    idStyles: number;
    /** Style name (should be 'refContainer') */
    styleName: string;
}

/**
 * Unused Sections Response
 * Array of unused sections
 */
export type IUnusedSectionsData = IUnusedSection[];

/**
 * RefContainer Sections Response
 * Array of sections with refContainer style
 */
export type IRefContainerSectionsData = IRefContainerSection[];

/**
 * Unused Sections API Response
 */
export interface IUnusedSectionsResponse extends IBaseApiResponse<IUnusedSectionsData> {}

/**
 * RefContainer Sections API Response
 */
export interface IRefContainerSectionsResponse extends IBaseApiResponse<IRefContainerSectionsData> {}
