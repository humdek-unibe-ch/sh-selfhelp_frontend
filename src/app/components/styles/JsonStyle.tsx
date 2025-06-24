import React from 'react';
import type { IJsonStyle } from '../../../types/common/styles.types';
import { Box, Code, ScrollArea } from '@mantine/core';

interface IJsonStyleProps {
    style: IJsonStyle;
}

const JsonStyle: React.FC<IJsonStyleProps> = ({ style }) => {
    const jsonData = style.json?.content;

    if (!jsonData) {
        return null;
    }

    // Format JSON for display
    const formattedJson = typeof jsonData === 'string' 
        ? jsonData 
        : JSON.stringify(jsonData, null, 2);

    return (
        <Box className={style.css}>
            <ScrollArea>
                <Code block>
                    {formattedJson}
                </Code>
            </ScrollArea>
        </Box>
    );
};

export default JsonStyle; 