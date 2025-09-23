import React from 'react';
import { Box } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IDivStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for DivStyle component
 * @interface IDivStyleProps
 * @property {IDivStyle} style - The div style configuration object
 */
interface IDivStyleProps {
    style: IDivStyle;
}

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
    const backgroundColor = style.color_background?.content;
    const borderColor = style.color_border?.content;
    const textColor = style.color_text?.content;
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

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
            className={cssClass}
            style={inlineStyles}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Box>
    );
};

export default DivStyle;