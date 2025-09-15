import React from 'react';
import { Progress, Tooltip } from '@mantine/core';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import { IProgressSectionStyle } from '../../../../../../types/common/styles.types';
import BasicStyle from '../../BasicStyle';

/**
 * Props interface for ProgressSectionStyle component
 */
interface IProgressSectionStyleProps {
    style: IProgressSectionStyle;
}

/**
 * ProgressSectionStyle component renders a Mantine Progress.Section component for individual progress sections.
 * Supports customizable values, colors, striped patterns, animations, labels, and tooltips.
 *
 * @component
 * @param {IProgressSectionStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Progress.Section with styled configuration and optional tooltip
 */
const ProgressSectionStyle: React.FC<IProgressSectionStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const value = parseFloat(getFieldContent(style, 'value') || '0');
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const striped = getFieldContent(style, 'mantine_progress_striped') === '1';
    const animated = getFieldContent(style, 'mantine_progress_animated') === '1';
    const label = getFieldContent(style, 'label');
    const tooltipLabel = getFieldContent(style, 'mantine_tooltip_label');
    const tooltipPosition = getFieldContent(style, 'mantine_tooltip_position') || 'top';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Render children content (for label or other nested content)
    const children = style.children?.map((childStyle) => (
        <BasicStyle key={childStyle.id} style={childStyle} />
    )) || [];

    // Create the progress section content
    const sectionContent = (
        <Progress.Section
            value={value}
            color={color}
            striped={striped}
            animated={animated}
            className={cssClass}
        >
            {label && <Progress.Label>{label}</Progress.Label>}
            {children}
        </Progress.Section>
    );

    // Wrap in tooltip if tooltip label is provided
    if (tooltipLabel && tooltipLabel.trim()) {
        return (
            <Tooltip
                label={tooltipLabel}
                position={tooltipPosition as any}
            >
                {sectionContent}
            </Tooltip>
        );
    }

    return sectionContent;

};

export default ProgressSectionStyle;
