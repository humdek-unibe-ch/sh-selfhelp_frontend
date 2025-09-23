import React from 'react';
import { ActionIcon } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { IActionIconStyle } from '../../../../../types/common/styles.types';
import IconComponent from '../../../shared/common/IconComponent';
import { castMantineSize, castMantineRadius } from '../../../../../utils/style-field-extractor';

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
    const variant = style.mantine_variant?.content || 'subtle';
    const loading = style.mantine_action_icon_loading?.content === '1';
    const size = castMantineSize((style as any).mantine_size?.content);
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const color = style.mantine_color?.content || 'blue';
    const disabled = style.disabled?.content === '1';
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // New fields for icon and link functionality
    const iconName = style.mantine_left_icon?.content;
    const url = style.page_keyword?.content;
    const is_link = style.is_link?.content;
    const open_in_new_tab = style.open_in_new_tab?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : <span style={{ fontSize: '16px' }}>⚡</span>;

    // Build style object
    const styleObj: React.CSSProperties = {};

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
                radius={radius === 'none' ? 0 : radius}
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
