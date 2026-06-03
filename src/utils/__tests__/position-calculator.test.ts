/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    calculateDragDropPosition,
    calculateContainerDropPosition,
    calculateSiblingBelowPosition,
    calculateSiblingAbovePosition,
    calculateFinalMenuPosition,
    type IPositionItem,
} from '../position-calculator';

const siblings: IPositionItem[] = [
    { id: 'a', position: 0 },
    { id: 'b', position: 10 },
    { id: 'c', position: 20 },
];

describe('calculateDragDropPosition', () => {
    it('returns -1 when dropping above the first sibling', () => {
        expect(calculateDragDropPosition({ id: 'a', position: 0 }, 'top', siblings)).toEqual({
            newParentId: null,
            newPosition: -1,
        });
    });

    it('uses previous-sibling position + 5 when dropping above a middle sibling', () => {
        expect(calculateDragDropPosition({ id: 'c', position: 20 }, 'top', siblings).newPosition).toBe(15);
    });

    it('uses target position + 5 when dropping below', () => {
        expect(calculateDragDropPosition({ id: 'b', position: 10 }, 'bottom', siblings).newPosition).toBe(15);
    });
});

describe('calculateContainerDropPosition', () => {
    it('places the first child at -1 under the given parent', () => {
        expect(calculateContainerDropPosition(99)).toEqual({ newParentId: 99, newPosition: -1 });
    });
});

describe('calculateSibling*Position', () => {
    it('places a sibling below at reference + 5', () => {
        expect(calculateSiblingBelowPosition({ id: 'b', position: 10 }).newPosition).toBe(15);
    });

    it('places a sibling above the first item at -1', () => {
        expect(calculateSiblingAbovePosition({ id: 'a', position: 0 }, siblings).newPosition).toBe(-1);
    });
});

describe('calculateFinalMenuPosition', () => {
    it('returns -1 for the first slot and last.position + 5 for the end', () => {
        expect(calculateFinalMenuPosition(siblings, 0)).toBe(-1);
        expect(calculateFinalMenuPosition(siblings, siblings.length)).toBe(25);
        expect(calculateFinalMenuPosition(siblings, 1)).toBe(5);
    });
});
