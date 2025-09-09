import React from 'react';
import { Group } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
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
    const gap = getFieldContent(style, 'mantine_gap');
    const justify = getFieldContent(style, 'mantine_justify');
    const align = getFieldContent(style, 'mantine_align');
    const wrap = getFieldContent(style, 'mantine_group_wrap') === '1';
    const grow = getFieldContent(style, 'mantine_group_grow') === '1';
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

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
