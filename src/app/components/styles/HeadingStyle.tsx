import React from 'react';
import { IHeadingStyle } from '../../../types/common/styles.types';

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
    const HeadingTag = `h${style.level.content}` as keyof JSX.IntrinsicElements;
    
    return (
        <HeadingTag className={style.css}>
            {style.title?.content}
        </HeadingTag>
    );
};

export default HeadingStyle;