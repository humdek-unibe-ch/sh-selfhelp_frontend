/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState, useEffect, useCallback, memo, useMemo, useDeferredValue, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Alert,
    Group,
    Badge,
    Button,
    TextInput,
    ActionIcon,
    Tooltip,
    Box,
    Stack,
    LoadingOverlay
} from '@mantine/core';
import {
    IconAlertCircle,
    IconPlus,
    IconSearch,
    IconChevronUp,
    IconChevronDown,
    IconX,
    IconArrowLeft,
    IconArrowRight,
    IconTrash,
    IconRefresh
} from '@tabler/icons-react';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import { useSectionOperations } from '../../../../../hooks/useSectionOperations';
import { useStyleGroups } from '../../../../../hooks/useStyleGroups';
import { IPageSectionWithFields } from '../../../../../types/common/pages.type';
import { SectionsList } from './SectionsList';
import { AddSectionModal } from './add-section-modal/AddSectionModal';
import { calculateSiblingBelowPosition } from '../../../../../utils/position-calculator';
import { PageHeader } from '../../../shared/common/PageHeader';
import { BulkRemoveModal } from './BulkRemoveModal';

// Helper function to recursively sort sections and their children by position
const sortSectionsByPosition = (sections: IPageSectionWithFields[]): IPageSectionWithFields[] => {
    return sections
        .slice()
        .sort((a, b) => a.position - b.position)
        .map(section => ({
            ...section,
            children: section.children ? sortSectionsByPosition(section.children) : []
        }));
};

interface ISectionLookup {
    validIds: Set<number>;
    parentById: Map<number, number | null>;
    nameById: Map<number, string>;
}

const buildSectionLookup = (sections: IPageSectionWithFields[]): ISectionLookup => {
    const validIds = new Set<number>();
    const parentById = new Map<number, number | null>();
    const nameById = new Map<number, string>();

    const collect = (items: IPageSectionWithFields[], parentId: number | null) => {
        items.forEach(section => {
            validIds.add(section.id);
            parentById.set(section.id, parentId);
            nameById.set(section.id, section.section_name);
            if (section.children) collect(section.children, section.id);
        });
    };

    collect(sections, null);
    return { validIds, parentById, nameById };
};

const getTopMostSelectedIdsFromLookup = (
    selectedIds: Set<number>,
    lookup: ISectionLookup
): number[] => {
    const ids: number[] = [];

    selectedIds.forEach(id => {
        if (!lookup.validIds.has(id)) return;

        let parentId = lookup.parentById.get(id) ?? null;
        while (parentId !== null) {
            if (selectedIds.has(parentId)) return;
            parentId = lookup.parentById.get(parentId) ?? null;
        }

        ids.push(id);
    });

    return ids;
};

interface ISectionSearchItem {
    id: number;
    text: string;
}

const buildSectionSearchIndex = (sections: IPageSectionWithFields[]): ISectionSearchItem[] => {
    const index: ISectionSearchItem[] = [];

    const collect = (items: IPageSectionWithFields[]) => {
        items.forEach((section) => {
            index.push({
                id: section.id,
                text: `${section.section_name} ${section.style_name} ${section.id}`.toLowerCase(),
            });

            if (section.children) collect(section.children);
        });
    };

    collect(sections);
    return index;
};

const searchSectionIndex = (index: ISectionSearchItem[], query: string): number[] => {
    const searchLower = query.toLowerCase();
    const results: number[] = [];

    for (const item of index) {
        if (item.text.includes(searchLower)) {
            results.push(item.id);
        }
    }

    return results;
};

const findSectionById = (sectionId: number, sections: IPageSectionWithFields[]): IPageSectionWithFields | null => {
    for (const section of sections) {
        if (section.id === sectionId) return section;
        if (section.children) {
            const found = findSectionById(sectionId, section.children);
            if (found) return found;
        }
    }
    return null;
};

const getParentSectionIds = (sections: IPageSectionWithFields[], sectionId: number): Set<number> => {
    const parentsToExpand = new Set<number>();

    const findParents = (items: IPageSectionWithFields[]): boolean => {
        for (const section of items) {
            if (section.id === sectionId) {
                return true;
            }

            if (section.children && findParents(section.children)) {
                parentsToExpand.add(section.id);
                return true;
            }
        }
        return false;
    };

    findParents(sections);
    return parentsToExpand;
};

