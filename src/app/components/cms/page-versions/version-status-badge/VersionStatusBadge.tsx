'use client';

import { Badge, Tooltip, Stack, Text } from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { format } from 'date-fns';

interface IVersionStatusBadgeProps {
    hasPublishedVersion: boolean;
    publishedVersionName?: string | null;
    publishedAt?: string | null;
}

export function VersionStatusBadge({ 
    hasPublishedVersion, 
    publishedVersionName,
    publishedAt 
}: IVersionStatusBadgeProps) {
    if (!hasPublishedVersion) {
        return (
            <Tooltip 
                label="No published version - page is not visible to public users"
                withArrow
            >
                <Badge 
                    size="lg" 
                    color="orange" 
                    variant="light"
                    leftSection={<IconAlertCircle size={14} />}
                    style={{ cursor: 'help' }}
                >
                    Draft Only
                </Badge>
            </Tooltip>
        );
    }

    const tooltipContent = (
        <Stack gap={4}>
            {publishedVersionName && (
                <Text size="xs" fw={500}>{publishedVersionName}</Text>
            )}
            {publishedAt && (
                <Text size="xs" c="dimmed">
                    Published {format(new Date(publishedAt), 'MMM dd, yyyy HH:mm')}
                </Text>
            )}
            <Text size="xs" c="dimmed">
                This version is live and visible to users
            </Text>
        </Stack>
    );

    return (
        <Tooltip label={tooltipContent} withArrow>
            <Badge 
                size="lg" 
                color="green" 
                variant="light"
                leftSection={<IconCheck size={14} />}
                style={{ cursor: 'help' }}
            >
                Published
            </Badge>
        </Tooltip>
    );
}

