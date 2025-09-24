import React from 'react';
import { Progress } from '@mantine/core';
import { IProgressStyle } from '../../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for ProgressStyle component
 */
/**
 * Props interface for IProgressStyle component
 */
interface IProgressStyleProps {
    style: IProgressStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ProgressStyle component renders a Mantine Progress component for displaying progress bars.
 * Supports customizable colors, sizes, radius, striped patterns, animations, and orientations.
 *
 * @component
 * @param {IProgressStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Progress with styled configuration
 */
const ProgressStyle: React.FC<IProgressStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const value = parseFloat((style as any).value?.content || '0');
    const color = style.mantine_color?.content || 'blue';
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const size = castMantineSize((style as any).mantine_size?.content);
    const striped = style.mantine_progress_striped?.content === '1';
    const animated = style.mantine_progress_animated?.content === '1';
    const transitionDuration = parseInt((style as any).mantine_progress_transition_duration?.content || '200');

    // Handle CSS field - use direct property from API response
    

    return (
        <Progress
            value={value}
            color={color}
            radius={radius === 'none' ? 0 : radius}
            size={size}
            striped={striped}
            animated={animated}
            transitionDuration={transitionDuration}
            {...styleProps} className={cssClass}
        />
    );

};

export default ProgressStyle;
