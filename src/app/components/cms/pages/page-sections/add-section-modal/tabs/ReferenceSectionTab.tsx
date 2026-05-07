/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Stack, Alert, Loader, Group, Select, Text } from '@mantine/core';
import { IconInfoCircle, IconAlertCircle } from '@tabler/icons-react';

interface ReferenceSectionTabProps {
    isLoadingRefContainers: boolean;
    isFetchingRefContainers: boolean;
    refContainersError: any;
    refContainerSections: any[];
    refContainerSectionsSelectData: { value: string; label: string }[];
    selectedRefContainerSection: string | null;
    setSelectedRefContainerSection: (value: string | null) => void;
    parentSectionId?: number | null;
}

export function ReferenceSectionTab({
    isLoadingRefContainers,
    isFetchingRefContainers,
    refContainersError,
    refContainerSections,
    refContainerSectionsSelectData,
    selectedRefContainerSection,
    setSelectedRefContainerSection,
    parentSectionId,
}: Readonly<ReferenceSectionTabProps>) {
    return (
        <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                Select a reference container section to add to this{" "}
                {parentSectionId ? "section" : "page"}. Reference containers are
                special sections that can be reused across different pages.
            </Alert>

            {isLoadingRefContainers || isFetchingRefContainers ? (
                <Group justify="center" p="xl">
                    <Loader size="sm" />
                    <Text size="sm">Loading reference containers...</Text>
                </Group>
            ) : refContainersError ? (
                <Alert icon={<IconAlertCircle size={16} />} color="red">
                    Failed to load reference containers. Please try again.
                </Alert>
            ) : refContainerSections.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="gray">
                    No reference container sections available.
                </Alert>
            ) : (
                <Stack gap="sm">
                    <Select
                        comboboxProps={{ withinPortal: true, zIndex: 10000 }}
                        label="Select Reference Container"
                        placeholder="Choose a reference container to add..."
                        data={refContainerSectionsSelectData}
                        value={selectedRefContainerSection}
                        onChange={setSelectedRefContainerSection}
                        searchable
                        clearable
                        size="sm"
                        nothingFoundMessage="No reference containers found"
                    />
                </Stack>
            )}
        </Stack>
    );
}