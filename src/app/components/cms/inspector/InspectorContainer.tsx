'use client';

import {
    ScrollArea,
    Stack
} from '@mantine/core';
import { ReactNode } from 'react';
import './InspectorContainer.module.css';
import { IInspectorButton, InspectorHeader } from './InspectorHeader';

interface IInspectorContainerProps {
    inspectorType: 'page' | 'section';
    inspectorTitle: string;
    inspectorId: string | number;
    inspectorButtons: IInspectorButton[];
    children: ReactNode;
    className?: string;
}

export function InspectorContainer({
    inspectorType,
    inspectorTitle,
    inspectorId,
    inspectorButtons,
    children,
    className
}: IInspectorContainerProps) {
    return (
        <div className={`aside-container ${className || ''}`}>
            {/* Inspector Header */}
            <InspectorHeader 
                inspectorType={inspectorType}
                inspectorTitle={inspectorTitle}
                inspectorId={inspectorId}
                inspectorButtons={inspectorButtons}
            />
            
            {/* Scrollable Content - Now full height */}
            <ScrollArea className="aside-content">
                <Stack gap="xs">
                    {children}
                </Stack>
            </ScrollArea>
        </div>
    );
}
