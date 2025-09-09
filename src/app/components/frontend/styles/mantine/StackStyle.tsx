import React from 'react';
import { Stack } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IStackStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for StackStyle component
 * @interface IStackStyleProps
 * @property {IStackStyle} style - The stack style configuration object
 */
interface IStackStyleProps {
    style: IStackStyle;
}

/**
 * StackStyle component renders a Mantine Stack component for vertical layouts.
 * Provides vertical stacking of elements with consistent spacing.
 *
 * @component
 * @param {IStackStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stack with styled children
 */
const StackStyle: React.FC<IStackStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Stack props
    const gap = getFieldContent(style, 'mantine_gap');
    const justify = getFieldContent(style, 'mantine_justify');
    const align = getFieldContent(style, 'mantine_align');
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    return (
        <Stack
            gap={gap || 'md'}
            justify={justify || undefined}
            align={align || undefined}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Stack>
    );
};

export default StackStyle;
