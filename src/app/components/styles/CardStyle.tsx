import React from 'react';
import { ICardStyle } from '@/types/api/styles.types';

interface ICardStyleProps {
    style: ICardStyle;
}

const CardStyle: React.FC<ICardStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.title.content}
        </div>
    );
};

export default CardStyle;