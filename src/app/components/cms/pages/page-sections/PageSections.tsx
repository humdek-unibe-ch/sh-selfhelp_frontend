'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Title,
    Text,
    Alert,
    Group,
    Badge,
    Button,
    TextInput,
    ActionIcon,
    Tooltip,
    Box
} from '@mantine/core';
import {
    IconInfoCircle,
    IconAlertCircle,
    IconFile,
    IconPlus,
    IconSearch,
    IconChevronUp,
    IconChevronDown,
    IconX,
    IconArrowLeft,
    IconArrowRight
} from '@tabler/icons-react';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import { useSectionOperations } from '../../../../../hooks/useSectionOperations';
import { IPageSection, IPageSectionWithFields } from '../../../../../types/common/pages.type';
import { SectionsList } from './SectionsList';
import { AddSectionModal } from './AddSectionModal';
import { calculateSiblingBelowPosition } from '../../../../../utils/position-calculator';
import styles from './PageSections.module.css';

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
    const { data, isLoading, error } = usePageSections(pageId);
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

    // Section operations hook
    const sectionOperations = useSectionOperations({
        pageId: pageId ? pageId : undefined,
        showNotifications: true
    });

    // Search functionality
    const searchInSections = useCallback((sections: IPageSectionWithFields[], query: string): number[] => {
        const results: number[] = [];
        const searchLower = query.toLowerCase();

        const searchRecursive = (items: IPageSectionWithFields[]) => {
            items.forEach(item => {
                if ((typeof item.name === 'string' ? item.name : item.name?.content || '').toLowerCase().includes(searchLower) ||
                    item.style_name.toLowerCase().includes(searchLower) ||
                    item.id.toString().includes(searchLower)) {
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

    // Helper function to expand all parent sections of a given section
    const expandParentsOfSection = useCallback((sectionId: number) => {
        if (!data?.sections) return;

        const parentsToExpand = new Set<number>();

        const findParents = (sections: IPageSectionWithFields[], parentId: number | null = null): boolean => {
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

        findParents(data.sections);

        if (parentsToExpand.size > 0) {
            setExpandedSections(prev => new Set([...Array.from(prev), ...Array.from(parentsToExpand)]));
        }
    }, [data?.sections]);

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

    // Update search results when query changes
    useEffect(() => {
        if (searchQuery.trim() && data?.sections) {
            const results = searchInSections(data.sections, searchQuery.trim());
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
    }, [searchQuery, data?.sections, searchInSections, expandParentsOfSection, scrollToSection]);

    // Expand all sections that contain search results
    useEffect(() => {
        if (searchResults.length > 0 && data?.sections) {
            const sectionsToExpand = new Set<number>();

            const findParentsOfResults = (sections: IPageSectionWithFields[], parentId: number | null = null) => {
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

            const hasDeepResult = (section: IPageSectionWithFields, results: number[]): boolean => {
                if (results.includes(section.id)) return true;
                if (section.children) {
                    return section.children.some(child => hasDeepResult(child, results));
                }
                return false;
            };

            findParentsOfResults(data.sections);
            setExpandedSections(prev => new Set([...Array.from(prev), ...Array.from(sectionsToExpand)]));
        }
    }, [searchResults, data?.sections]);

    // Helper function to find a section by ID
    const findSectionById = useCallback((sectionId: number, sections: IPageSectionWithFields[]): IPageSectionWithFields | null => {
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
        setExpandedSections(allSectionIds);
    };

    const handleCollapseAll = () => {
        setExpandedSections(new Set());
    };

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

                await sectionOperations.addSectionToPage(draggedSectionId, { specificPosition: newPosition });
            } else {
                // Moving to another section - use section mutation
                if (!pageId) {
                    throw new Error('Page ID is required for section operations');
                }
                await sectionOperations.addSectionToSection(newParentId, draggedSectionId, { specificPosition: newPosition });
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



    // Handle initial selected section ID from URL
    useEffect(() => {
        if (initialSelectedSectionId) {
            setSelectedSectionId(initialSelectedSectionId);
            // Auto-expand parents and scroll to the selected section
            expandParentsOfSection(initialSelectedSectionId);
            scrollToSection(initialSelectedSectionId);
        }
    }, [initialSelectedSectionId, expandParentsOfSection, scrollToSection]);

    // Auto-expand sections with children on initial load
    useEffect(() => {
        if (data?.sections && data.sections.length > 0) {
            const sectionsWithChildren = new Set<number>();

            const findSectionsWithChildren = (items: IPageSectionWithFields[]) => {
                items.forEach(item => {
                    if (item.children && item.children.length > 0) {
                        sectionsWithChildren.add(item.id);
                        findSectionsWithChildren(item.children);
                    }
                });
            };

            findSectionsWithChildren(data.sections);
            setExpandedSections(sectionsWithChildren);
        }
    }, [data?.sections]);

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
        <Paper p="xs" withBorder className={styles.paperContainer}>
            {/* Header with Search */}
            <Group justify="space-between" mb="xs" px="xs" wrap="nowrap">
                <Group gap="xs" wrap="nowrap">
                    <IconFile size={16} />
                    <Title order={6} size="sm" className={styles.titleNoWrap}>
                        {pageName ? `${pageName} - Sections` : 'Page Sections'}
                    </Title>
                    <Badge size="xs" variant="light" color="blue">
                        {data?.sections?.length || 0}
                    </Badge>
                </Group>

                {/* Search Bar - Flexible width */}
                <Group gap="xs" className={styles.searchGroup} wrap="nowrap">
                    <TextInput
                        placeholder="Search sections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchResults.length > 0) {
                                e.preventDefault();
                                handleSearchNext();
                            }
                            if (e.key === 'Escape') {
                                e.preventDefault();
                                handleSearchClear();
                            }
                        }}
                        leftSection={<IconSearch size={14} />}
                        rightSection={
                            searchQuery && (
                                <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    onClick={handleSearchClear}
                                >
                                    <IconX size={12} />
                                </ActionIcon>
                            )
                        }
                        size="xs"
                        className={styles.contentContainer}
                    />
                    {searchResults.length > 0 && (
                        <>
                            <Text size="xs" c="dimmed" className={styles.infoText}>
                                {currentSearchIndex + 1}/{searchResults.length}
                            </Text>
                            <Group gap={2}>
                                <Tooltip label="Previous">
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        onClick={handleSearchPrevious}
                                        disabled={searchResults.length === 0}
                                    >
                                        <IconArrowLeft size={12} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Next">
                                    <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        onClick={handleSearchNext}
                                        disabled={searchResults.length === 0}
                                    >
                                        <IconArrowRight size={12} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </>
                    )}
                </Group>

                <Group gap="xs" wrap="nowrap">
                    <Tooltip label="Expand All">
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="blue"
                            onClick={handleExpandAll}
                        >
                            <IconChevronDown size={12} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Collapse All">
                        <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="blue"
                            onClick={handleCollapseAll}
                        >
                            <IconChevronUp size={12} />
                        </ActionIcon>
                    </Tooltip>
                    <Button
                        leftSection={<IconPlus size={14} />}
                        size="xs"
                        variant="light"
                        onClick={() => {
                            setAddSectionModalOpened(true);
                        }}
                    >
                        Add Section
                    </Button>
                </Group>
            </Group>

            {/* Sections List - Scrollable Content Area */}
            <Box className={styles.contentContainer}>
                <SectionsList
                    sections={data?.sections || []}
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
                />
            </Box>

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