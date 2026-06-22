/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Progress } from '@mantine/core';
import { type IProgressStyle } from '../../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for ProgressStyle component
 */
/**
 * Props interface for IProgressStyle component
 */
interface IProgressStyleProps {
    style: IProgressStyle;
    styleProps: Record<string, string>;
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
    const value = parseFloat(style.value?.content || '0');
    const color = style.color?.content || 'blue';
    const radius = castMantineRadius(style.radius?.content);
    const size = castMantineSize(style.size?.content);
    const striped = style.web_progress_striped?.content === '1';
    const animated = style.web_progress_animated?.content === '1';
    const transitionDuration = parseInt(style.web_progress_transition_duration?.content || '200');

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
