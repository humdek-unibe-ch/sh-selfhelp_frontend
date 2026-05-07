import React from 'react';
import { SimpleGrid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { ISimpleGridStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SimpleGridStyle component
 * @interface ISimpleGridStyleProps
 * @property {ISimpleGridStyle} style - The simple grid style configuration object
 */
interface ISimpleGridStyleProps {
    style: ISimpleGridStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * Parse a `mantine_cols`-like field into a value Mantine v9 accepts:
 * - `"3"`           → `3` (fixed cols on every viewport)
 * - `{base:1, sm:2, lg:3}` → responsive object passed through
 * - `'{"base":1,"sm":2,"lg":3}'` (stringified) → parsed object
 * - `"xs:1,sm:2,md:3"` (legacy CSV) → parsed to object
 * Any malformed input falls back to `1` so mobile layouts never break.
 */
const parseResponsiveCols = (
    raw: string | number | Record<string, number> | undefined | null
): number | Record<string, number> => {
    if (raw === undefined || raw === null || raw === '') return 1;
    if (typeof raw === 'number') return raw || 1;
    if (typeof raw === 'object') return raw;

    const trimmed = raw.trim();

    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed) as Record<string, number>;
            if (parsed && typeof parsed === 'object') return parsed;
        } catch {
            /* fall through */
        }
    }

    if (trimmed.includes(':')) {
        const responsiveCols: Record<string, number> = {};
        trimmed.split(',').forEach(pair => {
            const [size, count] = pair.split(':');
            if (size && count) {
                const parsedCount = parseInt(count.trim(), 10);
                if (!Number.isNaN(parsedCount)) {
                    responsiveCols[size.trim()] = parsedCount;
                }
            }
        });
        if (Object.keys(responsiveCols).length > 0) return responsiveCols;
    }

    const parsedInt = parseInt(trimmed, 10);
    return Number.isNaN(parsedInt) ? 1 : parsedInt;
};

/**
 * SimpleGridStyle component renders a Mantine SimpleGrid component for responsive grid layouts.
 * Provides CSS Grid layout with responsive breakpoints and consistent spacing.
 *
 * Responsive behaviour:
 * - `mantine_cols` accepts a fixed number ("3") OR a JSON object
 *   ({"base":1,"sm":2,"lg":3}) for responsive layouts.
 * - Legacy `mantine_breakpoints` (CSV "xs:1,sm:2,md:3") is honoured as a
 *   fallback when `mantine_cols` is not set.
 *
 * @component
 * @param {ISimpleGridStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SimpleGrid with styled children
 */
const SimpleGridStyle: React.FC<ISimpleGridStyleProps> = ({ style, styleProps, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];

    const cols = style.mantine_cols?.content;
    const spacing = style.mantine_spacing?.content;
    const breakpoints = style.mantine_breakpoints?.content;
    const verticalSpacing = style.mantine_vertical_spacing?.content;
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    const gridCols: number | Record<string, number> = cols
        ? parseResponsiveCols(cols)
        : parseResponsiveCols(breakpoints);

    return (
        <SimpleGrid
            {...styleProps}
            cols={gridCols}
            spacing={spacing || 'sm'}
            verticalSpacing={verticalSpacing || 'sm'}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </SimpleGrid>
    );
};

export default SimpleGridStyle;
