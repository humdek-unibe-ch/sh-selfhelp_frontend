import React from 'react';
import { SimpleGrid } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISimpleGridStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SimpleGridStyle component
 * @interface ISimpleGridStyleProps
 * @property {ISimpleGridStyle} style - The simple grid style configuration object
 */
interface ISimpleGridStyleProps {
    style: ISimpleGridStyle;
}

/**
 * SimpleGridStyle component renders a Mantine SimpleGrid component for responsive grid layouts.
 * Provides CSS Grid layout with responsive breakpoints and consistent spacing.
 *
 * @component
 * @param {ISimpleGridStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine SimpleGrid with styled children
 */
const SimpleGridStyle: React.FC<ISimpleGridStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine SimpleGrid props
    const spacing = getFieldContent(style, 'mantine_spacing');
    const breakpoints = getFieldContent(style, 'mantine_breakpoints');
    const verticalSpacing = getFieldContent(style, 'mantine_vertical_spacing');
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Parse breakpoints - SimpleGrid expects number of columns or responsive object
    let cols: number | Record<string, number> = 1; // Default to 1 column
    if (breakpoints) {
        // If breakpoints is a single value, use it as cols
        if (!breakpoints.includes(',')) {
            cols = parseInt(breakpoints) || 1;
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
            cols = responsiveCols;
        }
    }

    return (
        <SimpleGrid
            cols={cols}
            spacing={spacing || 'md'}
            verticalSpacing={verticalSpacing || spacing || 'md'}
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
