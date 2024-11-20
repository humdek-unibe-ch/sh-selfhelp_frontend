import React from 'react';
import { CardStyle as CardStyleType } from '@/types/api/styles.types';

interface CardStyleProps {
    style: CardStyleType;
}

const CardStyle: React.FC<CardStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Card Style: {style.title?.content}
        </div>
    );
};

export default CardStyle;