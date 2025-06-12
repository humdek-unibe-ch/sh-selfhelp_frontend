'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
    Paper, 
    Title, 
    Text, 
    Stack,
    Loader,
    Alert,
    Box,
    Group,
    Badge,
    ActionIcon,
    Button,
    Collapse
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconAlertCircle, 
    IconFile, 
    IconChevronDown, 
    IconChevronRight,
    IconGripVertical,
    IconPlus,
    IconTrash,
    IconCopy
} from '@tabler/icons-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import {
    CSS
} from '@dnd-kit/utilities';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import { ISectionItem } from '../../../../../types/responses/admin/admin.types';

interface PageSectionsProps {
    keyword: string | null;
}

interface SectionItemProps {
    section: ISectionItem;
    level?: number;
    onToggleExpand: (sectionId: number) => void;
    isExpanded: boolean;
    onSectionMove?: (movedSections: ISectionItem[]) => void;
}

interface FlatSection extends ISectionItem {
    level: number;
    parentId: number | null;
}

// Draggable Section Item Component
function DraggableSectionItem({ section, level = 0, onToggleExpand, isExpanded, onSectionMove }: SectionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const hasChildren = section.children && section.children.length > 0;

    const getSectionTitle = (section: ISectionItem) => {
        const nameParts = section.name.split('-');
        return nameParts.length > 1 ? nameParts[1] : section.name;
    };

    return (
        <Box ref={setNodeRef} style={style}>
            <Paper 
                p="md" 
                withBorder 
                mb="xs"
                style={{ 
                    marginLeft: level * 20,
                    borderLeft: level > 0 ? '3px solid var(--mantine-color-blue-4)' : undefined,
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
            >
                <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" style={{ flex: 1 }}>
                        {/* Drag Handle */}
                        <ActionIcon 
                            variant="subtle" 
                            size="sm" 
                            style={{ cursor: 'grab' }}
                            {...attributes}
                            {...listeners}
                        >
                            <IconGripVertical size={16} />
                        </ActionIcon>

                        {/* Expand/Collapse Button */}
                        {hasChildren && (
                            <ActionIcon 
                                variant="subtle" 
                                size="sm"
                                onClick={() => onToggleExpand(section.id)}
                            >
                                {isExpanded ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
                            </ActionIcon>
                        )}

                        {/* Section Info */}
                        <Box style={{ flex: 1 }}>
                            <Group gap="xs" mb="xs">
                                <Text fw={500} size="sm">
                                    {getSectionTitle(section)}
                                </Text>
                                <Badge size="xs" variant="light" color="blue">
                                    {section.style_name}
                                </Badge>
                                <Badge size="xs" variant="outline">
                                    Pos: {section.position}
                                </Badge>
                                {hasChildren && (
                                    <Badge size="xs" variant="light" color="green">
                                        {section.children.length} children
                                    </Badge>
                                )}
                            </Group>
                            <Text size="xs" c="dimmed">
                                Path: {section.path} | ID: {section.id}
                            </Text>
                        </Box>
                    </Group>

                    {/* Action Buttons */}
                    <Group gap="xs">
                        <ActionIcon variant="subtle" size="sm" color="blue">
                            <IconPlus size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="sm" color="gray">
                            <IconCopy size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="sm" color="red">
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Group>
                </Group>
            </Paper>
        </Box>
    );
}

export function PageSections({ keyword }: PageSectionsProps) {
    const { data, isLoading, error } = usePageSections(keyword);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [sections, setSections] = useState<ISectionItem[]>([]);

    // Update local sections when data changes
    useEffect(() => {
        if (data?.sections) {
            setSections(data.sections);
            // Auto-expand all sections initially
            const allIds = new Set<number>();
            const collectIds = (items: ISectionItem[]) => {
                items.forEach(item => {
                    allIds.add(item.id);
                    if (item.children) {
                        collectIds(item.children);
                    }
                });
            };
            collectIds(data.sections);
            setExpandedSections(allIds);
        }
    }, [data?.sections]);

    // Flatten sections for drag and drop
    const flattenSections = (items: ISectionItem[], level = 0, parentId: number | null = null): FlatSection[] => {
        const result: FlatSection[] = [];
        
        items.forEach(item => {
            result.push({ ...item, level, parentId });
            
            if (item.children && expandedSections.has(item.id)) {
                result.push(...flattenSections(item.children, level + 1, item.id));
            }
        });
        
        return result;
    };

    const flatSections = useMemo(() => flattenSections(sections), [sections, expandedSections]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        // Find the sections being moved
        const activeIndex = flatSections.findIndex(section => section.id === active.id);
        const overIndex = flatSections.findIndex(section => section.id === over.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        // TODO: Implement the actual reordering logic
        // This is where you would update the sections array and send to backend
        console.log('Moving section:', {
            activeId: active.id,
            overId: over.id,
            activeIndex,
            overIndex,
            activeSection: flatSections[activeIndex],
            overSection: flatSections[overIndex]
        });

        // For now, just log the change - you'll implement the actual reordering later
    };

    if (!keyword) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <IconFile size="3rem" color="var(--mantine-color-gray-5)" />
                    <Title order={3} c="dimmed">No Page Selected</Title>
                    <Text c="dimmed" ta="center">
                        Select a page from the navigation to view its sections.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    if (isLoading) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <Loader size="lg" />
                    <Text c="dimmed">Loading page sections...</Text>
                </Stack>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper p="xl" withBorder>
                <Alert 
                    icon={<IconAlertCircle size="1rem" />} 
                    title="Error Loading Sections" 
                    color="red"
                    variant="light"
                >
                    Failed to load page sections. Please try again.
                </Alert>
            </Paper>
        );
    }

    return (
        <Stack gap="lg">
            {/* Header */}
            <Paper p="lg" withBorder>
                <Group justify="space-between" align="center">
                    <div>
                        <Title order={3}>Page Sections</Title>
                        <Text c="dimmed" size="sm">
                            Content sections for page: <Text span fw={500}>{keyword}</Text>
                        </Text>
                    </div>
                    <Group gap="xs">
                        <Badge color="blue" variant="light">
                            {sections.length} sections
                        </Badge>
                        <Button size="xs" leftSection={<IconPlus size={16} />}>
                            Add Section
                        </Button>
                    </Group>
                </Group>
            </Paper>

            {/* Sections List with Drag and Drop */}
            <Paper p="lg" withBorder>
                {sections.length > 0 ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={flatSections.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <Stack gap="xs">
                                {flatSections.map(section => (
                                    <DraggableSectionItem
                                        key={section.id}
                                        section={section}
                                        level={section.level}
                                        onToggleExpand={handleToggleExpand}
                                        isExpanded={expandedSections.has(section.id)}
                                    />
                                ))}
                            </Stack>
                        </SortableContext>

                        <DragOverlay>
                            {activeId ? (
                                <Paper p="md" withBorder shadow="lg" style={{ opacity: 0.8 }}>
                                    <Text fw={500}>
                                        Dragging section {activeId}
                                    </Text>
                                </Paper>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                ) : (
                    <Stack align="center" gap="md" py="xl">
                        <IconInfoCircle size="2rem" color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed" ta="center">
                            No sections found for this page.
                        </Text>
                        <Button size="sm" leftSection={<IconPlus size={16} />}>
                            Add First Section
                        </Button>
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
} 