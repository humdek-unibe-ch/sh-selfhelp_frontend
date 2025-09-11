import React from 'react';
import { Avatar } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IAvatarStyle } from '../../../../../types/common/styles.types';
import { TMantineAvatarVariant, TMantineSize } from '../../../../../types/mantine/common.types';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for AvatarStyle component
 */
interface IAvatarStyleProps {
    style: IAvatarStyle;
}

/**
 * AvatarStyle component renders a Mantine Avatar component for user profile images.
 * Supports various variants, sizes, and image sources.
 *
 * @component
 * @param {IAvatarStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Avatar with styled configuration
 */
const AvatarStyle: React.FC<IAvatarStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const src = getFieldContent(style, 'img_src');
    const alt = getFieldContent(style, 'alt') || 'Avatar';
    const iconName = getFieldContent(style, 'mantine_left_icon');
    const customInitials = getFieldContent(style, 'mantine_avatar_initials') || 'U';
    const variant = getFieldContent(style, 'mantine_avatar_variant') || 'light';
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const radius = getFieldContent(style, 'mantine_radius') || '50%';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get initials from name, label, or src (if src is text-based)
    const name = getFieldContent(style, 'name') || getFieldContent(style, 'label');

    // Check if src is a text name (not a URL)
    const isUrl = src && (src.startsWith('http') || src.startsWith('https') || src.includes('.'));
    const textSource = !isUrl && src ? src : name;

    const initials = textSource ? textSource.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    // Determine avatar content with priority: URL > text initials > icon > custom initials
    const avatarSrc = src ? getAssetUrl(src) : null;
    const avatarIcon = !src && iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    let avatarContent;
    if (avatarSrc) {
        // src is a URL - image will be shown, no content needed
        avatarContent = null;
    } else if (src && !isUrl) {
        // src is text (not URL) - show generated initials from text
        avatarContent = initials;
    } else if (avatarIcon) {
        // no src but icon is set - show icon
        avatarContent = avatarIcon;
    } else {
        // no src, no icon - generate initials from custom initials field
        avatarContent = customInitials ? customInitials.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }

    if (use_mantine_style) {
        return (
            <Avatar
                src={avatarSrc}
                alt={alt}
                variant={variant as TMantineAvatarVariant}
                size={size as TMantineSize}
                radius={radius}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {avatarContent}
            </Avatar>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};

export default AvatarStyle;

