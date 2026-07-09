#!/usr/bin/env node
/*
 * SPDX-FileCopyrightText: 2026 Humdek, University of Bern
 * SPDX-License-Identifier: MPL-2.0
 */
import fs from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node rewrite-entry-bundle-fields.mjs <bundle.json> [...]');
  process.exit(1);
}

function parseDataConfig(globalFields) {
  const raw = globalFields?.data_config;
  if (typeof raw !== 'string' || raw.trim() === '') {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed[0] : null;
  } catch {
    return null;
  }
}

function rewriteSection(section) {
  const style = section.style_name;
  if (style !== 'entry-list' && style !== 'entry-record') {
    if (Array.isArray(section.children)) {
      section.children.forEach(rewriteSection);
    }
    return;
  }

  const globalFields = section.global_fields ?? {};
  const cfg = parseDataConfig(globalFields);
  const tableToken = cfg?.table ?? section.fields?.data_table?.all?.content ?? '';
  const ownEntries = cfg?.current_user === false ? '0' : '1';

  section.fields = section.fields ?? {};
  section.fields.data_table = { all: { content: String(tableToken) } };
  section.fields.own_entries_only = { all: { content: ownEntries } };
  section.fields.filter = section.fields.filter ?? { all: { content: '' } };
  section.fields.scope = section.fields.scope ?? { all: { content: '' } };

  if (style === 'entry-record') {
    section.fields.url_param = section.fields.url_param ?? { all: { content: 'record_id' } };
  }

  if (globalFields.data_config) {
    delete globalFields.data_config;
    if (Object.keys(globalFields).length === 0) {
      delete section.global_fields;
    } else {
      section.global_fields = globalFields;
    }
  }

  if (Array.isArray(section.children)) {
    section.children.forEach(rewriteSection);
  }
}

for (const file of targets) {
  const abs = path.resolve(file);
  const bundle = JSON.parse(fs.readFileSync(abs, 'utf8'));
  for (const page of bundle.pages ?? []) {
    for (const section of page.sections ?? []) {
      rewriteSection(section);
    }
  }
  fs.writeFileSync(abs, JSON.stringify(bundle, null, 4) + '\n');
  console.log('rewrote', abs);
}
