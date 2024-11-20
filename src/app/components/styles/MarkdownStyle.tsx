import React from 'react';
import { IMarkdownStyle } from '@/types/api/styles.types';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import InternalLink from './shared/InternalLink';

/**
 * Props interface for MarkdownStyle component
 * @interface IMarkdownStyleProps
 * @property {IMarkdownStyle} style - The markdown style configuration object
 */
interface IMarkdownStyleProps {
    style: IMarkdownStyle;
}

/**
 * MarkdownStyle component renders markdown content with support for raw HTML.
 * Uses ReactMarkdown for parsing and rendering markdown content, and
 * InternalLink for handling links within the markdown content.
 *
 * @component
 * @param {IMarkdownStyleProps} props - Component props
 * @returns {JSX.Element} Rendered markdown content with specified styling
 */
const MarkdownStyle: React.FC<IMarkdownStyleProps> = ({ style }) => {
    /**
     * Adapter component to convert ReactMarkdown's link props to InternalLink props
     * @param {Object} props - Link props from ReactMarkdown
     * @returns {JSX.Element} InternalLink component with adapted props
     */
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