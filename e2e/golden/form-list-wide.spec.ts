/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Golden workflow (web): a wide form with very long labels, at the two screen sizes.
 *
 * The page is the backend QA fixture `QaFormListFixture` (`/qa-wide`): two entry lists whose form holds 24
 * inputs (text, textarea, select, checkbox, radio, number, switch) with labels as long as a sentence of a
 * questionnaire and one unbroken run of 70 characters in each, and 12 columns whose headers are just as
 * long. Three inputs are required, one of them far down. Nothing here is a short word.
 *
 * Per screen size (desktop 1366x768, phone 390x844):
 *   - the list: 12 long headers and long values stay inside the page; the table scrolls inside its own box
 *   - the modal form: no label, hint or error reaches past the dialog; every input is reached by the Tab key
 *     in order, focus never leaves the dialog and is always on screen, Save and Cancel are reachable
 *   - errors: the browser's own check focuses the first required input and sends nothing; the form's summary
 *     names the inputs that are far apart by their long labels and fits; typed input is kept
 *   - a saved record: view, edit and the history of the change (the labels and values are as long) fit
 *   - the form on a page: the same, without a dialog
 *
 * Requires a prepared QA stack with the wide page and the QA env (see `e2e/utils/env.ts`).
 */
import { test, expect, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { expectNoSeriousA11yViolations, expectNoSeriousA11yViolationsIn } from '../utils/a11y';
import { isQaConfigured, qaEnv } from '../utils/env';
import {
    createRecord,
    deleteTagged,
    expectNoPageOverflow,
    formListEnv,
    listRoot,
    listRows,
    listTarget,
    runTag,
    waitUntilSettled,
    watchRequests,
    type IListTarget,
} from '../utils/formList';
import { loginAs } from '../utils/loginAs';

const env = formListEnv();
const BASE_URL = qaEnv().baseUrl;
const LOCALE = 'en-GB';
const WIDE_PATH = `/${env.wideKeyword}`;
const RUN = runTag();
const FIELD_COUNT = 24;
/** One run of characters with no break in it, as long as a reference number or a compound word. */
const UNBROKEN = 'u'.repeat(90);

const SIZES = [
    { key: 'desktop', name: 'desktop 1366x768', width: 1366, height: 768 },
    { key: 'phone', name: 'phone 390x844', width: 390, height: 844 },
] as const;

function pad(n: number): string {
    return String(n).padStart(2, '0');
}

/** The input of a form by the name it stores under (the visible one: a checkbox also has a hidden twin). */
function input(scope: Locator, prefix: string, n: number): Locator {
    return scope.locator(`[name="${prefix}_${pad(n)}"]:not([type="hidden"])`);
}

/** The three inputs that must be filled in: the first, one in the middle and one near the end. */
function requiredFields(prefix: string, tag: string): Record<string, string> {
    return {
        [`${prefix}_01`]: `${tag} first ${UNBROKEN}`,
        [`${prefix}_13`]: `${tag} thirteenth`,
        [`${prefix}_21`]: `${tag} twenty-first`,
    };
}

/** A record with long values in the first inputs, which are the columns of the table. */
function longRecord(prefix: string, tag: string, n: number): Record<string, string> {
    return {
        ...requiredFields(prefix, `${tag} row ${n}`),
        [`${prefix}_02`]: `second value of row ${n} ${UNBROKEN}`,
        [`${prefix}_03`]: `third value of row ${n} ${UNBROKEN} ${UNBROKEN}`,
        [`${prefix}_05`]: `fifth ${UNBROKEN}`,
        [`${prefix}_07`]: `seventh ${UNBROKEN}`,
    };
}

/**
 * Nothing inside `scope` reaches past its right edge and the scope does not scroll sideways. What sits inside a box that
 * scrolls or clips on its own (a wide table) may be wider than that box: the box is what has to fit.
 */
async function expectContained(scope: Locator, label: string): Promise<void> {
    const result = await scope.evaluate((root) => {
        const edge = root.getBoundingClientRect().right;
        const outside: string[] = [];
        for (const element of Array.from(root.querySelectorAll<HTMLElement>('*'))) {
            let inside = false;
            for (let parent = element.parentElement; parent !== null && parent !== root; parent = parent.parentElement) {
                if (getComputedStyle(parent).overflowX !== 'visible') {
                    inside = true;
                    break;
                }
            }
            if (inside) {
                continue;
            }
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.right > edge + 1 && getComputedStyle(element).position !== 'fixed') {
                outside.push(`${element.tagName.toLowerCase()} "${(element.textContent ?? '').trim().slice(0, 30)}" +${Math.round(rect.right - edge)}px`);
            }
        }
        return { scroll: root.scrollWidth, client: root.clientWidth, outside: outside.slice(0, 5) };
    });
    expect(result.scroll, `${label}: scrolls sideways (${result.scroll}px in ${result.client}px)`).toBeLessThanOrEqual(result.client);
    expect(result.outside, `${label}: reaches past the right edge`).toEqual([]);
}

