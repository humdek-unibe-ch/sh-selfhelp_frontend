import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Text } from '@mantine/core';
import styles from './MarkdownStyle.module.css';
import { IMarkdownStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for MarkdownStyle component
 * @interface IMarkdownStyleProps
 * @property {IMarkdownStyle} style - The markdown style configuration object
 */
interface IMarkdownStyleProps {
    style: IMarkdownStyle;
}

/**
 * MarkdownStyle component renders markdown content using react-markdown.
 * Includes GitHub Flavored Markdown support for tables, strikethrough, etc.
 *
 * @component
 * @param {IMarkdownStyleProps} props - Component props
 * @returns {JSX.Element} Rendered markdown content
 */
const MarkdownStyle: React.FC<IMarkdownStyleProps> = ({ style }) => {
    const content = style.text_md?.content;
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Return null if no content
    if (!content) {
        return null;
    }

    // Render block-level markdown
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