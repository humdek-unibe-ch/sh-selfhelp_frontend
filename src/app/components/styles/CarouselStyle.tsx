import React from 'react';
import { ICarouselStyle } from '@/types/api/styles.types';

interface ICarouselStyleProps {
    style: ICarouselStyle;
}

const CarouselStyle: React.FC<ICarouselStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.sources.content.length} images
        </div>
    );
};

export default CarouselStyle;