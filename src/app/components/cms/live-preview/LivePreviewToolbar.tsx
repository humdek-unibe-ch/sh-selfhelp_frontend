/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * LivePreviewToolbar — the Live Preview top control bar (presentational).
 *
 * LEFT: identity (back-to-editor, page keyword + dev/version badges) and the
 * shared controls (Mobile + Draft toggles, Refresh both, open in new tab).
 * RIGHT: the mobile device controls (device, orientation, mobile-only reload) —
 * shown only while the mobile pane is on and available. All state + callbacks are
 * props; this component holds no preview state of its own.
 *
 * @module components/cms/live-preview/LivePreviewToolbar
 */

import {
    ActionIcon,
    Badge,
    Divider,
    Group,
    SegmentedControl,
    Stack,
    Switch,
    Text,
    Tooltip,
} from '@mantine/core';
import {
    IconArrowLeft,
    IconDeviceMobile,
    IconExternalLink,
    IconRefresh,
} from '@tabler/icons-react';
import type {
    IMobilePreviewVersionInfo,
    TMobilePreviewAvailability,
} from './hooks/useMobilePreviewAvailability';
import type {
    TPreviewDevice,
    TPreviewOrientation,
} from '../pages/mobile-preview/mobilePreviewUrl';

export interface ILivePreviewToolbarProps {
    onBack: () => void;
    currentKeyword: string | null;
    versionInfo: IMobilePreviewVersionInfo | null;
    devOrigin: boolean;
    showMobile: boolean;
    onToggleMobile: (checked: boolean) => void;
    draft: boolean;
    onToggleDraft: () => void;
    onRefresh: () => void;
    /** True while a mint is in flight (drives the refresh/reload spinners). */
    refreshing: boolean;
    webOpenUrl: string;
    availability: TMobilePreviewAvailability;
    device: TPreviewDevice;
    onDeviceChange: (device: TPreviewDevice) => void;
    orientation: TPreviewOrientation;
    onOrientationChange: (orientation: TPreviewOrientation) => void;
    onReloadMobile: () => void;
}

export function LivePreviewToolbar({
    onBack,
    currentKeyword,
    versionInfo,
    devOrigin,
    showMobile,
    onToggleMobile,
    draft,
    onToggleDraft,
    onRefresh,
    refreshing,
    webOpenUrl,
    availability,
    device,
    onDeviceChange,
    orientation,
    onOrientationChange,
    onReloadMobile,
}: ILivePreviewToolbarProps) {
    return (
        <Stack
            gap={0}
            style={{
                borderBottom: '1px solid var(--mantine-color-default-border)',
                background: 'var(--mantine-color-body)',
            }}
        >
            <Group justify="space-between" align="center" px="md" py="xs" wrap="nowrap">
                <Group gap="sm" align="center" wrap="nowrap">
                    <Tooltip label="Back to editor">
                        <ActionIcon variant="subtle" onClick={onBack} aria-label="Back to page editor">
                            <IconArrowLeft size="1.1rem" />
                        </ActionIcon>
                    </Tooltip>
                    <IconDeviceMobile size="1.1rem" />
                    <Text fw={600} size="sm">
                        Live preview
                    </Text>
                    <Badge size="sm" variant="light" color="blue">
                        {currentKeyword || 'home'}
                    </Badge>
                    {versionInfo?.version && (
                        <Badge size="sm" variant="light" color="grape">
                            preview v{versionInfo.version}
                        </Badge>
                    )}
                    {devOrigin && (
                        <Badge size="sm" variant="light" color="teal">
                            live-reload dev
                        </Badge>
                    )}
                    <Divider orientation="vertical" />
                    <Switch
                        size="xs"
                        checked={showMobile}
                        onChange={(e) => onToggleMobile(e.currentTarget.checked)}
                        label="Mobile"
                        aria-label="Show the mobile pane"
                    />
                    <Switch
                        size="xs"
                        checked={draft}
                        onChange={() => onToggleDraft()}
                        label="Draft"
                        aria-label="Preview unpublished draft content (web and mobile)"
                    />
                    <Tooltip label="Refresh both previews">
                        <ActionIcon
                            size="md"
                            variant="light"
                            onClick={onRefresh}
                            loading={refreshing}
                            aria-label="Refresh all previews"
                        >
                            <IconRefresh size="1rem" />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Open the current page in a new tab">
                        <ActionIcon
                            size="md"
                            variant="subtle"
                            component="a"
                            href={webOpenUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open the current page in a new tab"
                        >
                            <IconExternalLink size="1rem" />
                        </ActionIcon>
                    </Tooltip>
                </Group>

                {showMobile && availability === 'available' && (
                    <Group gap="xs" align="center" wrap="nowrap" justify="flex-end">
                        <SegmentedControl
                            size="xs"
                            value={device}
                            onChange={(v) => onDeviceChange(v as TPreviewDevice)}
                            data={[
                                { label: 'Phone', value: 'phone' },
                                { label: 'Tablet', value: 'tablet' },
                            ]}
                            aria-label="Preview device"
                        />
                        <SegmentedControl
                            size="xs"
                            value={orientation}
                            onChange={(v) => onOrientationChange(v as TPreviewOrientation)}
                            data={[
                                { label: 'Portrait', value: 'portrait' },
                                { label: 'Landscape', value: 'landscape' },
                            ]}
                            aria-label="Preview orientation"
                        />
                        <Tooltip label="Reload the mobile preview only">
                            <ActionIcon
                                size="md"
                                variant="subtle"
                                onClick={onReloadMobile}
                                loading={refreshing}
                                aria-label="Reload mobile preview"
                            >
                                <IconRefresh size="1rem" />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                )}
            </Group>
        </Stack>
    );
}
