import React from 'react';
import { ThemeIcon } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { IThemeIconStyle } from '../../../../../types/common/styles.types';
import { castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';

/**
 * Props interface for ThemeIconStyle component
 */
interface IThemeIconStyleProps {
    style: IThemeIconStyle;
}

/**
 * ThemeIconStyle component renders a Mantine ThemeIcon component for themed icon containers.
 * Provides consistent theming for icons with various variants and colors.
 *
 * @component
 * @param {IThemeIconStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ThemeIcon with icon content
 */
const ThemeIconStyle: React.FC<IThemeIconStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const variant = style.mantine_variant?.content || 'filled';
    const size = castMantineSize((style as any).mantine_size?.content) || 'md';
    const radius = castMantineRadius((style as any).mantine_radius?.content) || 'sm';
    const color = style.mantine_color?.content || 'blue';
    const leftIconName = style.mantine_left_icon?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon component
    const icon = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : null;

    return (
        <ThemeIcon
            variant={variant}
            size={size}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            className={cssClass}
            style={styleObj}
        >
            {icon}
        </ThemeIcon>
    );
};

export default ThemeIconStyle;

