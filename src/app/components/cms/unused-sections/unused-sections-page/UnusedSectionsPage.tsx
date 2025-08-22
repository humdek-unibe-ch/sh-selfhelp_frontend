'use client';

import { useState, useMemo } from 'react';
import {
    Container,
    Title,
    Text,
    Stack,
    Group,
    Button,
    TextInput,
    ActionIcon,
    SimpleGrid,
    Card,
    Badge,
    Alert,
    Loader,
    Box,
    Divider
} from '@mantine/core';
import {
    IconSearch,
    IconX,
    IconTrash,
    IconAlertTriangle,
    IconDatabase,
    IconInfoCircle
} from '@tabler/icons-react';
import { useUnusedSections } from '../../../../../hooks/useSectionUtility';
import { DeleteUnusedSectionModal } from '../delete-unused-section-modal/DeleteUnusedSectionModal';
import { DeleteAllUnusedSectionsModal } from '../delete-all-unused-sections-modal/DeleteAllUnusedSectionsModal';
import type { IUnusedSection } from '../../../../../types/responses/admin/section-utility.types';

export function UnusedSectionsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteModalSection, setDeleteModalSection] = useState<IUnusedSection | null>(null);
    const [deleteAllModalOpened, setDeleteAllModalOpened] = useState(false);

    const { data: unusedSections, isLoading, error, refetch } = useUnusedSections();

    // Filter sections based on search query
    const filteredSections = useMemo(() => {
        if (!unusedSections || !searchQuery.trim()) {
            return unusedSections || [];
        }

        const query = searchQuery.toLowerCase();
        return unusedSections.filter(section =>
            section.name.toLowerCase().includes(query) ||
            section.id.toString().includes(query) ||
            section.styleName?.toLowerCase().includes(query)
        );
    }, [unusedSections, searchQuery]);

    const handleDeleteSection = (section: IUnusedSection) => {
        setDeleteModalSection(section);
    };

    const handleDeleteAllSections = () => {
        setDeleteAllModalOpened(true);
    };

    const handleSectionDeleted = () => {
        refetch();
        setDeleteModalSection(null);
    };

    const handleAllSectionsDeleted = () => {
        refetch();
        setDeleteAllModalOpened(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <>
            <Container size="xl" py="xl">
                <Stack gap="lg">
                    {/* Header */}
                    <Group justify="space-between" align="flex-start">
                        <Box>
                            <Group gap="sm" align="center">
                                <IconDatabase size={28} color="var(--mantine-color-blue-6)" />
                                <Title order={1} size="h2">
                                    Unused Sections
                                </Title>
                            </Group>
                            <Text c="dimmed" mt="xs">
                                Manage sections that are not currently assigned to any page or parent section
                            </Text>
                        </Box>

                        {filteredSections.length > 0 && (
                            <Button
                                leftSection={<IconTrash size={16} />}
                                color="red"
                                variant="light"
                                onClick={handleDeleteAllSections}
                                size="sm"
                            >
                                Delete All ({filteredSections.length})
                            </Button>
                        )}
                    </Group>

                    <Divider />

                    {/* Search */}
                    <Group gap="md">
                        <TextInput
                            placeholder="Search by name, ID, or style..."
                            leftSection={<IconSearch size={16} />}
                            rightSection={
                                searchQuery && (
                                    <ActionIcon
                                        variant="subtle"
                                        color="gray"
                                        size="sm"
                                        onClick={clearSearch}
                                    >
                                        <IconX size={14} />
                                    </ActionIcon>
                                )
                            }
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.currentTarget.value)}
                            size="sm"
                            style={{ flexGrow: 1 }}
                        />
                    </Group>

                    {/* Content */}
                    {isLoading ? (
                        <Group justify="center" py="xl">
                            <Loader size="lg" />
                            <Text>Loading unused sections...</Text>
                        </Group>
                    ) : error ? (
                        <Alert icon={<IconAlertTriangle size={16} />} color="red">
                            Failed to load unused sections. Please try refreshing the page.
                        </Alert>
                    ) : !unusedSections || unusedSections.length === 0 ? (
                        <Alert icon={<IconInfoCircle size={16} />} color="green">
                            <Text fw={500} mb="xs">No unused sections found!</Text>
                            <Text size="sm">
                                All sections are currently assigned to pages or parent sections. 
                                This is a good sign - it means your content is well organized.
                            </Text>
                        </Alert>
                    ) : filteredSections.length === 0 ? (
                        <Alert icon={<IconInfoCircle size={16} />} color="blue">
                            <Text fw={500} mb="xs">No sections match your search</Text>
                            <Text size="sm">
                                Try adjusting your search terms or clearing the search to see all {unusedSections.length} unused sections.
                            </Text>
                        </Alert>
                    ) : (
                        <>
                            {/* Results Summary */}
                            <Group justify="space-between" align="center">
                                <Text size="sm" c="dimmed">
                                    {searchQuery 
                                        ? `Showing ${filteredSections.length} of ${unusedSections.length} unused sections`
                                        : `${filteredSections.length} unused sections found`
                                    }
                                </Text>
                            </Group>

                            {/* Sections Grid */}
                            <SimpleGrid
                                cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
                                spacing="md"
                            >
                                {filteredSections.map((section) => (
                                    <Card
                                        key={section.id}
                                        withBorder
                                        padding="md"
                                        radius="md"
                                        style={{ height: 'fit-content' }}
                                    >
                                        <Stack gap="sm">
                                            {/* Section Header */}
                                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                                <Box style={{ flex: 1, minWidth: 0 }}>
                                                    <Text fw={600} size="sm" lineClamp={2} title={section.name}>
                                                        {section.name}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        ID: {section.id}
                                                    </Text>
                                                </Box>
                                                <ActionIcon
                                                    color="red"
                                                    variant="subtle"
                                                    size="sm"
                                                    onClick={() => handleDeleteSection(section)}
                                                    title="Delete section"
                                                >
                                                    <IconTrash size={14} />
                                                </ActionIcon>
                                            </Group>

                                            {/* Section Details */}
                                            <Stack gap="xs">
                                                <Group gap="xs">
                                                    <Text size="xs" c="dimmed">Style:</Text>
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color={section.styleName ? "blue" : "gray"}
                                                    >
                                                        {section.styleName || 'No style'}
                                                    </Badge>
                                                </Group>
                                                <Group gap="xs">
                                                    <Text size="xs" c="dimmed">Style ID:</Text>
                                                    <Text size="xs">{section.idStyles}</Text>
                                                </Group>
                                            </Stack>
                                        </Stack>
                                    </Card>
                                ))}
                            </SimpleGrid>
                        </>
                    )}
                </Stack>
            </Container>

            {/* Delete Modals */}
            <DeleteUnusedSectionModal
                section={deleteModalSection}
                opened={!!deleteModalSection}
                onClose={() => setDeleteModalSection(null)}
                onDeleted={handleSectionDeleted}
            />

            <DeleteAllUnusedSectionsModal
                sections={filteredSections}
                opened={deleteAllModalOpened}
                onClose={() => setDeleteAllModalOpened(false)}
                onDeleted={handleAllSectionsDeleted}
            />
        </>
    );
}
