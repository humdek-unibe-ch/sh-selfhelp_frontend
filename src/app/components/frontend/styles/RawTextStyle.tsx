import React from 'react';
import { Box, Code } from '@mantine/core';
import { IRawTextStyle } from '../../../../types/common/styles.types';

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