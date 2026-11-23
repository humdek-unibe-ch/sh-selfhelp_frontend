/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Type into an input the way a person does: an `input` event the browser itself raised
 * (`isTrusted`). jsdom marks every event that `dispatchEvent` sends as untrusted and the property
 * cannot be redefined, so the event is handed to jsdom's internal dispatch with the flag set.
 * Code that tells a person's typing from a script's prefill (`event.nativeEvent.isTrusted`) can
 * only be tested this way.
 */
import { act, createEvent } from '@testing-library/react';

type TJsdomImpl = { isTrusted: boolean; _dispatch?: (event: unknown) => void };

function implOf(object: object): TJsdomImpl {
    const symbol = Object.getOwnPropertySymbols(object).find((entry) => entry.description === 'impl');
    if (!symbol) {
        throw new Error('jsdom internal object not found; update test-utils/trusted-input.ts');
    }
    return (object as Record<symbol, TJsdomImpl>)[symbol];
}

export function typeLikeAPerson(input: HTMLInputElement, value: string): void {
    const event = createEvent.input(input, { target: { value } });
    const eventImpl = implOf(event);
    eventImpl.isTrusted = true;
    act(() => {
        implOf(input)._dispatch?.(eventImpl);
    });
}
