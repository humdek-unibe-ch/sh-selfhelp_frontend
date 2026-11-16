/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Each CMS-app template defines its inputs once: the CMS list (`entry-form-list`) owns one inline
 * form, and nothing else in the bundle is a form. There is no separate form page (the old model
 * kept one "Add new" page shown in a modal, which is why its title had to name neither mode); the
 * list draws the dialog and names the mode itself ("Add ..." / "Edit ..."). Public pages only read
 * the same table (`data-view`, `entry-record`), so the inputs are never defined twice.
 */
interface IBundleSection {
    section_name?: string;
    style_name: string;
    fields?: Record<string, Record<string, { content?: string | null }>>;
    children?: IBundleSection[];
}

interface IBundlePage {
    keyword: string;
    cms_app_role?: string;
    fields?: Array<{ name: string }>;
    sections?: IBundleSection[];
}

const DIR = join(process.cwd(), 'examples', 'cms-in-cms');
const bundles = readdirSync(DIR).filter((f) => f.endsWith('.bundle.json'));

function flatten(sections: IBundleSection[] | undefined): IBundleSection[] {
    return (sections ?? []).flatMap((section) => [section, ...flatten(section.children)]);
}

function stylesOf(page: IBundlePage): string[] {
    return flatten(page.sections).map((section) => section.style_name);
}

describe('CMS app template forms', () => {
    it.each(bundles)('%s: the CMS list owns the one inline form and no page is a separate form page', (file) => {
        const { pages } = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as { pages: IBundlePage[] };

        expect(
            pages.filter((page) => page.fields?.some((field) => field.name === 'open_in_modal')),
            'no separate form page',
        ).toEqual([]);

        const lists = pages.filter((page) => stylesOf(page).includes('entry-form-list'));
        expect(lists.map((page) => page.cms_app_role), 'one CMS list').toEqual(['cms_list']);

        const forms = stylesOf(lists[0]).filter((style) => style === 'form-record' || style === 'form-log');
        expect(forms, 'the list holds its form inline, once').toHaveLength(1);
    });

    it.each(bundles)('%s: public pages read the table and define no input', (file) => {
        const { pages } = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as { pages: IBundlePage[] };
        const publicPages = pages.filter((page) => page.cms_app_role !== 'cms_list');

        expect(publicPages.length, 'the template has a public page').toBeGreaterThan(0);
        for (const page of publicPages) {
            const inputs = stylesOf(page).filter((style) => /^(form-|text-input|textarea|select|file-input|radio|checkbox|slider)/.test(style));
            expect(inputs, `${page.keyword} defines no input`).toEqual([]);
        }
    });

    // A data view with the layout `custom` draws its child sections once per record. The template can only
    // use what the view projects, so every token has to be a column, a label of a column, or a system value.
    const SYSTEM_TOKENS = new Set(['record_id', 'entry_date']);
    const TOKEN = /\{\{\s*([^{}]+?)\s*\}\}/g;

    function dataViewsOf(page: IBundlePage): IBundleSection[] {
        return flatten(page.sections).filter((section) => section.style_name === 'data-view');
    }

    function fieldValue(section: IBundleSection, name: string): string {
        const field = section.fields?.[name];
        return field?.all?.content ?? Object.values(field ?? {})[0]?.content ?? '';
    }

    function tokensOf(sections: IBundleSection[]): string[] {
        const tokens: string[] = [];
        for (const section of flatten(sections)) {
            for (const translations of Object.values(section.fields ?? {})) {
                for (const { content } of Object.values(translations)) {
                    for (const match of (content ?? '').matchAll(TOKEN)) tokens.push(match[1]);
                }
            }
        }
        return tokens;
    }

    const customViews = bundles.flatMap((file) => {
        const { pages } = JSON.parse(readFileSync(join(DIR, file), 'utf8')) as { pages: IBundlePage[] };
        return pages.flatMap((page) => dataViewsOf(page).filter((view) => fieldValue(view, 'list_layout') === 'custom').map((view) => ({ file, view })));
    });

    it('the events, the contact directory and the testimonials are data views with a record template', () => {
        expect(customViews.map(({ file }) => file).sort()).toEqual([
            'contact-directory.bundle.json',
            'events.bundle.json',
            'testimonials.bundle.json',
        ]);
    });

    it.each(customViews)('$file: the record template holds sections, no form or list, and the holder has classes', ({ view }) => {
        const children = view.children ?? [];
        expect(children.length, 'the template has a root section').toBeGreaterThan(0);
        expect(fieldValue(view, 'list_row_css').trim(), 'the element that holds the records is a responsive grid').toMatch(/grid-cols-1/);
        expect(
            flatten(children).filter((section) => /^(entry-|data-view|form-)/.test(section.style_name)),
            'a record template draws a record, not another list or form',
        ).toEqual([]);
    });

    it.each(customViews)('$file: every token of the record template is a column of the view', ({ view }) => {
        const columns = new Set((JSON.parse(fieldValue(view, 'list_columns')) as Array<{ field: string }>).map((column) => column.field));
        const known = (token: string): boolean => SYSTEM_TOKENS.has(token) || columns.has(token) || (token.startsWith('_') && token.endsWith('_label') && columns.has(token.slice(1, -6)));

        const unknown = [...new Set(tokensOf(view.children ?? []))].filter((token) => !known(token));
        expect(unknown, 'tokens the view does not project').toEqual([]);
    });
});
