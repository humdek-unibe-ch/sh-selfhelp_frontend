import React from 'react';
import type { IFigureStyle } from '../../../types/common/styles.types';
import { Box, Text } from '@mantine/core';
import BasicStyle from './BasicStyle';

interface IFigureStyleProps {
    style: IFigureStyle;
}

const FigureStyle: React.FC<IFigureStyleProps> = ({ style }) => {
    const captionTitle = style.caption_title?.content;
    const caption = style.caption?.content;
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box component="figure" className={style.css}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
            {(captionTitle || caption) && (
                <Text component="figcaption" size="sm" c="dimmed" mt="xs">
                    {captionTitle && <Text component="strong">{captionTitle}</Text>}
                    {captionTitle && caption && ': '}
                    {caption}
                </Text>
            )}
        </Box>
    );
};

export default FigureStyle; 