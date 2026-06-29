/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Mark, mergeAttributes } from '@tiptap/core';

/**
 * Email "style preset" contract (issue #56 mail editor).
 *
 * The mail-config WYSIWYG lets non-technical admins apply a small, named set of
 * email-safe styles (buttons, callouts, muted text, inline code) by attaching a
 * CSS class to a selection. The class is stored verbatim in the body fragment;
 * at send time the backend `App\Service\Auth\MailHtmlRenderer` inlines each class
 * into email-client-safe inline CSS. THIS LIST MUST STAY IN LOCKSTEP with the
 * `PRESET_STYLES` keys in that PHP renderer — adding/removing a preset means
 * editing both files (and the docs in backend `docs/reference/email-styles.md`).
 */
export interface IEmailStylePreset {
    /** Stable id used by the editor Style dropdown. */
    id: string;
    /** Human label shown in the dropdown. */
    label: string;
    /** The `email-*` CSS class stored on the element + inlined by the backend. */
    className: string;
    /** One-line admin-facing description. */
    description: string;
}

export const EMAIL_STYLE_PRESETS: readonly IEmailStylePreset[] = [
    {
        id: 'primary_button',
        label: 'Primary button',
        className: 'email-button',
        description: 'Solid call-to-action button. Apply to a link.',
    },
    {
        id: 'secondary_button',
        label: 'Secondary button',
        className: 'email-button-secondary',
        description: 'Outlined call-to-action button. Apply to a link.',
    },
    {
        id: 'text_link_strong',
        label: 'Strong link',
        className: 'email-link-strong',
        description: 'Bold, underlined link for emphasis.',
    },
    {
        id: 'muted_text',
        label: 'Muted text',
        className: 'email-muted',
        description: 'Small grey text for footnotes / disclaimers.',
    },
    {
        id: 'callout_box',
        label: 'Callout box',
        className: 'email-callout',
        description: 'Highlighted block for codes, links or notices.',
    },
    {
        id: 'code_block',
        label: 'Inline code',
        className: 'email-code',
        description: 'Large monospace text for verification codes.',
    },
] as const;

/** The set of recognised `email-*` preset classes. */
export const EMAIL_STYLE_CLASSES: readonly string[] = EMAIL_STYLE_PRESETS.map((p) => p.className);

/** True when `value` is exactly one of the known email preset classes. */
export function isEmailPresetClass(value: string): boolean {
    return EMAIL_STYLE_CLASSES.includes(value.trim());
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        emailStyle: {
            /** Apply (or switch to) an email preset class on the selection. */
            setEmailStyle: (className: string) => ReturnType;
            /** Remove any email preset class from the selection. */
            unsetEmailStyle: () => ReturnType;
        };
    }
}

/**
 * Tiptap mark that stores a single email preset class on a span. It only claims
 * spans whose class is a known `email-*` preset, so it never collides with the
 * mention chip span (`data-type="mention"`) or arbitrary authored markup. The
 * mark excludes itself (ProseMirror default), so switching presets replaces the
 * previous one instead of stacking.
 */
export const EmailStyleMark = Mark.create({
    name: 'emailStyle',

    addAttributes() {
        return {
            className: {
                default: null,
                parseHTML: (element) => element.getAttribute('class'),
                renderHTML: (attributes) =>
                    attributes.className ? { class: attributes.className as string } : {},
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[class]',
                getAttrs: (node) => {
                    const className = (node as HTMLElement).getAttribute('class') ?? '';
                    return isEmailPresetClass(className) ? { className } : false;
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes), 0];
    },

    addCommands() {
        const markName = this.name;
        return {
            setEmailStyle:
                (className: string) =>
                ({ commands }) =>
                    commands.setMark(markName, { className }),
            unsetEmailStyle:
                () =>
                ({ commands }) =>
                    commands.unsetMark(markName),
        };
    },
});
