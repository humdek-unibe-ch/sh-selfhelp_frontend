import { Icon } from '@tabler/icons-react';

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
    icon?: Icon;
    initiallyOpened?: boolean;
    links?: NavItem[];
    id?: number;
    isInMenu?: boolean;
}

export interface IResourceMeta {
    label: string;
    parent: string | undefined;
    canDelete: boolean;
    nav: boolean;
    navOrder: number | null;
    footer: boolean;
    footerOrder: number | null;
    params: Record<string, { type: string }>;
    protocol: string[];
}

export interface IResource {
    name: string;
    meta: IResourceMeta;
    list: string;
    show: string;
}