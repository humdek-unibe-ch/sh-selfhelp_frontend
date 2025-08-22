import React from 'react';
import { Anchor } from '@mantine/core';
import { ILinkStyle } from '../../../../types/common/styles.types';
import { getFieldContent, hasFieldValue } from '../../../../utils/style-field-extractor';

/**
 * Props interface for LinkStyle component
 * @interface ILinkStyleProps
 * @property {ILinkStyle} style - The link style configuration object
 */
interface ILinkStyleProps {
    style: ILinkStyle;
}

/**
 * LinkStyle component renders an anchor/link element with specified styling.
 * Supports external links and target options.
 *
 * @component
 * @param {ILinkStyleProps} props - Component props
 * @returns {JSX.Element} Rendered link with specified styling and target
 */
const LinkStyle: React.FC<ILinkStyleProps> = ({ style }) => {
    const label = getFieldContent(style, 'label');
    const url = getFieldContent(style, 'url');
    const openInNewTab = hasFieldValue(style, 'open_in_new_tab');
    const cssClass = getFieldContent(style, 'css');

    return (
        <Anchor 
            href={url}
            target={openInNewTab ? '_blank' : '_self'}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className={cssClass}
        >
            {label}
        </Anchor>
    );
};

export default LinkStyle;