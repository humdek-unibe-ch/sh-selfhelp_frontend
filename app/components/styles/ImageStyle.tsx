import React from 'react';
import { IImageStyle } from '@/types/api/styles.types';

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
 * Falls back to empty string for alt text if not provided.
 *
 * @component
 * @param {IImageStyleProps} props - Component props
 * @returns {JSX.Element} Rendered image with specified source and styling
 */
const ImageStyle: React.FC<IImageStyleProps> = ({ style }) => {
    return (
        <img 
            src={style.img_src.content} 
            alt={style.alt?.content || ''} 
            className={style.css}
        />
    );
};

export default ImageStyle;