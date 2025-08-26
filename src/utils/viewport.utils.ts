/**
 * Utility functions for viewport and element visibility detection
 */

/**
 * Check if an element is currently visible in the viewport
 * @param element - The DOM element to check
 * @param threshold - How much of the element should be visible (0 to 1)
 * @returns true if the element is sufficiently visible in the viewport
 */
export function isElementInViewport(element: Element | null, threshold: number = 0.5): boolean {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    // Check if element is completely outside viewport
    if (rect.bottom < 0 || rect.top > windowHeight || rect.right < 0 || rect.left > windowWidth) {
        return false;
    }

    // Calculate visible area
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleLeft = Math.max(0, rect.left);
    const visibleRight = Math.min(windowWidth, rect.right);

    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    const visibleArea = visibleHeight * visibleWidth;

    const totalArea = rect.height * rect.width;
    const visibilityRatio = totalArea > 0 ? visibleArea / totalArea : 0;

    return visibilityRatio >= threshold;
}

/**
 * Check if an element is approximately centered in the viewport
 * @param element - The DOM element to check
 * @param tolerance - Tolerance for "centered" in pixels
 * @returns true if the element center is near the viewport center
 */
export function isElementCentered(element: Element | null, tolerance: number = 100): boolean {
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    
    return Math.abs(elementCenter - viewportCenter) <= tolerance;
}

/**
 * Smart scroll function that only scrolls if element is not sufficiently visible
 * @param element - The DOM element to scroll to
 * @param options - Scroll options
 */
export function smartScrollToElement(
    element: Element | null, 
    options: {
        behavior?: ScrollBehavior;
        block?: ScrollLogicalPosition;
        inline?: ScrollLogicalPosition;
        threshold?: number;
    } = {}
): boolean {
    const { 
        behavior = 'smooth', 
        block = 'center', 
        inline = 'nearest',
        threshold = 0.7 
    } = options;

    if (!element) return false;

    // Check if element is already sufficiently visible
    if (isElementInViewport(element, threshold)) {
        return false; // No scroll needed
    }

    // Element is not sufficiently visible, scroll to it
    element.scrollIntoView({
        behavior,
        block,
        inline
    });

    return true; // Scroll was performed
}
