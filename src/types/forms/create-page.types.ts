/**
 * TypeScript interfaces for create page form and related types.
 * 
 * @module types/forms/create-page.types
 */

export interface ICreatePageFormValues {
    keyword: string;
    headerMenu: boolean;
    headerMenuPosition: number | null;
    footerMenu: boolean;
    footerMenuPosition: number | null;
    headlessPage: boolean;
    pageAccessType: string;
    urlPattern: string;
    navigationPage: boolean;
    openAccess: boolean;
    customUrlEdit: boolean;
}

export interface IMenuPageItem {
    id: string;
    keyword: string;
    label: string;
    position: number;
    isNew?: boolean;
}

export interface ICreatePageModalProps {
    opened: boolean;
    onClose: () => void;
} 