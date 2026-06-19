/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type IGridStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GridStyle component
 */
/**
 * Props interface for IGridStyle component
 */
interface IGridStyleProps {
    style: IGridStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * GridStyle component renders a responsive grid layout
 * Uses Mantine UI Grid component with 12-column system
 */
const GridStyle: React.FC<IGridStyleProps> = ({ style, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const cols = parseInt(style.web_cols?.content || '12');
    const gap = style.shared_gap?.content || 'md';
    const justify = style.shared_justify?.content;
    const align = style.shared_align?.content;
    const overflow = style.web_grid_overflow?.content || 'visible';
    const width = style.web_width?.content;
    const height = style.web_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;
    if (overflow) styleObj.overflow = overflow;

    const gridProps = {
        columns: cols,
        gutter: gap,
        ...(justify && { justify }),
        ...(align && { align }),
        style: styleObj,
        className: cssClass
    };

    return (
        <Grid {...gridProps}>
            {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Grid>
    );
};

export default GridStyle;
