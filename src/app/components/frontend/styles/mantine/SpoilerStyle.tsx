/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Spoiler } from '@mantine/core';
import { type ISpoilerStyle } from '../../../../../types/common/styles.types';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for SpoilerStyle component
 */
/**
 * Props interface for ISpoilerStyle component
 */
interface ISpoilerStyleProps {
    style: ISpoilerStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * SpoilerStyle component renders a Mantine Spoiler component for collapsible text.
 * Supports custom show/hide labels and maximum height configuration.
 *
 * @component
 * @param {ISpoilerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Spoiler with child content
 */
const SpoilerStyle: React.FC<ISpoilerStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const maxHeight = parseInt(style.web_height?.content || '100', 10) || 100;
    const showLabel = style.spoiler_show_label?.content || 'Show more';
    const hideLabel = style.spoiler_hide_label?.content || 'Hide';
    const color = style.color?.content || undefined;

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Spoiler
            maxHeight={maxHeight}
            showLabel={showLabel}
            hideLabel={hideLabel}
            styles={
                color
                    ? (theme) => ({ control: { color: theme.colors[color]?.[6] ?? color } })
                    : undefined
            }
            {...styleProps} className={cssClass}
            style={styleObj}
        >
                        {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Spoiler>
    );

};

export default SpoilerStyle;

