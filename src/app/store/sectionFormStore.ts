import { create } from 'zustand';

interface ISectionFormState {
    // Section name
    sectionName: string;
    
    // Section properties (non-translatable fields)
    properties: Record<string, string | boolean>;
    
    // Field values by language (translatable fields)
    fields: Record<string, Record<number, string>>;
    
    // Global section-level properties
    globalFields: {
        condition: string;
        data_config: string;
        css: string;
        css_mobile: string;
        debug: boolean;
    };
}

interface ISectionFormStore extends ISectionFormState {
    // Actions for updating individual fields
    setSectionName: (name: string) => void;
    setContentField: (fieldName: string, languageId: number, value: string) => void;
    setPropertyField: (fieldName: string, value: string | boolean) => void;
    setGlobalField: (fieldName: keyof ISectionFormState['globalFields'], value: string | boolean) => void;
    
    // Bulk actions
    setFormValues: (values: ISectionFormState) => void;
    reset: () => void;
}

const defaultState: ISectionFormState = {
    sectionName: '',
    properties: {},
    fields: {},
    globalFields: {
        condition: '',
        data_config: '',
        css: '',
        css_mobile: '',
        debug: false
    }
};

export const useSectionFormStore = create<ISectionFormStore>((set) => ({
    ...defaultState,
    
    setSectionName: (name: string) => set((state) => ({
        ...state,
        sectionName: name
    })),
    
    setContentField: (fieldName: string, languageId: number, value: string) => set((state) => ({
        ...state,
        fields: {
            ...state.fields,
            [fieldName]: {
                ...(state.fields[fieldName] || {}),
                [languageId]: value
            }
        }
    })),
    
    setPropertyField: (fieldName: string, value: string | boolean) => set((state) => ({
        ...state,
        properties: {
            ...state.properties,
            [fieldName]: value
        }
    })),
    
    setGlobalField: (fieldName: keyof ISectionFormState['globalFields'], value: string | boolean) => set((state) => ({
        ...state,
        globalFields: {
            ...state.globalFields,
            [fieldName]: value
        }
    })),
    
    setFormValues: (values: ISectionFormState) => set(() => values),
    
    reset: () => set(() => defaultState)
}));
