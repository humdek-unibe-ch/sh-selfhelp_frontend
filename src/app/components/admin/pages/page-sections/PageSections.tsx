'use client';

import { useState, useEffect } from 'react';
import { 
    Paper, 
    Title, 
    Text, 
    Stack,
    Loader,
    Alert,
    Group,
    Badge,
    Button
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconAlertCircle, 
    IconFile, 
    IconPlus
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
import { debug } from '../../../../../utils/debug-logger';

interface IPageSectionsProps {
    keyword: string | null;
}

interface IMoveData {
    draggedSectionId: number;
    newParentId: number | null;
    pageKeyword?: string;
    newPosition: number;
    draggedSection: IPageField;
    newParent: IPageField | null;
    descendantIds: number[];
    totalMovingItems: number;
}

export function PageSections({ keyword }: IPageSectionsProps) {
    const { data, isLoading, error } = usePageSections(keyword);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [addSectionModalOpened, setAddSectionModalOpened] = useState(false);
    const [selectedParentSectionId, setSelectedParentSectionId] = useState<number | null>(null);

    // Section mutations
    const addSectionToPageMutation = useAddSectionToPageMutation({
        showNotifications: true,
        onSuccess: () => {
            debug('Section added to page successfully', 'PageSections');
        }
    });

    const addSectionToSectionMutation = useAddSectionToSectionMutation({
        showNotifications: true,
        pageKeyword: keyword || undefined,
        onSuccess: () => {
            debug('Section added to section successfully', 'PageSections');
        }
    });

    const removeSectionFromPageMutation = useRemoveSectionFromPageMutation({
        showNotifications: true,
        onSuccess: () => {
            debug('Section removed from page successfully', 'PageSections');
        }
    });

    const removeSectionFromSectionMutation = useRemoveSectionFromSectionMutation({
        showNotifications: true,
        pageKeyword: keyword || undefined,
        onSuccess: () => {
            debug('Section removed from section successfully', 'PageSections');
        }
    });

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

    const handleSectionMove = async (moveData: IMoveData) => {
        debug('Processing section move', 'PageSections', moveData);
        
        try {
            const { draggedSectionId, newParentId, newPosition, pageKeyword } = moveData;
            
            // Prepare section data with new position
            const sectionData = {
                position: newPosition
            };

            if (newParentId === null) {
                // Moving to page level - use page mutation
                if (!pageKeyword) {
                    throw new Error('Page keyword is required for page-level moves');
                }
                
                await addSectionToPageMutation.mutateAsync({
                    keyword: pageKeyword,
                    sectionId: draggedSectionId,
                    sectionData: sectionData
                });
            } else {
                // Moving to another section - use section mutation
                await addSectionToSectionMutation.mutateAsync({
                    parentSectionId: newParentId,
                    sectionId: draggedSectionId,
                    sectionData: sectionData
                });
            }
            
            debug('Section move completed successfully', 'PageSections', {
                sectionId: draggedSectionId,
                newParentId,
                newPosition
            });
            
        } catch (error) {
            debug('Error moving section', 'PageSections', { error, moveData });
            // Error handling is done by the mutation hooks
        }
    };

    const handleRemoveSection = async (sectionId: number, parentId: number | null) => {
        debug('Removing section', 'PageSections', { sectionId, parentId });
        
        try {
            if (parentId === null) {
                // Remove from page
                if (!keyword) {
                    throw new Error('Page keyword is required for removing sections from page');
                }
                
                await removeSectionFromPageMutation.mutateAsync({
                    keyword,
                    sectionId
                });
            } else {
                // Remove from parent section
                await removeSectionFromSectionMutation.mutateAsync({
                    parentSectionId: parentId,
                    childSectionId: sectionId
                });
            }
            
            debug('Section removed successfully', 'PageSections', { sectionId, parentId });
            
        } catch (error) {
            debug('Error removing section', 'PageSections', { error, sectionId, parentId });
            // Error handling is done by the mutation hooks
        }
    };

    const handleAddChildSection = (parentSectionId: number) => {
        debug('Opening add child section modal', 'PageSections', { parentSectionId });
        setSelectedParentSectionId(parentSectionId);
        setAddSectionModalOpened(true);
    };

    const handleAddSiblingAbove = (referenceSectionId: number, parentId: number | null) => {
        debug('Adding sibling above section', 'PageSections', { referenceSectionId, parentId });
        // TODO: Implement sibling above creation with position calculation (-5)
        // For now, open the modal with the parent context
        setSelectedParentSectionId(parentId);
        setAddSectionModalOpened(true);
    };

    const handleAddSiblingBelow = (referenceSectionId: number, parentId: number | null) => {
        debug('Adding sibling below section', 'PageSections', { referenceSectionId, parentId });
        // TODO: Implement sibling below creation with position calculation (+5)
        // For now, open the modal with the parent context
        setSelectedParentSectionId(parentId);
        setAddSectionModalOpened(true);
    };

    const handleCloseAddSectionModal = () => {
        setAddSectionModalOpened(false);
        setSelectedParentSectionId(null);
    };

    // Auto-expand sections with children on initial load
    useEffect(() => {
        if (data?.sections && data.sections.length > 0) {
            const sectionsWithChildren = new Set<number>();
            
            const findSectionsWithChildren = (items: IPageField[]) => {
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

    if (!data?.sections || data.sections.length === 0) {
        return (
            <Paper p="md" withBorder>
                <Alert icon={<IconInfoCircle size={16} />} color="blue" title="No sections found">
                    <Text size="sm" mb="md">
                        This page doesn&apos;t have any sections yet.
                    </Text>
                    <Button 
                        leftSection={<IconPlus size={16} />} 
                        size="sm" 
                        variant="light"
                        onClick={() => setAddSectionModalOpened(true)}
                    >
                        Add First Section
                    </Button>
                </Alert>
            </Paper>
        );
    }

    const isProcessingMove = addSectionToPageMutation.isPending || addSectionToSectionMutation.isPending;
    const isProcessingRemove = removeSectionFromPageMutation.isPending || removeSectionFromSectionMutation.isPending;

    return (
        <Paper p="xs" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Group justify="space-between" mb="xs" px="xs">
                <Group gap="xs">
                    <IconFile size={16} />
                    <Title order={6} size="sm">Page Sections</Title>
                    <Badge size="xs" variant="light" color="blue">
                        {data.sections.length}
                    </Badge>
                    {(isProcessingMove || isProcessingRemove) && (
                        <Badge size="xs" variant="light" color="orange">
                            Processing...
                        </Badge>
                    )}
                </Group>
                <Button 
                    leftSection={<IconPlus size={14} />} 
                    size="xs" 
                    variant="light"
                    onClick={() => setAddSectionModalOpened(true)}
                >
                    Add Section
                </Button>
            </Group>

            {/* Sections List */}
            <SectionsList
                sections={data.sections}
                expandedSections={expandedSections}
                onToggleExpand={handleToggleExpand}
                onSectionMove={handleSectionMove}
                onRemoveSection={handleRemoveSection}
                onAddChildSection={handleAddChildSection}
                onAddSiblingAbove={handleAddSiblingAbove}
                onAddSiblingBelow={handleAddSiblingBelow}
                pageKeyword={keyword || undefined}
                isProcessing={isProcessingMove || isProcessingRemove}
            />

            {/* Add Section Modal */}
            <AddSectionModal
                opened={addSectionModalOpened}
                onClose={handleCloseAddSectionModal}
                pageKeyword={keyword || undefined}
                parentSectionId={selectedParentSectionId}
                title={selectedParentSectionId ? "Add Child Section" : "Add Section to Page"}
            />
        </Paper>
    );
} 