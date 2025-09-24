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
 * SimpleGridStyle component renders a Mantine SimpleGrid component for responsive grid layouts.
 * Provides CSS Grid layout with responsive breakpoints and consistent spacing.
 *
 * @component
 * @param {ISimpleGridStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SimpleGrid with styled children
 */
const SimpleGridStyle: React.FC<ISimpleGridStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine SimpleGrid props
    const cols = style.mantine_cols?.content;
    const spacing = style.mantine_spacing?.content;
    const breakpoints = style.mantine_breakpoints?.content;
    const verticalSpacing = style.mantine_vertical_spacing?.content;
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Determine number of columns - use mantine_cols field first, fallback to breakpoints
    let gridCols: number | Record<string, number> = 1; // Default to 1 column

    // Primary: Use mantine_cols field if available
    if (cols) {
        gridCols = parseInt(cols) || 1;
    }
    // Fallback: Use breakpoints for responsive behavior if no cols specified
    else if (breakpoints) {
        // If breakpoints is a single value, use it as cols
        if (!breakpoints.includes(',')) {
            gridCols = parseInt(breakpoints) || 1;
        } else {
            // Parse responsive breakpoints format: "xs:1,sm:2,md:3,lg:4"
            const breakpointPairs = breakpoints.split(',');
            const responsiveCols: Record<string, number> = {};
            breakpointPairs.forEach(pair => {
                const [size, count] = pair.split(':');
                if (size && count) {
                    responsiveCols[size.trim()] = parseInt(count.trim()) || 1;
                }
            });
            gridCols = responsiveCols;
        }
    }

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
