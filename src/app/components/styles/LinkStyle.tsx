import React from 'react';
import { LinkStyle as LinkStyleType } from '@/types/api/styles.types';

interface LinkStyleProps {
    style: LinkStyleType;
}

const LinkStyle: React.FC<LinkStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Link Style: {style.label?.content} ({style.url?.content})
        </div>
    );
};

export default LinkStyle;