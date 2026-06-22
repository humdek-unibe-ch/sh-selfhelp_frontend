/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Grid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type IGridColumnStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GridColumnStyle component
 */
/**
 * Props interface for IGridColumnStyle component
 */
interface IGridColumnStyleProps {
    style: IGridColumnStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * Parse a `grid_span`-like value into the form Mantine v9 accepts:
 * - `"auto"` / `"content"` → passed through verbatim
 * - `"6"` → coerced to `6` (fixed span)
 * - `{base:12,sm:6}` / stringified `'{"base":12,"sm":6}'` → object
 * Anything malformed falls back to `'auto'`.
 */
const parseResponsiveSpan = (
    raw: string | number | Record<string, number | string> | undefined | null
): number | string | Record<string, number | string> => {
    if (raw === undefined || raw === null || raw === '') return 'auto';
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'object') return raw;

    const trimmed = raw.trim();
    if (trimmed === '') return 'auto';

    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed) as Record<string, number | string>;
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            /* fall through */
        }
    }

    if (trimmed === 'auto' || trimmed === 'content') return trimmed;

    const parsedInt = parseInt(trimmed, 10);
    return Number.isNaN(parsedInt) ? 'auto' : parsedInt;
};

/**
 * GridColumnStyle component renders a grid column within a Grid
 * Uses Mantine UI Grid.Col component.
 *
 * `grid_span` accepts a number ("6"), the keywords "auto"/"content",
 * or a JSON object ({"base":12,"sm":6,"md":4}) for responsive layouts.
 */
const GridColumnStyle: React.FC<IGridColumnStyleProps> = ({ style, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];

    const span = parseResponsiveSpan(style.grid_span?.content);
    const offset = parseInt(style.grid_offset?.content || '0');
    const order = style.grid_order?.content ? parseInt(style.grid_order.content) : undefined;
    const grow = style.grid_grow?.content === '1';
    const width = style.shared_width?.content;
    const height = style.shared_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    const colProps = {
        span: span as React.ComponentProps<typeof Grid.Col>['span'],
        ...(offset > 0 && { offset }),
        ...(order && { order }),
        ...(grow && { grow }),
        style: styleObj,
        className: cssClass
    };

    return (
        <Grid.Col {...colProps}>
            {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Grid.Col>
    );
};

export default GridColumnStyle;
