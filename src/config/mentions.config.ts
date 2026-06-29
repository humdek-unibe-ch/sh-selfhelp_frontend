/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Shared Tiptap Mention Configuration
 * 
 * This module provides centralized configuration for mentions functionality
 * across all editor types (rich text and plain text input).
 */

import { type MentionOptions } from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import { type SuggestionProps, type SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { type Instance as TippyInstance, type GetReferenceClientRect } from 'tippy.js';
import {
    type ComponentClass,
    type ForwardRefExoticComponent,
    type FunctionComponent,
    type PropsWithoutRef,
    type RefAttributes,
} from 'react';
import type { IVariableListProps, IKeyboardHandler } from '../app/components/shared/mentions/MentionSuggestionList';

/**
 * Component used to render the mention suggestion dropdown.
 *
 * Mirrors the three constructor shapes Tiptap's `ReactRenderer` accepts
 * (`@tiptap/react`'s internal `ComponentType<R, P>`): a function component, a
 * class component, or a `forwardRef` component exposing the keyboard handler.
 */
type TMentionSuggestionComponent =
    | FunctionComponent<IVariableListProps>
    | ComponentClass<IVariableListProps>
    | ForwardRefExoticComponent<PropsWithoutRef<IVariableListProps> & RefAttributes<IKeyboardHandler>>;

/**
 * Variable suggestion item for mention dropdowns
 */
export interface IVariableSuggestion {
    id: string;
    label: string;
}

/**
 * Build the mention dropdown items from the backend `data_variables` map.
 *
 * Issue #56: `data_variables` is a `token => label` map. The mention `id` is the
 * stable interpolation TOKEN (inserted as `{{token}}` and persisted to content),
 * while `label` is the human display text shown in the picker — so an admin
 * browses/searches by the readable label but always stores the immutable key.
 * The token is treated as an opaque literal and is never reformatted here.
 *
 * @param dataVariables `token => label` map from the section `data_variables`.
 */
export function buildVariableSuggestions(dataVariables?: Record<string, string>): IVariableSuggestion[] {
    if (!dataVariables) {
        return [];
    }
    return Object.entries(dataVariables).map(([token, label]) => ({
        id: token,
        label: label || token,
    }));
}

/**
 * Resolve a single stored interpolation value to its human label.
 *
 * Issue #56 v2: a stored value is the immutable `{{token}}` (or a bare token);
 * the human `display_name` lives in `dataVariables` keyed by the bare token. This
 * is the single-value counterpart of {@link tokensToMentionHtml} (which handles
 * rich text): use it for one-chip widgets like the condition-builder field
 * selector and the custom-CSS pills so a reopened editor shows the readable
 * label, never the raw token. Display names may contain spaces — only the
 * visible label changes here, the stored token is returned untouched when no
 * label is known (unknown token, not-yet-loaded map, predefined value).
 *
 * @param raw stored value: `{{token}}`, a bare `token`, or a literal string
 * @param dataVariables `token => label` map for the current context
 */
export function resolveTokenLabel(raw: string, dataVariables?: Record<string, string>): string {
    if (!raw || !dataVariables) {
        return raw;
    }
    const token = raw.replace(/^\{\{/, '').replace(/\}\}$/, '').trim();
    const label = dataVariables[token];
    return label !== undefined && label.length > 0 ? label : raw;
}

/**
 * Variable bracket format for consistent mention rendering
 */
export const VARIABLE_BRACKET_FORMAT = '{{}}';

/**
 * Formats a variable ID into the standard bracket format
 * @param variableId - The variable identifier (e.g., 'user_email')
 * @returns Formatted variable (e.g., '{{user_email}}')
 */
export function formatVariable(variableId: string): string {
    return `${VARIABLE_BRACKET_FORMAT.slice(0, 2)}${variableId}${VARIABLE_BRACKET_FORMAT.slice(2)}`;
}

/**
 * Extracts the variable ID from a formatted variable string
 * @param formattedVariable - The formatted variable (e.g., '{{user_email}}')
 * @returns The variable ID (e.g., 'user_email') or null if not a valid format
 */
export function extractVariableId(formattedVariable: string): string | null {
    const match = formattedVariable.match(/^\{\{([^}]+)\}\}$/);
    return match ? match[1] : null;
}

/**
 * Checks if a string is a properly formatted variable
 * @param str - The string to check
 * @returns True if the string matches {{variable_id}} format
 */
export function isFormattedVariable(str: string): boolean {
    return /^\{\{[^}]+\}\}$/.test(str);
}

/**
 * Sanitizes HTML by removing mention styling but keeping properly formatted variables
 * Used when saving to database to ensure clean storage.
 *
 * Issue #56 v2: the chip shows the human `display_name`, but storage must keep the
 * immutable `{{token}}`. Each mention span carries the token in `data-id`, so we
 * serialize from `data-id` (never the visible label text).
 */
export function sanitizeForDatabase(html: string): string {
    if (!html) return html;

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Find all mention spans and replace them with formatted variables
    const mentionSpans = tempDiv.querySelectorAll('[data-type="mention"]');
    mentionSpans.forEach(span => {
        const variableId = span.getAttribute('data-id') || span.textContent || '';
        // Ensure the variable is properly formatted with brackets
        const formattedVariable = isFormattedVariable(variableId) ? variableId : formatVariable(variableId);
        const textNode = document.createTextNode(formattedVariable);
        span.parentNode?.replaceChild(textNode, span);
    });

    return tempDiv.innerHTML;
}

