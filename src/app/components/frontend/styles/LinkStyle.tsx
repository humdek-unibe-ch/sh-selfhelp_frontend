/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Anchor } from '@mantine/core';
import { type ILinkStyle } from '../../../../types/common/styles.types';
import { hasFieldValue } from '../../../../utils/style-field-extractor';
import IconComponent from '../../shared/common/IconComponent';
import {
    isPreviewInternalPath,
    previewPathFromHref,
    usePreviewNavigation,
} from '../../cms/live-preview/PreviewNavigationContext';

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
    styleProps: Record<string, string>;
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
    const color = style.color?.content || undefined;
    const underline = (style.web_link_underline?.content || 'hover') as 'always' | 'hover' | 'never';
    const leftIcon = style.web_left_icon?.content;
    const rightIcon = style.web_right_icon?.content;
    const hasIcon = Boolean(leftIcon || rightIcon);

    // Non-null only inside the CMS Live Preview web pane: intercept internal
    // links so they drive the preview instead of navigating the admin app.
    const previewNav = usePreviewNavigation();
    const previewPath = previewPathFromHref(url);
    const interceptPreview = Boolean(previewNav && !openInNewTab && isPreviewInternalPath(previewPath));

    return (
        <Anchor
            href={url}
            target={openInNewTab ? '_blank' : '_self'}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            c={color}
            underline={underline}
            {...styleProps} className={cssClass}
            style={hasIcon ? { display: 'inline-flex', alignItems: 'center', gap: 4 } : undefined}
            onClick={
                interceptPreview
                    ? (e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
                          e.preventDefault();
                          previewNav!.navigate(previewPath!);
                      }
                    : undefined
            }
        >
            {leftIcon ? <IconComponent iconName={leftIcon} size={16} /> : null}
            {label}
            {rightIcon ? <IconComponent iconName={rightIcon} size={16} /> : null}
        </Anchor>
    );
};

export default LinkStyle;