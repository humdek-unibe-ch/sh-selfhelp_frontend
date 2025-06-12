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
import { IPageField } from '../../../../../types/common/pages.type';
import { SectionsList } from './SectionsList';

interface PageSectionsProps {
    keyword: string | null;
}

export function PageSections({ keyword }: PageSectionsProps) {
    const { data, isLoading, error } = usePageSections(keyword);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

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

    const handleSectionMove = (moveData: any) => {
        // Log the move operation for backend integration
        console.log('Section Move Operation:', moveData);
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
            />
        </Paper>
    );
} 