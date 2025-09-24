import React from 'react';
import { Anchor } from '@mantine/core';
import { ILinkStyle } from '../../../../types/common/styles.types';
import { hasFieldValue } from '../../../../utils/style-field-extractor';

/**
 * Props interface for LinkStyle component
 * @interface ILinkStyleProps
 * @property {ILinkStyle} style - The link style configuration object
 */
/**
 * Props interface for ILinkStyle component
 */
interface ILinkStyleProps {
    style: ILinkStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * LinkStyle component renders an anchor/link element with specified styling.
 * Supports external links and target options.
 *
 * @component
 * @param {ILinkStyleProps} props - Component props
 * @returns {JSX.Element} Rendered link with specified styling and target
 */
const LinkStyle: React.FC<ILinkStyleProps> = ({ style, styleProps, cssClass }) => {
    const label = style.label?.content;
    const url = style.url?.content;
    const openInNewTab = hasFieldValue(style, 'open_in_new_tab');
    

    return (
        <Anchor 
            href={url}
            target={openInNewTab ? '_blank' : '_self'}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            {...styleProps} className={cssClass}
        >
            {label}
        </Anchor>
    );
};

export default LinkStyle;