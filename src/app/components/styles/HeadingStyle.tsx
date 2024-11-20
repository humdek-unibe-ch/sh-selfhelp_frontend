import React from 'react';
import { IHeadingStyle } from '@/types/api/styles.types';

interface IHeadingStyleProps {
    style: IHeadingStyle;
}

const HeadingStyle: React.FC<IHeadingStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.title.content}
        </div>
    );
};

export default HeadingStyle;