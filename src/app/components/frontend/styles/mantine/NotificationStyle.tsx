import React from 'react';
import { Notification } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { INotificationStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for NotificationStyle component
 */
interface INotificationStyleProps {
    style: INotificationStyle;
}

/**
 * NotificationStyle component renders a Mantine Notification component for alerts and messages.
 * Supports various colors, loading states, and close button configuration.
 *
 * @component
 * @param {INotificationStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Notification with styled configuration
 */
const NotificationStyle: React.FC<INotificationStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const title = getFieldContent(style, 'title');
    const message = getFieldContent(style, 'content') || getFieldContent(style, 'label') || 'Notification message';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const loading = getFieldContent(style, 'mantine_notification_loading') === '1';
    const withCloseButton = getFieldContent(style, 'mantine_notification_with_close_button') === '1';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon based on color/type
    const getIcon = () => {
        switch (color) {
            case 'red': return 'icon-alert-triangle';
            case 'green': return 'icon-check-circle';
            case 'yellow': return 'icon-alert-circle';
            case 'blue': return 'icon-info';
            default: return 'icon-bell';
        }
    };

    const icon = <IconComponent iconName={getIcon()} size={16} />;

    if (use_mantine_style) {
        return (
            <Notification
                title={title}
                color={color}
                loading={loading}
                withCloseButton={withCloseButton}
                radius={radius === 'none' ? 0 : radius}
                className={cssClass}
                style={styleObj}
                icon={icon}
            >
                {message}
            </Notification>
        );
    }

    // Fallback to basic styled div when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                padding: '16px',
                borderRadius: radius === 'xs' ? '2px' : radius === 'sm' ? '4px' : radius === 'lg' ? '8px' : radius === 'xl' ? '12px' : '6px',
                border: `1px solid ${color}`,
                backgroundColor: color === 'red' ? '#ffebee' : color === 'green' ? '#e8f5e8' : color === 'yellow' ? '#fff8e1' : '#e3f2fd',
                color: color === 'red' ? '#c62828' : color === 'green' ? '#2e7d32' : color === 'yellow' ? '#f57c00' : '#1565c0',
                position: 'relative'
            }}
        >
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '16px',
                    height: '16px',
                    border: '2px solid currentColor',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }} />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flexShrink: 0 }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    {title && (
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                            {title}
                        </div>
                    )}
                    <div>{message}</div>
                </div>
                {withCloseButton && (
                    <button
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: 'currentColor',
                            fontSize: '18px',
                            lineHeight: '1'
                        }}
                        onClick={() => {/* Handle close */}}
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

export default NotificationStyle;

