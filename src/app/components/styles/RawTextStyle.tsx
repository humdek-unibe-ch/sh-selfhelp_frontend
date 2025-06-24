import React from 'react';
import type { IRawTextStyle } from '../../../types/common/styles.types';
import { Box, Code } from '@mantine/core';

interface IRawTextStyleProps {
    style: IRawTextStyle;
}

const RawTextStyle: React.FC<IRawTextStyleProps> = ({ style }) => {
    const text = style.text?.content;

    if (!text) {
        return null;
    }

    return (
        <Box className={style.css}>
            <Code block>{text}</Code>
        </Box>
    );
};

export default RawTextStyle; 