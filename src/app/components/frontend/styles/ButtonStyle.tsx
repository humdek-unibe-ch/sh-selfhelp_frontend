/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useState } from 'react';
import { Button, Modal, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { type IButtonStyle } from '../../../../types/common/styles.types';
import IconComponent from '../../shared/common/IconComponent';
import parse from "html-react-parser";
import DOMPurify from 'isomorphic-dompurify';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 * @property {Record<string, any>} styleProps - Additional style properties for spacing
 * @property {string} cssClass - CSS class name for the component
 */
interface IButtonStyleProps {
    style: IButtonStyle;
    styleProps: Record<string, unknown>;
    cssClass: string;
}

/**
 * ButtonStyle component renders a button element with optional styling and actions.
 * Supports different button types and URL navigation.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling and action
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style, styleProps, cssClass }) => {
    const router = useRouter();
    const label = style.label?.content;
    // Internal page link takes precedence over the external URL.
    const url = style.page_keyword?.content || style.url?.content;
    const variant = style.variant?.content;
    const color = style.color?.content;
    const size = style.size?.content;
    const radius = style.radius?.content;
    const fullWidth = style.full_width?.content;
    const leftIconName = style.web_left_icon?.content;
    const rightIconName = style.web_right_icon?.content;
    const compact = style.web_compact?.content;
    const disabled = style.disabled?.content;
    const is_link = style.is_link?.content;
    const auto_contrast = style.web_auto_contrast?.content;
    const open_in_new_tab = style.open_in_new_tab?.content;    const label_cancel = style.label_cancel?.content;
    const confirmation_title = style.confirmation_title?.content;
    const confirmation_continue = style.confirmation_continue?.content;
    const confirmation_message = parse(DOMPurify.sanitize((style as { confirmation_message?: { content?: string } }).confirmation_message?.content as string));

    // Modal state
    const [confirmationOpened, setConfirmationOpened] = useState(false);

    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : null;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : null;

    // Execute the actual button action (navigation or URL opening)
    const executeAction = () => {
        if (url && url !== '#') {
            // Check if URL is internal (relative or same origin)
            if (open_in_new_tab === '1') {
                window.open(url, '_blank');
                return;
            }
            const isInternal = url.startsWith('/') ||
                (typeof window !== 'undefined' && url.startsWith(window.location.origin));

            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = url.startsWith('/') ? url : url.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = url;
            }
        }
    };

    const handleClick = (e?: React.MouseEvent) => {
        // Check if confirmation is required
        if (confirmation_title && confirmation_message) {
            // Prevent default if this is from an anchor tag
            if (e) {
                e.preventDefault();
            }
            setConfirmationOpened(true);
            return;
        }

        // Execute action directly if no confirmation needed
        executeAction();
    };

    // Confirmation Modal
    return (
        <>
            <Button
                {...styleProps}
                variant={variant}
                color={color}
                size={compact === '1' ? 'compact-' + size : size}
                radius={radius === 'none' ? 0 : radius}
                className={cssClass}
                fullWidth={fullWidth === '1'}
                leftSection={leftSection}
                rightSection={rightSection}
                disabled={disabled === '1'}
                autoContrast={auto_contrast === '1'}
                component={is_link === '1' ? 'a' : 'button'}
                href={is_link === '1' ? url : undefined}
                onClick={handleClick}
                target={open_in_new_tab === '1' ? '_blank' : '_self'}
            >
                {label}
            </Button>

            <Modal
                opened={confirmationOpened}
                onClose={() => setConfirmationOpened(false)}
                title={confirmation_title}
                centered
                size="md"
            >
                {confirmation_message}
                <Group justify="flex-end">
                    <Button
                        variant="default"
                        onClick={() => setConfirmationOpened(false)}
                    >
                        {label_cancel || 'Cancel'}
                    </Button>
                    <Button
                        onClick={() => {
                            setConfirmationOpened(false);
                            executeAction();
                        }}
                    >
                        {confirmation_continue || 'Continue'}
                    </Button>
                </Group>
            </Modal>
        </>
    );
};

export default ButtonStyle;