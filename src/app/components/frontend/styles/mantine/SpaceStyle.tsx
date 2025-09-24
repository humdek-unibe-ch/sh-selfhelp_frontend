import React from 'react';
import { Space } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { ISpaceStyle } from '../../../../../types/common/styles.types';

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
    styleProps: Record<string, any>;
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
    const size = style.mantine_size?.content;
    const direction = style.mantine_space_direction?.content;

    // Handle CSS field - use direct property from API response
    

    return (
        <Space
            w={direction === 'horizontal' ? size : undefined}
            h={direction === 'vertical' ? size : undefined}
            {...styleProps} className={cssClass}
        />
    );
};

export default SpaceStyle;
