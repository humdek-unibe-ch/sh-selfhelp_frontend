'use client';

import { 
    Paper, 
    Title, 
    Text, 
    Stack,
    Loader,
    Alert,
    Box,
    Group,
    Badge
} from '@mantine/core';
import { IconInfoCircle, IconAlertCircle, IconFile } from '@tabler/icons-react';
import { usePageSections } from '../../../../../hooks/usePageDetails';
import { ISectionItem } from '../../../../../types/responses/admin/admin.types';

interface PageSectionsProps {
    keyword: string | null;
}

export function PageSections({ keyword }: PageSectionsProps) {
    const { data, isLoading, error } = usePageSections(keyword);

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

    const renderSection = (section: ISectionItem, level: number = 0) => (
        <Box key={section.id} style={{ marginLeft: level * 20 }}>
            <Paper p="md" withBorder mb="sm">
                <Group justify="space-between" align="flex-start">
                    <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb="xs">
                            <Text fw={500} size="sm">
                                {section.name}
                            </Text>
                            <Badge size="xs" variant="light" color="blue">
                                {section.style_name}
                            </Badge>
                            <Badge size="xs" variant="outline">
                                Pos: {section.position}
                            </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                            Path: {section.path}
                        </Text>
                    </Box>
                </Group>
            </Paper>
            
            {section.children && section.children.length > 0 && (
                <Box ml="md">
                    {section.children.map(child => renderSection(child, level + 1))}
                </Box>
            )}
        </Box>
    );

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
                    <Badge color="blue" variant="light">
                        {data?.sections.length || 0} sections
                    </Badge>
                </Group>
            </Paper>

            {/* Sections List */}
            <Paper p="lg" withBorder>
                {data?.sections && data.sections.length > 0 ? (
                    <Stack gap="md">
                        {data.sections.map(section => renderSection(section))}
                    </Stack>
                ) : (
                    <Stack align="center" gap="md" py="xl">
                        <IconInfoCircle size="2rem" color="var(--mantine-color-gray-5)" />
                        <Text c="dimmed" ta="center">
                            No sections found for this page.
                        </Text>
                    </Stack>
                )}
            </Paper>
        </Stack>
    );
} 