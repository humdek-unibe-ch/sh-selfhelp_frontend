import { create } from 'zustand';
import { IAdminPage } from '../../types/responses/admin/admin.types';
import { debug } from '../../utils/debug-logger';

export interface AdminState {
    selectedPage: IAdminPage | null;
    setSelectedPage: (page: IAdminPage | null) => void;
    clearSelectedPage: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    selectedPage: null,
    
    setSelectedPage: (page: IAdminPage | null) => {
        debug('Setting selected page', 'AdminStore', { keyword: page?.keyword });
        set({ selectedPage: page });
    },
    
    clearSelectedPage: () => {
        debug('Clearing selected page', 'AdminStore');
        set({ selectedPage: null });
    }
}));

// Type-safe selector hooks
export const useSelectedPage = (): IAdminPage | null => 
    useAdminStore((state) => state.selectedPage);

export const useSetSelectedPage = () => 
    useAdminStore((state) => state.setSelectedPage);

export const useClearSelectedPage = () => 
    useAdminStore((state) => state.clearSelectedPage); 