/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Box } from '@mantine/core';
import { type IVideoStyle } from '../../../../types/common/styles.types';
import { getAssetUrl } from '../../../../utils/asset-url.utils';

/**
 * Props interface for IVideoStyle component
 */
interface IVideoStyleProps {
    style: IVideoStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

const VideoStyle: React.FC<IVideoStyleProps> = ({ style, cssClass }) => {
    const rawSrc = style.video_src?.content;
    const src = rawSrc ? getAssetUrl(rawSrc) : undefined;
    const rawPoster = style.poster_src?.content;
    const poster = rawPoster ? getAssetUrl(rawPoster) : undefined;

    // Playback toggles ('0' | '1'); controls default ON.
    const controls = style.has_controls?.content !== '0';
    const loop = style.media_loop?.content === '1';
    const autoPlay = style.media_autoplay?.content === '1';
    // Browsers require muted for autoplay, so force it on when autoplay is set.
    const muted = style.media_muted?.content === '1' || autoPlay;
    const isFluid = style.is_fluid?.content === '1';

    return (
        <Box className={cssClass || style.css || ''}>
            <video
                src={src}
                poster={poster}
                controls={controls}
                loop={loop}
                autoPlay={autoPlay}
                muted={muted}
                className={isFluid ? 'w-full h-auto' : ''}
                style={{ maxWidth: '100%', height: 'auto' }}
            >
                {style.alt?.content}
            </video>
        </Box>
    );
};

export default VideoStyle; 