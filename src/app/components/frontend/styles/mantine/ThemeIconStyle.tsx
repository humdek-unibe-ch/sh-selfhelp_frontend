import React from 'react';
import { ThemeIcon } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { castMantineRadius, castMantineSize, getFieldContent } from '../../../../../utils/style-field-extractor';
import { IThemeIconStyle } from '../../../../../types/common/styles.types';

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
    const variant = getFieldContent(style, 'mantine_variant') || 'filled';
    const size = castMantineSize(getFieldContent(style, 'mantine_size')) || 'md';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius')) || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');

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

