import React from 'react';
import { ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { getFieldContent, castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';
import { IActionIconStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for ActionIconStyle component
 */
interface IActionIconStyleProps {
    style: IActionIconStyle;
}

/**
 * ActionIconStyle component renders a Mantine ActionIcon component for interactive icon buttons.
 * Supports customizable variants, sizes, colors, loading states, icons, and link functionality.
 *
 * @component
 * @param {IActionIconStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ActionIcon with styled configuration
 */
const ActionIconStyle: React.FC<IActionIconStyleProps> = ({ style }) => {
    const router = useRouter();

    // Extract field values using the new unified field structure
    const variant = getFieldContent(style, 'mantine_variant') || 'subtle';
    const loading = getFieldContent(style, 'mantine_action_icon_loading') === '1';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // New fields for icon and link functionality
    const iconName = getFieldContent(style, 'mantine_left_icon');
    const url = getFieldContent(style, 'page_keyword');
    const is_link = getFieldContent(style, 'is_link');
    const open_in_new_tab = getFieldContent(style, 'open_in_new_tab');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : <span style={{ fontSize: '16px' }}>⚡</span>;

    // Build style object
    const styleObj: React.CSSProperties = {};
    console.log(style);

    const handleClick = (e?: React.MouseEvent) => {
        if (url && url !== '#') {
            // Check if URL is internal (relative or same origin)
            if (open_in_new_tab === '1') {
                window.open(url, '_blank');
                return;
            }
            const isInternal = url.startsWith('/') ||
                (typeof window !== 'undefined' && url.startsWith(window.location.origin));

            if (isInternal) {
                // Prevent default anchor behavior if this is called from an anchor tag
                if (e) {
                    e.preventDefault();
                }
                // Use Next.js router for internal navigation
                const path = url.startsWith('/') ? url : url.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = url;
            }
        }
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

    if (use_mantine_style) {
        return (
            <ActionIcon
                variant={variant as any}
                loading={loading}
                size={size}
                radius={radius}
                color={color}
                disabled={disabled || loading}
                className={cssClass}
                style={styleObj}
                component={is_link === '1' ? 'a' : 'button'}
                href={is_link === '1' ? url : undefined}
                onClick={handleClick}
                target={open_in_new_tab === '1' ? '_blank' : '_self'}
            >
                {loading ? null : icon}
            </ActionIcon>
        );
    }

    // Fallback to basic button/link when Mantine styling is disabled
    if (is_link === '1') {
        return (
            <a
                href={url && url !== '#' ? url : '#'}
                className={cssClass}
                target={open_in_new_tab === '1' ? '_blank' : '_self'}
                onClick={handleAnchorClick}
                style={{
                    ...styleObj,
                    textDecoration: 'none',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px',
                    cursor: disabled || loading ? 'not-allowed' : 'pointer',
                    opacity: disabled || loading ? 0.5 : 1,
                    display: 'inline-block'
                }}
            >
                {loading ? '...' : icon}
            </a>
        );
    }

    return (
        <button
            onClick={handleClick}
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
            {loading ? '...' : icon}
        </button>
    );
};

export default ActionIconStyle;
