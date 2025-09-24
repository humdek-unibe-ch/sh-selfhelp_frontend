import React from 'react';
import { Stack } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IStackStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for StackStyle component
 * @interface IStackStyleProps
 * @property {IStackStyle} style - The stack style configuration object
 */
/**
 * Props interface for IStackStyle component
 */
interface IStackStyleProps {
    style: IStackStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * StackStyle component renders a Mantine Stack component for vertical layouts.
 * Provides vertical stacking of elements with consistent spacing.
 *
 * @component
 * @param {IStackStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Stack with styled children
 */
const StackStyle: React.FC<IStackStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Stack props
    const gap = style.mantine_gap?.content;
    const justify = style.mantine_justify?.content;
    const align = style.mantine_align?.content;
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    return (
        <Stack
            gap={gap || 'md'}
            justify={justify || undefined}
            align={align || undefined}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Stack>
    );
};

export default StackStyle;
