import React from 'react';
import { Button } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IButtonStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for ButtonStyle component
 */
interface IButtonStyleProps {
    style: IButtonStyle;
}

/**
 * ButtonStyle component renders a Mantine Button component for various button types and actions.
 * Supports customizable variants, sizes, colors, and optional icons with full styling control.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Button with styled configuration
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const label = getFieldContent(style, 'label') || 'Button';
    const variant = getFieldContent(style, 'mantine_variant') || 'filled';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const fullWidth = getFieldContent(style, 'mantine_fullwidth') === '1';
    const compact = getFieldContent(style, 'mantine_compact') === '1';
    const autoContrast = getFieldContent(style, 'mantine_auto_contrast') === '1';
    const isLink = getFieldContent(style, 'is_link') === '1';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const openInNewTab = getFieldContent(style, 'open_in_new_tab') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon sections using IconComponent
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : undefined;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : undefined;

    if (use_mantine_style) {
        return (
            <Button
                variant={variant as any}
                color={color}
                size={size}
                radius={radius}
                leftSection={leftSection}
                rightSection={rightSection}
                fullWidth={fullWidth}
                compact={compact}
                autoContrast={autoContrast}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            >
                {label}
            </Button>
        );
    }

    // Fallback to basic button when Mantine styling is disabled
    return (
        <button
            className={cssClass}
            disabled={disabled}
            style={{
                ...styleObj,
                padding: compact ? '4px 8px' : '8px 16px',
                borderRadius: '4px',
                border: variant === 'outline' ? '1px solid #ccc' : 'none',
                backgroundColor: variant === 'filled' ? color : 'transparent',
                color: variant === 'filled' ? 'white' : color,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                width: fullWidth ? '100%' : 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            {leftSection}
            {label}
            {rightSection}
        </button>
    );
};

export default ButtonStyle;
