/**
 * Section Operations Utility
 * 
 * Centralized logic for handling section operations with position support.
 * This utility provides consistent position handling across all section operations:
 * - Create section
 * - Import sections
 * - Move sections
 * 
 * Position Rules:
 * - First position: -1
 * - Specific position: provided value
 * - Default append: calculated from existing sections
 */

import { ISectionExportData } from '../api/admin/section.api';

export interface ISectionOperationPosition {
    position: number;
    description: string;
}

export interface ISectionOperationOptions {
    /** Specific position to place the section(s). If not provided, defaults to -1 (first) */
    specificPosition?: number;
    /** Whether to append at the end instead of using specificPosition */
    appendAtEnd?: boolean;
    /** Custom position calculation function */
    positionCalculator?: () => number;
}

/**
 * Calculates the position for section operations
 */
export function calculateSectionOperationPosition(options: ISectionOperationOptions = {}): ISectionOperationPosition {
    const { specificPosition, appendAtEnd, positionCalculator } = options;

    // Priority order:
    // 1. Custom position calculator
    // 2. Specific position
    // 3. Append at end (use very high number)
    // 4. Default to first position (-1)

    if (positionCalculator) {
        const position = positionCalculator();
        return {
            position,
            description: `Custom calculated position: ${position}`
        };
    }

    if (specificPosition !== undefined) {
        return {
            position: specificPosition,
            description: `Specific position: ${specificPosition}`
        };
    }

    if (appendAtEnd) {
        return {
            position: 999999,
            description: 'Append at end'
        };
    }

    return {
        position: -1,
        description: 'First position (default)'
    };
}

/**
 * Enhanced import request interface that includes position
 */
export interface IImportSectionsWithPositionRequest {
    sections: ISectionExportData[];
    position?: number;
}

/**
 * Prepares section data for import operations with position support
 */
export function prepareSectionImportData(
    sections: ISectionExportData[],
    options: ISectionOperationOptions = {}
): IImportSectionsWithPositionRequest {
    const { position } = calculateSectionOperationPosition(options);
    
    return {
        sections,
        position
    };
}

/**
 * Prepares section data for create operations with position support
 */
export function prepareSectionCreateData(
    styleId: number,
    options: ISectionOperationOptions & { name?: string } = {}
): { styleId: number; position: number; name?: string } {
    const { position } = calculateSectionOperationPosition(options);
    const { name } = options;
    
    return {
        styleId,
        position,
        ...(name && { name })
    };
}