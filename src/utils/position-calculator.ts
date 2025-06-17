/**
 * Position calculation utilities for section and page ordering
 * 
 * New system:
 * - First element: -1 (temporary)
 * - Second element: 5
 * - Third element: 15
 * - Fourth element: 25
 * - After normalization: 0, 10, 20, 30...
 */

export interface IPositionItem {
    id: number;
    position: number;
}

/**
 * Calculate position for new items based on the new system
 */
export class PositionCalculator {
    /**
     * Calculate position for adding a new item at the end
     */
    static calculateEndPosition(items: IPositionItem[]): number {
        if (items.length === 0) {
            return -1; // First element gets -1
        }
        
        const sortedItems = [...items].sort((a, b) => a.position - b.position);
        const lastPosition = sortedItems[sortedItems.length - 1].position;
        
        if (lastPosition === -1) {
            return 5; // Second element gets 5
        }
        
        return lastPosition + 10; // Continue with 15, 25, 35...
    }
    
    /**
     * Calculate position for inserting at specific index
     */
    static calculateInsertPosition(items: IPositionItem[], insertIndex: number): number {
        if (items.length === 0) {
            return -1; // First element
        }
        
        const sortedItems = [...items].sort((a, b) => a.position - b.position);
        
        if (insertIndex === 0) {
            // Inserting at the beginning
            const firstPosition = sortedItems[0].position;
            if (firstPosition === -1) {
                // First item is -1, new first item should be -11
                return -11;
            }
            return Math.min(-1, firstPosition - 10);
        } else if (insertIndex >= sortedItems.length) {
            // Inserting at the end
            return this.calculateEndPosition(items);
        } else {
            // Inserting in the middle
            const prevPosition = sortedItems[insertIndex - 1].position;
            const nextPosition = sortedItems[insertIndex].position;
            const gap = nextPosition - prevPosition;
            
            if (gap > 2) {
                return Math.floor((prevPosition + nextPosition) / 2);
            } else {
                // Not enough gap - use next available position
                return prevPosition + 1;
            }
        }
    }
    
    /**
     * Calculate position for sibling above (reference position - 1)
     */
    static calculateSiblingAbovePosition(referencePosition: number): number {
        return referencePosition - 1;
    }
    
    /**
     * Calculate position for sibling below (reference position + 1)
     */
    static calculateSiblingBelowPosition(referencePosition: number): number {
        return referencePosition + 1;
    }
    
    /**
     * Normalize positions to clean 0, 10, 20, 30... pattern
     * This should be called periodically on the backend
     */
    static normalizePositions(items: IPositionItem[]): IPositionItem[] {
        const sortedItems = [...items].sort((a, b) => a.position - b.position);
        
        return sortedItems.map((item, index) => ({
            ...item,
            position: index * 10
        }));
    }
    
    /**
     * Check if positions need normalization (too many gaps or negative values)
     */
    static needsNormalization(items: IPositionItem[]): boolean {
        if (items.length === 0) return false;
        
        const sortedItems = [...items].sort((a, b) => a.position - b.position);
        
        // Check for negative positions (except first element can be -1)
        const hasNegatives = sortedItems.some((item, index) => 
            item.position < 0 && !(index === 0 && item.position === -1)
        );
        
        if (hasNegatives) return true;
        
        // Check for too many small gaps
        let smallGaps = 0;
        for (let i = 1; i < sortedItems.length; i++) {
            const gap = sortedItems[i].position - sortedItems[i - 1].position;
            if (gap < 3) smallGaps++;
        }
        
        // If more than 30% of gaps are small, normalize
        return smallGaps > (sortedItems.length - 1) * 0.3;
    }
} 