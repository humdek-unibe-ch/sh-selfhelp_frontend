'use client';

import { 
    Paper, 
    Title, 
    Text, 
    Group, 
    Badge, 
    Stack,
    Divider,
    Box,
    Alert
} from '@mantine/core';
import { IconInfoCircle, IconFile } from '@tabler/icons-react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';

interface PageContentProps {
    page: IAdminPage | null;
}

export function PageContent({ page }: PageContentProps) {
    if (!page) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <IconFile size="3rem" color="var(--mantine-color-gray-5)" />
                    <Title order={3} c="dimmed">No Page Selected</Title>
                    <Text c="dimmed" ta="center">
                        Select a page from the navigation to view and edit its content.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    return (
        <Stack gap="lg">
            {/* Page Header */}
            <Paper p="lg" withBorder>
                <Stack gap="md">
                    <Group justify="space-between" align="flex-start">
                        <div>
                            <Title order={2}>{page.keyword}</Title>
                            <Text c="dimmed" size="sm">{page.url}</Text>
                        </div>
                        <Group gap="xs">
                            {page.is_headless === 1 && (
                                <Badge color="orange" variant="light">
                                    Headless
                                </Badge>
                            )}
                            {page.nav_position !== null && (
                                <Badge color="blue" variant="light">
                                    Nav: {page.nav_position}
                                </Badge>
                            )}
                            {page.parent !== null && (
                                <Badge color="green" variant="light">
                                    Child Page
                                </Badge>
                            )}
                        </Group>
                    </Group>

                    <Divider />

                    <Group gap="lg">
                        <Box>
                            <Text size="sm" fw={500} c="dimmed">Page ID</Text>
                            <Text size="sm">{page.id_pages}</Text>
                        </Box>
                        {page.parent !== null && (
                            <Box>
                                <Text size="sm" fw={500} c="dimmed">Parent ID</Text>
                                <Text size="sm">{page.parent}</Text>
                            </Box>
                        )}
                        <Box>
                            <Text size="sm" fw={500} c="dimmed">URL</Text>
                            <Text size="sm" style={{ fontFamily: 'monospace' }}>{page.url}</Text>
                        </Box>
                    </Group>
                </Stack>
            </Paper>

            {/* Content Sections Placeholder */}
            <Paper p="lg" withBorder>
                <Stack gap="md">
                    <Group gap="xs">
                        <IconInfoCircle size="1.2rem" color="var(--mantine-color-blue-6)" />
                        <Title order={3}>Page Sections</Title>
                    </Group>
                    
                    <Alert 
                        icon={<IconInfoCircle size="1rem" />} 
                        title="Content sections will be loaded dynamically" 
                        color="blue"
                        variant="light"
                    >
                        This area will display the page sections and content fields for editing.
                        The sections will be fetched from the API based on the selected page keyword.
                    </Alert>
                </Stack>
            </Paper>

            {/* Properties Placeholder */}
            <Paper p="lg" withBorder>
                <Stack gap="md">
                    <Title order={3}>Properties</Title>
                    
                    <Alert 
                        icon={<IconInfoCircle size="1rem" />} 
                        title="Properties will be loaded dynamically" 
                        color="blue"
                        variant="light"
                    >
                        Page properties and configuration options will be displayed here.
                    </Alert>
                </Stack>
            </Paper>
        </Stack>
    );
} 