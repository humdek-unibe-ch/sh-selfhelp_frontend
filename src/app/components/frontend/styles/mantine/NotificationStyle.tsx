import React, { useState } from 'react';
import { Notification } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import { INotificationStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for NotificationStyle component
 */
/**
 * Props interface for INotificationStyle component
 */
interface INotificationStyleProps {
    style: INotificationStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * NotificationStyle component renders a Mantine Notification component for alerts and messages.
 * Supports various colors, loading states, and close button configuration.
 *
 * @component
 * @param {INotificationStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Notification with styled configuration
 */
const NotificationStyle: React.FC<INotificationStyleProps> = ({ style, styleProps, cssClass }) => {
    // State to control notification visibility
    const [isVisible, setIsVisible] = useState(true);

    // Extract field values using the new unified field structure
    const title = style.title?.content;
    const message = style.content?.content || 'Notification message';
    const color = style.mantine_color?.content || 'blue';
    const loading = style.mantine_notification_loading?.content === '1';
    const withCloseButton = style.mantine_notification_with_close_button?.content === '1';
    const withBorder = style.mantine_border?.content === '1';
    const radius = style.mantine_radius?.content || 'sm';
    const selectedIcon = style.mantine_left_icon?.content;

    // Handler for closing the notification
    const handleClose = () => {
        setIsVisible(false);
    };

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon - use selected icon or fall back to color-based default
    const getIcon = () => {
        // If user selected an icon, use it
        if (selectedIcon) {
            return selectedIcon;
        }

        // Otherwise use color-based default
        switch (color) {
            case 'red': return 'icon-alert-triangle';
            case 'green': return 'icon-check-circle';
            case 'yellow': return 'icon-alert-circle';
            case 'blue': return 'icon-info';
            default: return 'icon-bell';
        }
    };

    const icon = selectedIcon ? <IconComponent iconName={selectedIcon} size={16} /> : undefined;

    // Don't render anything if notification is closed
    if (!isVisible) {
        return null;
    }

    return (
        <Notification
            title={title}
            color={color}
            loading={loading}
            withCloseButton={withCloseButton}
            withBorder={withBorder}
            radius={radius === 'none' ? 0 : radius}
            {...styleProps} className={cssClass}
            style={styleObj}
            icon={icon}            
            onClose={withCloseButton ? handleClose : undefined}
        >
            {message}
        </Notification>
    );
};

export default NotificationStyle;

