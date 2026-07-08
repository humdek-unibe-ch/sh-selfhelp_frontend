/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { HeaderNavOverflow } from '../HeaderNavOverflow';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

vi.mock('../../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 1,
        languages: [{ id: 1, locale: 'en-GB', name: 'English' }],
        setCurrentLanguageId: vi.fn(),
        setLanguages: vi.fn(),
    }),
}));

class ResizeObserverMock {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
    }

    observe(target: Element): void {
        Object.defineProperty(target, 'clientWidth', {
            configurable: true,
            value: 180,
        });
        this.callback([], this as unknown as ResizeObserver);
    }

    unobserve(): void {}

    disconnect(): void {}
}

describe('HeaderNavOverflow', () => {
    beforeEach(() => {
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    });

    it('renders all items and does not auto-collapse into a More menu', () => {
        const items = ['Alpha', 'Beta', 'Gamma'];

        renderWithProviders(
            <div style={{ width: 180 }}>
                <HeaderNavOverflow
                    items={items}
                    getItemKey={(item) => item}
                    measureItem={(item) => <span>{item}</span>}
                    renderVisibleItems={(visible) => visible.map((item) => (
                        <span key={item}>{item}</span>
                    ))}
                    renderOverflowItems={(overflow) => overflow.map((item) => (
                        <span key={item}>{item}</span>
                    ))}
                />
            </div>,
        );

        expect(screen.queryByRole('button', { name: /More/i })).not.toBeInTheDocument();
        expect(document.querySelector('[data-nav-overflow-container]')).toHaveTextContent('Gamma');
        expect(document.querySelector('[data-nav-overflow-container]')).toHaveAttribute('data-nav-overflow-ready', 'true');
    });
});
