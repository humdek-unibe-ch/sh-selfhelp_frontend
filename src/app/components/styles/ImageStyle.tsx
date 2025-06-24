import React from 'react';
import { IImageStyle } from '../../../types/common/styles.types';

/**
 * Props interface for ImageStyle component
 * @interface IImageStyleProps
 * @property {IImageStyle} style - The image style configuration object containing source, alt text, and CSS
 */
interface IImageStyleProps {
    style: IImageStyle;
}

/**
 * ImageStyle component renders an image element with specified styling.
 * Handles image source URL and optional alt text for accessibility.
 * Falls back to placeholder image if source is not provided.
 *
 * @component
 * @param {IImageStyleProps} props - Component props
 * @returns {JSX.Element} Rendered image with specified source and styling
 */
const ImageStyle: React.FC<IImageStyleProps> = ({ style }) => {
    const src = style.img_src?.content || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    const alt = style.alt?.content || '';
    const title = style.title?.content || '';

    return (
        <img 
            src={src} 
            alt={alt}
            title={title}
            className={style.css || ''}
            width={style.width?.content || undefined}
            height={style.height?.content || undefined}
        />
    );
};

export default ImageStyle;