import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IListStyle } from '../../../../../types/common/styles.types';
import { getFieldContent, castMantineSize } from '../../../../../utils/style-field-extractor';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for ListStyle component
 */
interface IListStyleProps {
    style: IListStyle;
}

/**
 * ListStyle component renders a Mantine List component.
 * Supports ordered/unordered lists and can contain ListItem children.
 *
 * @component
 * @param {IListStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List with child content
 */
const ListStyle: React.FC<IListStyleProps> = ({ style }) => {
    // Extract Mantine-specific props
    const listStyleType = getFieldContent(style, 'mantine_list_list_style_type');
    const withPadding = getFieldContent(style, 'mantine_list_with_padding') === '1';
    const center = getFieldContent(style, 'mantine_list_center') === '1';
    const iconName = getFieldContent(style, 'mantine_list_icon');
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const spacing = getFieldContent(style, 'mantine_spacing') || 'md';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <List
            listStyleType={listStyleType}
            withPadding={withPadding}
            center={center}
            icon={icon}
            size={size}
            spacing={spacing as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            className={cssClass}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </List>
    );
};

export default ListStyle;
