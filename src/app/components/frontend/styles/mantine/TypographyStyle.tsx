import React from 'react';
import { Typography } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { ITypographyStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TypographyStyle component
 */
/**
 * Props interface for ITypographyStyle component
 */
interface ITypographyStyleProps {
    style: ITypographyStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * TypographyStyle component renders a Mantine Typography component for consistent typography styles.
 * Applies Mantine's typography styles to HTML content within child components.
 *
 * @component
 * @param {ITypographyStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Typography with child content
 */
const TypographyStyle: React.FC<ITypographyStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Typography {...styleProps} className={cssClass} style={styleObj}>
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Typography>
        );
    }

    // Return null when Mantine styling is disabled (no fallback needed)
    return null;
};

export default TypographyStyle;

