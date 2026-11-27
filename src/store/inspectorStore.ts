/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Inspector State Store
 * 
 * Global state management for inspector collapse/expand states.
 * Keeps track of which sections (Content, Properties, etc.) are collapsed
 * across different pages and sections to provide consistent UX.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    clampPageEditorSplit,
    PAGE_EDITOR_SPLIT_DEFAULT,
} from './pageEditorSplit';

interface IInspectorState {
    // Store collapse state by inspector type and section name
    // Key format: "pageInspector:content" or "sectionInspector:properties"
    collapsedSections: Record<string, boolean>;
    /** Tree / inspector pane sizes (percent). Per-device via localStorage. */
    pageEditorSplit: [number, number];

    // Actions
    setCollapsed: (inspectorType: string, sectionName: string, collapsed: boolean) => void;
    isCollapsed: (inspectorType: string, sectionName: string) => boolean;
    setPageEditorSplit: (sizes: [number, number]) => void;
    resetPageEditorSplit: () => void;
    clearInspectorState: () => void;
}

export const useInspectorStore = create<IInspectorState>()(
    persist(
        (set, get) => ({
            collapsedSections: {},
            pageEditorSplit: [...PAGE_EDITOR_SPLIT_DEFAULT] as [number, number],

            setCollapsed: (inspectorType: string, sectionName: string, collapsed: boolean) => {
                const key = `${inspectorType}:${sectionName}`;
                set((state) => ({
                    collapsedSections: {
                        ...state.collapsedSections,
                        [key]: collapsed
                    }
                }));
            },

            isCollapsed: (inspectorType: string, sectionName: string) => {
                const key = `${inspectorType}:${sectionName}`;
                const state = get();
                return state.collapsedSections[key] ?? false; // Default to expanded
            },

            setPageEditorSplit: (sizes: [number, number]) => {
                set({ pageEditorSplit: clampPageEditorSplit(sizes) });
            },

            resetPageEditorSplit: () => {
                set({ pageEditorSplit: [...PAGE_EDITOR_SPLIT_DEFAULT] as [number, number] });
            },

            clearInspectorState: () => {
                set({
                    collapsedSections: {},
                    pageEditorSplit: [...PAGE_EDITOR_SPLIT_DEFAULT] as [number, number],
                });
            }
        }),
        {
            name: 'inspector-state', // localStorage key
            partialize: (state) => ({
                collapsedSections: state.collapsedSections,
                pageEditorSplit: state.pageEditorSplit,
            }),
            merge: (persisted, current) => {
                const raw = (persisted ?? {}) as Partial<IInspectorState>;
                return {
                    ...current,
                    ...raw,
                    pageEditorSplit: clampPageEditorSplit(
                        raw.pageEditorSplit ?? current.pageEditorSplit,
                    ),
                    collapsedSections: raw.collapsedSections ?? current.collapsedSections,
                };
            },
        }
    )
);

/**
 * Inspector types for consistent naming
 */
export const INSPECTOR_TYPES = {
    PAGE: 'pageInspector',
    SECTION: 'sectionInspector',
    CONFIGURATION: 'configurationInspector'
} as const;

/**
 * Common section names for consistent naming
 */
export const INSPECTOR_SECTIONS = {
    CONTENT: 'content',
    PROPERTIES: 'properties',
    FIELDS: 'fields',
    SETTINGS: 'settings',
    ADVANCED: 'advanced'
} as const;
