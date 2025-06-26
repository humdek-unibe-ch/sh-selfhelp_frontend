import React from 'react';
import type { IAudioStyle } from '../../../types/common/styles.types';
import { Box } from '@mantine/core';

interface IAudioStyleProps {
    style: IAudioStyle;
}

const AudioStyle: React.FC<IAudioStyleProps> = ({ style }) => {
    // Get audio sources - handle both array and JSON string formats
    let sources: any[] = [];
    try {
        const sourcesContent = style.sources?.content;
        if (Array.isArray(sourcesContent)) {
            sources = sourcesContent;
        } else if (sourcesContent && typeof sourcesContent === 'string') {
            const stringContent = sourcesContent as string;
            if (stringContent.trim()) {
                sources = JSON.parse(stringContent);
            }
        }
    } catch (error) {
        console.warn('Failed to parse audio sources:', error);
        sources = [];
    }

    return (
        <Box className={style.css}>
            <audio 
                controls
                className="w-full"
            >
                {sources.map((source: any, index: number) => (
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