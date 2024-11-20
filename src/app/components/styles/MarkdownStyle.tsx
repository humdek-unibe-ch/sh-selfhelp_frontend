import React from 'react';
import { IMarkdownStyle } from '@/types/api/styles.types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import InternalLink from './shared/InternalLink';

interface IMarkdownStyleProps {
    style: IMarkdownStyle;
}

const MarkdownStyle: React.FC<IMarkdownStyleProps> = ({ style }) => {
    // Component to adapt ReactMarkdown's link props to our InternalLink
    const MarkdownLink = ({ href, children, ...props }: any) => (
        <InternalLink href={href} className={style.css} {...props}>
            {children}
        </InternalLink>
    );

    return (
        <div className={style.css}>
            <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{
                    a: MarkdownLink
                }}
            >
                {style.text_md.content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownStyle;