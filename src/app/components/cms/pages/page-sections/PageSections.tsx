'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Text,
    Loader,
    Alert,
    Group,
    Box,
    ScrollArea
} from '@mantine/core';
import {
    IconInfoCircle,
    IconAlertCircle,
} from '@tabler/icons-react';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import {
    useAddSectionToPageMutation,
    useRemoveSectionFromPageMutation,
    useRemoveSectionFromSectionMutation,
    useAddSectionToSectionMutation
} from '../../../../../hooks/mutations';
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionsList } from './SectionsList';
import { AddSectionModal } from './AddSectionModal';
import { PageSectionsHeader } from './PageSectionsHeader';
import { calculateSiblingBelowPosition } from '../../../../../utils/position-calculator';
import styles from './PageSections.module.css';

export interface IPageSectionsState {
    searchQuery: string;
    searchResults: number[];
    currentSearchIndex: number;
    sectionsCount: number;
    isProcessing: boolean;
}

export interface IPageSectionsHandlers {
    onSearchChange: (query: string) => void;
    onSearchNext: () => void;
    onSearchPrevious: () => void;
    onSearchClear: () => void;
    onExpandAll: () => void;
    onCollapseAll: () => void;
    onAddSection: () => void;
}

interface IPageSectionsProps {
    pageId: number | null;
    pageName?: string;
    initialSelectedSectionId?: number | null;
    // Callback to expose internal state and handlers to parent
    onStateChange?: (state: IPageSectionsState, handlers: IPageSectionsHandlers) => void;
}

interface IMoveData {
    draggedSectionId: number;
    newParentId: number | null;
    pageId?: number;
    newPosition: number;
    draggedSection: IPageField;
    newParent: IPageField | null;
    descendantIds: number[];
    totalMovingItems: number;
    // Old parent tracking for backend
    oldParentPageId: number | null; // Page ID if section was at page level
    oldParentSectionId: number | null; // Section ID if section was inside another section
}

