import React from 'react';
import { ContainerStyle as ContainerStyleType } from '@/types/api/styles.types';

interface ContainerStyleProps {
    style: ContainerStyleType;
}

const ContainerStyle: React.FC<ContainerStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Container Style: {style.children.length} children
        </div>
    );
};

export default ContainerStyle;