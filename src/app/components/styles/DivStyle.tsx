import React from 'react';
import { IDivStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

interface IDivStyleProps {
    style: IDivStyle;
}

const DivStyle: React.FC<IDivStyleProps> = ({ style }) => {
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

export default DivStyle;