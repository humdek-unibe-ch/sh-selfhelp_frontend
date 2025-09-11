import React from 'react';
import { ActionIcon } from '@mantine/core';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IActionIconStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ActionIconStyle component
 */
interface IActionIconStyleProps {
    style: IActionIconStyle;
}

/**
 * ActionIconStyle component renders a Mantine ActionIcon component for interactive icon buttons.
 * Supports customizable variants, sizes, colors, and loading states.
 *
 * @component
 * @param {IActionIconStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ActionIcon with styled configuration
 */
const ActionIconStyle: React.FC<IActionIconStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const variant = getFieldContent(style, 'mantine_variant') || 'subtle';
    const loading = getFieldContent(style, 'mantine_action_icon_loading') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <ActionIcon
                variant={variant as any}
                loading={loading}
                size={size}
                radius={radius}
                color={color}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            >
                {/* Default icon - can be customized via icon field in future */}
                <span style={{ fontSize: '16px' }}>⚡</span>
            </ActionIcon>
        );
    }

    // Fallback to basic button when Mantine styling is disabled
    return (
        <button
            className={cssClass}
            disabled={disabled || loading}
            style={{
                ...styleObj,
                border: 'none',
                borderRadius: '4px',
                padding: '8px',
                cursor: disabled || loading ? 'not-allowed' : 'pointer',
                opacity: disabled || loading ? 0.5 : 1
            }}
        >
            {loading ? '...' : '⚡'}
        </button>
    );
};

export default ActionIconStyle;
