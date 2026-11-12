/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * M4: each CMS-app template has ONE form page for "Add new" and edit, shown as
 * a modal titled by the page title. "Frage bearbeiten" / "Edit question" made
 * the add dialog look like an edit, so the title must not name either mode.
 */
interface IBundlePage {
    keyword: string;
    fields?: Array<{ name: string; translations?: Array<{ content: string }> }>;
}

const DIR = join(process.cwd(), 'examples', 'cms-in-cms');
const bundles = readdirSync(DIR).filter((f) => f.endsWith('.bundle.json'));

describe('CMS app template form pages', () => {
    it.each(bundles)('%s: the shared add/edit form title names neither mode', (file) => {
        const { pages } = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as { pages: IBundlePage[] };
        const formPages = pages.filter((p) => p.fields?.some((f) => f.name === 'open_in_modal'));
        expect(formPages.length).toBeGreaterThan(0);

        for (const page of formPages) {
            const titles = page.fields?.find((f) => f.name === 'title')?.translations?.map((t) => t.content) ?? [];
            for (const title of titles) {
                expect(title, page.keyword).not.toMatch(/\b(edit|bearbeiten|add|new|hinzufügen|neu)\b/i);
            }
        }
    });
});
