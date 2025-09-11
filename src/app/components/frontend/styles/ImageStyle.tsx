import React from 'react';
import { Image } from '@mantine/core';
import { IImageStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineRadius } from '../../../../utils/style-field-extractor';

/**
 * Props interface for ImageStyle component
 * @interface IImageStyleProps
 * @property {IImageStyle} style - The image style configuration object containing source, alt text, and CSS
 */
interface IImageStyleProps {
    style: IImageStyle;
}

/**
 * ImageStyle component renders a Mantine Image component with specified styling.
 * Handles image source URL, alt text for accessibility, and various object fit options.
 * Falls back to regular img element when Mantine styling is disabled.
 *
 * @component
 * @param {IImageStyleProps} props - Component props
 * @returns {JSX.Element} Rendered image with specified source and styling
 */
const ImageStyle: React.FC<IImageStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const src = getFieldContent(style, 'mantine_image_src') || getFieldContent(style, 'img_src') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    const alt = getFieldContent(style, 'mantine_image_alt') || getFieldContent(style, 'alt');
    const title = getFieldContent(style, 'title');
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');
    const fit = getFieldContent(style, 'mantine_image_fit') || 'contain';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    if (use_mantine_style) {
        return (
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                fit={fit as 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'}
                radius={radius}
                className={cssClass}
                style={styleObj}
                title={title}
            />
        );
    }

    // Fallback to basic img element when Mantine styling is disabled
    return (
        <img
            src={src}
            alt={alt}
            title={title}
            className={cssClass}
            style={{
                ...styleObj,
                objectFit: fit as any,
                borderRadius: radius === 'xs' ? '2px' :
                           radius === 'sm' ? '4px' :
                           radius === 'md' ? '8px' :
                           radius === 'lg' ? '12px' :
                           radius === 'xl' ? '16px' : '0px'
            }}
        />
    );
};

export default ImageStyle;