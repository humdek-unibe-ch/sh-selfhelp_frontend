import React, { useState } from 'react';
import { Modal, Button, Box } from '@mantine/core';
import { TStyle } from '../../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

interface IModalStyleProps {
    style: TStyle; // Using TStyle since modal isn't defined in types yet
}

const ModalStyle: React.FC<IModalStyleProps> = ({ style }) => {
    const [opened, setOpened] = useState(false);
    
    // Get modal properties from fields
    const title = style.fields?.title?.content;
    const id = style.fields?.id?.content;
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box className={style.css}>
            <Button onClick={() => setOpened(true)}>
                Open Modal
            </Button>
            
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={title}
                size="lg"
                centered
            >
                {children.map((childStyle: TStyle, index: number) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </Modal>
        </Box>
    );
};

export default ModalStyle; 