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
    Collapse,
    Tooltip
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
    UniqueIdentifier,
    DragOverEvent
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
import styles from './PageSections.module.css';

interface PageSectionsProps {
    keyword: string | null;
}

interface SectionItemProps {
    section: ISectionItem;
    level?: number;
    onToggleExpand: (sectionId: number) => void;
    isExpanded: boolean;
    onSectionMove?: (movedSections: ISectionItem[]) => void;
    isDragActive?: boolean;
    isValidDropTarget?: boolean;
}

interface FlatSection extends ISectionItem {
    level: number;
    parentId: number | null;
}

// Draggable Section Item Component
function DraggableSectionItem({ section, level = 0, onToggleExpand, isExpanded, onSectionMove, isDragActive = false, isValidDropTarget = false }: SectionItemProps) {
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
                p="xs" 
                withBorder 
                mb={2}
                className={`${styles.sectionItem} ${styles[`level${Math.min(level, 4)}`]}`}
                style={{ 
                    marginLeft: level * 12,
                    borderRadius: '4px',
                    cursor: isDragging ? 'grabbing' : 'default',
                    borderColor: isValidDropTarget && isDragActive ? 'var(--mantine-color-green-6)' : undefined,
                    borderWidth: isValidDropTarget && isDragActive ? '2px' : undefined,
                    backgroundColor: isValidDropTarget && isDragActive ? 'var(--mantine-color-green-0)' : undefined,
                    opacity: isDragActive && !section.can_have_children ? 0.3 : 1
                }}
            >
                <Group justify="space-between" wrap="nowrap" gap="xs">
                    <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                        {/* Drag Handle */}
                        <ActionIcon 
                            variant="subtle" 
                            size="xs" 
                            className={styles.dragHandle}
                            style={{ cursor: 'grab', flexShrink: 0 }}
                            {...attributes}
                            {...listeners}
                        >
                            <IconGripVertical size={12} />
                        </ActionIcon>

                        {/* Expand/Collapse Button */}
                        {hasChildren ? (
                            <ActionIcon 
                                variant="subtle" 
                                size="xs"
                                style={{ flexShrink: 0 }}
                                onClick={() => onToggleExpand(section.id)}
                            >
                                {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
                            </ActionIcon>
                        ) : (
                            <Box w={20} /> // Spacer for alignment
                        )}

                        {/* Section Info - Compact */}
                        <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                            <Tooltip label={`${section.name} | Path: ${section.path} | ID: ${section.id}`} position="top" withArrow>
                                <Text fw={500} size="xs" className={styles.truncateText} style={{ minWidth: 0, flex: 1 }}>
                                    {getSectionTitle(section)}
                                </Text>
                            </Tooltip>
                            <Badge size="xs" variant="light" color="blue" style={{ flexShrink: 0 }}>
                                {section.style_name}
                            </Badge>
                            <Badge size="xs" variant="outline" color="gray" style={{ flexShrink: 0 }}>
                                {section.position}
                            </Badge>
                            {hasChildren && (
                                <Badge size="xs" variant="dot" color="green" style={{ flexShrink: 0 }}>
                                    {section.children.length}
                                </Badge>
                            )}
                            {section.can_have_children && (
                                <Badge size="xs" variant="dot" color="blue" style={{ flexShrink: 0 }} title="Can have children">
                                    📁
                                </Badge>
                            )}
                        </Group>
                    </Group>

                    {/* Action Buttons - Compact */}
                    <Group gap={4} style={{ flexShrink: 0 }}>
                        {section.can_have_children && (
                            <ActionIcon variant="subtle" size="xs" color="blue" title="Add child section">
                                <IconPlus size={12} />
                            </ActionIcon>
                        )}
                        <ActionIcon variant="subtle" size="xs" color="gray" title="Copy section">
                            <IconCopy size={12} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="xs" color="red" title="Delete section">
                            <IconTrash size={12} />
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
    const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

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

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over?.id || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setOverId(null);

        if (!over || active.id === over.id) {
            return;
        }

        // Find the sections being moved
        const activeSection = flatSections.find(section => section.id === active.id);
        const overSection = flatSections.find(section => section.id === over.id);

        if (!activeSection || !overSection) {
            return;
        }

        // Check if the target section can have children
        if (!overSection.can_have_children) {
            console.log('Cannot drop on section that cannot have children:', overSection.name);
            return;
        }

        // Prevent dropping a section on itself or its descendants
        const isDescendant = (parentId: number, childId: number): boolean => {
            const checkChildren = (sections: ISectionItem[]): boolean => {
                return sections.some(section => {
                    if (section.id === childId) return true;
                    return section.children && checkChildren(section.children);
                });
            };
            
            const parent = flatSections.find(s => s.id === parentId);
            return parent ? checkChildren(parent.children) : false;
        };

        if (activeSection.id === overSection.id || isDescendant(activeSection.id, overSection.id)) {
            console.log('Cannot drop section on itself or its descendants');
            return;
        }

        // TODO: Implement the actual reordering logic
        // This is where you would update the sections array and send to backend
        console.log('Moving section:', {
            activeId: active.id,
            overId: over.id,
            activeSection,
            overSection,
            canAcceptChildren: overSection.can_have_children,
            action: 'move_to_parent'
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
        <Stack gap="md">
            {/* Header - Compact */}
            <Paper p="md" withBorder>
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <Title order={4} size="md">Page Sections</Title>
                        <Badge color="blue" variant="light" size="sm">
                            {sections.length}
                        </Badge>
                    </Group>
                    <Button size="xs" leftSection={<IconPlus size={14} />} variant="light">
                        Add Section
                    </Button>
                </Group>
            </Paper>

                        {/* Sections List with Drag and Drop */}
            <Paper p="md" withBorder>
                {sections.length > 0 ? (
                    <Box className={styles.sectionsContainer}>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={flatSections.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <Stack gap={2}>
                                    {flatSections.map(section => (
                                        <DraggableSectionItem
                                            key={section.id}
                                            section={section}
                                            level={section.level}
                                            onToggleExpand={handleToggleExpand}
                                            isExpanded={expandedSections.has(section.id)}
                                            isDragActive={!!activeId}
                                            isValidDropTarget={section.can_have_children && overId === section.id}
                                        />
                                    ))}
                                </Stack>
                            </SortableContext>

                                                 <DragOverlay>
                             {activeId ? (
                                 <Paper p="xs" withBorder shadow="lg" style={{ opacity: 0.9, backgroundColor: 'var(--mantine-color-blue-1)' }}>
                                     <Group gap="xs">
                                         <IconGripVertical size={12} />
                                         <Text fw={500} size="xs">
                                             Moving section {activeId}
                                         </Text>
                                     </Group>
                                 </Paper>
                             ) : null}
                                                  </DragOverlay>
                         </DndContext>
                     </Box>
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