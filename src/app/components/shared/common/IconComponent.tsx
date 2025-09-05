import React from 'react';
import * as TablerIcons from '@tabler/icons-react';

/**
 * Props interface for IconComponent
 * @interface IIconComponentProps
 * @property {string} iconName - The name of the Tabler icon to render
 * @property {number} [size=16] - The size of the icon in pixels
 */
interface IIconComponentProps {
    iconName: string;
    size?: number;
}

/**
 * IconComponent renders a Tabler icon dynamically based on the icon name.
 * Provides a reusable way to load and display icons with configurable size.
 *
 * @component
 * @param {IIconComponentProps} props - Component props
 * @returns {JSX.Element | null} Rendered icon component or null if icon not found
 */
const IconComponent: React.FC<IIconComponentProps> = ({ iconName, size = 16 }) => {
    if (!iconName || !iconName.trim()) return null;

    try {
        const IconComponent = TablerIcons[iconName as keyof typeof TablerIcons] as React.ElementType;
        if (IconComponent) {
            return <IconComponent size={size} key={iconName} />;
        }
    } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`, error);
    }
    return null;
};

export default IconComponent;