const hasDeepResult = (section: IPageSectionWithFields, results: Set<number>): boolean => {
    if (results.has(section.id)) return true;
    return section.children?.some(child => hasDeepResult(child, results)) ?? false;
};

const getSearchParentSectionIds = (
    sections: IPageSectionWithFields[],
    searchResults: number[]
): Set<number> => {
    const resultSet = new Set(searchResults);
    const sectionsToExpand = new Set<number>();

    const findParentsOfResults = (items: IPageSectionWithFields[]) => {
        items.forEach(section => {
            if (!section.children?.length) return;

            const hasResultInChildren = section.children.some(child => hasDeepResult(child, resultSet));
            if (hasResultInChildren) {
                sectionsToExpand.add(section.id);
            }

            findParentsOfResults(section.children);
        });
    };

    findParentsOfResults(sections);
    return sectionsToExpand;
};

const getSectionsWithChildrenIds = (sections: IPageSectionWithFields[]): Set<number> => {
    const sectionsWithChildren = new Set<number>();

    const collect = (items: IPageSectionWithFields[]) => {
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                sectionsWithChildren.add(item.id);
                collect(item.children);
            }
        });
    };

    collect(sections);
    return sectionsWithChildren;
};

interface IPageSectionsProps {
    pageId: number | null;
    pageName?: string;
    initialSelectedSectionId?: number | null;
}

interface IMoveData {
    draggedSectionId: number;
    newParentId: number | null;
    pageId?: number;
    newPosition: number;
    draggedSection: IPageSectionWithFields;
    newParent: IPageSectionWithFields | null;
    descendantIds: number[];
    totalMovingItems: number;
    // Old parent tracking for backend
    oldParentPageId: number | null; // Page ID if section was at page level
    oldParentSectionId: number | null; // Section ID if section was inside another section
}

