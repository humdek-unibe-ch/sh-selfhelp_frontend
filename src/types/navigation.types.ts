export interface NavigationResponse {
    success: boolean;
    data: NavigationItem[];
}

export interface NavigationItem {
    id_users: number;
    id_pages: number;
    acl_select: number;
    acl_insert: number;
    acl_update: number;
    acl_delete: number;
    keyword: string;
    url: string;
    protocol: string;
    id_actions: number;
    id_navigation_section: number | null;
    parent: number | null;
    is_headless: number;
    nav_position: number | null;
    footer_position: number | null;
    id_type: number;
    id_pageAccessTypes: number;
}

export interface RouteItem {
    title: string;
    path: string;
    isNav: boolean;
    position: number | null;
} 