import React from 'react';
import { Avatar } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IAvatarStyle } from '../../../../../types/common/styles.types';

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
    const src = getFieldContent(style, 'src');
    const alt = getFieldContent(style, 'alt') || 'Avatar';
    const variant = getFieldContent(style, 'mantine_avatar_variant') || 'light';
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const radius = getFieldContent(style, 'mantine_radius') || '50%';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get initials from name or use fallback
    const name = getFieldContent(style, 'name') || getFieldContent(style, 'label');
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    if (use_mantine_style) {
        return (
            <Avatar
                src={src}
                alt={alt}
                variant={variant as any}
                size={size as any}
                radius={radius}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {initials}
            </Avatar>
        );
    }

    // Fallback to basic img/div when Mantine styling is disabled
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={cssClass}
                style={{
                    ...styleObj,
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                }}
            />
        );
    }

    // Text-based fallback
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#e3f2fd',
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1rem'
            }}
        >
            {initials}
        </div>
    );
};

export default AvatarStyle;

