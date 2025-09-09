import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
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
    const cols = parseInt(getFieldContent(style, 'mantine_cols') || '12');
    const gap = getFieldContent(style, 'mantine_gap') || 'md';
    const justify = getFieldContent(style, 'mantine_justify');
    const align = getFieldContent(style, 'mantine_align');
    const overflow = getFieldContent(style, 'mantine_grid_overflow') || 'visible';
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

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
