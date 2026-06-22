/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Space } from '@mantine/core';
import { type ISpaceStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SpaceStyle component
 * @interface ISpaceStyleProps
 * @property {ISpaceStyle} style - The space style configuration object
 */
/**
 * Props interface for ISpaceStyle component
 */
interface ISpaceStyleProps {
    style: ISpaceStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * SpaceStyle component renders a Mantine Space component for adding spacing.
 * Provides consistent spacing between elements without content.
 *
 * @component
 * @param {ISpaceStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Space component
 */
const SpaceStyle: React.FC<ISpaceStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values for Mantine Space props
    const size = style.shared_size?.content;
    const orientation = style.shared_orientation?.content;

    return (
        <Space
            w={orientation === 'horizontal' ? size : undefined}
            h={orientation !== 'horizontal' ? size : undefined}
            {...styleProps} className={cssClass}
        />
    );
};

export default SpaceStyle;
