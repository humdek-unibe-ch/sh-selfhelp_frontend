import React, { useState } from 'react';
import { Alert } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IAlertStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';
import { castMantineRadius } from '../../../../../utils/style-field-extractor';

/**
 * Props interface for AlertStyle component
 */
/**
 * Props interface for IAlertStyle component
 */
interface IAlertStyleProps {
    style: IAlertStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * AlertStyle component renders a Mantine Alert component
 * Supports different variants, colors, and close button functionality
 */
const AlertStyle: React.FC<IAlertStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const message = style.content?.content;
    const title = style.mantine_alert_title?.content;
    const variant = style.mantine_variant?.content || 'light';
    const color = style.mantine_color?.content || 'blue';
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const withCloseButton = style.mantine_with_close_button?.content === '1';
    const closeButtonLabel = style.close_button_label?.content || 'Close';
    const iconName = style.mantine_left_icon?.content;

    // Handle CSS field - use direct property from API response
    

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
            {...styleProps} className={cssClass}
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