import React from 'react';
import { IHeadingStyle } from '../../../../types/common/styles.types';

/**
 * Props interface for HeadingStyle component
 * @interface IHeadingStyleProps
 * @property {IHeadingStyle} style - The heading style configuration object
 */
interface IHeadingStyleProps {
    style: IHeadingStyle;
}

/**
 * HeadingStyle component renders a heading element (h1-h6) with specified styling.
 * Supports different heading levels and custom styling through CSS classes.
 *
 * @component
 * @param {IHeadingStyleProps} props - Component props
 * @returns {JSX.Element} Rendered heading with specified styling and level
 */
const HeadingStyle: React.FC<IHeadingStyleProps> = ({ style }) => {
    // Get heading level with fallback to h2 if undefined or invalid
    const level = style.level?.content || '2';
    const validLevel = ['1', '2', '3', '4', '5', '6'].includes(level) ? level : '2';
    const HeadingTag = `h${validLevel}` as keyof JSX.IntrinsicElements;
    const title = style.title?.content;
    const cssClass = "section-" + style.id + " " + (style.css ?? '');
    
    return (
        <HeadingTag className={cssClass}>
            {title}
        </HeadingTag>
    );
};

export default HeadingStyle;