import React from 'react';
import { IDivStyle } from '@/types/api/styles.types';

interface IDivStyleProps {
    style: IDivStyle;
}

const DivStyle: React.FC<IDivStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.children.length} children
        </div>
    );
};

export default DivStyle;