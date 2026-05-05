'use client';

import {
    Stack,
    Card,
    Badge,
    SimpleGrid,
    Text,
    NumberInput,
    Alert,
    Loader,
    Group,
    Tooltip,
} from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { IStyleGroup, IStyle } from '../../../../../../../types/responses/admin/styles.types';

interface NewSectionTabProps {
    isLoadingStyles: boolean;
    isLoadingParentDetails: boolean;
    stylesError: any;
    filteredStyleGroups: IStyleGroup[];
    parentSectionId?: number | null;
    searchQuery: string;
    selectedStyles: { style: IStyle; quantity: number }[];
    handleStyleToggle: (style: IStyle) => void;
    updateStyleQuantity: (styleId: number, quantity: number) => void;
}

export function NewSectionTab({
    isLoadingStyles,
    isLoadingParentDetails,
    stylesError,
    filteredStyleGroups,
    parentSectionId,
    searchQuery,
    selectedStyles,
    handleStyleToggle,
    updateStyleQuantity,
}: Readonly<NewSectionTabProps>) {
    return (
        <Stack gap="sm">
            {isLoadingStyles || (parentSectionId && isLoadingParentDetails) ? (
                <Group justify="center" p="xl">
                    <Loader size="sm" />
                    <Text size="sm">
                        {isLoadingStyles ? "Loading styles..." : "Loading parent section details..."}
                    </Text>
                </Group>
            ) : stylesError ? (
                <Alert icon={<IconInfoCircle size={16} />} color="red">
                    Failed to load styles. Please try again.
                </Alert>
            ) : filteredStyleGroups.length === 0 ? (
                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                    {searchQuery
                        ? "No styles found matching your search criteria."
                        : parentSectionId
                            ? "No styles are allowed as children of the selected parent section."
                            : "No styles available."}
                </Alert>
            ) : (
                <Stack gap="sm">
                    {filteredStyleGroups.map((group: IStyleGroup) => (
                        <div key={group.id}>
                            <Group gap="xs" mb="xs">
                                <Text fw={600} size="sm" c="blue">
                                    {group.name}
                                </Text>
                                <Badge size="xs" variant="outline">
                                    {group.styles.length}
                                </Badge>
                            </Group>
                            {group.description && (
                                <Text size="xs" c="dimmed" mb="xs">
                                    {group.description}
                                </Text>
                            )}
                            <SimpleGrid
                                cols={{ base: 1, sm: 2, md: 3 }}
                                spacing="sm"
                                verticalSpacing="sm"
                                mb="md"
                            >
                                {group.styles.map((style: IStyle) => {
                                    const selectedItem = selectedStyles.find(
                                        (s) => s.style.id === style.id
                                    );
                                    const isSelected = !!selectedItem;

                                    return (
                                        <Card
                                            key={style.id}
                                            withBorder
                                            p="xs"
                                            style={{
                                                transition: "box-shadow 0.1s ease",
                                                backgroundColor: selectedItem
                                                    ? "var(--mantine-color-blue-0)"
                                                    : undefined,
                                                borderColor: selectedItem
                                                    ? "var(--mantine-color-blue-4)"
                                                    : undefined,
                                                cursor: "pointer",
                                            }}
                                            onClick={(e) => {
                                                const target = e.target as HTMLElement;
                                                const isInteractive = target.closest(
                                                    'input, button, textarea, select, [role="spinbutton"]'
                                                );
                                                if (isInteractive) return;
                                                handleStyleToggle(style);
                                            }}
                                        >
                                            <Stack gap={4}>
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Text fw={600} size="sm" truncate>
                                                        {style.name}
                                                    </Text>
                                                    {isSelected && (
                                                        <Badge size="xs" variant="filled" color="blue">
                                                            Selected
                                                        </Badge>
                                                    )}
                                                </Group>

                                                {style.description && (
                                                    <Tooltip
                                                        label={style.description}
                                                        multiline
                                                        w={300}
                                                        position="bottom"
                                                        withArrow
                                                        openDelay={300}
                                                    >
                                                        <Text size="xs" c="dimmed" lineClamp={2}>
                                                            {style.description}
                                                        </Text>
                                                    </Tooltip>
                                                )}

                                                {isSelected && (
                                                    <NumberInput
                                                        size="xs"
                                                        min={1}
                                                        max={10}
                                                        value={selectedItem!.quantity}
                                                        onMouseDown={(e) => e.stopPropagation()}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(val) =>
                                                            updateStyleQuantity(style.id, Number(val) || 1)
                                                        }
                                                    />
                                                )}
                                            </Stack>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        </div>
                    ))}
                </Stack>
            )}
        </Stack>
    );
}