const PageSectionsComponent = function PageSections({
    pageId,
    pageName,
    initialSelectedSectionId,
    onStateChange
}: IPageSectionsProps) {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = usePageSections(pageId);
    
    // Memoize sections data to prevent unnecessary re-renders
    const memoizedSections = useMemo(() => data?.sections || [], [data?.sections]);
    const router = useRouter();

    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [addSectionModalOpened, setAddSectionModalOpened] = useState(false);
    const [selectedParentSectionId, setSelectedParentSectionId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [specificPosition, setSpecificPosition] = useState<number | undefined>(undefined);

    // Search functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<number[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [focusedSectionId, setFocusedSectionId] = useState<number | null>(null);

    // Section mutations
    const addSectionToPageMutation = useAddSectionToPageMutation({
        showNotifications: true
    });

    const addSectionToSectionMutation = useAddSectionToSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined
    });

    const removeSectionFromPageMutation = useRemoveSectionFromPageMutation({
        showNotifications: true
    });

    const removeSectionFromSectionMutation = useRemoveSectionFromSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined
    });

    // Search functionality
    const searchInSections = useCallback((sections: IPageField[], query: string): number[] => {
        const results: number[] = [];
        const searchLower = query.toLowerCase();

        const searchRecursive = (items: IPageField[]) => {
            items.forEach(item => {
                if (item.name.toLowerCase().includes(searchLower) ||
                    item.style_name.toLowerCase().includes(searchLower) ||
                    item.id.toString().includes(query)) {
                    results.push(item.id);
                }
                if (item.children) {
                    searchRecursive(item.children);
                }
            });
        };

        searchRecursive(sections);
        return results;
    }, []);

    // Helper function to expand all parent sections of a given section - use memoized sections
    const expandParentsOfSection = useCallback((sectionId: number) => {
        if (!memoizedSections.length) return;

        const parentsToExpand = new Set<number>();

        const findParents = (sections: IPageField[], parentId: number | null = null): boolean => {
            for (const section of sections) {
                if (section.id === sectionId) {
                    return true; // Found the target section
                }

                if (section.children) {
                    const foundInChildren = findParents(section.children, section.id);
                    if (foundInChildren) {
                        parentsToExpand.add(section.id); // This section contains the target
                        return true;
                    }
                }
            }
            return false;
        };

        findParents(memoizedSections);

        if (parentsToExpand.size > 0) {
            setExpandedSections(prev => new Set([...Array.from(prev), ...Array.from(parentsToExpand)]));
        }
    }, [memoizedSections]);

    // Helper function to scroll to a section element
    const scrollToSection = useCallback((sectionId: number) => {
        // Use setTimeout to ensure the DOM has updated after expansion
        setTimeout(() => {
            const sectionElement = document.querySelector(`[data-section-id="${sectionId}"]`);
            if (sectionElement) {
                sectionElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }, 100); // Small delay to allow for DOM updates
    }, []);

    // Update search results when query changes - use memoized sections
    useEffect(() => {
        if (searchQuery.trim() && memoizedSections.length > 0) {
            const results = searchInSections(memoizedSections, searchQuery.trim());
            setSearchResults(results);
            if (results.length > 0) {
                const firstResultId = results[0];
                setCurrentSearchIndex(0);
                setFocusedSectionId(firstResultId);
                setSelectedSectionId(firstResultId);

                // Auto-expand and scroll to first result
                expandParentsOfSection(firstResultId);
                scrollToSection(firstResultId);
            } else {
                setCurrentSearchIndex(-1);
                setFocusedSectionId(null);
            }
        } else {
            setSearchResults([]);
            setCurrentSearchIndex(-1);
            setFocusedSectionId(null);
        }

    }, [searchQuery, memoizedSections, searchInSections, expandParentsOfSection, scrollToSection]);

    // Expand all sections that contain search results - use memoized sections
    useEffect(() => {
        if (searchResults.length > 0 && memoizedSections.length > 0) {
            const sectionsToExpand = new Set<number>();

            const findParentsOfResults = (sections: IPageField[], parentId: number | null = null) => {
                sections.forEach(section => {
                    if (section.children) {
                        const hasResultInChildren = section.children.some(child =>
                            searchResults.includes(child.id) ||
                            hasDeepResult(child, searchResults)
                        );

                        if (hasResultInChildren) {
                            sectionsToExpand.add(section.id);
                        }

                        findParentsOfResults(section.children, section.id);
                    }
                });
            };

            const hasDeepResult = (section: IPageField, results: number[]): boolean => {
                if (results.includes(section.id)) return true;
                if (section.children) {
                    return section.children.some(child => hasDeepResult(child, results));
                }
                return false;
            };

            findParentsOfResults(memoizedSections);
            setExpandedSections(prev => new Set([...Array.from(prev), ...Array.from(sectionsToExpand)]));
        }
    }, [searchResults, memoizedSections]);

    // Helper function to find a section by ID
    const findSectionById = useCallback((sectionId: number, sections: IPageField[]): IPageField | null => {
        for (const section of sections) {
            if (section.id === sectionId) return section;
            if (section.children) {
                const found = findSectionById(sectionId, section.children);
                if (found) return found;
            }
        }
        return null;
    }, []);

    const handleToggleExpand = (sectionId: number) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleSectionSelect = (sectionId: number) => {
        // Just update the selected section ID - navigation is handled by SectionLink
        setSelectedSectionId(sectionId);
    };

    // Collapse/Expand all functionality - use memoized sections
    const handleExpandAll = useCallback(() => {
        if (!memoizedSections.length) return;

        const allSectionIds = new Set<number>();
        const collectAllIds = (sections: IPageField[]) => {
            sections.forEach(section => {
                if (section.children && section.children.length > 0) {
                    allSectionIds.add(section.id);
                    collectAllIds(section.children);
                }
            });
        };

        collectAllIds(memoizedSections);
        setExpandedSections(allSectionIds);
    }, [memoizedSections]);

    const handleCollapseAll = useCallback(() => {
        setExpandedSections(new Set());
    }, []);

    // Search navigation
    const handleSearchNext = () => {
        if (searchResults.length === 0) return;

        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        const nextSectionId = searchResults[nextIndex];

        setCurrentSearchIndex(nextIndex);
        setFocusedSectionId(nextSectionId);
        setSelectedSectionId(nextSectionId);

        // Auto-expand parent sections containing the focused result
        expandParentsOfSection(nextSectionId);

        // Auto-scroll to the focused element
        scrollToSection(nextSectionId);
    };

    const handleSearchPrevious = () => {
        if (searchResults.length === 0) return;

        const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
        const prevSectionId = searchResults[prevIndex];

        setCurrentSearchIndex(prevIndex);
        setFocusedSectionId(prevSectionId);
        setSelectedSectionId(prevSectionId);

        // Auto-expand parent sections containing the focused result
        expandParentsOfSection(prevSectionId);

        // Auto-scroll to the focused element
        scrollToSection(prevSectionId);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        setFocusedSectionId(null);
    };

    const handleSectionMove = async (moveData: IMoveData) => {

        try {
            const { draggedSectionId, newParentId, newPosition, pageId, oldParentPageId, oldParentSectionId } = moveData;

            // Prepare section data with new position and old parent information
            const sectionData = {
                position: newPosition,
                oldParentPageId,
                oldParentSectionId
            };

            if (newParentId === null) {
                // Moving to page level - use page mutation
                if (!pageId) {
                    throw new Error('Page ID is required for page-level moves');
                }

                await addSectionToPageMutation.mutateAsync({
                    pageId: pageId,
                    sectionId: draggedSectionId,
                    sectionData: sectionData
                });
            } else {
                // Moving to another section - use section mutation
                if (!pageId) {
                    throw new Error('Page ID is required for section operations');
                }
                await addSectionToSectionMutation.mutateAsync({
                    pageId,
                    parentSectionId: newParentId,
                    sectionId: draggedSectionId,
                    sectionData: sectionData
                });
            }



        } catch (error) {
            // Error handling is done by the mutation hooks
        }
    };

    const handleRemoveSection = async (sectionId: number, parentId: number | null) => {
        // Check if we're removing the currently selected section
        const isRemovingSelectedSection = selectedSectionId === sectionId;

        try {
            if (parentId === null) {
                // Remove from page
                if (!pageId) {
                    throw new Error('Page ID is required for removing sections from page');
                }

                await removeSectionFromPageMutation.mutateAsync({
                    pageId,
                    sectionId
                });
            } else {
                // Remove from parent section
                if (!pageId) {
                    throw new Error('Page ID is required for section operations');
                }
                await removeSectionFromSectionMutation.mutateAsync({
                    pageId,
                    parentSectionId: parentId,
                    childSectionId: sectionId
                });
            }

            // If we removed the currently selected section, navigate to page
            if (isRemovingSelectedSection) {
                setSelectedSectionId(null);
                // Navigate to page view (remove section ID from URL)
                const currentPath = window.location.pathname;
                const pathParts = currentPath.split('/');
                const adminIndex = pathParts.indexOf('admin');
                const pagesIndex = pathParts.indexOf('pages', adminIndex);

                if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
                    const pageKeyword = pathParts[pagesIndex + 1];
                    const newPath = `/admin/pages/${pageKeyword}`;
                    router.push(newPath, { scroll: false });
                }
            }

        } catch (error) {
            // Error handling is done by the mutation hooks
        }
    };

    const handleAddChildSection = (parentSectionId: number) => {
        setSelectedParentSectionId(parentSectionId);
        setSpecificPosition(undefined); // Child sections use default positioning
        setAddSectionModalOpened(true);
    };

    const handleAddSiblingAbove = (referenceSectionId: number, parentId: number | null) => {
        if (!data?.sections) return;

        const referenceSection = findSectionById(referenceSectionId, data.sections);
        if (!referenceSection) return;

        const newPosition = referenceSection.position - 5;

        setSelectedParentSectionId(parentId);
        setSpecificPosition(newPosition);
        setAddSectionModalOpened(true);
    };

    const handleAddSiblingBelow = (referenceSectionId: number, parentId: number | null) => {
        if (!data?.sections) return;

        const referenceSection = findSectionById(referenceSectionId, data.sections);
        if (!referenceSection) return;

        const result = calculateSiblingBelowPosition(referenceSection, parentId);

        setSelectedParentSectionId(parentId);
        setSpecificPosition(result.newPosition);
        setAddSectionModalOpened(true);
    };

    const handleCloseAddSectionModal = () => {
        setAddSectionModalOpened(false);
        setSelectedParentSectionId(null);
        setSpecificPosition(undefined);
    };

    const handleAddSectionClick = () => {
        setAddSectionModalOpened(true);
    };

    // Handle auto-selection of newly created sections
    const handleSectionCreated = (sectionId: number) => {
        setSelectedSectionId(sectionId);
        // Auto-expand parents and scroll to the new section
        setTimeout(() => {
            expandParentsOfSection(sectionId);
            scrollToSection(sectionId);
        }, 100);
    };

    // Handle auto-selection of imported sections (select the first one)
    const handleSectionsImported = (sectionIds: number[]) => {

        if (sectionIds.length > 0) {
            const firstSectionId = sectionIds[0];
            setSelectedSectionId(firstSectionId);
            // Auto-expand parents and scroll to the first imported section
            setTimeout(() => {
                expandParentsOfSection(firstSectionId);
                scrollToSection(firstSectionId);
            }, 100);
        } else {
            // Even if we don't have section IDs, the import was successful
            // The query invalidation will refresh the section list
        }
    };



    // Handle initial selected section ID from URL
    useEffect(() => {
        if (initialSelectedSectionId) {
            setSelectedSectionId(initialSelectedSectionId);
            // Auto-expand parents and scroll to the selected section
            expandParentsOfSection(initialSelectedSectionId);
            scrollToSection(initialSelectedSectionId);
        }
    }, [initialSelectedSectionId, expandParentsOfSection, scrollToSection]);

    // Silently refresh sections on section selection changes to keep left list fresh
    useEffect(() => {
        if (!pageId) return;
        queryClient.prefetchQuery({
            queryKey: ['pageSections', pageId],
            staleTime: 0
        });
    }, [initialSelectedSectionId, pageId, queryClient]);

    // Auto-expand sections with children on initial load - use memoized sections
    useEffect(() => {
        if (memoizedSections.length > 0) {
            const sectionsWithChildren = new Set<number>();

            const findSectionsWithChildren = (items: IPageField[]) => {
                items.forEach(item => {
                    if (item.children && item.children.length > 0) {
                        sectionsWithChildren.add(item.id);
                        findSectionsWithChildren(item.children);
                    }
                });
            };

            findSectionsWithChildren(memoizedSections);
            setExpandedSections(sectionsWithChildren);
        }
    }, [memoizedSections]);

    // Expose state and handlers to parent component
    useEffect(() => {
        if (onStateChange) {
            const isProcessingMove = addSectionToPageMutation.isPending || addSectionToSectionMutation.isPending;
            const isProcessingRemove = removeSectionFromPageMutation.isPending || removeSectionFromSectionMutation.isPending;

            const state: IPageSectionsState = {
                searchQuery,
                searchResults,
                currentSearchIndex,
                sectionsCount: data?.sections?.length || 0,
                isProcessing: isProcessingMove || isProcessingRemove
            };

            const handlers: IPageSectionsHandlers = {
                onSearchChange: setSearchQuery,
                onSearchNext: handleSearchNext,
                onSearchPrevious: handleSearchPrevious,
                onSearchClear: handleSearchClear,
                onExpandAll: handleExpandAll,
                onCollapseAll: handleCollapseAll,
                onAddSection: handleAddSectionClick
            };

            onStateChange(state, handlers);
        }
    }, [
        searchQuery,
        searchResults,
        currentSearchIndex,
        memoizedSections.length,
        addSectionToPageMutation.isPending,
        addSectionToSectionMutation.isPending,
        removeSectionFromPageMutation.isPending,
        removeSectionFromSectionMutation.isPending,
        onStateChange
    ]);

    if (isLoading) {
        return (
            <Paper p="md" withBorder>
                <Group gap="xs" mb="md">
                    <Loader size="sm" />
                    <Text size="sm">Loading page sections...</Text>
                </Group>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper p="md" withBorder>
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error loading sections">
                    {error.message || 'Failed to load page sections'}
                </Alert>
            </Paper>
        );
    }

    // Prepare current state and handlers for header
    const isProcessingMove = addSectionToPageMutation.isPending || addSectionToSectionMutation.isPending;
    const isProcessingRemove = removeSectionFromPageMutation.isPending || removeSectionFromSectionMutation.isPending;

    const currentState: IPageSectionsState = {
        searchQuery,
        searchResults,
        currentSearchIndex,
        sectionsCount: data?.sections?.length || 0,
        isProcessing: isProcessingMove || isProcessingRemove
    };

    const currentHandlers: IPageSectionsHandlers = {
        onSearchChange: setSearchQuery,
        onSearchNext: handleSearchNext,
        onSearchPrevious: handleSearchPrevious,
        onSearchClear: handleSearchClear,
        onExpandAll: handleExpandAll,
        onCollapseAll: handleCollapseAll,
        onAddSection: handleAddSectionClick
    };

    if (!memoizedSections.length) {
        return (
            <>
                <Box className={styles.pageSectionsContainer}>
                    {/* Header - Always show when we have a page */}
                    <PageSectionsHeader
                        pageName={pageName}
                        state={currentState}
                        handlers={currentHandlers}
                    />

                    {/* Empty State Content */}
                    <Box className={styles.scrollableContent}>
                        <Alert icon={<IconInfoCircle size={16} />} color="blue" title="No sections found" className={styles.emptyStateAlert}>
                            <Text size="sm">
                                This page doesn&apos;t have any sections yet. Click the &quot;Add Section&quot; button in the header to get started.
                            </Text>
                        </Alert>
                    </Box>
                </Box>

                {/* Add Section Modal - Now available even when no sections exist */}
                <AddSectionModal
                    opened={addSectionModalOpened}
                    onClose={handleCloseAddSectionModal}
                    pageId={pageId || undefined}
                    parentSectionId={selectedParentSectionId}
                    title={selectedParentSectionId ? "Add Child Section" : "Add Section to Page"}
                    specificPosition={specificPosition}
                />
            </>
        );
    }

    return (
        <Box className={styles.pageSectionsContainer}>
            {/* Header - Always show when we have sections */}
            <PageSectionsHeader
                pageName={pageName}
                state={currentState}
                handlers={currentHandlers}
            />

            {/* Scrollable Content Area - Now full height */}
            <ScrollArea h="calc(100vh - 106px)">
                <SectionsList
                    key={`sections-${pageId}`} // Stable key based on pageId
                    sections={memoizedSections}
                    expandedSections={expandedSections}
                    onToggleExpand={handleToggleExpand}
                    onSectionMove={handleSectionMove}
                    onRemoveSection={handleRemoveSection}
                    onAddChildSection={handleAddChildSection}
                    onAddSiblingAbove={handleAddSiblingAbove}
                    onAddSiblingBelow={handleAddSiblingBelow}
                    onSectionSelect={handleSectionSelect}
                    selectedSectionId={selectedSectionId}
                    focusedSectionId={focusedSectionId}
                    pageId={pageId || undefined}
                    isProcessing={currentState.isProcessing}
                />
            </ScrollArea>

            {/* Add Section Modal */}
            <AddSectionModal
                opened={addSectionModalOpened}
                onClose={handleCloseAddSectionModal}
                pageId={pageId || undefined}
                parentSectionId={selectedParentSectionId}
                title={selectedParentSectionId ? "Add Child Section" : "Add Section to Page"}
                specificPosition={specificPosition}
                onSectionCreated={handleSectionCreated}
                onSectionsImported={handleSectionsImported}
            />
        </Box>
    );
};

// Export memoized component to prevent unnecessary re-renders
export const PageSections = memo(PageSectionsComponent, (prevProps, nextProps) => {
    return (
        prevProps.pageId === nextProps.pageId &&
        prevProps.pageName === nextProps.pageName &&
        prevProps.initialSelectedSectionId === nextProps.initialSelectedSectionId
    );
}); 