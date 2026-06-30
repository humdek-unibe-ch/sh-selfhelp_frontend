/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { Extension } from '@tiptap/core';

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
            /** Apply (or switch to) an email preset on the selection's link/block. */
            setEmailStyle: (className: string) => ReturnType;
            /** Remove any email preset from the selection's link + current block. */
            unsetEmailStyle: () => ReturnType;
        };
    }
}

/**
 * Preset classes that apply to a LINK (`<a>`): solid / outlined buttons + strong
 * link. Every other preset is a BLOCK preset applied to the current paragraph or
 * heading (callout box, muted footnote, large verification code).
 */
const LINK_PRESET_CLASSES: readonly string[] = ['email-button', 'email-button-secondary', 'email-link-strong'];

/**
 * Tiptap extension that round-trips the email "style preset" classes through the
 * editor. The presets are plain CSS classes the backend `MailHtmlRenderer` inlines
 * at send time, but they live on real elements: `email-button` / `email-button-secondary`
 * / `email-link-strong` on an `<a>`, and `email-callout` / `email-muted` / `email-code`
 * on a `<p>` / `<h*>`.
 *
 * A previous span-only mark never matched those elements, so the classes were
 * silently dropped on load and reseeded mails lost their styling (issue #56 mail
 * editor). This adds an `emailStyleClass` GLOBAL ATTRIBUTE to the paragraph,
 * heading and link types: it parses the known `email-*` class off the element and
 * re-renders it, so the styling survives load -> edit -> save. Only mail-config
 * bodies register this extension.
 */
export const EmailStyleExtension = Extension.create({
    name: 'emailStyle',

    addGlobalAttributes() {
        return [
            {
                types: ['paragraph', 'heading', 'link'],
                attributes: {
                    emailStyleClass: {
                        default: null,
                        parseHTML: (element) => {
                            const classes = (element.getAttribute('class') ?? '').split(/\s+/);
                            return classes.find((c) => isEmailPresetClass(c)) ?? null;
                        },
                        renderHTML: (attributes) => {
                            const className = attributes.emailStyleClass;
                            return typeof className === 'string' && className.length > 0
                                ? { class: className }
                                : {};
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setEmailStyle:
                (className: string) =>
                ({ editor, commands }) => {
                    if (LINK_PRESET_CLASSES.includes(className)) {
                        // Button / strong-link presets attach to the link mark, so
                        // the selection must already be a link (set its URL first).
                        return commands.updateAttributes('link', { emailStyleClass: className });
                    }
                    const blockType = editor.isActive('heading') ? 'heading' : 'paragraph';
                    return commands.updateAttributes(blockType, { emailStyleClass: className });
                },
            unsetEmailStyle:
                () =>
                ({ editor, chain }) => {
                    const blockType = editor.isActive('heading') ? 'heading' : 'paragraph';
                    return chain()
                        .updateAttributes('link', { emailStyleClass: null })
                        .updateAttributes(blockType, { emailStyleClass: null })
                        .run();
                },
        };
    },
});
