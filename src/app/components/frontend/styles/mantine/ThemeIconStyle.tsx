import React from 'react';
import { ThemeIcon } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
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
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const iconName = getFieldContent(style, 'mantine_left_icon') || getFieldContent(style, 'icon') || 'icon-star';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon component
    const icon = <IconComponent iconName={iconName} size={16} />;

    if (use_mantine_style) {
        return (
            <ThemeIcon
                variant={variant as any}
                size={size as any}
                radius={radius === 'none' ? 0 : radius}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {icon}
            </ThemeIcon>
        );
    }

    // Fallback to basic styled div with icon when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size === 'xs' ? '24px' : size === 'sm' ? '32px' : size === 'lg' ? '48px' : size === 'xl' ? '64px' : '40px',
                height: size === 'xs' ? '24px' : size === 'sm' ? '32px' : size === 'lg' ? '48px' : size === 'xl' ? '64px' : '40px',
                borderRadius: radius === 'xs' ? '2px' : radius === 'sm' ? '4px' : radius === 'lg' ? '8px' : radius === 'xl' ? '12px' : '6px',
                backgroundColor: variant === 'filled' ? '#1976d2' : variant === 'light' ? '#e3f2fd' : 'transparent',
                color: variant === 'filled' ? 'white' : '#1976d2',
                border: variant === 'outline' ? '1px solid #1976d2' : 'none'
            }}
        >
            {icon}
        </div>
    );
};

export default ThemeIconStyle;

