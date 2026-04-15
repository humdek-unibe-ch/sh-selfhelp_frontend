import { create } from 'zustand';

interface IPageFormState {
    keyword: string;
    url: string;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
    headerMenuEnabled: boolean;
    footerMenuEnabled: boolean;
    fields: Record<string, Record<number, string>>;
    isInitialized: boolean;
}

interface IPageFormStore extends IPageFormState {
    setKeyword: (keyword: string) => void;
    setUrl: (url: string) => void;
    setHeadless: (headless: boolean) => void;
    setNavPosition: (position: number | null) => void;
    setFooterPosition: (position: number | null) => void;
    setOpenAccess: (openAccess: boolean) => void;
    setPageAccessType: (pageAccessType: string) => void;
    setHeaderMenuEnabled: (enabled: boolean) => void;
    setFooterMenuEnabled: (enabled: boolean) => void;
    setContentField: (fieldName: string, languageId: number, value: string) => void;
    setFormValues: (values: Omit<IPageFormState, 'isInitialized'>) => void;
    reset: () => void;
}

const defaultState: IPageFormState = {
    keyword: '',
    url: '',
    headless: false,
    navPosition: null,
    footerPosition: null,
    openAccess: false,
    pageAccessType: '',
    headerMenuEnabled: false,
    footerMenuEnabled: false,
    fields: {},
    isInitialized: false
};

export const usePageFormStore = create<IPageFormStore>((set) => ({
    ...defaultState,

    setKeyword: (keyword: string) => set({ keyword }),

    setUrl: (url: string) => set({ url }),

    setHeadless: (headless: boolean) => set({ headless }),

    setNavPosition: (position: number | null) => set({ navPosition: position }),

    setFooterPosition: (position: number | null) => set({ footerPosition: position }),

    setOpenAccess: (openAccess: boolean) => set({ openAccess: openAccess }),

    setPageAccessType: (pageAccessType: string) => set({ pageAccessType }),

    setHeaderMenuEnabled: (enabled: boolean) => set((state) => ({
        headerMenuEnabled: enabled,
        navPosition: enabled ? state.navPosition : null
    })),

    setFooterMenuEnabled: (enabled: boolean) => set((state) => ({
        footerMenuEnabled: enabled,
        footerPosition: enabled ? state.footerPosition : null
    })),

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
