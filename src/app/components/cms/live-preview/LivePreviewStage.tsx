/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * LivePreviewStage — the Live Preview body: the inline web pane (always) beside
 * the optional mobile device frame.
 *
 * Presentational layout only. It carries the `ResizeObserver` ref (`bodyRef`) so
 * the parent can measure the available area and compute the device-frame layout,
 * and composes `LivePreviewWebFrame` + `LivePreviewMobileFrame`.
 *
 * @module components/cms/live-preview/LivePreviewStage
 */

import { type RefCallback } from 'react';
import { Box } from '@mantine/core';
import { LivePreviewWebFrame, type ILivePreviewWebFrameProps } from './LivePreviewWebFrame';
import {
    LivePreviewMobileFrame,
    type ILivePreviewMobileFrameProps,
} from './LivePreviewMobileFrame';

export interface ILivePreviewStageProps {
    /** `useElementSize` ref attached to the body so the parent can measure it. */
    bodyRef: RefCallback<HTMLDivElement | null>;
    web: ILivePreviewWebFrameProps;
    showMobile: boolean;
    mobile: ILivePreviewMobileFrameProps;
}

export function LivePreviewStage({ bodyRef, web, showMobile, mobile }: ILivePreviewStageProps) {
    return (
        <Box
            ref={bodyRef}
            style={{
                flex: 1,
                display: 'flex',
                gap: 16,
                padding: 16,
                overflow: 'hidden',
                background: 'var(--mantine-color-default-hover)',
            }}
        >
            <LivePreviewWebFrame {...web} />
            {showMobile && <LivePreviewMobileFrame {...mobile} />}
        </Box>
    );
}
