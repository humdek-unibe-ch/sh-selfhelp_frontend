/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React, { useCallback, useState } from 'react';
import { Image } from '@mantine/core';
import { type IImageStyle } from '../../../../types/common/styles.types';
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
    styleProps: Record<string, unknown>;
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
    const width = style.web_width?.content;
    const height = style.web_height?.content;
    const fit = style.web_image_fit?.content || 'contain';
    const radius = castMantineRadius((style as { web_radius?: { content?: string } }).web_radius?.content);
    const rawFallback = style.fallback_src?.content;
    const fallbackSrc = rawFallback ? getAssetUrl(rawFallback) : undefined;

    // Mantine's `fallbackSrc` only swaps on the React `onError` event. Under
    // Next.js SSR a fast 404 can fire `error` on the server-rendered <img>
    // BEFORE hydration attaches that handler, so the swap never happens and the
    // broken image sticks. Detect an already-broken image when the node mounts
    // (post-hydration) and swap to the fallback explicitly; `onError` still
    // covers failures that happen after hydration.
    const [failed, setFailed] = useState(false);
    const detectBroken = useCallback((node: HTMLImageElement | null) => {
        if (node && node.complete && node.naturalWidth === 0) {
            setFailed(true);
        }
    }, []);
    const shownSrc = failed && fallbackSrc ? fallbackSrc : src;

    return (
            <Image
                ref={detectBroken}
                src={shownSrc}
                alt={alt}
                fallbackSrc={fallbackSrc}
                onError={() => { if (fallbackSrc) setFailed(true); }}
                width={width}
                height={height}
                fit={fit as 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'}
                radius={radius === 'none' ? 0 : radius}
                {...styleProps} className={cssClass}
                title={title}
            />
        );
};

export default ImageStyle;