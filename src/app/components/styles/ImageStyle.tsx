import React from 'react';
import { IImageStyle } from '@/types/api/styles.types';

interface IImageStyleProps {
    style: IImageStyle;
}

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