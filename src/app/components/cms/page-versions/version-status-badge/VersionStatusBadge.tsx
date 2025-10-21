'use client';

import { Badge, Group, Tooltip } from '@mantine/core';
import { IconCheck, IconClock } from '@tabler/icons-react';

interface IVersionStatusBadgeProps {
    hasPublishedVersion: boolean;
    publishedVersionName?: string | null;
}

export function VersionStatusBadge({ hasPublishedVersion, publishedVersionName }: IVersionStatusBadgeProps) {
    if (!hasPublishedVersion) {
        return (
            <Tooltip label="This page has no published version. Users will see a 404 error.">
                <Badge 
                    size="sm" 
                    color="yellow" 
                    variant="filled"
                    leftSection={<IconClock size={12} />}
                >
                    Draft Only
                </Badge>
            </Tooltip>
        );
    }

    return (
        <Tooltip label={publishedVersionName ? `Published: ${publishedVersionName}` : 'Published version is live'}>
            <Badge 
                size="sm" 
                color="green" 
                variant="filled"
                leftSection={<IconCheck size={12} />}
            >
                Published
            </Badge>
        </Tooltip>
    );
}

