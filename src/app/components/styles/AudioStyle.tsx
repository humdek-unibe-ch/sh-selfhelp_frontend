import React from 'react';
import type { IAudioStyle } from '../../../types/common/styles.types';
import { Box } from '@mantine/core';

interface IAudioStyleProps {
    style: IAudioStyle;
}

const AudioStyle: React.FC<IAudioStyleProps> = ({ style }) => {
    // Get audio sources
    const sources = style.sources?.content || [];

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