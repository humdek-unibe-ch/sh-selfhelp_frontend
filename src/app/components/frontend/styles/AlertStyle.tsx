import React from 'react';
import { Alert } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IAlertStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../utils/style-field-extractor';
import IconComponent from '../../shared/common/IconComponent';

/**
 * Props interface for AlertStyle component
 */
interface IAlertStyleProps {
    style: IAlertStyle;
}

/**
 * AlertStyle component renders a Mantine Alert component
 * Supports different variants, colors, and close button functionality
 */
const AlertStyle: React.FC<IAlertStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const message = getFieldContent(style, 'value') || getFieldContent(style, 'message');
    const title = getFieldContent(style, 'mantine_alert_title');
    const variant = getFieldContent(style, 'mantine_variant') || 'light';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const withCloseButton = getFieldContent(style, 'mantine_alert_with_close_button') === '1';
    const iconName = getFieldContent(style, 'mantine_left_icon');
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon section using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={20} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    if (use_mantine_style) {
        return (
            <Alert
                variant={variant as any}
                color={color}
                title={title}
                icon={icon}
                radius={radius}
                withCloseButton={withCloseButton}
                className={cssClass}
                style={styleObj}
            >
                {message}
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </Alert>
        );
    }

    // Fallback to basic alert when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
                color: '#333'
            }}
            role="alert"
        >
            {title && (
                <div style={{
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    fontSize: '16px'
                }}>
                    {title}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
                <div style={{ flex: 1 }}>
                    {message}
                    {children.map((childStyle, index) => (
                        childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                    ))}
                </div>
                {withCloseButton && (
                    <button
                        type="button"
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                        aria-label="Close"
                        onClick={() => {
                            // Handle close functionality here
                        }}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default AlertStyle; 