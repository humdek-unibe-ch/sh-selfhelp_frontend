export interface IRoute {
    title: string;
    path: string;
    isNav: boolean;
    position: number | null;
    params: Record<string, { type: string }>;
    protocol: string[];
}

export interface IUrlParam {
    name: string;
    type: 'i' | 'a' | 's' | 'h';  // integer, alphanumeric, string, hash
    value?: string | number;
}

export interface NavItem {
    label: string;
    link?: string;
    icon?: any;
    initiallyOpened?: boolean;
    links?: NavItem[];
    id?: number;
    isInMenu?: boolean;
}