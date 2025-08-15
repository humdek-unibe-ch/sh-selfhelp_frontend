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
    useCreateSectionInSectionMutation,
    useAddSectionToPageMutation,
    useAddSectionToSectionMutation
} from './mutations';
import { importSectionsToPage, importSectionsToSection } from '../api/admin/section.api';
import { notifications } from '@mantine/notifications';
import { debug } from '../utils/debug-logger';

export interface IUseSectionOperationsOptions {
    pageKeyword?: string;
    showNotifications?: boolean;
    onSuccess?: (result?: any) => void;
    onError?: (error: any) => void;
    onSectionCreated?: (sectionId: number) => void;
    onSectionsImported?: (sectionIds: number[]) => void;
}

export interface ISectionOperationsResult {
    // Create operations
    createSectionInPage: (styleId: number, options?: ISectionOperationOptions & { name?: string }) => Promise<void>;
    createSectionInSection: (parentSectionId: number, styleId: number, options?: ISectionOperationOptions & { name?: string }) => Promise<void>;
    
    // Add operations (for existing sections)
    addSectionToPage: (sectionId: number, options?: ISectionOperationOptions) => Promise<void>;
    addSectionToSection: (parentSectionId: number, sectionId: number, options?: ISectionOperationOptions) => Promise<void>;
    
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
    const { pageKeyword, showNotifications = true, onSuccess, onError, onSectionCreated, onSectionsImported } = hookOptions;
    const queryClient = useQueryClient();

