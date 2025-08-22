/**
 * Page Content Context Provider and Hook.
 * Manages global page content state and provides methods to update it.
 * Integrates with React Query for caching and state management.
 * 
 * @module contexts/PageContentContext
 */

"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IPageContent } from '../../types/responses/frontend/frontend.types';

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
    const updatePageContent = (keyword: string, content: IPageContent) => {
        queryClient.setQueryData(['page-content', keyword], content);
        setPageContent(content);
    };

    /**
     * Clears the current page content (useful when navigating between pages)
     */
    const clearPageContent = () => {
        setPageContent(null);
    };

    return (
        <PageContentContext.Provider value={{ 
            pageContent, 
            setPageContent, 
            updatePageContent,
            clearPageContent 
        }}>
            {children}
        </PageContentContext.Provider>
    );
};

// Export the context for direct usage
export { PageContentContext };

/**
 * Hook to access page content context
 * @throws {Error} When used outside of PageContentProvider
 * @returns {PageContentContextType} Page content context value
 */
export const usePageContentContext = () => {
    const context = useContext(PageContentContext);
    if (!context) {
        throw new Error('usePageContentContext must be used within a PageContentProvider');
    }
    return context;
};
