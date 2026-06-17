/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Section Operations Hook
 * 
 * Provides easy access to section operations with consistent position handling.
 * This hook combines the section operations utility with the existing mutation hooks
 * to provide a unified interface for all section operations.
 */

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
    prepareSectionImportData, 
    prepareSectionCreateData, 
    type ISectionOperationOptions,
    flattenSections, 
} from '../utils/section-operations.utils';
import {
    useCreateSectionInPageMutation,
    useCreateSectionInSectionMutation,
    useAddSectionToPageMutation,
    useAddSectionToSectionMutation,
    useRemoveSectionFromPageMutation,
    useRemoveSectionFromSectionMutation,
    useRemoveBulkSectionsFromPageMutation
} from './mutations';
import { importSectionsToPage, importSectionsToSection, type ISectionExportData } from '../api/admin/section.api';
import { notifications } from '@mantine/notifications';
import { type IStyle } from '../types/responses/admin/styles.types';

/** Minimal shape of a created/added section result consumed for auto-selection. */
type TSectionCreateResult = { id?: number; section?: { id?: number } };

/** Possible shapes returned by the import-sections endpoints (probed at runtime). */
interface IImportSectionsResultProbe {
    data?: {
        sections?: Array<{ id: number }>;
        importedSections?: Array<{ id: number }>;
        sectionIds?: number[];
    };
    sections?: Array<{ id: number }>;
    importedSections?: Array<{ id: number }>;
    sectionIds?: number[];
}

export interface SectionStyleItem {
  style: IStyle;
  quantity: number;
}

interface SectionItem {
  sectionId: number;
}

export interface IUseSectionOperationsOptions {
    pageId?: number;
    showNotifications?: boolean;
    onSuccess?: (result?: unknown) => void;
    onError?: (error: unknown) => void;
    onSectionCreated?: (sectionId: number) => void;
    onSectionsImported?: (sectionIds: number[]) => void;
}

/**
 * Options for moving/adding an existing section, including where it came from
 * (used to reconcile the old parent during drag-and-drop moves).
 */
export type IMoveSectionOptions = ISectionOperationOptions & {
    oldParentPageId?: number | null;
    oldParentSectionId?: number | null;
};

export interface ISectionOperationsResult {
    // Create operations
    createSectionInPage: (
    styles: SectionStyleItem[],
    option: ISectionOperationOptions & { name?: string }
    ) => Promise<void>;

    createSectionInSection: (
    parentSectionId: number,
    styles: SectionStyleItem[],
    options: ISectionOperationOptions & { name?: string }
    ) => Promise<void>;
        
    // Add operations (for existing sections)
    addSectionToPage: (
    sections: SectionItem[],
    options: IMoveSectionOptions
    ) => Promise<void>;

    addSectionToSection: (
    parentSectionId: number,
    sections: SectionItem[],
    options: IMoveSectionOptions
    ) => Promise<void>;

    // Remove operations
    removeSectionFromPage: (sectionIds: number) => Promise<void>;
    removeSectionFromSection: (parentSectionId: number, childSectionId: number) => Promise<void>;

    // Import operations
    importSectionsToPage: (sections: ISectionExportData[], options?: ISectionOperationOptions) => Promise<void>;
    importSectionsToSection: (parentSectionId: number, sections: ISectionExportData[], options?: ISectionOperationOptions) => Promise<void>;

    //Bulk Remove
    removeBulkSectionsFromPage: (sectionIds: number[]) => Promise<void>;
    
    // Status
    isLoading: boolean;
}

/**
 * Hook that provides unified section operations with position handling
 */
