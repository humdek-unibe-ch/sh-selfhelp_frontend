import React from 'react';
import { TypographyStylesProvider } from '@mantine/core';
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
 * TypographyStyle component renders a Mantine TypographyStylesProvider component for consistent typography.
 * Applies Mantine's typography styles to all child components.
 *
 * @component
 * @param {ITypographyStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine TypographyStylesProvider with child content
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
            <TypographyStylesProvider className={cssClass} style={styleObj}>
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </TypographyStylesProvider>
        );
    }

    // Fallback to basic div when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </div>
    );
};

export default TypographyStyle;

