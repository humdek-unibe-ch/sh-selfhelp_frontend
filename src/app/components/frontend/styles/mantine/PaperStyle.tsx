import React from 'react';
import { Paper } from '@mantine/core';
import { castMantineRadius, getFieldContent } from '../../../../../utils/style-field-extractor';
import { IPaperStyle } from '../../../../../types/common/styles.types';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for PaperStyle component
 */
interface IPaperStyleProps {
    style: IPaperStyle;
}

/**
 * PaperStyle component renders a Mantine Paper component for elevated surfaces.
 * Supports shadow, radius, padding, and border configurations.
 *
 * @component
 * @param {IPaperStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Paper with styled configuration
 */
const PaperStyle: React.FC<IPaperStyleProps> = ({ style }) => {

    // Extract Mantine-specific props
    const shadow = getFieldContent(style, 'mantine_paper_shadow') || 'sm';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const px = getFieldContent(style, 'mantine_px') || 'md';
    const py = getFieldContent(style, 'mantine_py') || 'md';
    const withBorder = getFieldContent(style, 'mantine_border') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    console.log(shadow, radius, px, py, withBorder);

    return (
        <Paper
            shadow={shadow === 'none' ? undefined : shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            p={px === 'none' ? 0 : px}
            px={px === 'none' ? 0 : px}
            py={py === 'none' ? 0 : py}
            withBorder={withBorder}
            className={cssClass}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Paper>
    );
};

export default PaperStyle;
