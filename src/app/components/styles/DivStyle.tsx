import React from 'react';
import { DivStyle as DivStyleType } from '@/types/api/styles.types';

interface DivStyleProps {
    style: DivStyleType;
}

const DivStyle: React.FC<DivStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Div Style: {style.children.length} children
        </div>
    );
};

export default DivStyle;