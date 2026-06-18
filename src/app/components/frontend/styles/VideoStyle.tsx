/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Box } from '@mantine/core';
import { type IVideoStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for IVideoStyle component
 */
interface IVideoStyleProps {
    style: IVideoStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

const VideoStyle: React.FC<IVideoStyleProps> = ({ style }) => {
    // Get video sources - handle both array and JSON string formats
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
    
    // Determine if video should be fluid (responsive)
    const isFluid = style.is_fluid?.content === '1';

    return (
        <Box className={style.css ?? ""}>
            <video 
                controls
                className={isFluid ? 'w-full h-auto' : ''}
                style={{
                    maxWidth: '100%',
                    height: 'auto'
                }}
            >
                {sources.map((source, index: number) => (
                    <source 
                        key={index} 
                        src={source.source || source.src} 
                        type={source.type} 
                    />
                ))}
                {style.alt?.content}
            </video>
        </Box>
    );
};

export default VideoStyle; 