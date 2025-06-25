import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Text } from '@mantine/core';
import styles from './MarkdownStyle.module.css';
import { IMarkdownInlineStyle, IMarkdownStyle } from '../../../types/common/styles.types';
import { getFieldContent } from '../../../utils/style-field-extractor';

/**
 * Props interface for MarkdownStyle component
 * @interface IMarkdownStyleProps
 * @property {IMarkdownStyle | IMarkdownInlineStyle} style - The markdown style configuration object
 */
interface IMarkdownStyleProps {
    style: IMarkdownStyle | IMarkdownInlineStyle;
}

/**
 * MarkdownStyle component renders markdown content using react-markdown.
 * Supports both block-level markdown and inline markdown rendering.
 * Includes GitHub Flavored Markdown support for tables, strikethrough, etc.
 *
 * @component
 * @param {IMarkdownStyleProps} props - Component props
 * @returns {JSX.Element} Rendered markdown content
 */
const MarkdownStyle: React.FC<IMarkdownStyleProps> = ({ style }) => {
    const isInline = style.style_name === 'markdownInline';
    const content = isInline 
        ? getFieldContent(style, 'text_md_inline') 
        : getFieldContent(style, 'text_md');
    
    const cssClass = getFieldContent(style, 'css');

    // Return null if no content
    if (!content) {
        return null;
    }

    // For inline markdown, use Text component with markdown parsing
    if (isInline) {
        return (
            <Text 
                component="span" 
                className={`${cssClass} ${styles.markdownInline}`}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        // Override paragraph to render as span for inline
                        p: ({ children }) => <span>{children}</span>,
                        // Disable block-level elements for inline markdown
                        h1: ({ children }) => <strong>{children}</strong>,
                        h2: ({ children }) => <strong>{children}</strong>,
                        h3: ({ children }) => <strong>{children}</strong>,
                        h4: ({ children }) => <strong>{children}</strong>,
                        h5: ({ children }) => <strong>{children}</strong>,
                        h6: ({ children }) => <strong>{children}</strong>,
                        blockquote: ({ children }) => <span>{children}</span>,
                        ul: ({ children }) => <span>{children}</span>,
                        ol: ({ children }) => <span>{children}</span>,
                        li: ({ children }) => <span>{children}</span>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </Text>
        );
    }

    // For block-level markdown, use full markdown rendering
    return (
        <div className={`${cssClass} ${styles.markdown}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom component mappings for better styling
                    h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
                    h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
                    h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
                    h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
                    h5: ({ children }) => <h5 className={styles.h5}>{children}</h5>,
                    h6: ({ children }) => <h6 className={styles.h6}>{children}</h6>,
                    p: ({ children }) => <p className={styles.paragraph}>{children}</p>,
                    a: ({ children, href }) => (
                        <a href={href} className={styles.link} target="_blank" rel="noopener noreferrer">
                            {children}
                        </a>
                    ),
                    ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
                    ol: ({ children }) => <ol className={styles.orderedList}>{children}</ol>,
                    li: ({ children }) => <li className={styles.listItem}>{children}</li>,
                    blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
                    code: ({ children, ...props }: any) => {
                        const inline = props.inline;
                        return inline 
                            ? <code className={styles.inlineCode}>{children}</code>
                            : <pre className={styles.codeBlock}><code>{children}</code></pre>;
                    },
                    table: ({ children }) => <table className={styles.table}>{children}</table>,
                    thead: ({ children }) => <thead className={styles.tableHead}>{children}</thead>,
                    tbody: ({ children }) => <tbody className={styles.tableBody}>{children}</tbody>,
                    tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
                    th: ({ children }) => <th className={styles.tableHeader}>{children}</th>,
                    td: ({ children }) => <td className={styles.tableCell}>{children}</td>,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownStyle;