import React from 'react';
import { IContainerStyle } from '@/types/api/styles.types';

interface IContainerStyleProps {
    style: IContainerStyle;
}

const ContainerStyle: React.FC<IContainerStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Container Style: {style.children.length} children
        </div>
    );
};

export default ContainerStyle;