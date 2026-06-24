/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `useMobilePreviewSession` — own the mobile iframe's one-time code + remount
 * lifecycle.
 *
 * Mints a keyword-LESS one-time preview code (free navigation, still GET-only +
 * read-only render allowlist) exactly once per distinct intent (language / draft
 * / reload) and drives the SAFE reload: a reload UNMOUNTS the iframe, re-mints,
 * and the remount effect brings it back only once a FRESH code is ready —
 * remounting onto an already-consumed code (or swapping `src` in place) wedges
 * the cross-origin Expo dev frame on a perpetual loading spinner.
 *
 * The same fresh-code remount is used on tab RESUME: when `pageActive` goes
 * false → true, the frame reloads fresh (mirrors the manual reload).
 *
 * @module components/cms/live-preview/hooks/useMobilePreviewSession
 */

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AdminMobilePreviewApi } from '../../../../../api/admin/mobile-preview.api';

function toErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return 'Failed to start the live preview. Please retry.';
}

export interface IUseMobilePreviewSessionOptions {
    /** The mobile iframe mounts + the code is minted only while this is true. */
    previewActive: boolean;
    /** Real tab visibility — a false → true transition reloads the frame fresh. */
    pageActive: boolean;
    languagesLoading: boolean;
    languagesCount: number;
    selectedLanguageId: number | null;
    draft: boolean;
    previewOrigin: string;
    /** Canonical keyword ref — the frame (re)loads at this page. */
    currentKeywordRef: MutableRefObject<string | null>;
    /** Pin the keyword the frame last (re)loaded with (drives the iframe URL). */
    setMobileLoadKeyword: (keyword: string | null) => void;
}

export interface IUseMobilePreviewSessionResult {
    /** Latest minted one-time code (null until the first mint). */
    code: string | null;
    /** Human-readable mint error (null while OK / pending). */
    mintError: string | null;
    /** True while a mint is in flight (drives the toolbar spinners). */
    mintPending: boolean;
    /** Whether the iframe should currently be mounted (false mid-reload). */
    mobileMounted: boolean;
    /** Reload the frame the safe way (unmount → re-mint → remount on fresh code). */
    reloadMobileFresh: () => void;
}

export function useMobilePreviewSession(
    opts: IUseMobilePreviewSessionOptions,
): IUseMobilePreviewSessionResult {
    const {
        previewActive,
        pageActive,
        languagesLoading,
        languagesCount,
        selectedLanguageId,
        draft,
        previewOrigin,
        currentKeywordRef,
        setMobileLoadKeyword,
    } = opts;

    const mintMutation = useMutation({
        mutationFn: () =>
            AdminMobilePreviewApi.createSession({
                language_id: selectedLanguageId ?? undefined,
                draft,
            }),
        // Auto-recover from a transient failure (cold dev route-compile can exceed
        // the client timeout on the first mint; the backend may briefly 503
        // mid-restart). Minted codes are single-use + cheap; the error UI is the
        // fallback once these are exhausted.
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    });
    const { mutate: mintCode } = mintMutation;
    const code = mintMutation.data?.code ?? null;
    const mintError = mintMutation.isError ? toErrorMessage(mintMutation.error) : null;

    // Remount latch: a reload UNMOUNTS the frame and the remount effect brings it
    // back only once a FRESH code is minted (see module doc).
    const [mobileMounted, setMobileMounted] = useState(true);
    const [mobileReloadPending, setMobileReloadPending] = useState(false);
    const [mobileReloadKey, setMobileReloadKey] = useState(0);

    // Latest minted code (ref so the reload helper reads it without re-creating
    // the callback every mint) + the code being replaced on the current reload.
    const codeRef = useRef<string | null>(null);
    const reloadFromCodeRef = useRef<string | null>(null);
    // Mint-once dedup key (StrictMode double-invoke + independent transitions).
    const lastMintKeyRef = useRef<string | null>(null);

    useEffect(() => {
        codeRef.current = code;
    }, [code]);

    // Remount the iframe ONLY once a FRESH code has been minted after a reload /
    // refresh / resume. Bringing it back on the old, already-consumed code wedges
    // the cross-origin Expo dev frame on a perpetual spinner.
    useEffect(() => {
        if (!mobileReloadPending) return;
        if (!code || code === reloadFromCodeRef.current) return;
        setMobileReloadPending(false);
        setMobileMounted(true);
    }, [mobileReloadPending, code]);

    // Reload the SAFE way: unmount, mint a fresh code, let the remount effect
    // bring it back only once that new code is ready.
    const reloadMobileFresh = useCallback(() => {
        reloadFromCodeRef.current = codeRef.current;
        setMobileLoadKeyword(currentKeywordRef.current);
        setMobileMounted(false);
        setMobileReloadPending(true);
        setMobileReloadKey((k) => k + 1);
    }, [setMobileLoadKeyword, currentKeywordRef]);

    // On tab RESUME (pageActive false → true) remount fresh — the same safe path
    // as a manual reload. The initial mount does not trigger it (no transition).
    const prevPageActiveRef = useRef(pageActive);
    useEffect(() => {
        const previous = prevPageActiveRef.current;
        prevPageActiveRef.current = pageActive;
        if (!previous && pageActive) {
            reloadMobileFresh();
        }
    }, [pageActive, reloadMobileFresh]);

    // Mint exactly ONCE per distinct intent. Re-mints only when something that
    // affects the token changes: language, draft, origin, or a reload.
    useEffect(() => {
        if (!previewActive) return undefined;
        if (languagesLoading) return undefined;
        if (languagesCount > 0 && selectedLanguageId === null) return undefined;

        const key = `${previewOrigin}|${selectedLanguageId ?? ''}|${draft ? 1 : 0}|${mobileReloadKey}`;
        if (lastMintKeyRef.current === key) return undefined;
        lastMintKeyRef.current = key;
        mintCode();
        return undefined;
    }, [
        previewActive,
        languagesLoading,
        languagesCount,
        selectedLanguageId,
        draft,
        mobileReloadKey,
        previewOrigin,
        mintCode,
    ]);

    return {
        code,
        mintError,
        mintPending: mintMutation.isPending,
        mobileMounted,
        reloadMobileFresh,
    };
}
