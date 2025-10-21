'use client';

import { Box, Paper, Stack, Text, Button, Group, Badge, Alert } from '@mantine/core';
import { useState } from 'react';
import { usePageVersions } from '../../../hooks/usePageVersions';
import { usePublishVersionMutation } from '../../../hooks/mutations/usePageVersionMutations';

interface IVersionTestPanelProps {
    pageId: number;
    pageKeyword: string;
}

export function VersionTestPanel({ pageId, pageKeyword }: IVersionTestPanelProps) {
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<any>(null);

    const { data: versionsData } = usePageVersions(pageId);
    const publishMutation = usePublishVersionMutation();

    const testPublishedVersion = async () => {
        setIsTesting(true);
        setTestResults(null);

        const results: any = {};

        try {
            // Test published version (default)
            const response1 = await fetch(`http://localhost/symfony/cms-api/v1/pages/${pageId}`);
            const data1 = await response1.json();
            results.published = {
                status: response1.status,
                hasPageData: !!data1.data?.page,
                message: data1.message
            };

            // Test draft/preview version
            const response2 = await fetch(`http://localhost/symfony/cms-api/v1/pages/${pageId}?preview=true`);
            const data2 = await response2.json();
            results.draft = {
                status: response2.status,
                hasPageData: !!data2.data?.page,
                message: data2.message
            };

            // Test with language
            const response3 = await fetch(`http://localhost/symfony/cms-api/v1/pages/${pageId}?language_id=1`);
            const data3 = await response3.json();
            results.publishedWithLanguage = {
                status: response3.status,
                hasPageData: !!data3.data?.page,
                message: data3.message
            };

        } catch (error) {
            results.error = error.message;
        }

        setTestResults(results);
        setIsTesting(false);
    };

    const publishTestVersion = async () => {
        await publishMutation.mutateAsync({
            pageId,
            data: {
                version_name: 'Test Published Version',
                metadata: {
                    description: 'Test version to verify publishing system works',
                    tags: ['test']
                }
            }
        });
    };

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between">
                    <Text size="lg" fw={600}>Version System Test Panel</Text>
                    <Badge color="blue" variant="light">Debug Tool</Badge>
                </Group>

                <Text size="sm" c="dimmed">
                    Use this tool to test the page versioning system. Page ID: {pageId}, Keyword: {pageKeyword}
                </Text>

                {/* Current Status */}
                <Box>
                    <Text size="sm" fw={500} mb="xs">Current Status:</Text>
                    <Group gap="sm">
                        <Badge
                            color={versionsData?.current_published_version_id ? 'green' : 'yellow'}
                            variant="filled"
                        >
                            {versionsData?.current_published_version_id ? 'Has Published Version' : 'No Published Version'}
                        </Badge>
                        <Badge color="blue" variant="light">
                            {versionsData?.versions?.length || 0} Versions Total
                        </Badge>
                    </Group>
                </Box>

                {/* Test Buttons */}
                <Group grow>
                    <Button
                        variant="filled"
                        color="blue"
                        onClick={testPublishedVersion}
                        loading={isTesting}
                    >
                        Test API Responses
                    </Button>
                    <Button
                        variant="outline"
                        color="green"
                        onClick={publishTestVersion}
                        loading={publishMutation.isPending}
                        disabled={versionsData?.current_published_version_id !== null}
                    >
                        Publish Test Version
                    </Button>
                </Group>

                {/* Test Results */}
                {testResults && (
                    <Box>
                        <Text size="sm" fw={500} mb="xs">API Test Results:</Text>
                        <Stack gap="xs">
                            <Alert color={testResults.published?.hasPageData ? 'green' : 'red'} variant="light">
                                <Text size="sm" fw={500}>Published (default): {testResults.published?.status}</Text>
                                <Text size="xs">{testResults.published?.message}</Text>
                            </Alert>

                            <Alert color={testResults.draft?.hasPageData ? 'green' : 'red'} variant="light">
                                <Text size="sm" fw={500}>Draft (preview=true): {testResults.draft?.status}</Text>
                                <Text size="xs">{testResults.draft?.message}</Text>
                            </Alert>

                            <Alert color={testResults.publishedWithLanguage?.hasPageData ? 'green' : 'red'} variant="light">
                                <Text size="sm" fw={500}>Published + Language: {testResults.publishedWithLanguage?.status}</Text>
                                <Text size="xs">{testResults.publishedWithLanguage?.message}</Text>
                            </Alert>
                        </Stack>
                    </Box>
                )}

                {/* Expected Behavior */}
                <Alert color="blue" variant="light">
                    <Text size="sm" fw={500}>Expected Behavior:</Text>
                    <Text size="xs" mt={4}>
                        • <strong>Published (default)</strong>: Should show published version if exists, 404 if not<br/>
                        • <strong>Draft (preview=true)</strong>: Should always show draft content<br/>
                        • <strong>Published + Language</strong>: Same as published, with language support
                    </Text>
                </Alert>
            </Stack>
        </Paper>
    );
}
