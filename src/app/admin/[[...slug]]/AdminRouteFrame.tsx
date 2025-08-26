'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AdminShellWrapper } from '../../components/cms/admin-shell/AdminShellWrapper';

interface IAdminAsideContextValue {
    setAside: (node: React.ReactNode | null) => void;
    setAsideWidth: (width: number) => void;
}

const AdminAsideContext = createContext<IAdminAsideContextValue | null>(null);

export function useAdminRouteAside(): IAdminAsideContextValue {
    const ctx = useContext(AdminAsideContext);
    if (!ctx) {
        throw new Error('useAdminRouteAside must be used within <AdminRouteFrame>');
    }
    return ctx;
}

interface IAdminRouteFrameProps {
    children: React.ReactNode;
}

export function AdminRouteFrame({ children }: IAdminRouteFrameProps) {
    const [aside, setAsideNode] = useState<React.ReactNode | null>(null);
    const [asideWidth, setAsideWidthState] = useState<number>(420);

    const setAside = useCallback((node: React.ReactNode | null) => {
        setAsideNode(node);
    }, []);

    const setAsideWidth = useCallback((width: number) => {
        setAsideWidthState(width);
    }, []);

    const value = useMemo<IAdminAsideContextValue>(() => ({ setAside, setAsideWidth }), [setAside, setAsideWidth]);

    return (
        <AdminAsideContext.Provider value={value}>
            <AdminShellWrapper aside={aside} asideWidth={asideWidth}>
                {children}
            </AdminShellWrapper>
        </AdminAsideContext.Provider>
    );
}




