import React from 'react';
import type { IVideoStyle } from '../../../types/common/styles.types';
import { Box } from '@mantine/core';

interface IVideoStyleProps {
    style: IVideoStyle;
}

const VideoStyle: React.FC<IVideoStyleProps> = ({ style }) => {
    // Get video sources
    const sources = style.sources?.content || [];
    
    // Determine if video should be fluid (responsive)
    const isFluid = style.is_fluid?.content === '1';

    return (
        <Box className={style.css}>
            <video 
                controls
                className={isFluid ? 'w-full h-auto' : ''}
                style={{
                    maxWidth: '100%',
                    height: 'auto'
                }}
            >
                {sources.map((source: any, index: number) => (
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