    // Mutation hooks
    const createSectionInPageMutation = useCreateSectionInPageMutation({
        showNotifications,
        onSuccess: (result) => {
            const sectionId = result?.id || result?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const createSectionInSectionMutation = useCreateSectionInSectionMutation({
        showNotifications,
        pageKeyword,
        onSuccess: (result) => {
            const sectionId = result?.id || result?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const addSectionToPageMutation = useAddSectionToPageMutation({
        showNotifications,
        onSuccess: (result) => {
            const sectionId = result?.id || result?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const addSectionToSectionMutation = useAddSectionToSectionMutation({
        showNotifications,
        pageKeyword,
        onSuccess: (result) => {
            const sectionId = result?.id || result?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
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

    // Add existing section to page
    const addSectionToPage = useCallback(async (
        sectionId: number, 
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const position = options.specificPosition !== undefined ? options.specificPosition : -1;
        
        logSectionOperation('Add Section to Page', { sectionId }, {
            position,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        await addSectionToPageMutation.mutateAsync({
            keyword: pageKeyword,
            sectionId,
            sectionData: { position }
        });
    }, [pageKeyword, addSectionToPageMutation]);

    // Add existing section to section
    const addSectionToSection = useCallback(async (
        parentSectionId: number,
        sectionId: number, 
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageKeyword) {
            throw new Error('Page keyword is required for section operations');
        }

        const position = options.specificPosition !== undefined ? options.specificPosition : -1;
        
        logSectionOperation('Add Section to Section', { sectionId, parentSectionId }, {
            position,
            description: options.specificPosition !== undefined 
                ? `Specific position: ${options.specificPosition}` 
                : 'Default position (-1)'
        });

        await addSectionToSectionMutation.mutateAsync({
            keyword: pageKeyword,
            parentSectionId,
            sectionId,
            sectionData: { position }
        });
    }, [pageKeyword, addSectionToSectionMutation]);

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
            const result = await importSectionsToPage(pageKeyword, sections, importData.position);
            
            // Debug log the actual response structure
            debug('Import sections to page response', 'useSectionOperations', { 
                result, 
                fullResponse: result,
                dataField: result?.data,
                sectionsField: result?.data?.sections,
                importedSectionsField: result?.data?.importedSections
            });
            
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            // Extract section IDs from import result for auto-selection
            // Try multiple possible response structures
            let importedSectionIds: number[] = [];
            
            // Cast to any to handle unknown response structure
            const responseData = result as any;
            
            if (responseData?.data?.sections && Array.isArray(responseData.data.sections)) {
                importedSectionIds = responseData.data.sections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.data?.importedSections && Array.isArray(responseData.data.importedSections)) {
                importedSectionIds = responseData.data.importedSections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.data?.sectionIds && Array.isArray(responseData.data.sectionIds)) {
                importedSectionIds = responseData.data.sectionIds;
            } else if (responseData?.sections && Array.isArray(responseData.sections)) {
                importedSectionIds = responseData.sections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.importedSections && Array.isArray(responseData.importedSections)) {
                importedSectionIds = responseData.importedSections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.sectionIds && Array.isArray(responseData.sectionIds)) {
                importedSectionIds = responseData.sectionIds;
            }
            
            debug('Extracted section IDs for auto-selection', 'useSectionOperations', { 
                importedSectionIds,
                hasCallback: !!onSectionsImported,
                sectionsCount: sections.length
            });
            
            if (importedSectionIds.length > 0 && onSectionsImported) {
                onSectionsImported(importedSectionIds);
            } else if (onSectionsImported && sections.length > 0) {
                // If we couldn't extract section IDs but have sections, log a warning
                // This ensures the callback is called but with empty array
                debug('Could not extract section IDs from import response, calling callback with empty array', 'useSectionOperations', { 
                    responseStructure: Object.keys(responseData || {}),
                    dataStructure: Object.keys(responseData?.data || {}),
                    fullResponse: responseData
                });
                
                // Still call the callback so the UI can handle the import completion
                // The callback implementation can decide how to handle empty section IDs
                onSectionsImported([]);
            }
            
            if (showNotifications) {
                notifications.show({
                    title: 'Import Successful',
                    message: `Successfully imported ${sections.length} section(s)${importData.position !== undefined ? ` at position ${importData.position}` : ''}`,
                    color: 'green'
                });
            }
            
            onSuccess?.(result);
        } catch (error) {
            debug('Error importing sections to page', 'useSectionOperations', { error });
            
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
    }, [pageKeyword, showNotifications, onSuccess, onError, onSectionsImported, invalidateQueriesAfterImport]);

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
            const result = await importSectionsToSection(pageKeyword, parentSectionId, sections, importData.position);
            
            // Debug log the actual response structure
            debug('Import sections to section response', 'useSectionOperations', { 
                result, 
                fullResponse: result,
                dataField: result?.data,
                sectionsField: result?.data?.sections,
                importedSectionsField: result?.data?.importedSections
            });
            
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            // Extract section IDs from import result for auto-selection
            // Try multiple possible response structures
            let importedSectionIds: number[] = [];
            
            // Cast to any to handle unknown response structure
            const responseData = result as any;
            
            if (responseData?.data?.sections && Array.isArray(responseData.data.sections)) {
                importedSectionIds = responseData.data.sections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.data?.importedSections && Array.isArray(responseData.data.importedSections)) {
                importedSectionIds = responseData.data.importedSections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.data?.sectionIds && Array.isArray(responseData.data.sectionIds)) {
                importedSectionIds = responseData.data.sectionIds;
            } else if (responseData?.sections && Array.isArray(responseData.sections)) {
                importedSectionIds = responseData.sections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.importedSections && Array.isArray(responseData.importedSections)) {
                importedSectionIds = responseData.importedSections.map((s: any) => s.id).filter(Boolean);
            } else if (responseData?.sectionIds && Array.isArray(responseData.sectionIds)) {
                importedSectionIds = responseData.sectionIds;
            }
            
            debug('Extracted section IDs for auto-selection', 'useSectionOperations', { 
                importedSectionIds,
                hasCallback: !!onSectionsImported,
                sectionsCount: sections.length
            });
            
            if (importedSectionIds.length > 0 && onSectionsImported) {
                onSectionsImported(importedSectionIds);
            } else if (onSectionsImported && sections.length > 0) {
                // If we couldn't extract section IDs but have sections, log a warning
                // This ensures the callback is called but with empty array
                debug('Could not extract section IDs from import response, calling callback with empty array', 'useSectionOperations', { 
                    responseStructure: Object.keys(responseData || {}),
                    dataStructure: Object.keys(responseData?.data || {}),
                    fullResponse: responseData
                });
                
                // Still call the callback so the UI can handle the import completion
                // The callback implementation can decide how to handle empty section IDs
                onSectionsImported([]);
            }
            
            if (showNotifications) {
                notifications.show({
                    title: 'Import Successful',
                    message: `Successfully imported ${sections.length} section(s)${importData.position !== undefined ? ` at position ${importData.position}` : ''}`,
                    color: 'green'
                });
            }
            
            onSuccess?.(result);
        } catch (error) {
            debug('Error importing sections to section', 'useSectionOperations', { error });
            
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
    }, [pageKeyword, showNotifications, onSuccess, onError, onSectionsImported, invalidateQueriesAfterImport]);

    return {
        createSectionInPage,
        createSectionInSection,
        addSectionToPage,
        addSectionToSection,
        importSectionsToPage: importSectionsToPageHandler,
        importSectionsToSection: importSectionsToSectionHandler,
        isLoading: createSectionInPageMutation.isPending || 
                   createSectionInSectionMutation.isPending ||
                   addSectionToPageMutation.isPending ||
                   addSectionToSectionMutation.isPending
    };
} 