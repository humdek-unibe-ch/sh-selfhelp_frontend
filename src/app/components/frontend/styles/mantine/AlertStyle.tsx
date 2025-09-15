import React, { useState } from 'react';
import { Alert } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IAlertStyle } from '../../../../../types/common/styles.types';
import { getFieldContent, castMantineRadius } from '../../../../../utils/style-field-extractor';
import IconComponent from '../../../shared/common/IconComponent';

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
    const message = getFieldContent(style, 'content') || getFieldContent(style, 'value') || getFieldContent(style, 'message');
    const title = getFieldContent(style, 'mantine_alert_title');
    const variant = getFieldContent(style, 'mantine_variant') || 'light';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const withCloseButton = getFieldContent(style, 'mantine_with_close_button') === '1';
    const closeButtonLabel = getFieldContent(style, 'close_button_label') || 'Close';
    const iconName = getFieldContent(style, 'mantine_left_icon');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon section using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={20} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Handler for closing the notification
    const handleClose = () => {
        setIsVisible(false);
    };

    const [isVisible, setIsVisible] = useState(true);

    // Don't render anything if notification is closed
    if (!isVisible) {
        return null;
    }

    return (
        <Alert
            variant={variant as any}
            color={color}
            title={title}
            icon={icon}
            withCloseButton={withCloseButton}
            closeButtonLabel={closeButtonLabel}
            className={cssClass}
            radius={radius === 'none' ? 0 : radius}
            onClose={withCloseButton ? handleClose : undefined}
        >
            {message}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Alert>
    );
};

export default AlertStyle; 