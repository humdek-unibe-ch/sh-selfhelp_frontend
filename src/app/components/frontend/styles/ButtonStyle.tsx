import React from 'react';
import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import { IButtonStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 */
interface IButtonStyleProps {
    style: IButtonStyle;
}

/**
 * ButtonStyle component renders a button element with optional styling and actions.
 * Supports different button types and URL navigation.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling and action
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    const router = useRouter();
    const label = getFieldContent(style, 'label');
    const url = getFieldContent(style, 'url');
    const type = getFieldContent(style, 'type') || 'primary';

    // Handle CSS field - use direct property from API response
    const cssClass = style.css ?? '';

    const handleClick = () => {
        if (url && url !== '#') {
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

    console.log(style);

    return (
        <Button
            variant="filled"
            // color={type}
            onClick={handleClick}
            className={cssClass}
            
        >
            {label}
        </Button>
    );

};

export default ButtonStyle;