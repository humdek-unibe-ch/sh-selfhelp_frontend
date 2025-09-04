import React from 'react';
import { Box, Text } from '@mantine/core';
import { IPlaintextStyle } from '../../../../types/common/styles.types';

interface IPlaintextStyleProps {
    style: IPlaintextStyle;
}

const PlaintextStyle: React.FC<IPlaintextStyleProps> = ({ style }) => {
    const text = style.text?.content;
    const isParagraph = style.is_paragraph?.content === '1';

    if (!text) {
        return null;
    }

    return (
        <Box className={style.css ?? ""}>
            {isParagraph ? (
                <Text component="p">{text}</Text>
            ) : (
                <Text component="span">{text}</Text>
            )}
        </Box>
    );
};

export default PlaintextStyle; 