interface IFocusInfo {
    inside: boolean;
    /** The number of the question the focused control belongs to ("Question 07: ..."), 0 for a button. */
    question: number;
    text: string;
    top: number;
    bottom: number;
}

/** Wait until nothing scrolls any more: the page and the boxes around the focused control may scroll smoothly to it. */
async function untilScrollStops(page: Page): Promise<void> {
    await page.evaluate(
        () => new Promise<void>((resolve) => {
            const position = (): string => {
                const parts = [`${window.scrollX},${window.scrollY}`];
                for (let node = document.activeElement as HTMLElement | null; node !== null; node = node.parentElement) {
                    parts.push(`${node.scrollLeft},${node.scrollTop}`);
                }
                return parts.join('|');
            };
            let last = position();
            let still = 0;
            const giveUp = window.setTimeout(resolve, 3000);
            const tick = (): void => {
                const now = position();
                still = now === last ? still + 1 : 0;
                last = now;
                if (still >= 6) {
                    window.clearTimeout(giveUp);
                    resolve();
                    return;
                }
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }),
    );
}

async function focused(page: Page, containerSelector: string): Promise<IFocusInfo> {
    await untilScrollStops(page);
    return page.evaluate((selector) => {
        const element = document.activeElement as HTMLElement | null;
        if (element === null) {
            return { inside: false, question: 0, text: '', top: 0, bottom: 0 };
        }
        // The question the control belongs to: the smallest box around it that holds exactly one question text (a radio
        // sits in a group, a switch in a row with its On/Off words, the Save button in a box with every question).
        let named = '';
        for (let node: HTMLElement | null = element; node !== null; node = node.parentElement) {
            const text = (node.textContent ?? '').trim();
            const questions = text.match(/Question \d\d:/g) ?? [];
            if (questions.length > 1) {
                break;
            }
            if (questions.length === 1) {
                named = text;
                break;
            }
        }
        const match = /Question (\d\d):/.exec(named);
        const rect = element.getBoundingClientRect();
        return {
            inside: element.closest(selector) !== null,
            question: match === null ? 0 : Number(match[1]),
            text: (element.textContent ?? '').trim().slice(0, 30),
            top: rect.top,
            bottom: rect.bottom,
        };
    }, containerSelector);
}

/**
 * Press Tab until the Save button has focus. Every step must stay inside the container and on screen. Returns the
 * numbers of the questions that had focus, in order, and the number of steps.
 */
async function tabToSave(page: Page, containerSelector: string, height: number): Promise<{ questions: number[]; steps: number }> {
    const questions: number[] = [];
    for (let step = 1; step <= 80; step += 1) {
        await page.keyboard.press('Tab');
        const info = await focused(page, containerSelector);
        expect(info.inside, `step ${step}: focus left the form (on "${info.text}")`).toBe(true);
        // A small control is seen whole; a tall one (a text area, which the browser scrolls to by its caret) shows at
        // least its first lines, so the focus ring and the caret are in sight.
        const visible = Math.min(info.bottom, height) - Math.max(info.top, 0);
        expect(visible, `step ${step}: the focused control is on screen (top ${Math.round(info.top)}, bottom ${Math.round(info.bottom)} of ${height})`).toBeGreaterThanOrEqual(Math.min(info.bottom - info.top, 24) - 1);
        if (info.question !== 0 && questions[questions.length - 1] !== info.question) {
            questions.push(info.question);
        }
        if (info.text === 'Save') {
            return { questions, steps: step };
        }
    }
    throw new Error('Tab never reached Save');
}

for (const size of SIZES) {
    test.describe(`golden: wide forms with long labels (${size.name})`, () => {
        test.skip(!isQaConfigured(), 'Set QA_USER_EMAIL + QA_USER_PASSWORD + QA_FORM_PAGE_KEYWORD (and run a QA stack) to execute the golden E2E.');
        test.describe.configure({ mode: 'serial' });

        const tag = `${RUN}-${size.key}`;
        let context: BrowserContext;
        let page: Page;
        let wide: IListTarget;
        let widepage: IListTarget;

        test.beforeAll(async ({ browser }) => {
            context = await browser.newContext({ baseURL: BASE_URL, locale: LOCALE, viewport: { width: size.width, height: size.height } });
            page = await context.newPage();
            await loginAs(page, env.user.email, env.user.password, env.loginKeyword);
            await page.goto(WIDE_PATH);
            await waitUntilSettled(page);
            wide = await listTarget(page, env.wideKeyword, 'wide');
            widepage = await listTarget(page, env.wideKeyword, 'widepage');
            await deleteTagged(page, wide, 'qa-e2e-');
            await deleteTagged(page, widepage, 'qa-e2e-');
        });

        test.afterAll(async () => {
            await deleteTagged(page, wide, tag);
            await deleteTagged(page, widepage, tag);
            await context.close();
        });

        test('the list: twelve long headers and long values stay in the page', async () => {
            for (let n = 1; n <= 3; n += 1) {
                await createRecord(page, wide, longRecord('qa_wide', tag, n));
            }
            await page.goto(`${WIDE_PATH}?wide.q=${encodeURIComponent(tag)}`);
            await waitUntilSettled(page);
            const list = listRoot(page, 'wide');
            await expect(list.getByRole('heading', { name: 'Wide entries', exact: true })).toBeVisible();
            await expect(list.getByRole('columnheader').filter({ hasText: /^Column \d\d: / })).toHaveCount(12);
            await expect(list.getByRole('row').filter({ hasText: tag })).toHaveCount(3);
            await expectNoPageOverflow(page, `${size.name}: the wide list`);
            await expectContained(page.locator('main'), `${size.name}: the main area of the wide list`);
            await expectNoSeriousA11yViolations(page, `${size.name}: the wide list`);
        });

        test('the modal form: nothing reaches past the dialog, every input is reached by Tab and stays on screen', async () => {
            await page.goto(WIDE_PATH);
            await waitUntilSettled(page);
            const list = listRoot(page, 'wide');
            await list.getByRole('button', { name: 'Add entry' }).click();
            const dialog = page.getByRole('dialog', { name: 'Add entry' });
            await expect(dialog).toBeVisible();
            await expect(input(dialog, 'qa_wide', 1)).toBeVisible();

            await expectContained(dialog, `${size.name}: the form dialog`);
            await expectNoPageOverflow(page, `${size.name}: the form dialog`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the wide form`);

            // The labels are all there, in full, and wrapped: each one is taller than a single line.
            const labels = dialog.locator('label, .mantine-Switch-label').filter({ hasText: /^Question \d\d: / });
            expect(await labels.count()).toBeGreaterThanOrEqual(FIELD_COUNT);
            const lineHeights = await labels.evaluateAll((nodes) =>
                nodes.slice(0, 5).map((node) => ({ height: node.getBoundingClientRect().height, line: parseFloat(getComputedStyle(node).lineHeight) || 20 })),
            );
            for (const entry of lineHeights) {
                expect(entry.height, 'a long label wraps over several lines').toBeGreaterThan(entry.line * 2);
            }

            // Tab from the first input to Save: in order, inside the dialog, always on screen.
            await input(dialog, 'qa_wide', 1).focus();
            const forward = await tabToSave(page, '[role="dialog"]', size.height);
            // Every other question is reached once, in the order of the form: text, textarea, select, checkbox,
            // number, radio and switch alike.
            expect(forward.questions, 'the questions Tab reaches, in order').toEqual(Array.from({ length: FIELD_COUNT - 1 }, (_, index) => index + 2));
            expect(forward.steps).toBeGreaterThanOrEqual(FIELD_COUNT - 1);
            await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeFocused();
            const save = await dialog.getByRole('button', { name: 'Save', exact: true }).boundingBox();
            expect(save, 'Save is on screen').not.toBeNull();
            // One step further is Cancel, and Shift+Tab goes back to the input before Save.
            await page.keyboard.press('Tab');
            await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
            await page.keyboard.press('Shift+Tab');
            await page.keyboard.press('Shift+Tab');
            const back = await focused(page, '[role="dialog"]');
            expect(back.inside).toBe(true);
            expect(back.text).not.toBe('Save');
        });

        test('errors: the browser asks for the first required input; the summary names the far apart ones; typed input stays', async () => {
            await page.goto(WIDE_PATH);
            await waitUntilSettled(page);
            const list = listRoot(page, 'wide');
            await list.getByRole('button', { name: 'Add entry' }).click();
            const dialog = page.getByRole('dialog', { name: 'Add entry' });
            const submits = watchRequests(page, /\/api\/forms\/submit/, 'POST');

            // Typed input that must survive every refusal.
            const keep = `keep ${UNBROKEN}`;
            await input(dialog, 'qa_wide', 2).fill(keep);
            await dialog.getByRole('combobox', { name: /^Question 04:/ }).click();
            await page.getByRole('option', { name: 'Option B' }).click();

            // 1. The required inputs are empty: the browser's own check focuses the first one; nothing is sent.
            await dialog.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(input(dialog, 'qa_wide', 1)).toBeFocused();
            expect(submits.count(), 'nothing is sent while a required input is empty').toBe(0);
            await expect(dialog).toBeVisible();
            const stillOnScreen = await focused(page, '[role="dialog"]');
            expect(stillOnScreen.top).toBeGreaterThanOrEqual(-1);
            expect(stillOnScreen.bottom).toBeLessThanOrEqual(size.height + 1);

            // 2. Spaces satisfy the browser but not the form: its summary names both inputs by their long labels,
            // and not the one that is filled in properly.
            await input(dialog, 'qa_wide', 1).fill('   ');
            await input(dialog, 'qa_wide', 13).fill('   ');
            await input(dialog, 'qa_wide', 21).fill(`${tag} twenty-first`);
            await dialog.getByRole('button', { name: 'Save', exact: true }).click();
            const summary = dialog.getByText(/^Please fill in the following required fields:/);
            await expect(summary).toBeVisible();
            const text = (await summary.textContent()) ?? '';
            expect(text).toContain('Question 01: please describe in as much detail');
            expect(text).toContain('Question 13: please describe in as much detail');
            expect(text).not.toContain('Question 21:');
            expect(text).toContain(UNBROKEN.length > 0 ? 'unbrokenreferencenumber' : '');
            expect(submits.count(), 'the summary stops the send').toBe(0);
            await expectContained(dialog, `${size.name}: the form dialog with the summary`);
            await expectNoPageOverflow(page, `${size.name}: the form dialog with the summary`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the wide form with the summary`);

            // The typed input is still there, so is the choice of the select.
            await expect(input(dialog, 'qa_wide', 2)).toHaveValue(keep);
            await expect(dialog.getByRole('combobox', { name: /^Question 04:/ })).toHaveValue('Option B');
            await expect(input(dialog, 'qa_wide', 1)).toHaveValue('   ');

            // Leaving asks first, because there is input; the question fits and its buttons are reachable.
            await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
            const discard = page.getByRole('dialog', { name: 'Discard your changes?' });
            await expect(discard).toBeVisible();
            for (const name of ['Keep editing', 'Discard changes']) {
                const box = await discard.getByRole('button', { name }).boundingBox();
                expect(box, `${name} is on screen`).not.toBeNull();
                expect((box?.x ?? -1) + (box?.width ?? 0)).toBeLessThanOrEqual(size.width + 1);
            }
            await discard.getByRole('button', { name: 'Keep editing' }).click();
            await expect(input(dialog, 'qa_wide', 2)).toHaveValue(keep);

            // 3. Fill the required inputs properly: the record is saved, the dialog closes.
            await input(dialog, 'qa_wide', 1).fill(`${tag} saved ${UNBROKEN}`);
            await input(dialog, 'qa_wide', 13).fill(`${tag} thirteen`);
            const [response] = await Promise.all([
                page.waitForResponse((candidate) => /\/api\/forms\/submit/.test(candidate.url()) && candidate.request().method() === 'POST'),
                dialog.getByRole('button', { name: 'Save', exact: true }).click(),
            ]);
            expect(response.status()).toBeLessThan(400);
            await expect(page.getByRole('dialog')).toHaveCount(0);
            const rows = await listRows(page, wide, `${tag} saved`);
            expect(rows.total).toBe(1);
        });

        test('a saved record: view, edit and the history of the change keep their long labels and values in the dialog', async () => {
            await page.goto(`${WIDE_PATH}?wide.q=${encodeURIComponent(`${tag} saved`)}`);
            await waitUntilSettled(page);
            const list = listRoot(page, 'wide');
            const row = list.getByRole('row').filter({ hasText: `${tag} saved` });
            await expect(row).toBeVisible();

            // View: the long column labels and values are a list of terms and descriptions.
            await row.getByRole('button', { name: /^View / }).click();
            let dialog = page.getByRole('dialog');
            await expect(dialog.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
            await expect(dialog.locator('dt').first()).toBeVisible();
            await expectContained(dialog, `${size.name}: the record view`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the record view`);
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).toHaveCount(0);

            // Edit: change a long value; the form is prefilled and fits.
            await row.getByRole('button', { name: /^Edit / }).click();
            dialog = page.getByRole('dialog');
            await expect(input(dialog, 'qa_wide', 1)).toHaveValue(new RegExp(`^${tag} saved`));
            await expectContained(dialog, `${size.name}: the edit form`);
            await input(dialog, 'qa_wide', 2).fill(`changed value ${UNBROKEN}`);
            // An existing record is saved with "Update".
            const [saved] = await Promise.all([
                page.waitForResponse((candidate) => /\/api\/forms\/(submit|update)/.test(candidate.url()) && ['POST', 'PUT'].includes(candidate.request().method())),
                dialog.getByRole('button', { name: 'Update', exact: true }).click(),
            ]);
            expect(saved.status()).toBeLessThan(400);
            await expect(page.getByRole('dialog')).toHaveCount(0);

            // History: two versions; the details of the change and a comparison show the field and the long old and new
            // values, and the whole entry as terms and descriptions. The history names a field the way its column is
            // named (here the input name: nobody curated a label), so the long labels are checked above, in the view.
            await row.getByRole('button', { name: /^History / }).click();
            dialog = page.getByRole('dialog');
            const history = dialog.getByTestId('form-list-history');
            await expect(history).toBeVisible();
            await expect(history.getByText('Version 2', { exact: true })).toBeVisible();
            await expectContained(dialog, `${size.name}: the history of the record`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the history of the record`);

            await history.getByRole('button', { name: 'Details of version 2' }).click();
            const version = history.getByTestId('form-list-history-version');
            await expect(version.getByText('qa_wide_02', { exact: true }).first()).toBeVisible();
            await expect(version.getByText(/Before: keep u+/)).toBeVisible();
            await expect(version.getByText(/After: changed value u+/)).toBeVisible();
            expect(await version.locator('dt').count(), 'the entry after the version lists its fields').toBeGreaterThanOrEqual(3);
            await expectContained(dialog, `${size.name}: the details of a version`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the details of a version`);

            await history.getByRole('button', { name: 'Compare with current: version 1' }).click();
            const compared = history.getByTestId('form-list-history-compare');
            await expect(compared.getByText('qa_wide_02', { exact: true }).first()).toBeVisible();
            await expectContained(dialog, `${size.name}: the comparison of two versions`);
            await expectNoSeriousA11yViolationsIn(page, '[role="dialog"]', `${size.name}: the comparison of two versions`);
            await page.keyboard.press('Escape');
            await expect(page.getByRole('dialog')).toHaveCount(0);
        });

        test('the form on a page: the same inputs and buttons, without a dialog', async () => {
            await page.goto(WIDE_PATH);
            await waitUntilSettled(page);
            const list = listRoot(page, 'widepage');
            await list.getByRole('button', { name: 'Add entry' }).click();
            const form = page.getByTestId('form-list-record-form');
            await expect(form).toBeVisible();
            await expect(input(form, 'qa_widepage', 1)).toBeVisible();
            await expectContained(form, `${size.name}: the form on a page`);
            await expectNoPageOverflow(page, `${size.name}: the form on a page`);
            await expectNoSeriousA11yViolationsIn(page, '[data-testid="form-list-record-form"]', `${size.name}: the form on a page`);

            await input(form, 'qa_widepage', 1).focus();
            const forward = await tabToSave(page, '[data-testid="form-list-record-form"]', size.height);
            expect(forward.questions, 'the questions Tab reaches on the page').toEqual(Array.from({ length: FIELD_COUNT - 1 }, (_, index) => index + 2));

            // Required input empty: the browser asks, nothing is sent; typed input stays.
            await input(form, 'qa_widepage', 2).fill(`page ${UNBROKEN}`);
            await form.getByRole('button', { name: 'Save', exact: true }).click();
            await expect(input(form, 'qa_widepage', 1)).toBeFocused();
            await expect(input(form, 'qa_widepage', 2)).toHaveValue(`page ${UNBROKEN}`);

            // The way back asks (there is input), and a page of the list is what is left.
            await page.getByRole('button', { name: 'Back to the list' }).click();
            await page.getByRole('dialog', { name: 'Discard your changes?' }).getByRole('button', { name: 'Discard changes' }).click();
            await expect(form).toHaveCount(0);
            await expect(list.getByRole('button', { name: 'Add entry' })).toBeVisible();
        });
    });
}
