"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IPageContent } from '@/types/api/requests.type';

interface PageContentContextType {
    pageContent: IPageContent | null;
    setPageContent: (content: IPageContent) => void;
    updatePageContent: (keyword: string, content: IPageContent) => void;
}

const PageContentContext = createContext<PageContentContextType | undefined>(undefined);

export const PageContentProvider = ({ children }: { children: ReactNode }) => {
    const [pageContent, setPageContent] = useState<IPageContent | null>(null);
    const queryClient = useQueryClient();

    const updatePageContent = (keyword: string, content: IPageContent) => {
        // Update both the React Query cache and local state
        queryClient.setQueryData(['page-content', keyword], content);
        setPageContent(content);
    };

    return (
        <PageContentContext.Provider value={{ 
            pageContent, 
            setPageContent, 
            updatePageContent 
        }}>
            {children}
        </PageContentContext.Provider>
    );
};

// Export the context itself for useContext usage
export { PageContentContext };

// Hook for components that need to read the content
export const usePageContentContext = () => {
    const context = useContext(PageContentContext);
    if (!context) {
        throw new Error('usePageContentContext must be used within a PageContentProvider');
    }
    return context;
};
