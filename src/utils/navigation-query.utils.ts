/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { PlaceholderDataFunction } from '@tanstack/react-query';

/**
 * Permission-filtered navigation differs by auth scope. Never reuse a guest
 * (or prior-user) placeholder when the scope changes — that made the header
 * stick on an empty guest menu after login until a hard reload.
 */
export function navigationAuthScopeFromUserId(userId: number | null | undefined): string {
    return typeof userId === 'number' ? `user:${userId}` : 'guest';
}

export function keepPlaceholderWithinAuthScope<T>(
    authScope: string,
): PlaceholderDataFunction<T, Error, T, readonly unknown[]> {
    return (previousData, previousQuery) => {
        const prevScope = previousQuery?.queryKey.at(-1);
        return prevScope === authScope ? previousData : undefined;
    };
}
