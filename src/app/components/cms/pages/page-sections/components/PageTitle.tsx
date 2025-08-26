'use client';

import { memo } from 'react';
import { Group, Title, Badge } from '@mantine/core';

interface IPageTitleProps {
    pageName: string;
    sectionsCount: number;
    isProcessing?: boolean;
}

export const PageTitle = memo<IPageTitleProps>(
    function PageTitle({ pageName, sectionsCount, isProcessing }) {
        return (
            <Group gap="xs" align="center" wrap="nowrap">
                <Title order={6} size="sm">
                    {pageName} - Sections
                </Title>
                <Badge size="xs" variant="light" color="blue">
                    {sectionsCount}
                </Badge>
                {isProcessing && (
                    <Badge size="xs" variant="light" color="orange">
                        Processing...
                    </Badge>
                )}
            </Group>
        );
    },
    // Custom comparison - only re-render if these specific props change
    (prevProps, nextProps) => {
        return (
            prevProps.pageName === nextProps.pageName &&
            prevProps.sectionsCount === nextProps.sectionsCount &&
            prevProps.isProcessing === nextProps.isProcessing
        );
    }
);
