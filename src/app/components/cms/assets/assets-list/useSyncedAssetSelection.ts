/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { AdminAssetApi, type IAsset } from '../../../../../api/admin/asset.api';
import { subscribeSyncTags } from '../../../../../utils/sync-tags.utils';

/**
 * F121: the asset selection holds copies of the selected assets, and the bulk bar works out what it
 * may offer (groups, update, delete) from those copies. A change made elsewhere (another tab, another
 * person) arrives as an `asset:<id>` change notice. For every selected asset named in one, read the asset
 * again and replace the copy, or drop it from the selection when it cannot be read any more (deleted,
 * access lost). The server still refuses what a stale copy would allow, so this only keeps the bar honest.
 *
 * Assets that are not selected are not touched here; the lists refresh through the query cache.
 */
export function useSyncedAssetSelection(
    selectedRef: MutableRefObject<ReadonlyMap<number, IAsset>>,
    setSelected: Dispatch<SetStateAction<ReadonlyMap<number, IAsset>>>,
): void {
    useEffect(() => {
        let active = true;

        const refresh = async (id: number): Promise<void> => {
            try {
                const fresh = await AdminAssetApi.getAssetById(id);
                if (!active) return;
                setSelected((prev) => {
                    if (!prev.has(id)) return prev;
                    const next = new Map(prev);
                    next.set(id, fresh);
                    return next;
                });
            } catch {
                if (!active) return;
                setSelected((prev) => {
                    if (!prev.has(id)) return prev;
                    const next = new Map(prev);
                    next.delete(id);
                    return next;
                });
            }
        };

        const unsubscribe = subscribeSyncTags((tags) => {
            const ids = tags
                .filter((tag) => tag.startsWith('asset:'))
                .map((tag) => Number(tag.slice('asset:'.length)))
                .filter((id) => Number.isInteger(id) && selectedRef.current.has(id));
            for (const id of ids) {
                void refresh(id);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [selectedRef, setSelected]);
}
