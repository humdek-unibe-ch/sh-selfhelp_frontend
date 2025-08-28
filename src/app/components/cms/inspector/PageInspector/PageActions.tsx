'use client';

import { 
    IconDeviceFloppy, 
    IconPlus, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { IInspectorButton } from '../InspectorHeader';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';

interface IPageActionsProps {
    page: IAdminPage | null;
    isConfigurationPage?: boolean;
    fieldsLoading?: boolean;
    updateMutationPending?: boolean;
    onSave: () => void;
    onExport: () => void;
    onCreateChild: () => void;
    onDelete: () => void;
}

// This is a utility function that generates buttons, not a React component
export function generatePageActions({
    page,
    isConfigurationPage,
    fieldsLoading,
    updateMutationPending,
    onSave,
    onExport,
    onCreateChild,
    onDelete
}: IPageActionsProps): IInspectorButton[] {
    if (!page) return [];

    const buttons: IInspectorButton[] = [
            {
                id: 'save',
                label: 'Save',
                icon: <IconDeviceFloppy size="0.875rem" />,
                onClick: onSave,
                variant: 'filled',
                loading: updateMutationPending,
                disabled: !page || fieldsLoading
            }
        ];

        if (!isConfigurationPage) {
            buttons.push(
                {
                    id: 'export',
                    label: 'Export',
                    icon: <IconFileExport size="1rem" />,
                    onClick: onExport,
                    variant: 'outline',
                    color: 'blue',
                    disabled: !page || fieldsLoading
                },
                {
                    id: 'create-child',
                    label: 'Create Child',
                    icon: <IconPlus size="1rem" />,
                    onClick: onCreateChild,
                    variant: 'outline',
                    color: 'green',
                    disabled: !page
                }
            );
        }

        buttons.push({
            id: 'delete',
            label: 'Delete',
            icon: <IconTrash size="1rem" />,
            onClick: onDelete,
            variant: 'outline',
            color: 'red',
            disabled: !page
        });

    return buttons;
}
