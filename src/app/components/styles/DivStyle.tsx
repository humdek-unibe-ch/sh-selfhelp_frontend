import React from 'react';
import { Box } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IDivStyle } from '../../../types/common/styles.types';

/**
 * Props interface for DivStyle component
 * @interface IDivStyleProps
 * @property {IDivStyle} style - The div style configuration object
 */
interface IDivStyleProps {
    style: IDivStyle;
}

/**
 * Helper function to extract field content from either direct property or fields object
 */
const getFieldContent = (style: any, fieldName: string): any => {
    // Check if it's a direct property
    if (style[fieldName] && typeof style[fieldName] === 'object' && 'content' in style[fieldName]) {
        return style[fieldName].content;
    }
    // Check in fields object
    if (style.fields && style.fields[fieldName]) {
        return style.fields[fieldName].content;
    }
    return null;
};

/**
 * DivStyle component renders a div container with optional styling and child elements.
 * Supports custom background, border, and text colors.
 * Uses Mantine Box component for flexibility.
 *
 * @component
 * @param {IDivStyleProps} props - Component props
 * @returns {JSX.Element} Rendered div with styled children
 */
const DivStyle: React.FC<IDivStyleProps> = ({ style }) => {
    const backgroundColor = getFieldContent(style, 'color_background');
    const borderColor = getFieldContent(style, 'color_border');
    const textColor = getFieldContent(style, 'color_text');
    const cssClass = style.css || getFieldContent(style, 'css') || '';
    const cssMobile = getFieldContent(style, 'css_mobile') || '';

    // Build inline styles for colors
    const inlineStyles: React.CSSProperties = {};
    if (backgroundColor) {
        inlineStyles.backgroundColor = backgroundColor;
    }
    if (borderColor) {
        inlineStyles.borderColor = borderColor;
        inlineStyles.borderWidth = '1px';
        inlineStyles.borderStyle = 'solid';
    }
    if (textColor) {
        inlineStyles.color = textColor;
    }

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Box 
            className={`${cssClass} ${cssMobile}`}
            style={inlineStyles}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
            ))}
        </Box>
    );
};

export default DivStyle;