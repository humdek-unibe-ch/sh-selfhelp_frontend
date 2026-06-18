/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { ReactNode } from 'react';
import type { ComboboxProps } from '@mantine/core';

export interface IFieldConfig {
    // Core select functionality
    multiSelect?: boolean;
    creatable?: boolean;
    separator?: string;
    clearable?: boolean;
    searchable?: boolean;
    allowDeselect?: boolean;

    // Display and behavior
    placeholder?: string;
    nothingFoundMessage?: string;
    description?: string;
    error?: string;
    required?: boolean;
    withAsterisk?: boolean;
    disabled?: boolean;

    // Dropdown configuration
    limit?: number;
    maxDropdownHeight?: number;
    hidePickedOptions?: boolean;
    maxValues?: number;

    // Styling and layout
    checkIconPosition?: 'left' | 'right';
    leftSection?: ReactNode;
    rightSection?: ReactNode;

    // Data and options
    options?: Array<{
        value: string;
        text: string;
        disabled?: boolean;
        [key: string]: unknown;
    }>;
    apiUrl?: string;

    // Advanced configuration
    comboboxProps?: ComboboxProps;
    dropdownOpened?: boolean;
    onDropdownOpen?: () => void;
    onDropdownClose?: () => void;
}

export interface ISelectOption {
    value: string;
    text: string;
}

export interface ISelectOptionsResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        options: ISelectOption[];
    };
}

export interface ICssClassOption {
    value: string;
    text: string;
}

export interface ICssClassesResponse {
    status: number;
    message: string;
    error: string | null;
    logged_in: boolean;
    meta: {
        version: string;
        timestamp: string;
    };
    data: {
        classes: ICssClassOption[];
    };
} 