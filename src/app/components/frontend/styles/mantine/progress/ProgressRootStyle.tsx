/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Progress } from '@mantine/core';
import { type IProgressRootStyle } from '../../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../../utils/style-field-extractor';
import BasicStyle from '../../BasicStyle';

/**
 * Props interface for ProgressRootStyle component
 */
/**
 * Props interface for IProgressRootStyle component
 */
interface IProgressRootStyleProps {
    style: IProgressRootStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * ProgressRootStyle component renders a Mantine Progress.Root component for compound progress bars.
 * Supports multiple progress sections and customizable orientation.
 *
 * @component
 * @param {IProgressRootStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Progress.Root with styled configuration and child sections
 */
const ProgressRootStyle: React.FC<IProgressRootStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const size = castMantineSize(style.shared_size?.content);
    const radius = castMantineRadius(style.shared_radius?.content);
    const autoContrast = style.web_progress_auto_contrast?.content === '1';

    // Handle CSS field - use direct property from API response
    

    // Render children sections
    const children = style.children?.map((childStyle) => (
        <BasicStyle key={childStyle.id} style={childStyle} />
    )) || [];

    return (
        <Progress.Root
            size={size}
            radius={radius === 'none' ? 0 : radius}
            autoContrast={autoContrast}
            {...styleProps} className={cssClass}
        >
            {children}
        </Progress.Root>
    );
};

export default ProgressRootStyle;
