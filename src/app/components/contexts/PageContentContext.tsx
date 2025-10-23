/**
 * Page Content Context Provider and Hook.
 * Manages global page content state and provides methods to update it.
 * Integrates with React Query for caching and state management.
 * 
 * @module contexts/PageContentContext
 */

"use client";
import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IPageContent } from '../../../types/responses/frontend/frontend.types';

/**
 * Page content context type definition
 */
interface PageContentContextType {
    /** Current page content */
    pageContent: IPageContent | null;
    /** Sets the current page content */
    setPageContent: (content: IPageContent) => void;
    /** Updates both React Query cache and local state */
    updatePageContent: (keyword: string, content: IPageContent) => void;
    /** Clears the current page content */
    clearPageContent: () => void;
}

/**
 * Context instance with undefined default value
 */
const PageContentContext = createContext<PageContentContextType | undefined>(undefined);

/**
 * Page Content Provider Component
 * Manages page content state and provides methods to update it
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
export const PageContentProvider = ({ children }: { children: ReactNode }) => {
    const [pageContent, setPageContent] = useState<IPageContent | null>(null);
    const queryClient = useQueryClient();

    /**
     * Updates both React Query cache and local state
     * @param {string} keyword - Page identifier
     * @param {IPageContent} content - New page content
     */
    const updatePageContent = useCallback((keyword: string, content: IPageContent) => {
        queryClient.setQueryData(['page-content', keyword], content);
        setPageContent(content);
    }, [queryClient]);

    /**
     * Clears the current page content (useful when navigating between pages)
     */
    const clearPageContent = useCallback(() => {
        setPageContent(null);
    }, []);

    const contextValue = useMemo(() => ({
        pageContent,
        setPageContent,
        updatePageContent,
        clearPageContent
    }), [pageContent, updatePageContent, clearPageContent]);

    return (
        <PageContentContext.Provider value={contextValue}>
            {children}
        </PageContentContext.Provider>
    );
};

// Export the context for direct usage
export { PageContentContext };

/**
 * Hook to access page content context
 * Returns default implementation when used outside of PageContentProvider (for layout components)
 * @returns {PageContentContextType} Page content context value
 */
export const usePageContentContext = () => {
    const context = useContext(PageContentContext);
    if (!context) {
        // Return default implementation for layout components that need the hook but don't have access to provider
        return {
            pageContent: null,
            setPageContent: () => {},
            updatePageContent: () => {},
            clearPageContent: () => {}
        };
    }
    return context;
};
