/**
 * Inspector State Store
 * 
 * Global state management for inspector collapse/expand states.
 * Keeps track of which sections (Content, Properties, etc.) are collapsed
 * across different pages and sections to provide consistent UX.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IInspectorState {
    // Store collapse state by inspector type and section name
    // Key format: "pageInspector:content" or "sectionInspector:properties"
    collapsedSections: Record<string, boolean>;
    
    // Actions
    setCollapsed: (inspectorType: string, sectionName: string, collapsed: boolean) => void;
    isCollapsed: (inspectorType: string, sectionName: string) => boolean;
    clearInspectorState: () => void;
}

export const useInspectorStore = create<IInspectorState>()(
    persist(
        (set, get) => ({
            collapsedSections: {},
            
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
            
            clearInspectorState: () => {
                set({ collapsedSections: {} });
            }
        }),
        {
            name: 'inspector-state', // localStorage key
            partialize: (state) => ({ 
                collapsedSections: state.collapsedSections
            }),
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
