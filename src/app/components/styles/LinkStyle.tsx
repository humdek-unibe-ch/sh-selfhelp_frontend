import React from 'react';
import { ILinkStyle } from '../../../types/common/styles.types';
import InternalLink from '../shared/InternalLink';

/**
 * Props interface for LinkStyle component
 * @interface ILinkStyleProps
 * @property {ILinkStyle} style - The link style configuration object
 */
interface ILinkStyleProps {
    style: ILinkStyle;
}

/**
 * LinkStyle component renders a link with the specified URL and styling.
 * Uses InternalLink component to handle both internal and external links appropriately.
 *
 * @component
 * @param {ILinkStyleProps} props - Component props
 * @returns {JSX.Element} Rendered link component with specified styling
 */
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