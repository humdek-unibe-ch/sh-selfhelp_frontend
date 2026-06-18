/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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

    // Looking up a missing key just yields `undefined` (no throw), and a
    // try/catch around JSX cannot catch render-time errors anyway, so we resolve
    // the icon component and render it conditionally instead.
    const Icon = TablerIcons[iconName as keyof typeof TablerIcons] as React.ElementType | undefined;
    if (!Icon) {
        return null;
    }

    return <Icon size={size} key={iconName} />;
};

export default IconComponent;
