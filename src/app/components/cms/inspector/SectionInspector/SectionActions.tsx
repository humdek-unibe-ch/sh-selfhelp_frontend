'use client';

import { 
    IconDeviceFloppy, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { IInspectorButton } from '../InspectorHeader';

interface ISectionActionsProps {
    sectionId: number | null;
    sectionDetailsData: { 
        section: { 
            id: number; 
            name: string;
            id_styles?: number;
            style_name?: string;
            style?: {
                id: number;
                name: string;
                description?: string;
                typeId?: number;
                type?: string;
                canHaveChildren?: boolean;
            };
        };
        fields?: any[];
        languages?: any[];
    } | null | undefined;
    updateMutationPending?: boolean;
    deleteMutationPending?: boolean;
    onSave: () => void;
    onExport: () => void;
    onDelete: () => void;
}

// This is a utility function that generates buttons, not a React component
export function generateSectionActions({
    sectionId,
    sectionDetailsData,
    updateMutationPending,
    onSave,
    onExport,
    onDelete
}: ISectionActionsProps): IInspectorButton[] {
    if (!sectionId || !sectionDetailsData) return [];

    const buttons: IInspectorButton[] = [
            {
                id: 'save',
                label: 'Save',
                icon: <IconDeviceFloppy size="1rem" />,
                onClick: onSave,
                variant: 'filled',
                loading: updateMutationPending,
                disabled: !sectionId || !sectionDetailsData
            },
            {
                id: 'export',
                label: 'Export',
                icon: <IconFileExport size="1rem" />,
                onClick: onExport,
                variant: 'outline',
                color: 'blue',
                disabled: !sectionId || !sectionDetailsData
            },
            {
                id: 'delete',
                label: 'Delete Section',
                icon: <IconTrash size="1rem" />,
                onClick: onDelete,
                variant: 'outline',
                color: 'red',
                disabled: !sectionId || !sectionDetailsData
            }
        ];

    return buttons;
}
