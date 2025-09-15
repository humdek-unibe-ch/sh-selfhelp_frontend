import React from 'react';
import { Progress } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';
import { IProgressStyle } from '../../../../../../types/common/styles.types';

/**
 * Props interface for ProgressStyle component
 */
interface IProgressStyleProps {
    style: IProgressStyle;
}

/**
 * ProgressStyle component renders a Mantine Progress component for displaying progress bars.
 * Supports customizable colors, sizes, radius, striped patterns, animations, and orientations.
 *
 * @component
 * @param {IProgressStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Progress with styled configuration
 */
const ProgressStyle: React.FC<IProgressStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const value = parseFloat(getFieldContent(style, 'value') || '0');
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const striped = getFieldContent(style, 'mantine_progress_striped') === '1';
    const animated = getFieldContent(style, 'mantine_progress_animated') === '1';
    const transitionDuration = parseInt(getFieldContent(style, 'mantine_progress_transition_duration') || '200');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    return (
        <Progress
            value={value}
            color={color}
            radius={radius === 'none' ? 0 : radius}
            size={size}
            striped={striped}
            animated={animated}
            transitionDuration={transitionDuration}
            className={cssClass}
        />
    );

};

export default ProgressStyle;
