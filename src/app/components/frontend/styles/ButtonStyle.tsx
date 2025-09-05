import React from 'react';
import { Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import { IButtonStyle } from '../../../../types/common/styles.types';
import IconComponent from '../../shared/common/IconComponent';

/**
 * Props interface for ButtonStyle component
 * @interface IButtonStyleProps
 * @property {IButtonStyle} style - The button style configuration object
 */
interface IButtonStyleProps {
    style: IButtonStyle;
}

/**
 * ButtonStyle component renders a button element with optional styling and actions.
 * Supports different button types and URL navigation.
 *
 * @component
 * @param {IButtonStyleProps} props - Component props
 * @returns {JSX.Element} Rendered button with specified styling and action
 */
const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    const router = useRouter();
    const label = getFieldContent(style, 'label');
    const url = getFieldContent(style, 'url');
    const variant = getFieldContent(style, 'mantine_variant');
    const color = getFieldContent(style, 'mantine_color');
    const size = getFieldContent(style, 'mantine_slider_size');
    const radius = getFieldContent(style, 'mantine_slider_radius');
    const fullWidth = getFieldContent(style, 'mantine_fullwidth');
    const leftIconName = getFieldContent(style, 'mantine_btn_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_btn_right_icon');
    const compact = getFieldContent(style, 'mantine_compact');
    const disabled = getFieldContent(style, 'disabled');
    const is_link = getFieldContent(style, 'is_link');
    const auto_contrast = getFieldContent(style, 'mantine_auto_contrast');
    const open_in_new_tab = getFieldContent(style, 'open_in_new_tab');

    // Handle CSS field - use direct property from API response
    const cssClass = style.css ?? '';

    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : null;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : null;

    const handleClick = () => {
        if (url && url !== '#') {
            console.log('url', url);
            // Check if URL is internal (relative or same origin)
            if (open_in_new_tab === '1') {
                window.open(url, '_blank');
                return;
            }
            const isInternal = url.startsWith('/') ||
                (typeof window !== 'undefined' && url.startsWith(window.location.origin));

            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = url.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = url;
            }
        }
    };

    console.log(style);

    return (
        <Button
            variant={variant}
            color={color}
            size={compact === '1' ? 'compact-' + size : size}
            radius={radius}
            onClick={is_link === '1' ? undefined : handleClick}
            className={cssClass}
            fullWidth={fullWidth === '1'}
            leftSection={leftSection}
            rightSection={rightSection}
            disabled={disabled === '1'}
            autoContrast={auto_contrast === '1'}
            component={is_link === '1' ? 'a' : 'button'}
            href={is_link === '1' ? url : undefined}
            target={open_in_new_tab === '1' ? '_blank' : '_self'}
        >
            {label}
        </Button>
    );
};

export default ButtonStyle;