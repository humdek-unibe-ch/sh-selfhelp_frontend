/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Avatar } from '@mantine/core';
import { type IAvatarStyle } from '../../../../../types/common/styles.types';
import { type TMantineAvatarVariant, type TMantineSize } from '../../../../../types/mantine/common.types';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for AvatarStyle component
 */
/**
 * Props interface for IAvatarStyle component
 */
interface IAvatarStyleProps {
    style: IAvatarStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * AvatarStyle component renders a Mantine Avatar component for user profile images.
 * Supports various variants, sizes, and image sources.
 *
 * @component
 * @param {IAvatarStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Avatar with styled configuration
 */
const AvatarStyle: React.FC<IAvatarStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const src = style.img_src?.content;
    const alt = style.alt?.content || 'Avatar';
    const iconName = style.web_left_icon?.content;
    const name = style.name?.content?.trim();
    const customInitials = style.web_avatar_initials?.content || 'U';
    const variant = style.web_variant?.content || 'light';
    const size = style.size?.content || 'md';
    const radius = style.radius?.content || '50%';
    const color = style.color?.content || 'blue';
    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};


    // Check if src is a text name (not a URL)
    const _isUrl = src && (src.startsWith('http') || src.startsWith('https') || src.includes('.'));

    // Determine avatar content with priority: URL > name (auto-initials) > icon > custom initials
    const avatarSrc = src ? getAssetUrl(src) : null;
    const useName = !avatarSrc && !!name;
    const avatarIcon = !avatarSrc && !useName && iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    let avatarContent;
    if (avatarSrc || useName) {
        // image (src) or Mantine-derived initials (name) — no manual content.
        avatarContent = null;
    } else if (avatarIcon) {
        // no src/name but icon is set - show icon
        avatarContent = avatarIcon;
    } else {
        // no src, no name, no icon - generate initials from custom initials field
        avatarContent = customInitials ? customInitials.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    }

    return (
        <Avatar
            src={avatarSrc}
            alt={alt}
            name={useName ? name : undefined}
            variant={variant as TMantineAvatarVariant}
            size={size as TMantineSize}
            radius={radius === 'none' ? 0 : radius}
            color={color}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {avatarContent}
        </Avatar>
    );
};

export default AvatarStyle;

