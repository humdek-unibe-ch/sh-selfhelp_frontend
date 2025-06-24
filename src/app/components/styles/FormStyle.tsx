import React from 'react';
import type { IFormStyle } from '../../../types/common/styles.types';
import { Box, Button, Group } from '@mantine/core';
import BasicStyle from './BasicStyle';

interface IFormStyleProps {
    style: IFormStyle;
}

const FormStyle: React.FC<IFormStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const url = style.url?.content;
    const type = style.type?.content || 'primary';
    const labelCancel = style.label_cancel?.content;
    const urlCancel = style.url_cancel?.content;
    
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            window.location.href = url;
        }
    };

    const handleCancel = () => {
        if (urlCancel) {
            window.location.href = urlCancel;
        }
    };

    return (
        <Box component="form" className={style.css} onSubmit={handleSubmit}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
            
            <Group mt="md" justify="space-between">
                <div>
                    {label && (
                        <Button type="submit" color={type} size="sm">
                            {label}
                        </Button>
                    )}
                </div>
                {labelCancel && (
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={handleCancel}
                    >
                        {labelCancel}
                    </Button>
                )}
            </Group>
        </Box>
    );
};

export default FormStyle; 