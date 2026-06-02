/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Accessibility assertion helper (canonical Testing Rule 34, Slice 11).
 *
 * Runs axe-core against the current page and fails on any `serious` or
 * `critical` WCAG 2.0/2.1 A/AA violation. Lower-impact findings (`minor`,
 * `moderate`) are reported in the log but do not block — they are tracked as
 * debt, not gates, so the a11y check is meaningful without being noisy.
 *
 * The failure message lists each blocking rule with its help URL so the fix
 * is actionable straight from CI output (Rule 17: assert the public, visible
 * effect; here the effect is "the page is operable by assistive tech").
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

export async function expectNoSeriousA11yViolations(page: Page, label: string): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    // `!= null` narrows out both null and undefined (axe types impact as
    // `ImpactValue | null`), leaving a plain string for Set.has().
    const blocking = results.violations.filter((v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact));

    if (results.violations.length > 0) {
        // Surface everything (including non-blocking) for triage.
        console.log(
            `[a11y] ${label}: ${results.violations.length} violation(s), ${blocking.length} blocking (serious/critical).`,
        );
    }

    const summary = blocking
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) ${v.helpUrl}`)
        .join('\n');

    expect(blocking, `Serious/critical accessibility violations on ${label}:\n${summary}`).toHaveLength(0);
}
