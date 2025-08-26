/**
 * Sections State Store
 * 
 * Global state management for page sections expand/collapse states.
 * Keeps track of which sections are expanded/collapsed per page
 * to provide consistent UX across navigation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ISectionsState {
    // Store expanded sections state by page ID
    // Key format: "page:123" -> array of section IDs
    expandedSectionsState: Record<string, number[]>;
    
    // Actions
    setExpandedSections: (pageId: number, sectionIds: number[]) => void;
    getExpandedSections: (pageId: number) => number[];
    toggleSection: (pageId: number, sectionId: number) => void;
    expandAll: (pageId: number, allSectionIds: number[]) => void;
    collapseAll: (pageId: number) => void;
    clearSectionsState: () => void;
}

export const useSectionsStore = create<ISectionsState>()(
    persist(
        (set, get) => ({
            expandedSectionsState: {},
            
            setExpandedSections: (pageId: number, sectionIds: number[]) => {
                const key = `page:${pageId}`;
                set((state) => ({
                    expandedSectionsState: {
                        ...state.expandedSectionsState,
                        [key]: sectionIds
                    }
                }));
            },
            
            getExpandedSections: (pageId: number) => {
                const key = `page:${pageId}`;
                const state = get();
                return state.expandedSectionsState[key] ?? [];
            },
            
            toggleSection: (pageId: number, sectionId: number) => {
                const key = `page:${pageId}`;
                const state = get();
                const currentExpanded = state.expandedSectionsState[key] ?? [];
                
                const newExpanded = currentExpanded.includes(sectionId)
                    ? currentExpanded.filter(id => id !== sectionId)
                    : [...currentExpanded, sectionId];
                
                set((state) => ({
                    expandedSectionsState: {
                        ...state.expandedSectionsState,
                        [key]: newExpanded
                    }
                }));
            },
            
            expandAll: (pageId: number, allSectionIds: number[]) => {
                const key = `page:${pageId}`;
                set((state) => ({
                    expandedSectionsState: {
                        ...state.expandedSectionsState,
                        [key]: allSectionIds
                    }
                }));
            },
            
            collapseAll: (pageId: number) => {
                const key = `page:${pageId}`;
                set((state) => ({
                    expandedSectionsState: {
                        ...state.expandedSectionsState,
                        [key]: []
                    }
                }));
            },
            
            clearSectionsState: () => {
                set({ expandedSectionsState: {} });
            }
        }),
        {
            name: 'sections-state', // localStorage key
            partialize: (state) => ({ 
                expandedSectionsState: state.expandedSectionsState
            }),
        }
    )
);

export type { ISectionsState };
