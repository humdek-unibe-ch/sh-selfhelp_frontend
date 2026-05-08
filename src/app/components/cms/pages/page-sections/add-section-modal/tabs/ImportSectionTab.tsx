/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    Stack,
    Card,
    Badge,
    Text,
    FileInput,
    Alert,
    Group,
    Button,
    List,
    Anchor,
} from '@mantine/core';
import { IconInfoCircle, IconAlertCircle, IconUpload, IconCopy, IconBrandOpenai } from '@tabler/icons-react';
import { IImportValidationError } from '../../../../../../../api/admin/section.api';

interface ImportSectionTabProps {
    selectedFile: File | null;
    setSelectedFile: (file: File | null) => void;
    isCopyingPrompt: boolean;
    handleCopyAiPrompt: () => void;
    importErrors: IImportValidationError[];
    setImportErrors: (errors: IImportValidationError[]) => void;
    pageId?: number;
}

export function ImportSectionTab({
    selectedFile,
    setSelectedFile,
    isCopyingPrompt,
    handleCopyAiPrompt,
    importErrors,
    setImportErrors,
    pageId,
}: ImportSectionTabProps) {
    return (
        <Stack gap="md">
            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                Import sections from a previously exported JSON file. The file
                should contain section data in the correct (minimized) format —
                fields equal to the style default can be omitted, and the
                backend will fill them in.
            </Alert>

            <Card withBorder p="sm">
                <Stack gap="xs">
                    <Group justify="space-between" align="center" wrap="nowrap">
                        <Stack gap={2}>
                            <Text size="sm" fw={600}>
                                No JSON yet? Generate one with AI.
                            </Text>
                            <Text size="xs" c="dimmed">
                                Copy the full prompt template, paste it into any LLM web
                                UI together with what you need, then upload the returned
                                JSON here.
                            </Text>
                        </Stack>
                        <Button
                            variant="light"
                            color="teal"
                            size="xs"
                            leftSection={<IconCopy size={14} />}
                            loading={isCopyingPrompt}
                            onClick={handleCopyAiPrompt}
                        >
                            Copy AI prompt
                        </Button>
                    </Group>
                    <Group gap="sm">
                        <Anchor href="https://chat.openai.com/" target="_blank" rel="noopener noreferrer" size="xs">
                            <Group gap={4} wrap="nowrap">
                                <IconBrandOpenai size={12} />
                                ChatGPT
                            </Group>
                        </Anchor>
                        <Anchor href="https://gemini.google.com/" target="_blank" rel="noopener noreferrer" size="xs">
                            Gemini
                        </Anchor>
                        <Anchor href="https://claude.ai/" target="_blank" rel="noopener noreferrer" size="xs">
                            Claude
                        </Anchor>
                    </Group>
                </Stack>
            </Card>

            <FileInput
                label="Select JSON file to import"
                placeholder="Choose a JSON file..."
                leftSection={<IconUpload size={16} />}
                value={selectedFile}
                onChange={setSelectedFile}
                accept=".json,application/json"
                clearable
            />

            {selectedFile && (
                <Card withBorder p="sm" bg="green.0">
                    <Group gap="xs">
                        <Text size="sm" fw={500}>Selected file:</Text>
                        <Text size="sm">{selectedFile.name}</Text>
                        <Badge size="xs" color="green">
                            {(selectedFile.size / 1024).toFixed(1)} KB
                        </Badge>
                    </Group>
                </Card>
            )}

            {selectedFile && !selectedFile.name.toLowerCase().endsWith(".json") && (
                <Alert color="orange" icon={<IconAlertCircle size={16} />}>
                    Warning: Selected file does not have a .json extension. The
                    import may fail if the file is not valid JSON.
                </Alert>
            )}

            {importErrors.length > 0 && (
                <Alert
                    color="red"
                    icon={<IconAlertCircle size={16} />}
                    title={`Import validation failed (${importErrors.length} issue${importErrors.length === 1 ? "" : "s"})`}
                    withCloseButton
                    onClose={() => setImportErrors([])}
                >
                    <Text size="xs" mb="xs" c="dimmed">
                        Nothing was written. Fix these issues in the JSON and try again:
                    </Text>
                    <List size="xs" spacing={4} withPadding>
                        {importErrors.map((err, idx) => (
                            <List.Item key={`${err.path}-${err.type}-${idx}`}>
                                <Group gap={6} wrap="nowrap" align="flex-start">
                                    <Badge size="xs" variant="light" color="red">
                                        {err.type}
                                    </Badge>
                                    <Text size="xs">
                                        {err.path && (
                                            <Text component="code" size="xs" c="dimmed" mr={4}>
                                                {err.path}
                                            </Text>
                                        )}
                                        {err.detail}
                                    </Text>
                                </Group>
                            </List.Item>
                        ))}
                    </List>
                </Alert>
            )}
        </Stack>
    );
}