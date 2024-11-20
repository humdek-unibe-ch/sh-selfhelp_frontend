import React from 'react';
import { IMarkdownStyle } from '@/types/api/styles.types';

interface IMarkdownStyleProps {
    style: IMarkdownStyle;
}

const MarkdownStyle: React.FC<IMarkdownStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            {style.text_md.content}
        </div>
    );
};

export default MarkdownStyle;