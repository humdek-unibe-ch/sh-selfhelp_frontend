/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Anchor, Card, Progress, Table, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import type { IAnalyticsTopPage } from '../../../../types/responses/admin/analytics.types';

interface ITopPagesTableProps {
    pages: IAnalyticsTopPage[];
}

/** Most-visited pages in the selected range, linking into the page editor. */
export function TopPagesTable({ pages }: ITopPagesTableProps) {
    const router = useRouter();
    const maxViews = pages.reduce((max, page) => Math.max(max, page.views), 0);

    return (
        <Card withBorder radius="md" p="md">
            <Text fw={600} mb={2}>Top pages</Text>
            <Text size="xs" c="dimmed" mb="sm">Most viewed pages in the selected range</Text>
            {pages.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="lg">
                    No page views recorded yet.
                </Text>
            ) : (
                <Table verticalSpacing={6} horizontalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Page</Table.Th>
                            <Table.Th w={90} ta="right">Views</Table.Th>
                            <Table.Th w={90} ta="right">Visitors</Table.Th>
                            <Table.Th w={110} visibleFrom="sm" aria-label="Share" />
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {pages.map((page) => (
                            <Table.Tr key={page.page_id}>
                                <Table.Td>
                                    <Anchor
                                        size="sm"
                                        fw={500}
                                        onClick={() => router.push(`/admin/pages/${page.keyword}`)}
                                    >
                                        {page.keyword}
                                    </Anchor>
                                    {page.url ? (
                                        <Text size="xs" c="dimmed" truncate maw={260}>
                                            {page.url}
                                        </Text>
                                    ) : null}
                                </Table.Td>
                                <Table.Td ta="right">{page.views.toLocaleString()}</Table.Td>
                                <Table.Td ta="right">{page.unique_visitors.toLocaleString()}</Table.Td>
                                <Table.Td visibleFrom="sm">
                                    <Progress
                                        value={maxViews > 0 ? (page.views / maxViews) * 100 : 0}
                                        size="sm"
                                        radius="xl"
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}
        </Card>
    );
}
