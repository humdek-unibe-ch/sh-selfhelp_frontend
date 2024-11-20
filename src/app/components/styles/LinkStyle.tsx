import React from 'react';
import { ILinkStyle } from '@/types/api/styles.types';

interface ILinkStyleProps {
    style: ILinkStyle;
}

const LinkStyle: React.FC<ILinkStyleProps> = ({ style }) => {
    return (
        <a 
            href={style.url.content} 
            className={style.css}
            target={style.open_in_new_tab?.content === 'true' ? '_blank' : undefined}
            rel={style.open_in_new_tab?.content === 'true' ? 'noopener noreferrer' : undefined}
        >
            {style.label.content}
        </a>
    );
};

export default LinkStyle;