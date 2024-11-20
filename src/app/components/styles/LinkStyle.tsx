import React from 'react';
import { ILinkStyle } from '@/types/api/styles.types';
import InternalLink from './shared/InternalLink';

interface ILinkStyleProps {
    style: ILinkStyle;
}

const LinkStyle: React.FC<ILinkStyleProps> = ({ style }) => {
    return (
        <InternalLink 
            href={style.url.content}
            className={style.css}
        >
            {style.label.content}
        </InternalLink>
    );
};

export default LinkStyle;