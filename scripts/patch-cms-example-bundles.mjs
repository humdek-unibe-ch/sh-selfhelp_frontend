#!/usr/bin/env node
/**
 * One-shot patcher for CMS-in-CMS example bundles: translatable text fields,
 * datetime pickers, localized seed rows, and mobile spacing classes.
 */
import { readFileSync, writeFileSync, copyFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const examplesDir = join(__dirname, '../examples/cms-in-cms');
const backendFixtures = join(__dirname, '../../sh-selfhelp_backend/tests/fixtures/examples');

const TRANSlatable_FLAG = {
    translatable: { all: { content: '1' } },
};

const DATE_TIME_PICKER = {
    style_name: 'date-picker',
    fields: {
        web_datepicker_type: { all: { content: 'datetime' } },
        web_datepicker_format: { all: { content: 'YYYY-MM-DD HH:mm' } },
        web_datepicker_placeholder: { all: { content: '2026-07-06 14:30' } },
    },
};

function deepMergeFields(section, extraFields) {
    section.fields = { ...section.fields, ...extraFields };
}

function setSectionCssMobile(section, classes) {
    if (!section) return;
    section.global_fields = {
        ...(section.global_fields ?? {}),
        css_mobile: classes,
    };
}

function patchNews(bundle) {
    const form = findSection(bundle, 'news-form');
    if (form) {
        deepMergeFields(findChild(form, 'news-form-title'), TRANSlatable_FLAG);
        deepMergeFields(findChild(form, 'news-form-summary'), TRANSlatable_FLAG);
        const published = findChild(form, 'news-form-published-on');
        if (published) {
            published.style_name = 'date-picker';
            published.fields = {
                ...published.fields,
                ...DATE_TIME_PICKER.fields,
            };
            published.fields.label = {
                'de-CH': { content: 'Datum und Zeit' },
                'en-GB': { content: 'Date and time' },
            };
        }
    }
    setSectionCssMobile(findSection(bundle, 'news-list-card'), 'px-md py-md gap-sm');
    setSectionCssMobile(findSection(bundle, 'news-list'), 'px-md py-lg gap-md');
    localizeRows(bundle, 'news-form', {
        title: [
            ['New study platform goes live', 'Neue Studienplattform ist live'],
            ['Maintenance window on Friday', 'Wartungsfenster am Freitag'],
            ['Two new questionnaire templates', 'Zwei neue Fragebogen-Vorlagen'],
            ['Summer office hours', 'Sommer-Sprechzeiten'],
        ],
        summary: [
            ['The redesigned participant portal is now open to all study groups.', 'Das überarbeitete Teilnehmerportal steht allen Studiengruppen offen.'],
            ['The platform will be read-only between 06:00 and 07:00 CET.', 'Die Plattform ist zwischen 06:00 und 07:00 MEZ nur lesbar.'],
            ['Weekly mood tracking and sleep diary templates are ready to import.', 'Wöchentlicher Stimmungs-Tracker und Schlaftagebuch sind importierbar.'],
            ['Support replies within two working days during July and August.', 'Support antwortet im Juli und August innerhalb von zwei Arbeitstagen.'],
        ],
    });
}

function patchEvents(bundle) {
    const form = findSection(bundle, 'events-form');
    if (form) {
        deepMergeFields(findChild(form, 'events-form-title'), TRANSlatable_FLAG);
        const dateField = findChild(form, 'events-form-date');
        if (dateField) {
            dateField.style_name = 'date-picker';
            dateField.fields = { ...dateField.fields, ...DATE_TIME_PICKER.fields };
        }
    }
    setSectionCssMobile(findSection(bundle, 'events-list-card'), 'px-md py-md gap-sm');
    localizeRows(bundle, 'events-form', {
        title: [
            ['Study kickoff webinar', 'Kick-off-Webinar zur Studie'],
            ['Coordinator workshop', 'Koordinatorinnen-Workshop'],
            ['Open lab day', 'Tag der offenen Labortür'],
            ['Results evening', 'Ergebnisabend'],
        ],
    });
}

function patchFaq(bundle) {
    const form = findSection(bundle, 'faq-form');
    if (form) {
        deepMergeFields(findChild(form, 'faq-form-question'), TRANSlatable_FLAG);
    }
    setSectionCssMobile(findSection(bundle, 'faq-list'), 'px-md py-lg gap-md');
    localizeRows(bundle, 'faq-form', {
        question: [
            ['How do I reset my password?', 'Wie setze ich mein Passwort zurück?'],
            ['Can I use the platform on my phone?', 'Kann ich die Plattform auf dem Handy nutzen?'],
            ['Who can see my answers?', 'Wer kann meine Antworten sehen?'],
            ['How do I withdraw from a study?', 'Wie trete ich aus einer Studie aus?'],
            ['Which browsers are supported?', 'Welche Browser werden unterstützt?'],
        ],
    });
}

function patchTeamMembers(bundle) {
    setSectionCssMobile(findSection(bundle, 'team-members-list-card'), 'px-md py-md gap-sm');
    setSectionCssMobile(findSection(bundle, 'team-members-record-card'), 'px-md py-lg gap-md');
}

function patchContact(bundle) {
    setSectionCssMobile(findSection(bundle, 'contact-directory-list-card'), 'px-md py-md gap-sm');
}

function patchTestimonials(bundle) {
    setSectionCssMobile(findSection(bundle, 'testimonials-list-card'), 'px-md py-md gap-sm');
    localizeRows(bundle, 'testimonials-form', {
        role: [
            ['Study participant, wave 2', 'Studienteilnehmerin, Welle 2'],
            ['Principal Investigator, cardiology', 'Hauptprüferin Kardiologie'],
            ['Research coordinator', 'Studienkoordinatorin'],
            ['IT support lead', 'IT-Support-Leitung'],
        ],
    });
}

function localizeRows(bundle, ownerName, columnMaps) {
    const table = bundle.data_tables?.find((t) => t.owner_section_name === ownerName);
    if (!table?.rows) return;
    for (const [column, pairs] of Object.entries(columnMaps)) {
        pairs.forEach(([en, de], index) => {
            const row = table.rows[index];
            if (!row) return;
            row[column] = { 'en-GB': en, 'de-CH': de };
        });
    }
}

function walkSections(sections, visitor) {
    if (!Array.isArray(sections)) return;
    for (const section of sections) {
        visitor(section);
        walkSections(section.children, visitor);
    }
}

function findSection(bundle, name) {
    let found = null;
    for (const page of bundle.pages ?? []) {
        walkSections(page.sections, (section) => {
            if (section.section_name === name) found = section;
        });
    }
    return found;
}

function findChild(parent, name) {
    return parent?.children?.find((c) => c.section_name === name) ?? null;
}

const patchers = {
    'news.bundle.json': patchNews,
    'events.bundle.json': patchEvents,
    'faq.bundle.json': patchFaq,
    'team-members.bundle.json': patchTeamMembers,
    'contact-directory.bundle.json': patchContact,
    'testimonials.bundle.json': patchTestimonials,
};

for (const file of readdirSync(examplesDir).filter((f) => f.endsWith('.bundle.json'))) {
    const patcher = patchers[file];
    if (!patcher) continue;
    const path = join(examplesDir, file);
    const bundle = JSON.parse(readFileSync(path, 'utf8'));
    patcher(bundle);
    writeFileSync(path, `${JSON.stringify(bundle, null, 4)}\n`);
    copyFileSync(path, join(backendFixtures, file));
    console.log(`patched ${file}`);
}
