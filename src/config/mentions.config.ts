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
 * Used when saving to database to ensure clean storage
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

/**
 * Creates the base Tiptap Mention extension configuration
 * Following official Tiptap patterns for mention implementation
 */
export function createMentionConfig(
    variables: IVariableSuggestion[],
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
            return formatVariable(node.attrs.id);
        },
        renderHTML({ options, node }) {
            return [
                'span',
                {
                    ...options.HTMLAttributes,
                    'data-id': node.attrs.id,
                },
                formatVariable(node.attrs.id),
            ];
        },
        suggestion: {
            char: '{{',
            pluginKey: new PluginKey('mention'),
            items: ({ query }: { query: string }) => {
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

