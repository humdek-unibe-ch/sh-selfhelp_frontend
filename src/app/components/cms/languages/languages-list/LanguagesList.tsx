"use client";

import {
    Table,
    TableTbody,
    TableTd,
    TableThead,
    TableTh,
    TableTr,
} from '@mantine/core';
import {
    Card,
    Group,
    Button,
    ActionIcon,
    Tooltip,
    LoadingOverlay,
    Text,
    Stack,
    Center,
} from '@mantine/core';
import {
    IconEdit,
    IconTrash,
    IconPlus,
    IconLanguage,
} from '@tabler/icons-react';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { ILanguage } from '../../../../../types/responses/admin/languages.types';

interface ILanguagesListProps {
    onCreateLanguage?: () => void;
    onEditLanguage?: (languageId: number) => void;
    onDeleteLanguage?: (languageId: number, languageName: string, languageLocale: string) => void;
}

export function LanguagesList({
    onCreateLanguage,
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

    // Empty state
    if (!languages || languages.length === 0) {
        return (
            <Card withBorder shadow="sm" radius="md">
                <Center h={200}>
                    <Stack align="center" gap="md">
                        <IconLanguage size={48} style={{ color: 'var(--mantine-color-gray-4)' }} />
                        <Text fw={500}>No languages found</Text>
                        <Text size="sm" c="dimmed">
                            Get started by creating your first language
                        </Text>
                        <Button
                            leftSection={<IconPlus size={16} />}
                            onClick={onCreateLanguage}
                            variant="filled"
                        >
                            Create Language
                        </Button>
                    </Stack>
                </Center>
            </Card>
        );
    }

    return (
        <Card withBorder shadow="sm" radius="md">
            <Card.Section withBorder inheritPadding py="sm">
                <Group justify="space-between">
                    <Group align="center" gap="xs">
                        <IconLanguage size={20} />
                        <Text fw={500}>Languages</Text>
                        <Text size="sm" c="dimmed">
                            ({languages.length} {languages.length === 1 ? 'language' : 'languages'})
                        </Text>
                    </Group>
                    <Button
                        leftSection={<IconPlus size={16} />}
                        onClick={onCreateLanguage}
                        variant="filled"
                        size="sm"
                    >
                        Create Language
                    </Button>
                </Group>
            </Card.Section>

            <Card.Section>
                <Table striped highlightOnHover>
                    <TableThead>
                        <TableTr>
                            <TableTh>ID</TableTh>
                            <TableTh>Language</TableTh>
                            <TableTh>Locale</TableTh>
                            <TableTh>CSV Separator</TableTh>
                            <TableTh w={120}>Actions</TableTh>
                        </TableTr>
                    </TableThead>
                    <TableTbody>
                        {languages.map((language: ILanguage) => (
                            <TableTr key={language.id}>
                                <TableTd>
                                    <Text size="sm" fw={500}>{language.id}</Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="sm">{language.language}</Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="sm" c="dimmed">{language.locale}</Text>
                                </TableTd>
                                <TableTd>
                                    <Text size="sm" fw={500}>{language.csvSeparator}</Text>
                                </TableTd>
                                <TableTd>
                                    <Group gap="xs">
                                        <Tooltip label="Edit language">
                                            <ActionIcon
                                                size="sm"
                                                variant="light"
                                                color="blue"
                                                onClick={() => onEditLanguage?.(language.id)}
                                            >
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Delete language">
                                            <ActionIcon
                                                size="sm"
                                                variant="light"
                                                color="red"
                                                onClick={() => onDeleteLanguage?.(language.id, language.language, language.locale)}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </TableTd>
                            </TableTr>
                        ))}
                    </TableTbody>
                </Table>
            </Card.Section>
        </Card>
    );
}
