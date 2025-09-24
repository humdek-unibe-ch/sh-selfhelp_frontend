import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { IListStyle } from '../../../../../../types/common/styles.types';
import IconComponent from '../../../../shared/common/IconComponent';
import { castMantineSize } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for ListStyle component
 */
/**
 * Props interface for IListStyle component
 */
interface IListStyleProps {
    style: IListStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ListStyle component renders a Mantine List component.
 * Supports ordered/unordered lists and can contain ListItem children.
 *
 * @component
 * @param {IListStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List with child content
 */
const ListStyle: React.FC<IListStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract Mantine-specific props
    const listStyleType = style.mantine_list_list_style_type?.content;
    const withPadding = style.mantine_list_with_padding?.content === '1';
    const center = style.mantine_list_center?.content === '1';
    const iconName = style.mantine_list_icon?.content;
    const size = castMantineSize((style as any).mantine_size?.content);
    const spacing = style.mantine_spacing?.content || 'md';

    // Handle CSS field - use direct property from API response
    

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
            {...styleProps} className={cssClass}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </List>
    );
};

export default ListStyle;
