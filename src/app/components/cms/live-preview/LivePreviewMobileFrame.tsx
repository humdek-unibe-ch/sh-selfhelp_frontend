/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * LivePreviewMobileFrame — the mobile (device) half of the Live Preview stage.
 *
 * Presentational: renders the availability states (checking / unavailable) and,
 * when available, the real `selfhelp-mobile-preview` iframe inside a device
 * bezel (dark rounded phone/tablet frame). The bezel + screen are sized via the
 * `frame` layout computed by the parent (which subtracts the bezel chrome so the
 * bottom of the device — including the mobile bottom tab bar — is never clipped).
 * Changing device/orientation only resizes via CSS (no iframe reload).
 *
 * @module components/cms/live-preview/LivePreviewMobileFrame
 */

import { type RefObject } from 'react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Group,
    Loader,
    Stack,
    Text,
} from '@mantine/core';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';
import type { ILivePreviewFrameLayout } from './livePreviewLayout';
import type { TMobilePreviewAvailability } from './hooks/useMobilePreviewAvailability';
import type { TPreviewDevice } from '../pages/mobile-preview/mobilePreviewUrl';

export interface ILivePreviewMobileFrameProps {
    availability: TMobilePreviewAvailability;
    previewOrigin: string;
    isDev: boolean;
    /** Re-run the availability probe (the "unavailable" retry). */
    onRetryAvailability: () => void;
    /** Scaled device-frame layout (native size + scale + on-screen size). */
    frame: ILivePreviewFrameLayout;
    /** Device bezel padding (top/bottom/left/right), drives the frame look. */
    bezelPadding: number;
    device: TPreviewDevice;
    /** Mobile iframe `src` (null until a code is minted). */
    mobileUrl: string | null;
    /** Whether the iframe should currently be mounted (false mid-reload). */
    mobileMounted: boolean;
    /** availability available && tab visible — gates rendering the iframe. */
    previewActive: boolean;
    mobileIframeRef: RefObject<HTMLIFrameElement | null>;
    /** Mint error (null while OK / pending). */
    mintError: string | null;
    /** Reload the mobile frame only (fresh mint). */
    onReloadMobile: () => void;
    /** True while a mint is in flight (drives the retry spinner). */
    mintPending: boolean;
}

export function LivePreviewMobileFrame({
    availability,
    previewOrigin,
    isDev,
    onRetryAvailability,
    frame,
    bezelPadding,
    device,
    mobileUrl,
    mobileMounted,
    previewActive,
    mobileIframeRef,
    mintError,
    onReloadMobile,
    mintPending,
}: ILivePreviewMobileFrameProps) {
    return (
        <Box
            style={{
                flex: '0 0 auto',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {availability === 'checking' ? (
                <Group gap="xs" align="center" h="100%" px="md">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                        Checking mobile preview…
                    </Text>
                </Group>
            ) : availability === 'unavailable' ? (
                <Box maw={340}>
                    <Alert
                        icon={<IconAlertTriangle size="1rem" />}
                        color="yellow"
                        title="Mobile preview unavailable"
                    >
                        <Stack gap="xs">
                            <Text size="sm">
                                No mobile preview is running at <code>{previewOrigin}</code>.
                                Enable the <code>selfhelp-mobile-preview</code> service
                                {isDev ? (
                                    <>
                                        , or start the Expo dev server (
                                        <code>npx expo start --web</code>)
                                    </>
                                ) : null}
                                .
                            </Text>
                            <Group>
                                <ActionIcon
                                    variant="light"
                                    onClick={onRetryAvailability}
                                    aria-label="Retry mobile preview"
                                >
                                    <IconRefresh size="1rem" />
                                </ActionIcon>
                            </Group>
                        </Stack>
                    </Alert>
                </Box>
            ) : (
                // A realistic device bezel around the scaled screen: a dark rounded
                // frame + drop shadow, mirroring the mobile app's own PhoneFrame so
                // the preview reads like a phone rather than a flat web card. The
                // screen height is sized via the parent's `frameChromeHeight` so the
                // bezel never clips the bottom of the device.
                <Box
                    style={{
                        padding: bezelPadding,
                        borderRadius: device === 'phone' ? 44 : 34,
                        background: 'linear-gradient(160deg, #2b3742 0%, #161b21 100%)',
                        boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
                    }}
                >
                    <Box
                        style={{
                            width: frame.displayWidth,
                            height: frame.displayHeight,
                            overflow: 'hidden',
                            borderRadius: device === 'phone' ? 34 : 24,
                            background: 'var(--mantine-color-body)',
                        }}
                    >
                        {mobileUrl && mobileMounted && previewActive ? (
                            <iframe
                                key={mobileUrl}
                                ref={mobileIframeRef}
                                title="Mobile live preview"
                                src={mobileUrl}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                style={{
                                    width: frame.width,
                                    height: frame.height,
                                    border: 0,
                                    transform: `scale(${frame.scale})`,
                                    transformOrigin: 'top left',
                                }}
                            />
                        ) : mintError ? (
                            <Stack align="center" justify="center" h="100%" gap="xs" p="md">
                                <IconAlertTriangle size="1.4rem" color="var(--mantine-color-red-6)" />
                                <Text size="sm" fw={600} ta="center">
                                    Could not start the mobile preview
                                </Text>
                                <Text size="xs" c="dimmed" ta="center">
                                    {mintError}
                                </Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<IconRefresh size="0.9rem" />}
                                    onClick={onReloadMobile}
                                    loading={mintPending}
                                >
                                    Retry
                                </Button>
                            </Stack>
                        ) : (
                            <Stack align="center" justify="center" h="100%" gap="xs" p="md">
                                <Loader size="sm" />
                                <Text size="xs" c="dimmed" ta="center">
                                    {isDev
                                        ? 'Starting the mobile preview… the first load compiles the Expo dev bundle and can take a moment.'
                                        : 'Starting the mobile preview…'}
                                </Text>
                            </Stack>
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
