import React from 'react';
import { ButtonStyle as ButtonStyleType } from '@/types/api/styles.types';

interface ButtonStyleProps {
    style: ButtonStyleType;
}

const ButtonStyle: React.FC<ButtonStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Button Style: {style.label?.content}
        </div>
    );
};

export default ButtonStyle;