import React from 'react';
import { MarkdownStyle as MarkdownStyleType } from '@/types/api/styles.types';

interface MarkdownStyleProps {
    style: MarkdownStyleType;
}

const MarkdownStyle: React.FC<MarkdownStyleProps> = ({ style }) => {
    return (
        <div className={style.css}>
            Markdown Style: {style.text_md?.content}
        </div>
    );
};

export default MarkdownStyle;