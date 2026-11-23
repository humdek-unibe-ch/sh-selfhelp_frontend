/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef, useState } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import type { IAsset } from '../../../../../../api/admin/asset.api';

/**
 * F121: the selected assets of the list are copies. An `asset:<id>` change notice reads each
 * selected asset named in it again and replaces the copy, or drops it from the selection when it
 * cannot be read any more. Assets that are not selected are left alone.
 */
const api = vi.hoisted(() => ({ getAssetById: vi.fn() }));

vi.mock('../../../../../../api/admin/asset.api', () => ({ AdminAssetApi: { getAssetById: api.getAssetById } }));

import { useSyncedAssetSelection } from '../useSyncedAssetSelection';
import { applySyncTags } from '../../../../../../utils/sync-tags.utils';

const asset = (id: number, name: string): IAsset => ({ id, file_name: name }) as unknown as IAsset;

function mountSelection(initial: IAsset[]) {
    return renderHook(() => {
        const [selected, setSelected] = useState<ReadonlyMap<number, IAsset>>(new Map(initial.map((entry) => [entry.id, entry])));
        const selectedRef = useRef(selected);
        selectedRef.current = selected;
        useSyncedAssetSelection(selectedRef, setSelected);
        return selected;
    });
}

const notice = (...tags: string[]) => act(async () => applySyncTags(new QueryClient(), tags));

beforeEach(() => {
    api.getAssetById.mockReset();
});

describe('the selection of the asset list under live sync (F121)', () => {
    it('replaces the copy of a selected asset another person changed', async () => {
        api.getAssetById.mockResolvedValue(asset(5, 'renamed.png'));
        const { result } = mountSelection([asset(5, 'old.png'), asset(6, 'other.png')]);

        await notice('asset:5');

        await waitFor(() => expect((result.current.get(5) as unknown as { file_name: string }).file_name).toBe('renamed.png'));
        expect(api.getAssetById).toHaveBeenCalledTimes(1);
        expect(api.getAssetById).toHaveBeenCalledWith(5);
        expect((result.current.get(6) as unknown as { file_name: string }).file_name).toBe('other.png');
    });

    it('drops a selected asset that cannot be read any more (deleted, access lost)', async () => {
        api.getAssetById.mockRejectedValue({ response: { status: 404 } });
        const { result } = mountSelection([asset(5, 'gone.png'), asset(6, 'other.png')]);

        await notice('asset:5');

        await waitFor(() => expect(result.current.has(5)).toBe(false));
        expect(result.current.has(6)).toBe(true);
    });

    it('does not read assets that are not selected, and ignores other tags', async () => {
        const { result } = mountSelection([asset(5, 'mine.png')]);

        await notice('asset:99', 'navigation', 'page:5', 'asset:abc');

        expect(api.getAssetById).not.toHaveBeenCalled();
        expect(result.current.size).toBe(1);
    });

    it('stops listening when the list is gone', async () => {
        const { unmount } = mountSelection([asset(5, 'mine.png')]);
        unmount();

        await notice('asset:5');

        expect(api.getAssetById).not.toHaveBeenCalled();
    });
});
