/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/**
 * How many leading items fit in `containerWidth` before a trailing "More"
 * control is required for the remainder.
 */
export function calculateVisibleItemCount(
    itemWidths: readonly number[],
    containerWidth: number,
    moreButtonWidth: number,
    gap: number,
): number {
    if (itemWidths.length === 0 || containerWidth <= 0) {
        return 0;
    }

    const totalWidth = itemWidths.reduce(
        (sum, width, index) => sum + width + (index > 0 ? gap : 0),
        0,
    );
    if (totalWidth <= containerWidth) {
        return itemWidths.length;
    }

    let used = 0;
    for (let index = 0; index < itemWidths.length; index += 1) {
        const itemWidth = itemWidths[index] + (index > 0 ? gap : 0);
        const hiddenCount = itemWidths.length - index - 1;
        const reserve = hiddenCount > 0 ? moreButtonWidth + gap : 0;
        if (used + itemWidth + reserve > containerWidth) {
            return index;
        }
        used += itemWidth;
    }

    return itemWidths.length;
}
