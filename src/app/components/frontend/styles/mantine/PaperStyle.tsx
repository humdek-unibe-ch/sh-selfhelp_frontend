import React from 'react';
import { Paper } from '@mantine/core';
import { IPaperStyle } from '../../../../../types/common/styles.types';
import { castMantineRadius } from '../../../../../utils/style-field-extractor';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for PaperStyle component
 */
/**
 * Props interface for IPaperStyle component
 */
interface IPaperStyleProps {
    style: IPaperStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * PaperStyle component renders a Mantine Paper component for elevated surfaces.
 * Supports shadow, radius, padding, and border configurations.
 *
 * @component
 * @param {IPaperStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Paper with styled configuration
 */
const PaperStyle: React.FC<IPaperStyleProps> = ({ style, styleProps, cssClass }) => {

    // Extract Mantine-specific props
    const shadow = style.mantine_paper_shadow?.content || 'sm';
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const px = style.mantine_px?.content || 'md';
    const py = style.mantine_py?.content || 'md';
    const withBorder = style.mantine_border?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Paper
            shadow={shadow === 'none' ? undefined : shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            p={px === 'none' ? 0 : px}
            px={px === 'none' ? 0 : px}
            py={py === 'none' ? 0 : py}
            withBorder={withBorder}
            {...styleProps} className={cssClass}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Paper>
    );
};

export default PaperStyle;
