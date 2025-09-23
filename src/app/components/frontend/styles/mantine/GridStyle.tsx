import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IGridStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GridStyle component
 */
interface IGridStyleProps {
    style: IGridStyle;
}

/**
 * GridStyle component renders a responsive grid layout
 * Uses Mantine UI Grid component with 12-column system
 */
const GridStyle: React.FC<IGridStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const cols = parseInt((style as any).mantine_cols?.content || '12');
    const gap = style.mantine_gap?.content || 'md';
    const justify = style.mantine_justify?.content;
    const align = style.mantine_align?.content;
    const overflow = style.mantine_grid_overflow?.content || 'visible';
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;
    if (overflow) styleObj.overflow = overflow;

    const gridProps: any = {
        columns: cols,
        gutter: gap,
        ...(justify && { justify }),
        ...(align && { align }),
        style: styleObj,
        className: cssClass
    };

    return (
        <Grid {...gridProps}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Grid>
    );
};

export default GridStyle;
