import React from 'react';
import BasicStyle from './BasicStyle';
import { ICarouselStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for CarouselStyle component
 * @interface ICarouselStyleProps
 * @property {ICarouselStyle} style - The carousel style configuration object
 */
interface ICarouselStyleProps {
    style: ICarouselStyle;
}

/**
 * CarouselStyle component renders a carousel/slider with child elements.
 * Provides a container for displaying content in a slideshow format.
 * Uses BasicStyle for rendering nested style elements.
 *
 * @component
 * @param {ICarouselStyleProps} props - Component props
 * @returns {JSX.Element} Rendered carousel with styled children
 */
const CarouselStyle: React.FC<ICarouselStyleProps> = ({ style }) => {
    return (
        <div className={style.css ?? ''}>
            {style.children?.map((child, index) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </div>
    );
};

export default CarouselStyle;