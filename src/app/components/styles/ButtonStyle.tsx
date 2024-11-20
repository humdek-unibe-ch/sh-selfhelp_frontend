import React from 'react';
import { IButtonStyle } from '@/types/api/styles.types';

interface IButtonStyleProps {
    style: IButtonStyle;
}

const ButtonStyle: React.FC<IButtonStyleProps> = ({ style }) => {
    return (
        <button className={style.css}>
            {style.label.content}
        </button>
    );
};

export default ButtonStyle;