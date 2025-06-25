/**
 * Section Operations Hook
 * 
 * Provides easy access to section operations with consistent position handling.
 * This hook combines the section operations utility with the existing mutation hooks
 * to provide a unified interface for all section operations.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ISectionExportData } from '../api/admin/section.api';
import { 
    prepareSectionImportData, 
    prepareSectionCreateData, 
    logSectionOperation,
    ISectionOperationOptions 
} from '../utils/section-operations.utils';
import { 
    useCreateSectionInPageMutation, 
    useCreateSectionInSectionMutation 
} from './mutations';
import { importSectionsToPage, importSectionsToSection } from '../api/admin/section.api';
import { notifications } from '@mantine/notifications';

export interface IUseSectionOperationsOptions {
    pageKeyword?: string;
    showNotifications?: boolean;
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export interface ISectionOperationsResult {
    // Create operations
    createSectionInPage: (styleId: number, options?: ISectionOperationOptions & { name?: string }) => Promise<void>;
    createSectionInSection: (parentSectionId: number, styleId: number, options?: ISectionOperationOptions & { name?: string }) => Promise<void>;
    
    // Import operations
    importSectionsToPage: (sections: ISectionExportData[], options?: ISectionOperationOptions) => Promise<void>;
    importSectionsToSection: (parentSectionId: number, sections: ISectionExportData[], options?: ISectionOperationOptions) => Promise<void>;
    
    // Status
    isLoading: boolean;
}

/**
 * Hook that provides unified section operations with position handling
 */
export function useSectionOperations(hookOptions: IUseSectionOperationsOptions = {}): ISectionOperationsResult {
    const { pageKeyword, showNotifications = true, onSuccess, onError } = hookOptions;
    const queryClient = useQueryClient();

    // Mutation hooks
    const createSectionInPageMutation = useCreateSectionInPageMutation({
        showNotifications,
        onSuccess: () => onSuccess?.(),
        onError: (error) => onError?.(error)
    });

    const createSectionInSectionMutation = useCreateSectionInSectionMutation({
        showNotifications,
        pageKeyword,
        onSuccess: () => onSuccess?.(),
        onError: (error) => onError?.(error)
    });

    // Helper function to invalidate relevant queries after import operations
    const invalidateQueriesAfterImport = useCallback(async () => {
        if (!pageKeyword) return;

        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['pageSections', pageKeyword] }),
            queryClient.invalidateQueries({ queryKey: ['pageFields', pageKeyword] }),
            queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
        ]);
    }, [queryClient, pageKeyword]);

    // Create section in page
    const createSectionInPage = useCallback(async (
        styleId: number, 
        options: ISectionOperationOptions & { name?: string } = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const sectionData = prepareSectionCreateData(styleId, options);
        
        logSectionOperation('Create Section in Page', sectionData, {
            position: sectionData.position,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        await createSectionInPageMutation.mutateAsync({
            keyword: pageKeyword,
            sectionData
        });
    }, [pageKeyword, createSectionInPageMutation]);

    // Create section in section
    const createSectionInSection = useCallback(async (
        parentSectionId: number,
        styleId: number, 
        options: ISectionOperationOptions & { name?: string } = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const sectionData = prepareSectionCreateData(styleId, options);
        
        logSectionOperation('Create Section in Section', sectionData, {
            position: sectionData.position,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        await createSectionInSectionMutation.mutateAsync({
            keyword: pageKeyword,
            parentSectionId,
            sectionData
        });
    }, [pageKeyword, createSectionInSectionMutation]);

    // Import sections to page
    const importSectionsToPageHandler = useCallback(async (
        sections: ISectionExportData[],
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const importData = prepareSectionImportData(sections, options);
        
        logSectionOperation('Import Sections to Page', importData, {
            position: importData.position || -1,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        try {
            await importSectionsToPage(pageKeyword, sections, importData.position);
            
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            if (showNotifications) {
                notifications.show({
                    title: 'Import Successful',
                    message: `Successfully imported ${sections.length} section(s)${importData.position !== undefined ? ` at position ${importData.position}` : ''}`,
                    color: 'green'
                });
            }
            
            onSuccess?.();
        } catch (error) {
            if (showNotifications) {
                notifications.show({
                    title: 'Import Failed',
                    message: error instanceof Error ? error.message : 'Failed to import sections',
                    color: 'red'
                });
            }
            
            onError?.(error);
            throw error;
        }
    }, [pageKeyword, showNotifications, onSuccess, onError]);

    // Import sections to section
    const importSectionsToSectionHandler = useCallback(async (
        parentSectionId: number,
        sections: ISectionExportData[],
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const importData = prepareSectionImportData(sections, options);
        
        logSectionOperation('Import Sections to Section', importData, {
            position: importData.position || -1,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        try {
            await importSectionsToSection(pageKeyword, parentSectionId, sections, importData.position);
            
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            if (showNotifications) {
                notifications.show({
                    title: 'Import Successful',
                    message: `Successfully imported ${sections.length} section(s)${importData.position !== undefined ? ` at position ${importData.position}` : ''}`,
                    color: 'green'
                });
            }
            
            onSuccess?.();
        } catch (error) {
            if (showNotifications) {
                notifications.show({
                    title: 'Import Failed',
                    message: error instanceof Error ? error.message : 'Failed to import sections',
                    color: 'red'
                });
            }
            
            onError?.(error);
            throw error;
        }
    }, [pageKeyword, showNotifications, onSuccess, onError]);

    return {
        createSectionInPage,
        createSectionInSection,
        importSectionsToPage: importSectionsToPageHandler,
        importSectionsToSection: importSectionsToSectionHandler,
        isLoading: createSectionInPageMutation.isPending || createSectionInSectionMutation.isPending
    };
} 