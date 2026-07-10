/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import type { ReactElement } from 'react';
import * as LucideIcons from 'lucide-react';
import IconComponent from '../../shared/common/IconComponent';

interface IMenuItemIconProps {
    iconName: string | null | undefined;
    platform: 'web' | 'mobile';
    size?: number;
}

export function MenuItemIcon({ iconName, platform, size = 18 }: IMenuItemIconProps): ReactElement | null {
    if (!iconName || iconName.trim() === '') {
        return null;
    }

    if (platform === 'web') {
        return <IconComponent iconName={iconName} size={size} />;
    }

    const LucideIcon = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }> | undefined;
    if (!LucideIcon) {
        return null;
    }

    return <LucideIcon size={size} aria-hidden />;
}
