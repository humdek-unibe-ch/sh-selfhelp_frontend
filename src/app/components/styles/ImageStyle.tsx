import React from 'react';
import { ImageStyle as ImageStyleType } from '@/types/api/styles.types';

interface ImageStyleProps {
    style: ImageStyleType;
}

const ImageStyle: React.FC<ImageStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Image Style: {style.img_src?.content} (Alt: {style.alt?.content})
        </div>
    );
};

export default ImageStyle;