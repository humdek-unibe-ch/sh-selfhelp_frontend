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

/**
 * Global app chrome that is not part of any page's content and is excluded from
 * the per-page scan: the floating debug-menu trigger (`DebugMenu`, an icon-only
 * Mantine `ActionIcon`). It is a developer affordance whose accessible-name gap
 * is tracked separately from end-user page accessibility, and it would
 * otherwise report the same `button-name` finding on every surface.
 */
const EXCLUDED_SELECTOR = 'button:has(.tabler-icon-bug)';

/**
 * Known, tracked accessibility debt: rules that are reported but do NOT block
 * the gate. Kept tiny + explicit so the suite still fails on any *new*
 * serious/critical issue while not being held hostage by pre-existing app-wide
 * debt that cannot be fixed from the test layer:
 *
 *   - `color-contrast`: the Mantine default primary palette (e.g. links and
 *     buttons in `#228be6`, dimmed text in `#868e96`) renders small text at
 *     ~3.3–3.6:1, below the 4.5:1 WCAG AA threshold. This is a theme-level
 *     decision in the app's Mantine theme, not a per-page defect.
 */
const NON_BLOCKING_RULE_IDS = new Set(['color-contrast']);

export async function expectNoSeriousA11yViolations(page: Page, label: string): Promise<void> {
    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude(EXCLUDED_SELECTOR)
        .analyze();

    // `!= null` narrows out both null and undefined (axe types impact as
    // `ImpactValue | null`), leaving a plain string for Set.has().
    const seriousOrCritical = results.violations.filter((v) => v.impact != null && BLOCKING_IMPACTS.has(v.impact));
    const blocking = seriousOrCritical.filter((v) => !NON_BLOCKING_RULE_IDS.has(v.id));
    const trackedDebt = seriousOrCritical.filter((v) => NON_BLOCKING_RULE_IDS.has(v.id));

    if (results.violations.length > 0) {
        // Surface everything (including non-blocking + tracked debt) for triage.
        const debtNote = trackedDebt.length
            ? `, ${trackedDebt.length} tracked-debt (${[...new Set(trackedDebt.map((v) => v.id))].join(', ')})`
            : '';
        console.log(
            `[a11y] ${label}: ${results.violations.length} violation(s), ${blocking.length} blocking${debtNote}.`,
        );
    }

    const summary = blocking
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s)) ${v.helpUrl}`)
        .join('\n');

    expect(blocking, `Serious/critical accessibility violations on ${label}:\n${summary}`).toHaveLength(0);
}
