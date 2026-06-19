/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Flex } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type IFlexStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for FlexStyle component
 * @interface IFlexStyleProps
 * @property {IFlexStyle} style - The flex style configuration object
 * @property {Record<string, any>} styleProps - Additional style properties for spacing
 * @property {string} cssClass - CSS class name for the component
 */
interface IFlexStyleProps {
    style: IFlexStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * FlexStyle component renders a Mantine Flex component for flexible layouts.
 * Provides CSS flexbox layout capabilities with responsive design support.
 *
 * @component
 * @param {IFlexStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Flex with styled children
 */
const FlexStyle: React.FC<IFlexStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Flex props
    const gap = style.shared_gap?.content;
    const justify = style.shared_justify?.content;
    const align = style.shared_align?.content;
    const direction = style.shared_direction?.content;
    const wrap = style.shared_wrap?.content;
    const width = style.web_width?.content;
    const height = style.web_height?.content;

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    return (
        <Flex
            {...styleProps}
            gap={gap || 'md'}
            justify={justify || undefined}
            align={align || undefined}
            direction={direction || 'row'}
            wrap={wrap || undefined}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Flex>
    );
};

export default FlexStyle;
