/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

'use client';

import type { ReactNode } from 'react';

import classes from './WebsiteHeaderRenderer.module.css';



export type TNavOverflowTriggerVariant = 'pill' | 'tab' | 'icon';



interface IHeaderNavOverflowProps<T> {

    items: readonly T[];

    gap?: number;

    className?: string;

    overflowTriggerVariant?: TNavOverflowTriggerVariant;

    getItemKey: (item: T) => string;

    measureItem: (item: T) => ReactNode;

    renderVisibleItems: (visibleItems: readonly T[]) => ReactNode;

    renderOverflowItems: (overflowItems: readonly T[]) => ReactNode;

    integrateOverflow?: (args: {

        visibleItems: readonly T[];

        overflowMenu: ReactNode | null;

    }) => ReactNode;

}
/**
 * Header nav row wrapper.
 *
 * Automatic width-aware "More" collapsing was intentionally removed so menu
 * grouping stays fully manual in CMS configuration.
 */

export function HeaderNavOverflow<T>({

    items,

    gap = 4,

    className,

    renderVisibleItems,

    integrateOverflow,

}: IHeaderNavOverflowProps<T>) {
    const visibleItems = items;
    const overflowMenu = null;

    const visibleRow = integrateOverflow
        ? integrateOverflow({ visibleItems, overflowMenu })
        : renderVisibleItems(visibleItems);

    return (
        <div data-nav-overflow-root className={className ?? classes.navOverflowRoot}>
            <div
                data-nav-overflow-container
                data-nav-overflow-ready="true"
                className={classes.navOverflowVisible}
                style={{ gap }}
            >
                {visibleRow}
            </div>
        </div>
    );
}
