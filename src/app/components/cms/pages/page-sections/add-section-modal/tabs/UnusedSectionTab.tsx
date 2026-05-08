/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Stack,
    Card,
    Badge,
    SimpleGrid,
    Text,
    TextInput,
    Alert,
    Loader,
    Group,
} from '@mantine/core';
import { IconSearch, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

interface UnusedSectionTabProps {
    isLoadingUnused: boolean;
    isFetchingUnused: boolean;
    unusedError: any;
    unusedSections: any[];
    filteredUnusedSections: any[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedUnusedSections: { sectionId: number }[];
    toggleUnusedSection: (section: { id: number; name: string }) => void;
    parentSectionId?: number | null;
}

export function UnusedSectionTab({
    isLoadingUnused,
    isFetchingUnused,
    unusedError,
    unusedSections,
    filteredUnusedSections,
    searchQuery,
    setSearchQuery,
    selectedUnusedSections,
    toggleUnusedSection,
    parentSectionId,
}: Readonly<UnusedSectionTabProps>) {
    return (
        <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                Select an unused section to add to this{" "}
                {parentSectionId ? "section" : "page"}. Unused sections are
                sections that exist but are not currently assigned.
            </Alert>

            {(isLoadingUnused || isFetchingUnused) && (
                <Group justify="center" p="xl">
                    <Loader size="sm" />
                    <Text size="sm">Loading unused sections...</Text>
                </Group>
            )}

            {!(isLoadingUnused || isFetchingUnused) && unusedError && (
                <Alert icon={<IconAlertCircle size={16} />} color="red">
                    Failed to load unused sections. Please try again.
                </Alert>
            )}

            {!(isLoadingUnused || isFetchingUnused) &&
                !unusedError &&
                unusedSections.length === 0 && (
                    <Alert icon={<IconInfoCircle size={16} />} color="gray">
                        No unused sections available.
                    </Alert>
                )}

            {!(isLoadingUnused || isFetchingUnused) &&
                !unusedError &&
                unusedSections.length > 0 && (
                    <>
                        <TextInput
                            placeholder="Search by name, ID, or style..."
                            leftSection={<IconSearch size={16} />}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.currentTarget.value)}
                            size="sm"
                        />

                        <Text size="sm" c="dimmed" mb="xs">
                            {filteredUnusedSections.length} unused sections found
                        </Text>

                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="md">
                            {filteredUnusedSections.map((section) => {
                                const isSelected = selectedUnusedSections.some(
                                    (s) => s.sectionId === section.id
                                );

                                return (
                                    <Card
                                        key={section.id}
                                        withBorder
                                        p="md"
                                        style={{
                                            cursor: "pointer",
                                            transition: "all 0.1s ease",
                                            backgroundColor: isSelected
                                                ? "var(--mantine-color-blue-0)"
                                                : undefined,
                                            borderColor: isSelected
                                                ? "var(--mantine-color-blue-5)"
                                                : undefined,
                                        }}
                                        onClick={(e) => {
                                            const target = e.target as HTMLElement;
                                            const isInteractive = target.closest(
                                                'input, button, textarea, select, [role="spinbutton"]'
                                            );
                                            if (isInteractive) return;
                                            toggleUnusedSection(section);
                                        }}
                                    >
                                        <Stack gap="xs">
                                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                                <Text fw={600} size="sm" truncate style={{ flex: 1 }}>
                                                    {section.name}
                                                </Text>
                                                {isSelected && (
                                                    <Badge size="xs" color="blue" variant="filled">
                                                        Selected
                                                    </Badge>
                                                )}
                                            </Group>

                                            <Text size="xs" c="dimmed">ID: {section.id}</Text>

                                            {section.styleName && (
                                                <Badge size="xs" variant="light" color="blue" style={{ alignSelf: "flex-start" }}>
                                                    {section.styleName}
                                                </Badge>
                                            )}

                                            {!!section.idStyles && (
                                                <Text size="xs" c="dimmed">Style ID: {section.idStyles}</Text>
                                            )}
                                        </Stack>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    </>
                )}
        </Stack>
    );
}