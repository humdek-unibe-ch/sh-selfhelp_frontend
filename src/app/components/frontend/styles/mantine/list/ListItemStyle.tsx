/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { type IListItemStyle } from '../../../../../../types/common/styles.types';
import IconComponent from '../../../../shared/common/IconComponent';
import { renderRichInline } from '../../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for ListItemStyle component
 */
/**
 * Props interface for IListItemStyle component
 */
interface IListItemStyleProps {
    style: IListItemStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * ListItemStyle component renders a Mantine List.Item component.
 * Displays content from the content field and supports optional icons and child components.
 *
 * @component
 * @param {IListItemStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List.Item with content and children
 */
const ListItemStyle: React.FC<IListItemStyleProps> = ({ style, styleProps, cssClass }) => {
    // markdown-inline field — preserve inline bold/italic/underline/links.
    const content = renderRichInline(style.list_item_content?.content);
    const iconName = style.web_list_item_icon?.content;

    // Handle CSS field - use direct property from API response
    

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <List.Item
            icon={icon}
            {...styleProps} className={cssClass}
        >
            {content}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </List.Item>
    );

};

export default ListItemStyle;
