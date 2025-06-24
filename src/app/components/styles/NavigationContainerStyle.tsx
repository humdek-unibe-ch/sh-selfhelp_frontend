import React from 'react';
import type { INavigationContainerStyle } from '../../../types/common/styles.types';
import { Box, Title, Text } from '@mantine/core';
import BasicStyle from './BasicStyle';
import MarkdownStyle from './MarkdownStyle';

interface INavigationContainerStyleProps {
    style: INavigationContainerStyle;
}

const NavigationContainerStyle: React.FC<INavigationContainerStyleProps> = ({ style }) => {
    const title = style.title?.content;
    const textMd = style.text_md?.content;
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box className={style.css}>
            {title && (
                <Title order={3} mb="md">
                    {title}
                </Title>
            )}
            
            {textMd && (
                <Box mb="md">
                    <MarkdownStyle style={{
                        ...style,
                        style_name: 'markdown',
                        text_md: { content: textMd }
                    } as any} />
                </Box>
            )}
            
            <Box>
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
                ))}
            </Box>
        </Box>
    );
};

export default NavigationContainerStyle; 