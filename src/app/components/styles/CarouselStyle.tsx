import React from 'react';
import { CarouselStyle as CarouselStyleType } from '@/types/api/styles.types';

interface CarouselStyleProps {
    style: CarouselStyleType;
}

const CarouselStyle: React.FC<CarouselStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Carousel Style: {style.sources?.content.length} images
        </div>
    );
};

export default CarouselStyle;