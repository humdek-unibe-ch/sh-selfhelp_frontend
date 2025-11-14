import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IGridColumnStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GridColumnStyle component
 */
/**
 * Props interface for IGridColumnStyle component
 */
interface IGridColumnStyleProps {
    style: IGridColumnStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * GridColumnStyle component renders a grid column within a Grid
 * Uses Mantine UI Grid.Col component
 */
const GridColumnStyle: React.FC<IGridColumnStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const span = style.mantine_grid_span?.content || 'auto';
    const offset = parseInt((style as any).mantine_grid_offset?.content || '0');
    const order = style.mantine_grid_order?.content ? parseInt((style as any).mantine_grid_order?.content!) : undefined;
    const grow = style.mantine_grid_grow?.content === '1';
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    const colProps: any = {
        span: span,
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
