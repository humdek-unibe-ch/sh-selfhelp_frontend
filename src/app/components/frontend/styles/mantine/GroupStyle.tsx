import React from 'react';
import { Group } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IGroupStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for GroupStyle component
 * @interface IGroupStyleProps
 * @property {IGroupStyle} style - The group style configuration object
 */
interface IGroupStyleProps {
    style: IGroupStyle;
}

/**
 * GroupStyle component renders a Mantine Group component for horizontal layouts.
 * Provides horizontal grouping of elements with consistent spacing.
 *
 * @component
 * @param {IGroupStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Group with styled children
 */
const GroupStyle: React.FC<IGroupStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Group props
    const gap = style.mantine_gap?.content;
    const justify = style.mantine_justify?.content;
    const align = style.mantine_align?.content;
    const wrap = style.mantine_group_wrap?.content === '1';
    const grow = style.mantine_group_grow?.content === '1';
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    return (
        <Group
            gap={gap || 'md'}
            justify={justify || undefined}
            align={align || undefined}
            wrap={wrap ? 'wrap' : undefined}
            grow={grow}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Group>
    );
};

export default GroupStyle;
