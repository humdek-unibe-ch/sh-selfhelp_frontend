/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { create } from 'zustand';
import { type IPageRouteItem } from '../../types/common/pages.type';

interface IPageFormState {
    keyword: string;
    url: string;
    headless: boolean;
    openAccess: boolean;
    pageAccessType: string;
    /** CMS-in-CMS organization axis (issue #30): `public` | `cms`. */
    surface: 'public' | 'cms';
    /** DB-driven public routes edited by the Routes panel (issue #30). */
    routes: IPageRouteItem[];
    fields: Record<string, Record<number, string>>;
    isInitialized: boolean;
}

interface IPageFormStore extends IPageFormState {
    setKeyword: (keyword: string) => void;
    setUrl: (url: string) => void;
    setHeadless: (headless: boolean) => void;
    setOpenAccess: (openAccess: boolean) => void;
    setPageAccessType: (pageAccessType: string) => void;
    setSurface: (surface: 'public' | 'cms') => void;
    setRoutes: (routes: IPageRouteItem[]) => void;
    setContentField: (fieldName: string, languageId: number, value: string) => void;
    setFormValues: (values: Omit<IPageFormState, 'isInitialized'>) => void;
    reset: () => void;
}

const defaultState: IPageFormState = {
    keyword: '',
    url: '',
    headless: false,
    openAccess: false,
    pageAccessType: '',
    surface: 'public',
    routes: [],
    fields: {},
    isInitialized: false
};

export const usePageFormStore = create<IPageFormStore>((set) => ({
    ...defaultState,

    setKeyword: (keyword: string) => set({ keyword }),

    setUrl: (url: string) => set({ url }),

    setHeadless: (headless: boolean) => set({ headless }),

    setOpenAccess: (openAccess: boolean) => set({ openAccess: openAccess }),

    setPageAccessType: (pageAccessType: string) => set({ pageAccessType }),

    setSurface: (surface: 'public' | 'cms') => set({ surface }),

    setRoutes: (routes: IPageRouteItem[]) => set({ routes }),

    setContentField: (fieldName: string, languageId: number, value: string) => set((state) => ({
        fields: {
            ...state.fields,
            [fieldName]: {
                ...(state.fields[fieldName] || {}),
                [languageId]: value
            }
        }
    })),

    setFormValues: (values: Omit<IPageFormState, 'isInitialized'>) => set(() => ({
        ...values,
        isInitialized: true
    })),

    reset: () => set(() => defaultState)
}));

export type { IPageFormState };
