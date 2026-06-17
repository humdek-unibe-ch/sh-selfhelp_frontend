/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Returns `false` during SSR and the first (hydration) client render, then
 * `true` once running on the client. This is the behaviour-equivalent,
 * effect-free replacement for the common mount flag:
 *
 *     const [mounted, setMounted] = useState(false);
 *     useEffect(() => setMounted(true), []);
 *
 * It uses `useSyncExternalStore` (the React-recommended way to read
 * render-environment state) so it does not call setState inside an effect.
 */
export function useIsClient(): boolean {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}
