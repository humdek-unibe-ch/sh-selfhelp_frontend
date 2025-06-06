/**
 * TypeScript interfaces for create page form and related types.
 * 
 * @module types/forms/create-page.types
 */

import { IAdminPage } from '../responses/admin/admin.types';

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
    parentPage?: number | null;
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
    parentPage?: IAdminPage | null;
} 