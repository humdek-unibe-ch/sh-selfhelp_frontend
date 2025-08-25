import React from 'react';
import { Box, Button, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import BasicStyle from './BasicStyle';
import { IFormStyle } from '../../../../types/common/styles.types';

interface IFormStyleProps {
    style: IFormStyle;
}

const FormStyle: React.FC<IFormStyleProps> = ({ style }) => {
    const router = useRouter();
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
            // Check if URL is internal (relative or same origin)
            const isInternal = url.startsWith('/') || 
                              (typeof window !== 'undefined' && url.startsWith(window.location.origin));
            
            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = url.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = url;
            }
        }
    };

    const handleCancel = () => {
        if (urlCancel) {
            // Check if URL is internal (relative or same origin)
            const isInternal = urlCancel.startsWith('/') || 
                              (typeof window !== 'undefined' && urlCancel.startsWith(window.location.origin));
            
            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = urlCancel.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = urlCancel;
            }
        }
    };

    return (
        <Box component="form" className={style.css} onSubmit={handleSubmit}>
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
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