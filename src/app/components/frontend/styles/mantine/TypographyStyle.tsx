/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Typography } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type ITypographyStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TypographyStyle component
 */
/**
 * Props interface for ITypographyStyle component
 */
interface ITypographyStyleProps {
    style: ITypographyStyle;
    styleProps: Record<string, string>;
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
    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Typography {...styleProps} className={cssClass} style={styleObj}>
            {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Typography>
    );
};

export default TypographyStyle;

