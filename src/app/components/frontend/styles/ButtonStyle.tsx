import React, { useState } from 'react';
import { Button, Modal, Group, Text } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IButtonStyle } from '../../../../types/common/styles.types';
import IconComponent from '../../shared/common/IconComponent';
import parse from "html-react-parser";
import DOMPurify from 'dompurify';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 * @property {Record<string, any>} styleProps - Additional style properties for spacing
 * @property {string} cssClass - CSS class name for the component
 */
interface IButtonStyleProps {
    style: IButtonStyle;
    styleProps: Record<string, any>;
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
    const url = style.page_keyword?.content;
    const variant = style.mantine_variant?.content;
    const color = style.mantine_color?.content;
    const size = style.mantine_size?.content;
    const radius = style.mantine_radius?.content;
    const fullWidth = style.mantine_fullwidth?.content;
    const leftIconName = style.mantine_left_icon?.content;
    const rightIconName = style.mantine_right_icon?.content;
    const compact = style.mantine_compact?.content;
    const disabled = style.disabled?.content;
    const is_link = style.is_link?.content;
    const auto_contrast = style.mantine_auto_contrast?.content;
    const open_in_new_tab = style.open_in_new_tab?.content;
    const use_mantine_style = style.use_mantine_style?.content;
    const label_cancel = style.label_cancel?.content;
    const confirmation_title = style.confirmation_title?.content;
    const confirmation_continue = style.confirmation_continue?.content;
    const confirmation_message = parse(DOMPurify.sanitize((style as any).confirmation_message?.content));

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

    // Handle anchor click for internal links
    const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (url && url !== '#') {
            const isInternal = url.startsWith('/') ||
                (typeof window !== 'undefined' && url.startsWith(window.location.origin));

            if (isInternal && open_in_new_tab !== '1') {
                e.preventDefault();
                handleClick();
            }
            // For external URLs or new tab, let the anchor handle it normally
        }
    };

    // Confirmation Modal
    return (
        <>
            {use_mantine_style === '1' ? (
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
            ) : (
                // Regular React button/link when Mantine is disabled
                is_link === '1' ? (
                    <a
                        href={url && url !== '#' ? url : '#'}
                        className={cssClass}
                        target={open_in_new_tab === '1' ? '_blank' : '_self'}
                        onClick={handleAnchorClick}
                    >
                        {label}
                    </a>
                ) : (
                    <button
                        onClick={handleClick}
                        className={cssClass}
                        disabled={disabled === '1'}
                    >
                        {label}
                    </button>
                )
            )}

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