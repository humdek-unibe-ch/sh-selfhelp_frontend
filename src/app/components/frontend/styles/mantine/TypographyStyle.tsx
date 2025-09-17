import React from 'react';
import { Typography } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ITypographyStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TypographyStyle component
 */
interface ITypographyStyleProps {
    style: ITypographyStyle;
}

/**
 * TypographyStyle component renders a Mantine Typography component for consistent typography styles.
 * Applies Mantine's typography styles to HTML content within child components.
 *
 * @component
 * @param {ITypographyStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Typography with child content
 */
const TypographyStyle: React.FC<ITypographyStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Typography className={cssClass} style={styleObj}>
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

