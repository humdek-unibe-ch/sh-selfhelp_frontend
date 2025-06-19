/**
 * Position Calculator Utility
 * 
 * Centralized logic for calculating positions in drag-and-drop operations.
 * Used across: create page, edit page, and reordering sections.
 * 
 * Rules:
 * - First position: -1
 * - Any other position: sibling above position + 5
 */

import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

export interface IPositionItem {
    id: string | number;
    position: number;
}

export interface IPositionCalculationResult {
    newParentId: string | number | null;
    newPosition: number;
}

/**
 * Calculate new position for drag and drop operations
 * 
 * @param targetItem - The item we're dropping on/near
 * @param edge - Whether dropping above ('top') or below ('bottom') the target
 * @param siblings - All sibling items in the same container (sorted by position)
 * @param newParentId - The parent ID for the new position (optional)
 * @returns Object with newParentId and newPosition
 */
export function calculateDragDropPosition<T extends IPositionItem>(
    targetItem: T,
    edge: Edge | null,
    siblings: T[],
    newParentId: string | number | null = null
): IPositionCalculationResult {
    const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
    const targetIndex = sortedSiblings.findIndex(s => s.id === targetItem.id);

    if (edge === 'top') {
        if (targetIndex === 0) {
            // Dropping above the first element - first position gets -1
            return {
                newParentId,
                newPosition: -1
            };
        }
        // Dropping above target - take the position of the sibling above and add +5
        const previousSibling = sortedSiblings[targetIndex - 1];
        return {
            newParentId,
            newPosition: previousSibling.position + 5
        };
    } else {
        // Dropping below target - take target's position and add +5
        return {
            newParentId,
            newPosition: targetItem.position + 5
        };
    }
}

/**
 * Calculate position for container drops (dropping inside a parent)
 * 
 * @param parentId - The ID of the parent container
 * @returns Object with newParentId and newPosition (-1 for first child)
 */
export function calculateContainerDropPosition(
    parentId: string | number
): IPositionCalculationResult {
    return {
        newParentId: parentId,
        newPosition: -1 // First child
    };
}

/**
 * Calculate position for adding a sibling below an existing item
 * 
 * @param referenceItem - The item to add a sibling below
 * @param parentId - The parent ID (can be null for root level)
 * @returns Object with newParentId and newPosition
 */
export function calculateSiblingBelowPosition<T extends IPositionItem>(
    referenceItem: T,
    parentId: string | number | null = null
): IPositionCalculationResult {
    return {
        newParentId: parentId,
        newPosition: referenceItem.position + 5
    };
}

/**
 * Calculate position for adding a sibling above an existing item
 * 
 * @param referenceItem - The item to add a sibling above
 * @param siblings - All sibling items in the same container (sorted by position)
 * @param parentId - The parent ID (can be null for root level)
 * @returns Object with newParentId and newPosition
 */
export function calculateSiblingAbovePosition<T extends IPositionItem>(
    referenceItem: T,
    siblings: T[],
    parentId: string | number | null = null
): IPositionCalculationResult {
    const sortedSiblings = [...siblings].sort((a, b) => a.position - b.position);
    const targetIndex = sortedSiblings.findIndex(s => s.id === referenceItem.id);

    if (targetIndex === 0) {
        // Adding above the first element - first position gets -1
        return {
            newParentId: parentId,
            newPosition: -1
        };
    }

    // Adding above target - take the position of the sibling above and add +5
    const previousSibling = sortedSiblings[targetIndex - 1];
    return {
        newParentId: parentId,
        newPosition: previousSibling.position + 5
    };
}

/**
 * Calculate position for menu items (pages in header/footer menus)
 * 
 * @param targetItem - The menu item we're dropping on/near
 * @param edge - Whether dropping above ('top') or below ('bottom') the target
 * @param menuItems - All menu items (sorted by position)
 * @returns New position number
 */
export function calculateMenuPosition<T extends IPositionItem>(
    targetItem: T,
    edge: Edge | null,
    menuItems: T[]
): number {
    const result = calculateDragDropPosition(targetItem, edge, menuItems);
    return result.newPosition;
}

/**
 * Calculate final position for menu positioning (used in complex scenarios)
 * 
 * @param items - Array of positioned items
 * @param targetIndex - The index where we want to insert
 * @returns New position number
 */
export function calculateFinalMenuPosition<T extends IPositionItem>(
    items: T[],
    targetIndex: number
): number {
    if (targetIndex <= 0) {
        // First position gets -1
        return -1;
    }
    
    if (targetIndex >= items.length) {
        // Last position - take last item's position and add +5
        return items.length > 0 ? items[items.length - 1].position + 5 : -1;
    }
    
    // Middle position - take the position of the item before the target index and add +5
    const prevItem = items[targetIndex - 1];
    return prevItem.position + 5;
} 