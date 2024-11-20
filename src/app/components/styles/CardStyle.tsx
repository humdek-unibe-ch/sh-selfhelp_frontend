import React from 'react';
import { ICardStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

interface ICardStyleProps {
    style: ICardStyle;
}

const CardStyle: React.FC<ICardStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            <h3>{style.title.content}</h3>
            {
                style.children?.map(
                    (childStyle, index) => (
                        childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
                    )
                )
            }
        </div>
    );
};

export default CardStyle;