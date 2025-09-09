import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IGridColumnStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GridColumnStyle component
 */
interface IGridColumnStyleProps {
    style: IGridColumnStyle;
}

/**
 * GridColumnStyle component renders a grid column within a Grid
 * Uses Mantine UI Grid.Col component
 */
const GridColumnStyle: React.FC<IGridColumnStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const span = getFieldContent(style, 'mantine_grid_span') || 'auto';
    const offset = parseInt(getFieldContent(style, 'mantine_grid_offset') || '0');
    const order = getFieldContent(style, 'mantine_grid_order') ? parseInt(getFieldContent(style, 'mantine_grid_order')!) : undefined;
    const grow = getFieldContent(style, 'mantine_grid_grow') === '1';
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    const colProps: any = {
        span: span === 'auto' || span === 'content' ? span : parseInt(span),
        ...(offset > 0 && { offset }),
        ...(order && { order }),
        ...(grow && { grow }),
        style: styleObj,
        className: cssClass
    };

    return (
        <Grid.Col {...colProps}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Grid.Col>
    );
};

export default GridColumnStyle;
