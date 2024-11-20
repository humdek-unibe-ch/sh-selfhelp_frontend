import React from 'react';
import { IContainerStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

interface IContainerStyleProps {
    style: IContainerStyle;
}

const ContainerStyle: React.FC<IContainerStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
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

export default ContainerStyle;