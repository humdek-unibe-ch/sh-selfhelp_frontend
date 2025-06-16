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
    useUpdateSectionInPageMutation,
    useUpdateSectionInSectionMutation,
    useAddSectionToPageMutation,
    useRemoveSectionFromPageMutation,
    useRemoveSectionFromSectionMutation
} from '../../../../../hooks/mutations';
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionsList } from './SectionsList';
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

    // Section mutations
    const updateSectionInPageMutation = useUpdateSectionInPageMutation({
        showNotifications: true,
        onSuccess: () => {
            debug('Section position updated in page successfully', 'PageSections');
        }
    });

    const updateSectionInSectionMutation = useUpdateSectionInSectionMutation({
        showNotifications: true,
        pageKeyword: keyword || undefined,
        onSuccess: () => {
            debug('Section position updated in section successfully', 'PageSections');
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
            const sectionUpdateData = {
                position: newPosition,
                // Add any other fields that need to be updated during move
            };

            if (newParentId === null) {
                // Moving to page level - use page mutation
                if (!pageKeyword) {
                    throw new Error('Page keyword is required for page-level moves');
                }
                
                await updateSectionInPageMutation.mutateAsync({
                    keyword: pageKeyword,
                    sectionId: draggedSectionId,
                    sectionData: sectionUpdateData
                });
            } else {
                // Moving to another section - use section mutation
                await updateSectionInSectionMutation.mutateAsync({
                    parentSectionId: newParentId,
                    childSectionId: draggedSectionId,
                    sectionData: sectionUpdateData
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
                    <Button leftSection={<IconPlus size={16} />} size="sm" variant="light">
                        Add First Section
                    </Button>
                </Alert>
            </Paper>
        );
    }

    const isProcessingMove = updateSectionInPageMutation.isPending || updateSectionInSectionMutation.isPending;
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
                <Button leftSection={<IconPlus size={14} />} size="xs" variant="light">
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
                pageKeyword={keyword || undefined}
                isProcessing={isProcessingMove || isProcessingRemove}
            />
        </Paper>
    );
} 