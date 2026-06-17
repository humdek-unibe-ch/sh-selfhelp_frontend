/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Box } from '@mantine/core';
import { type IAudioStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for IAudioStyle component
 */
interface IAudioStyleProps {
    style: IAudioStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

const AudioStyle: React.FC<IAudioStyleProps> = ({ style }) => {
    // Get audio sources - handle both array and JSON string formats
    let sources: Array<{ source?: string; src?: string; type?: string }> = [];
    try {
        const sourcesContent = style.sources?.content;
        if (Array.isArray(sourcesContent)) {
            sources = sourcesContent as Array<{ source?: string; src?: string; type?: string }>;
        } else if (sourcesContent && typeof sourcesContent === 'string') {
            const stringContent = sourcesContent as string;
            if (stringContent.trim()) {
                sources = JSON.parse(stringContent);
            }
        }
    } catch {

        sources = [];
    }

    return (
        <Box className={style.css ?? ""}>
            <audio 
                controls
                className="w-full"
            >
                {sources.map((source, index: number) => (
                    <source 
                        key={index} 
                        src={source.source || source.src} 
                        type={source.type} 
                    />
                ))}
                Your browser does not support the audio element.
            </audio>
        </Box>
    );
};

export default AudioStyle; 