export function useSectionOperations(hookOptions: IUseSectionOperationsOptions = {}): ISectionOperationsResult {
    const { pageId, showNotifications = true, onSuccess, onError, onSectionCreated, onSectionsImported } = hookOptions;
    const queryClient = useQueryClient();

    // Mutation hooks
    const createSectionInPageMutation = useCreateSectionInPageMutation({
        showNotifications,
        onSuccess: (result) => {
            const created = result as TSectionCreateResult;
            const sectionId = created?.id || created?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const createSectionInSectionMutation = useCreateSectionInSectionMutation({
        showNotifications,
        pageId,
        onSuccess: (result) => {
            const created = result as TSectionCreateResult;
            const sectionId = created?.id || created?.section?.id;
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
            const created = result as TSectionCreateResult;
            const sectionId = created?.id || created?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const addSectionToSectionMutation = useAddSectionToSectionMutation({
        showNotifications,
        pageId,
        onSuccess: (result) => {
            const created = result as TSectionCreateResult;
            const sectionId = created?.id || created?.section?.id;
            if (sectionId && onSectionCreated) {
                onSectionCreated(sectionId);
            }
            onSuccess?.(result);
        },
        onError: (error) => onError?.(error)
    });

    const removeSectionFromPageMutation = useRemoveSectionFromPageMutation({
        showNotifications,
        onSuccess: (result, _variables) => onSuccess?.(result),
        onError: (error) => onError?.(error)
    });

    const removeSectionFromSectionMutation = useRemoveSectionFromSectionMutation({
        showNotifications,
        pageId,
        onSuccess: (result, _variables) => onSuccess?.(result),
        onError: (error) => onError?.(error)
    });

    const removeBulkSectionsFromPageMutation = useRemoveBulkSectionsFromPageMutation({
        showNotifications,
        onSuccess: (result, _variables) => onSuccess?.(result),
        onError: (error) => onError?.(error)
    });

    // Helper function to invalidate relevant queries after import operations
    const invalidateQueriesAfterImport = useCallback(async () => {
        if (!pageId) return;

        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] }),
            queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] }),
            queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
        ]);
    }, [queryClient, pageId]);

    // Create section in page
    const createSectionInPage = useCallback(async (
    styles: SectionStyleItem[],
    options: ISectionOperationOptions & { name?: string }
    ) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }
        const { specificPosition, name } = options;

        const sections = styles.flatMap((item) =>
            prepareSectionCreateData(item.style.id, {
            specificPosition,
            name,
            quantity: item.quantity,
            }),
        );
        
        await createSectionInPageMutation.mutateAsync({
            pageId: pageId,
            sections: sections,
        });
    }, [pageId, createSectionInPageMutation]);

    // Create section in section
   const createSectionInSection = useCallback(
     async (
       parentSectionId: number,
       styles: SectionStyleItem[],
       options: ISectionOperationOptions & { name?: string } = {},
     ) => {
       if (!pageId) {
         throw new Error("Page ID is required for section operations");
       }

       const { specificPosition, name } = options;

       const sections = styles.flatMap((item) =>
         prepareSectionCreateData(item.style.id, {
           specificPosition,
           name,
           quantity: item.quantity,
         }),
       );

       await createSectionInSectionMutation.mutateAsync({
         pageId,
         parentSectionId,
         sections: sections,
       });
     },
     [pageId, createSectionInSectionMutation],
   );

    // Add existing section to page
    const addSectionToPage = useCallback(async (
        sections: SectionItem[],
        options: IMoveSectionOptions = {}
    ) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        const position = options.specificPosition !== undefined ? options.specificPosition : -1;

        await addSectionToPageMutation.mutateAsync({
        pageId,
        sections: flattenSections(sections, position, options),
        });
    }, [pageId, addSectionToPageMutation]);

    // Add existing section to section
    const addSectionToSection = useCallback(async (
        parentSectionId: number,
        sections: SectionItem[],
        options: IMoveSectionOptions = {}
    ) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        const position = options.specificPosition !== undefined ? options.specificPosition : -1;

        await addSectionToSectionMutation.mutateAsync({
        pageId,
        parentSectionId,
        sections: flattenSections(sections, position, options),
        });
    }, [pageId, addSectionToSectionMutation]);

    // Remove section from page
    const removeSectionFromPage = useCallback(async (sectionId: number) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        await removeSectionFromPageMutation.mutateAsync({
            pageId: pageId,
            sectionId
        });
    }, [pageId, removeSectionFromPageMutation]);

    // Remove section from section
    const removeSectionFromSection = useCallback(async (parentSectionId: number, childSectionId: number) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        await removeSectionFromSectionMutation.mutateAsync({
            pageId: pageId,
            parentSectionId,
            childSectionId
        });
    }, [pageId, removeSectionFromSectionMutation]);

    const removeBulkSectionsFromPage = useCallback(
      async (sectionIds: number[]) => {
        if (!pageId) {
          throw new Error("Page ID is required for section operations");
        }

        await removeBulkSectionsFromPageMutation.mutateAsync({
          pageId,
          sectionIds,
        });
      },
      [pageId, removeBulkSectionsFromPageMutation],
    );

    // Import sections to page
    const importSectionsToPageHandler = useCallback(async (
        sections: ISectionExportData[],
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        const importData = prepareSectionImportData(sections, options);

        try {
            const result = await importSectionsToPage(pageId, sections, importData.position);
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            // Extract section IDs from import result for auto-selection
            // Try multiple possible response structures
            let importedSectionIds: number[] = [];
            
            // Narrow to the known possible import-response shapes
            const responseData = result as unknown as IImportSectionsResultProbe;
            
            if (responseData?.data?.sections && Array.isArray(responseData.data.sections)) {
                importedSectionIds = responseData.data.sections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.data?.importedSections && Array.isArray(responseData.data.importedSections)) {
                importedSectionIds = responseData.data.importedSections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.data?.sectionIds && Array.isArray(responseData.data.sectionIds)) {
                importedSectionIds = responseData.data.sectionIds;
            } else if (responseData?.sections && Array.isArray(responseData.sections)) {
                importedSectionIds = responseData.sections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.importedSections && Array.isArray(responseData.importedSections)) {
                importedSectionIds = responseData.importedSections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.sectionIds && Array.isArray(responseData.sectionIds)) {
                importedSectionIds = responseData.sectionIds;
            }
            
            if (importedSectionIds.length > 0 && onSectionsImported) {
                onSectionsImported(importedSectionIds);
            } else if (onSectionsImported && sections.length > 0) {
                // If we couldn't extract section IDs but have sections, still call the callback
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
    }, [pageId, showNotifications, onSuccess, onError, onSectionsImported, invalidateQueriesAfterImport]);

    // Import sections to section
    const importSectionsToSectionHandler = useCallback(async (
        parentSectionId: number,
        sections: ISectionExportData[],
        options: ISectionOperationOptions = {}
    ) => {
        if (!pageId) {
            throw new Error('Page ID is required for section operations');
        }

        const importData = prepareSectionImportData(sections, options);

        try {
            const result = await importSectionsToSection(pageId, parentSectionId, sections, importData.position);
            
            // Invalidate queries to refresh the section list
            await invalidateQueriesAfterImport();
            
            // Extract section IDs from import result for auto-selection
            // Try multiple possible response structures
            let importedSectionIds: number[] = [];
            
            // Narrow to the known possible import-response shapes
            const responseData = result as unknown as IImportSectionsResultProbe;
            
            if (responseData?.data?.sections && Array.isArray(responseData.data.sections)) {
                importedSectionIds = responseData.data.sections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.data?.importedSections && Array.isArray(responseData.data.importedSections)) {
                importedSectionIds = responseData.data.importedSections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.data?.sectionIds && Array.isArray(responseData.data.sectionIds)) {
                importedSectionIds = responseData.data.sectionIds;
            } else if (responseData?.sections && Array.isArray(responseData.sections)) {
                importedSectionIds = responseData.sections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.importedSections && Array.isArray(responseData.importedSections)) {
                importedSectionIds = responseData.importedSections.map((s) => s.id).filter(Boolean);
            } else if (responseData?.sectionIds && Array.isArray(responseData.sectionIds)) {
                importedSectionIds = responseData.sectionIds;
            }
            
            if (importedSectionIds.length > 0 && onSectionsImported) {
                onSectionsImported(importedSectionIds);
            } else if (onSectionsImported && sections.length > 0) {
                // If we couldn't extract section IDs but have sections, still call the callback
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
    }, [pageId, showNotifications, onSuccess, onError, onSectionsImported, invalidateQueriesAfterImport]);

    return {
        removeBulkSectionsFromPage,
        createSectionInPage,
        createSectionInSection,
        addSectionToPage,
        addSectionToSection,
        removeSectionFromPage,
        removeSectionFromSection,
        importSectionsToPage: importSectionsToPageHandler,
        importSectionsToSection: importSectionsToSectionHandler,
        isLoading: createSectionInPageMutation.isPending ||
                   createSectionInSectionMutation.isPending ||
                   addSectionToPageMutation.isPending ||
                   addSectionToSectionMutation.isPending ||
                   removeSectionFromPageMutation.isPending ||
                   removeSectionFromSectionMutation.isPending ||
                   removeBulkSectionsFromPageMutation.isPending
    };
}