/** Escape a string for safe interpolation into HTML text content. */
function escapeHtmlText(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape a string for safe interpolation into a double-quoted HTML attribute. */
function escapeHtmlAttribute(text: string): string {
    return escapeHtmlText(text).replace(/"/g, '&quot;');
}

/**
 * Hydrate stored `{{token}}` occurrences back into Tiptap mention spans so the
 * editor shows label chips on load. This is the inverse of
 * {@link sanitizeForDatabase}: that turns chips into `{{token}}` for storage,
 * this turns `{{token}}` back into `<span data-type="mention" …>label</span>`.
 *
 * Issue #56 v2: the token is the immutable interpolation key (e.g.
 * `d.section_230`); the chip shows the human `display_name` from `dataVariables`.
 * Only tokens present in `dataVariables` become chips — unknown tokens (typos, a
 * not-yet-loaded variable, or system tokens absent from this section's map) stay
 * as literal `{{token}}` text so nothing is lost. The token is matched as an
 * opaque literal between `{{` and `}}`, so this stays forward-compatible with any
 * token shape the backend emits.
 *
 * @param content stored field content (HTML for rich text, plain for single-line)
 * @param dataVariables `token => label` map for the current section
 */
export function tokensToMentionHtml(content: string, dataVariables?: Record<string, string>): string {
    if (!content || !dataVariables) {
        return content;
    }
    return content.replace(/\{\{([^{}]+)\}\}/g, (whole: string, rawToken: string): string => {
        const token = rawToken.trim();
        if (!Object.prototype.hasOwnProperty.call(dataVariables, token)) {
            return whole;
        }
        const label = dataVariables[token] || token;
        return `<span data-type="mention" class="mention-variable" data-id="${escapeHtmlAttribute(token)}" data-label="${escapeHtmlAttribute(label)}">${escapeHtmlText(label)}</span>`;
    });
}

/**
 * Creates the base Tiptap Mention extension configuration
 * Following official Tiptap patterns for mention implementation
 *
 * `getVariables` is a live getter (not a snapshot array): the section variable
 * map loads asynchronously after the editor mounts (issue #56 v2), so reading it
 * lazily on every `{{` keystroke means the dropdown shows freshly-loaded
 * variables without recreating the editor (which would drop the caret / chips).
 */
export function createMentionConfig(
    getVariables: () => IVariableSuggestion[],
    SuggestionComponent: TMentionSuggestionComponent,
    maxVisibleRows: number = 5,
    maxItems: number = 50
): Partial<MentionOptions> {
    return {
        HTMLAttributes: {
            class: 'mention-variable',
            'data-type': 'mention',
        },
        renderText({ node }) {
            // Plain-text / single-line serialization always emits the stable
            // `{{token}}` so storage stays token-based regardless of the human
            // label shown in the chip (issue #56 v2).
            return formatVariable(node.attrs.id);
        },
        renderHTML({ options, node }) {
            // The chip displays the human label (display_name); `data-id` keeps
            // the immutable token, and `data-label` (emitted by the built-in
            // attribute via options.HTMLAttributes) lets it parse back into a
            // chip on reload. `sanitizeForDatabase` serializes back to
            // `{{token}}` from `data-id` (issue #56 v2).
            const label = typeof node.attrs.label === 'string' && node.attrs.label.length > 0
                ? node.attrs.label
                : formatVariable(node.attrs.id);
            return [
                'span',
                {
                    ...options.HTMLAttributes,
                    'data-id': node.attrs.id,
                },
                label,
            ];
        },
        suggestion: {
            char: '{{',
            pluginKey: new PluginKey('mention'),
            items: ({ query }: { query: string }) => {
                const variables = getVariables();
                const filtered = query.length > 0
                    ? variables.filter(v => v.label.toLowerCase().includes(query.toLowerCase()))
                    : variables;
                return filtered.slice(0, maxItems);
            },
            render: () => {
                let component: ReactRenderer<IKeyboardHandler, IVariableListProps> | null = null;
                let popup: TippyInstance[] | null = null;

                return {
                    onStart: (props: SuggestionProps<IVariableSuggestion>) => {
                        component = new ReactRenderer<IKeyboardHandler, IVariableListProps>(SuggestionComponent, {
                            props: {
                                items: props.items,
                                command: props.command,
                                maxVisibleRows,
                                maxItems,
                            },
                            editor: props.editor,
                        });

                        if (!props.clientRect) {
                            return;
                        }

                        popup = tippy('body', {
                            getReferenceClientRect: props.clientRect as GetReferenceClientRect,
                            appendTo: () => document.body,
                            content: component.element,
                            showOnCreate: true,
                            interactive: true,
                            trigger: 'manual',
                            placement: 'bottom-start',
                            zIndex: 999999,
                            arrow: false,
                            theme: 'light',
                            maxWidth: '400px',
                        });
                    },

                    onUpdate(props: SuggestionProps<IVariableSuggestion>) {
                        component?.updateProps({
                            items: props.items,
                            command: props.command,
                            maxVisibleRows,
                            maxItems,
                        });

                        if (!props.clientRect) {
                            return;
                        }

                        popup?.[0]?.setProps({
                            getReferenceClientRect: props.clientRect as GetReferenceClientRect,
                        });
                    },

                    onKeyDown(props: SuggestionKeyDownProps) {
                        if (props.event.key === 'Escape') {
                            popup?.[0]?.hide();
                            return true;
                        }

                        // Check if component has ref and onKeyDown method
                        if (component && typeof component.ref === 'object' && component.ref !== null) {
                            const ref = component.ref;
                            if (typeof ref.onKeyDown === 'function') {
                                return ref.onKeyDown(props);
                            }
                        }
                        return false;
                    },

                    onExit() {
                        popup?.[0]?.destroy();
                        component?.destroy();
                        popup = null;
                        component = null;
                    },
                };
            },
        },
    };
}

