/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import {
    Table,
    Card,
    Group,
    ActionIcon,
    Tooltip,
    LoadingOverlay,
    Text,
    Stack,
    Center,
    Box,
} from '@mantine/core';

import {
    IconEdit,
    IconTrash,
} from '@tabler/icons-react';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { type ILanguage } from '../../../../../types/responses/admin/languages.types';
import { EmptyState } from '../../../shared/common/EmptyState';
import { adminTableClasses as tableStyles } from '../../shared/admin-table';
import classes from './LanguagesList.module.css';

interface ILanguagesListProps {
    onCreateLanguage?: () => void;
    onEditLanguage?: (languageId: number) => void;
    onDeleteLanguage?: (languageId: number, languageName: string, languageLocale: string) => void;
}

export function LanguagesList({
    onEditLanguage,
    onDeleteLanguage,
}: ILanguagesListProps) {
    // Fetch languages data
    const { languages, isLoading, error } = useAdminLanguages();

    // Loading state
    if (isLoading) {
        return (
            <Card withBorder shadow="sm" radius="md">
                <LoadingOverlay visible={true} />
                <Center h={200}>
                    <Text>Loading languages...</Text>
                </Center>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card withBorder shadow="sm" radius="md">
                <Center h={200}>
                    <Stack align="center" gap="xs">
                        <Text c="red" fw={500}>Error loading languages</Text>
                        <Text size="sm" c="dimmed">{error.message}</Text>
                    </Stack>
                </Center>
            </Card>
        );
    }

    const hasLanguages = languages && languages.length > 0;

    return (
        <div className={tableStyles.tableWrapper}>
            <Box className={tableStyles.tableScrollContainer}>
                    <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th className={tableStyles.tableHeader}>ID</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>Language</Table.Th>
                                <Table.Th className={tableStyles.tableHeader}>CSV Separator</Table.Th>
                                <Table.Th className={tableStyles.tableHeader} w={120}>Actions</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {hasLanguages && languages.map((language: ILanguage) => (
                                <Table.Tr key={language.id}>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Text size="sm" fw={500}>{language.id}</Text>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <span className={classes.langText}>
                                            <Text span size="sm" className={classes.langName}>{language.language}</Text>
                                            <Text span size="xs" c="dimmed" className={classes.langLocale}>{language.locale}</Text>
                                        </span>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Text size="sm" fw={500}>{language.csvSeparator}</Text>
                                    </Table.Td>
                                    <Table.Td className={tableStyles.tableCell}>
                                        <Group gap={2} wrap="nowrap" className={tableStyles.actionsCell}>
                                            <Tooltip label="Edit language" withArrow>
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="gray"
                                                    aria-label="Edit language"
                                                    onClick={() => onEditLanguage?.(language.id)}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Delete language" withArrow>
                                                <ActionIcon
                                                    size="sm"
                                                    variant="subtle"
                                                    color="red"
                                                    aria-label="Delete language"
                                                    onClick={() => onDeleteLanguage?.(language.id, language.language, language.locale)}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Box>

                {/* Empty state — inside the shell, below the header row (matches Users). */}
                {!hasLanguages && (
                    <EmptyState
                        title="No languages found"
                        description="Get started by creating your first language"
                    />
                )}
            </div>
    );
}