function PageSections({ pageId, pageName, initialSelectedSectionId }: IPageSectionsProps) {
    const { data, isLoading, isFetching, error, refetch } = usePageSections(pageId);
    const { data: styleGroups } = useStyleGroups();
    const sections = data?.sections;

    const router = useRouter();

    const [expandedSectionsOverride, setExpandedSectionsOverride] = useState<Set<number> | null>(null);
    const [addSectionModalOpened, setAddSectionModalOpened] = useState(false);
    const [selectedParentSectionId, setSelectedParentSectionId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [specificPosition, setSpecificPosition] = useState<number | undefined>(undefined);
    const [bulkMode, setBulkMode] = useState(false);


    // Search functionality
    const [searchQuery, setSearchQuery] = useState('');
    const deferredSearchQuery = useDeferredValue(searchQuery);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const searchIndex = useMemo(() => {
        return sections ? buildSectionSearchIndex(sections) : [];
    }, [sections]);
    const searchResults = useMemo(() => {
        const query = deferredSearchQuery.trim();
        if (!query || searchIndex.length === 0) return [];
        return searchSectionIndex(searchIndex, query);
    }, [deferredSearchQuery, searchIndex]);
    const normalizedSearchIndex = searchResults.length > 0
        ? Math.max(0, Math.min(currentSearchIndex, searchResults.length - 1))
        : -1;
    const focusedSectionId = normalizedSearchIndex >= 0 ? searchResults[normalizedSearchIndex] : null;
    const activeSectionId = focusedSectionId ?? selectedSectionId ?? initialSelectedSectionId ?? null;
    const autoExpandedSections = useMemo(() => {
        if (!sections) return new Set<number>();

        const ids = getSectionsWithChildrenIds(sections);
        if (initialSelectedSectionId) {
            getParentSectionIds(sections, initialSelectedSectionId).forEach(id => ids.add(id));
        }
        if (searchResults.length > 0) {
            getSearchParentSectionIds(sections, searchResults).forEach(id => ids.add(id));
        }
        if (focusedSectionId) {
            getParentSectionIds(sections, focusedSectionId).forEach(id => ids.add(id));
        }

        return ids;
    }, [sections, initialSelectedSectionId, searchResults, focusedSectionId]);
    const visibleExpandedSections = useMemo(() => {
        return expandedSectionsOverride ?? autoExpandedSections;
    }, [autoExpandedSections, expandedSectionsOverride]);
    const sortedSections = useMemo(() => {
        if (isLoading || !sections) return undefined;
        return sortSectionsByPosition(sections);
    }, [isLoading, sections]);
    const sectionLookup = useMemo(() => {
        return sections ? buildSectionLookup(sections) : null;
    }, [sections]);

    // Section operations hook
    const sectionOperations = useSectionOperations({
        pageId: pageId ? pageId : undefined,
        showNotifications: true
    });

    // Helper function to expand all parent sections of a given section
    const expandParentsOfSection = useCallback((sectionId: number) => {
        if (!sections) return;

        const parentsToExpand = getParentSectionIds(sections, sectionId);
        if (parentsToExpand.size > 0) {
            setExpandedSectionsOverride(prev => {
                const base = prev ?? autoExpandedSections;
                return new Set([...Array.from(base), ...Array.from(parentsToExpand)]);
            });
        }
    }, [autoExpandedSections, sections]);

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

    useEffect(() => {
        if (focusedSectionId) {
            scrollToSection(focusedSectionId);
        }
    }, [focusedSectionId, scrollToSection]);

    const handleToggleExpand = (sectionId: number) => {
        setExpandedSectionsOverride(prev => {
            const newSet = new Set(prev ?? autoExpandedSections);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const handleSectionSelect = (sectionId: number) => {
        setSelectedSectionId(sectionId);

        // Update URL with section ID as path parameter
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');

        // Find the admin pages path and reconstruct with section ID
        const adminIndex = pathParts.indexOf('admin');
        const pagesIndex = pathParts.indexOf('pages', adminIndex);

        if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
            const pageKeyword = pathParts[pagesIndex + 1];
            const newPath = `/admin/pages/${pageKeyword}/${sectionId}`;
            router.push(newPath, { scroll: false });
        }
    };

    // Collapse/Expand all functionality
    const handleExpandAll = () => {
        if (!data?.sections) return;

        const allSectionIds = new Set<number>();
        const collectAllIds = (sections: IPageSectionWithFields[]) => {
            sections.forEach(section => {
                if (section.children && section.children.length > 0) {
                    allSectionIds.add(section.id);
                    collectAllIds(section.children);
                }
            });
        };

        collectAllIds(data.sections);
        setExpandedSectionsOverride(allSectionIds);
    };

    const handleCollapseAll = () => {
        setExpandedSectionsOverride(new Set());
    };

    // Search navigation
    const handleSearchQueryChange = (query: string) => {
        setSearchQuery(query);
        setCurrentSearchIndex(query.trim() ? 0 : -1);
    };

    const handleSearchNext = () => {
        if (searchResults.length === 0) return;

        const nextIndex = (normalizedSearchIndex + 1) % searchResults.length;
        const nextSectionId = searchResults[nextIndex];

        setCurrentSearchIndex(nextIndex);
        setSelectedSectionId(nextSectionId);

        // Auto-expand parent sections containing the focused result
        expandParentsOfSection(nextSectionId);

        // Auto-scroll to the focused element
        scrollToSection(nextSectionId);


    };

    const handleSearchPrevious = () => {
        if (searchResults.length === 0) return;

        const prevIndex = normalizedSearchIndex === 0 ? searchResults.length - 1 : normalizedSearchIndex - 1;
        const prevSectionId = searchResults[prevIndex];

        setCurrentSearchIndex(prevIndex);
        setSelectedSectionId(prevSectionId);

        // Auto-expand parent sections containing the focused result
        expandParentsOfSection(prevSectionId);

        // Auto-scroll to the focused element
        scrollToSection(prevSectionId);


    };

    const handleSearchClear = () => {
        setSearchQuery('');
        setCurrentSearchIndex(-1);
    };

        const handleSectionMove = async (moveData: IMoveData) => {

        try {
            const { draggedSectionId, newParentId, newPosition, pageId, oldParentPageId, oldParentSectionId } = moveData;

            if (newParentId === null) {
                // Moving to page level - use page mutation
                if (!pageId) {
                    throw new Error('Page ID is required for page-level moves');
                }

                await sectionOperations.addSectionToPage(  [{ sectionId: draggedSectionId }], {
                    specificPosition: newPosition,
                    oldParentPageId,
                    oldParentSectionId
                } as any);
            } else {
                // Moving to another section - use section mutation
                if (!pageId) {
                    throw new Error('Page ID is required for section operations');
                }
                await sectionOperations.addSectionToSection(newParentId, [{ sectionId: draggedSectionId }], {
                    specificPosition: newPosition,
                    oldParentPageId,
                    oldParentSectionId
                } as any);
            }

        } catch {
            // Error handling is done by the mutation hooks
        }
    };

    const handleRemoveSection = async (sectionId: number, parentId: number | null) => {
        // Check if we're removing the currently selected section
        const isRemovingSelectedSection = activeSectionId === sectionId;


        try {
            if (parentId === null) {
                // Remove from page
                if (!pageId) {
                    throw new Error('Page ID is required for removing sections from page');
                }

                await sectionOperations.removeSectionFromPage(sectionId);
            } else {
                // Remove from parent section
                if (!pageId) {
                    throw new Error('Page ID is required for section operations');
                }
                await sectionOperations.removeSectionFromSection(parentId, sectionId);
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

        } catch {
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

    // Handle auto-selection of newly created sections
    const handleSectionCreated = (sectionId: number) => {
        setSelectedSectionId(sectionId);

        // Navigate to the section using router.push for inspector loading
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');

        // Find the admin pages path and reconstruct with section ID
        const adminIndex = pathParts.indexOf('admin');
        const pagesIndex = pathParts.indexOf('pages', adminIndex);

        if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
            const pageKeyword = pathParts[pagesIndex + 1];
            const newPath = `/admin/pages/${pageKeyword}/${sectionId}`;
            router.push(newPath, { scroll: false });
        }

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

            // Navigate to the first imported section using router.push for inspector loading
            const currentPath = window.location.pathname;
            const pathParts = currentPath.split('/');

            // Find the admin pages path and reconstruct with section ID
            const adminIndex = pathParts.indexOf('admin');
            const pagesIndex = pathParts.indexOf('pages', adminIndex);

            if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
                const pageKeyword = pathParts[pagesIndex + 1];
                const newPath = `/admin/pages/${pageKeyword}/${firstSectionId}`;
                router.push(newPath, { scroll: false });
            }

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

    useEffect(() => {
        if (initialSelectedSectionId) {
            scrollToSection(initialSelectedSectionId);
        }
    }, [initialSelectedSectionId, scrollToSection]);

    // Bulk

    const selectedIdsRef = useRef<Set<number>>(new Set());
    const [selectedCount, setSelectedCount] = useState(0);
    const [selectionVersion, setSelectionVersion] = useState(0);
    const [BulkRemoveModalOpened, setBulkRemoveModalOpened] = useState(false);
    const [bulkRemoveIds, setBulkRemoveIds] = useState<number[]>([]);

    const clearBulkSelection = useCallback(() => {
        selectedIdsRef.current = new Set();
        setSelectedCount(0);
        setSelectionVersion(prev => prev + 1);
    }, []);

    const handleToggleBulkMode = () => {
        setBulkMode(prev => {
            if (prev) clearBulkSelection();
            return !prev;
        });
    };

    const getBulkRemoveIds = useCallback(() => {
        const selectedIds = selectedIdsRef.current;
        if (!sectionLookup) return Array.from(selectedIds);
        return getTopMostSelectedIdsFromLookup(selectedIds, sectionLookup);
    }, [sectionLookup]);

    const handleToggleSelect = (sectionId: number, selected: boolean) => {
        if (selected) {
            selectedIdsRef.current.add(sectionId);
        } else {
            selectedIdsRef.current.delete(sectionId);
        }
        setSelectedCount(selectedIdsRef.current.size);
    };

    const handleSelectAll = () => {
        if (!sectionLookup) return;
        selectedIdsRef.current = new Set(sectionLookup.validIds);
        setSelectedCount(selectedIdsRef.current.size);
        setSelectionVersion(prev => prev + 1);
    };

    const handleDeselectAll = () => {
        clearBulkSelection();
    };

    const handleOpenBulkRemoveModal = () => {
        setBulkRemoveIds(getBulkRemoveIds());
        setBulkRemoveModalOpened(true);
    };

    const handleBulkRemove = async () => {
        const idsToRemove = bulkRemoveIds.length > 0 ? bulkRemoveIds : getBulkRemoveIds();
        if (!sections || idsToRemove.length === 0) return;

        await sectionOperations.removeBulkSectionsFromPage(idsToRemove);
        clearBulkSelection();
        setBulkRemoveIds([]);
        setBulkRemoveModalOpened(false);
    };

    if (error) {
        return (
            <Paper p="md" withBorder>
                <Alert icon={<IconAlertCircle size={16} />} color="red" title="Error loading sections">
                    {error.message || 'Failed to load page sections'}
                </Alert>
            </Paper>
        );
    }

   return (
     <Paper p="md" radius="md">
       <Stack gap="md">
         <PageHeader
           title={pageName ? `${pageName} - Sections` : "Page Sections"}
           subtitle="Manage page structure, sections, and their relationships"
           badge={data?.sections?.length || 0}
         >
           <Stack gap="xs">
             {/* Top row */}
             <Group gap="xs" wrap="nowrap">
               <Button
                 leftSection={<IconPlus size={14} />}
                 size="sm"
                 variant="light"
                 onClick={() => setAddSectionModalOpened(true)}
               >
                 Add Section
               </Button>

               <Button
                 size="sm"
                 variant="light"
                 onClick={
                   visibleExpandedSections.size > 0
                     ? handleCollapseAll
                     : handleExpandAll
                 }
                 leftSection={
                   visibleExpandedSections.size > 0 ? (
                     <IconChevronUp size={16} />
                   ) : (
                     <IconChevronDown size={16} />
                   )
                 }
               >
                 {visibleExpandedSections.size > 0
                   ? "Collapse all"
                   : "Expand all"}
               </Button>

               <Button
                 size="sm"
                 variant={bulkMode ? "filled" : "light"}
                 color={bulkMode ? "orange" : ""}
                 onClick={handleToggleBulkMode}
                 leftSection={<IconTrash size={16} />}
               >
                 {bulkMode ? "Exit bulk" : "Bulk remove"}
               </Button>

               <Button
                 size="sm"
                 variant="light"
                 component={Link}
                 href={`/admin/pages/${pageName}`}
               >
                 Edit Page
               </Button>

               <Button
                 size="sm"
                 variant="light"
                 component={Link}
                 href={`/${pageName}`}
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 Preview Page
               </Button>
             </Group>

             {/* Bottom row (selection actions) */}
             {bulkMode && (
               <Group gap="xs" mt="xs">
                 <Button
                   size="sm"
                   variant="subtle"
                   onClick={() =>
                     selectedCount > 0 ? handleDeselectAll() : handleSelectAll()
                   }
                 >
                   {selectedCount > 0 ? "Deselect All" : "Select All"}
                 </Button>

                 {selectedCount > 0 && (
                   <Button
                     size="sm"
                     color="orange"
                     leftSection={<IconTrash size={14} />}
                     onClick={handleOpenBulkRemoveModal}
                   >
                     Remove ({selectedCount})
                   </Button>
                 )}
               </Group>
             )}
           </Stack>
         </PageHeader>

         {/* 2. Advanced Search Bar with match counter + Prev/Next navigation */}
         <Group gap="xs" wrap="nowrap" align="center">
           <TextInput
             placeholder="Search sections by name, ID, or style..."
             value={searchQuery}
             onChange={(e) => handleSearchQueryChange(e.currentTarget.value)}
             onKeyDown={(e) => {
               if (e.key === "Enter" && searchResults.length > 0) {
                 e.preventDefault();
                 if (e.shiftKey) {
                   handleSearchPrevious();
                 } else {
                   handleSearchNext();
                 }
               }
               if (e.key === "Escape") {
                 e.preventDefault();
                 handleSearchClear();
               }
             }}
             leftSection={<IconSearch size={16} />}
             rightSection={
               searchQuery && (
                 <ActionIcon
                   size="sm"
                   variant="subtle"
                   color="gray"
                   onClick={handleSearchClear}
                   aria-label="Clear search"
                 >
                   <IconX size={14} />
                 </ActionIcon>
               )
             }
             size="md"
             style={{ flex: 1 }}
             // Autofill / form-helper extensions (SharkID, 1Password,
             // Bitwarden, Dashlane, …) decorate <input> elements with
             // custom data-* attributes (e.g. `data-sharkid`) before React
             // hydrates, producing a hydration-mismatch warning. Suppress
             // the check on this single input only.
             suppressHydrationWarning
           />

           {searchQuery && (
             <Badge
               size="lg"
               variant="light"
               color={searchResults.length > 0 ? "yellow" : "gray"}
               radius="sm"
             >
               {searchResults.length > 0
                 ? `${normalizedSearchIndex + 1}/${searchResults.length}`
                 : "0/0"}
             </Badge>
           )}

           {searchResults.length > 0 && (
             <Group gap={4} wrap="nowrap">
               <Tooltip label="Previous match (Shift+Enter)" withArrow>
                 <ActionIcon
                   size="lg"
                   variant="default"
                   onClick={handleSearchPrevious}
                   aria-label="Previous match"
                 >
                   <IconArrowLeft size={16} />
                 </ActionIcon>
               </Tooltip>
               <Tooltip label="Next match (Enter)" withArrow>
                 <ActionIcon
                   size="lg"
                   variant="default"
                   onClick={handleSearchNext}
                   aria-label="Next match"
                 >
                   <IconArrowRight size={16} />
                 </ActionIcon>
               </Tooltip>
             </Group>
           )}
           <Tooltip label="Refresh sections" withArrow>
             <ActionIcon
               size="xl"
               variant="light"
               onClick={() => refetch()}
               loading={isFetching}
               aria-label="Refresh sections"
             >
               <IconRefresh size={16} />
             </ActionIcon>
           </Tooltip>
         </Group>

         {/* 4. Main Content */}
         <Box>
           <LoadingOverlay
             visible={isLoading}
             overlayProps={{ blur: 0, backgroundOpacity: 0.35 }}
             loaderProps={{ size: "md" }}
           />
           <SectionsList
             sections={sortedSections}
             expandedSections={visibleExpandedSections}
             onToggleExpand={handleToggleExpand}
             onSectionMove={handleSectionMove}
             onRemoveSection={handleRemoveSection}
             onAddChildSection={handleAddChildSection}
             onAddSiblingAbove={handleAddSiblingAbove}
             onAddSiblingBelow={handleAddSiblingBelow}
             onSectionSelect={handleSectionSelect}
             selectedSectionId={activeSectionId}
             focusedSectionId={focusedSectionId}
             searchQuery={deferredSearchQuery}
             pageId={pageId || undefined}
             styleGroups={styleGroups}
             selectedIdsRef={selectedIdsRef}
             onToggleSelect={handleToggleSelect}
             selectionVersion={selectionVersion}
             bulkMode={bulkMode}
           />
         </Box>

         {/* Add Section Modal */}
         <AddSectionModal
           opened={addSectionModalOpened}
           onClose={handleCloseAddSectionModal}
           pageId={pageId || undefined}
           parentSectionId={selectedParentSectionId}
           title={
             selectedParentSectionId
               ? "Add Child Section"
               : "Add Section to Page"
           }
           specificPosition={specificPosition}
           onSectionCreated={handleSectionCreated}
           onSectionsImported={handleSectionsImported}
         />

         <BulkRemoveModal
           opened={BulkRemoveModalOpened}
           onClose={() => {
             setBulkRemoveIds([]);
             setBulkRemoveModalOpened(false);
           }}
           selectedSections={bulkRemoveIds.map((id) => ({
             id,
             name: sectionLookup?.nameById.get(id) ?? "Unknown Section",
           }))}
           onConfirm={handleBulkRemove}
         />
       </Stack>
     </Paper>
   );
};

// Export memoized component to prevent unnecessary re-renders
const PageSectionsMemo = memo(PageSections, (prevProps: IPageSectionsProps, nextProps: IPageSectionsProps) => {
    return (
        prevProps.pageId === nextProps.pageId &&
        prevProps.pageName === nextProps.pageName &&
        prevProps.initialSelectedSectionId === nextProps.initialSelectedSectionId
    );
});

// Export the memoized version as the main export
export { PageSectionsMemo as PageSections }; 
