/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState } from 'react';
import { Alert } from '@mantine/core';
import parse from 'html-react-parser';
import BasicStyle from '../BasicStyle';
import { type IAlertStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';
import { castMantineRadius } from '../../../../../utils/style-field-extractor';
import { sanitizeHtmlForParsing } from '../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for AlertStyle component
 */
/**
 * Props interface for IAlertStyle component
 */
interface IAlertStyleProps {
    style: IAlertStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * AlertStyle component renders a Mantine Alert component
 * Supports different variants, colors, and close button functionality
 */
const AlertStyle: React.FC<IAlertStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const message = style.content?.content;
    // Render the body as sanitized HTML (XSS- + hydration-safe via the shared
    // sanitizer) instead of a raw string, so authored markup — e.g. the
    // `{{system.maintenance_message}}` operator note that arrives wrapped in
    // `<p>…</p>` — renders as formatted text rather than literal tags.
    const renderedMessage =
        typeof message === 'string' && message.trim() !== ''
            ? parse(sanitizeHtmlForParsing(message))
            : null;
    const title = style.alert_title?.content;
    const variant = style.web_variant?.content || 'light';
    const color = style.shared_color?.content || 'blue';
    const radius = castMantineRadius(style.shared_radius?.content);
    const withCloseButton = style.web_with_close_button?.content === '1';
    const iconName = style.web_left_icon?.content;

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
            variant={variant}
            color={color}
            title={title}
            icon={icon}
            withCloseButton={withCloseButton}
            closeButtonLabel="Close"
            {...styleProps} className={cssClass}
            radius={radius === 'none' ? 0 : radius}
            onClose={withCloseButton ? handleClose : undefined}
        >
            {renderedMessage}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Alert>
    );
};

export default AlertStyle; 