/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { SimpleGrid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type ISimpleGridStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SimpleGridStyle component
 * @interface ISimpleGridStyleProps
 * @property {ISimpleGridStyle} style - The simple grid style configuration object
 */
interface ISimpleGridStyleProps {
    style: ISimpleGridStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/** Parse a column-count field ("3") into a positive integer, or undefined. */
const toCol = (raw: string | undefined): number | undefined => {
    if (!raw) return undefined;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) || n <= 0 ? undefined : n;
};

/**
 * SimpleGridStyle renders a Mantine SimpleGrid (equal-width responsive columns).
 *
 * Columns are cross-platform: `shared_cols` is the base column count (read on
 * web AND mobile). The web-only `web_cols_sm`/`web_cols_md`/`web_cols_lg` add
 * responsive overrides per Mantine breakpoint; when none are set a plain number
 * is passed. Horizontal spacing is `shared_gap`, row spacing is
 * `shared_vertical_spacing`.
 *
 * @component
 * @param {ISimpleGridStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SimpleGrid with styled children
 */
const SimpleGridStyle: React.FC<ISimpleGridStyleProps> = ({ style, styleProps, cssClass }) => {
    const children = Array.isArray(style.children) ? style.children : [];

    const baseCols = toCol(style.shared_cols?.content) ?? 3;
    const sm = toCol(style.web_cols_sm?.content);
    const md = toCol(style.web_cols_md?.content);
    const lg = toCol(style.web_cols_lg?.content);
    const gap = style.shared_gap?.content;
    const verticalSpacing = style.shared_vertical_spacing?.content;
    const width = style.shared_width?.content;
    const height = style.shared_height?.content;

    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // A plain number unless the author set at least one responsive override.
    const cols: number | Record<string, number> =
        sm === undefined && md === undefined && lg === undefined
            ? baseCols
            : {
                base: baseCols,
                ...(sm !== undefined ? { sm } : {}),
                ...(md !== undefined ? { md } : {}),
                ...(lg !== undefined ? { lg } : {}),
            };

    return (
        <SimpleGrid
            {...styleProps}
            cols={cols}
            spacing={gap || 'md'}
            verticalSpacing={verticalSpacing || 'md'}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </SimpleGrid>
    );
};

export default SimpleGridStyle;
