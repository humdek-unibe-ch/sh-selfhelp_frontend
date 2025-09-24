import React from 'react';
import { Image } from '@mantine/core';
import { IImageStyle } from '../../../../types/common/styles.types';
import { getAssetUrl } from '../../../../utils/asset-url.utils';
import { castMantineRadius } from '../../../../utils/style-field-extractor';

/**
 * Props interface for ImageStyle component
 * @interface IImageStyleProps
 * @property {IImageStyle} style - The image style configuration object containing source, alt text, and CSS
 */
/**
 * Props interface for IImageStyle component
 */
interface IImageStyleProps {
    style: IImageStyle;
    styleProps: Record<string, any>;
    cssClass: string;
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
const ImageStyle: React.FC<IImageStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    // Support multiple field names for compatibility with different data structures
    const rawSrc = style.img_src?.content;

    // Use getAssetUrl which now properly handles external URLs
    const src = rawSrc ? getAssetUrl(rawSrc) : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';

    const alt = style.alt?.content;
    const title = style.title?.content;
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;
    const fit = style.mantine_image_fit?.content || 'contain';
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const use_mantine_style = style.use_mantine_style?.content === '1';

    

    if (use_mantine_style) {
        return (
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                fit={fit as 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'}
                radius={radius === 'none' ? 0 : radius}
                {...styleProps} className={cssClass}
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
            width={width}
            height={height}
            className={cssClass}
        />
    );
};

export default ImageStyle;