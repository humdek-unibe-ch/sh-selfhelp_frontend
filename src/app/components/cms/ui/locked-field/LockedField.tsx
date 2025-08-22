'use client';

import { ActionIcon, TextInput, Tooltip, TextInputProps } from '@mantine/core';
import { IconEdit, IconLock } from '@tabler/icons-react';
import { useState, ReactNode } from 'react';

interface ILockedFieldProps extends Omit<TextInputProps, 'rightSection' | 'label'> {
    /** The field label - can be string or ReactNode */
    label?: ReactNode;
    /** Whether the field starts locked */
    initialLocked?: boolean;
    /** Callback when lock state changes */
    onLockChange?: (locked: boolean) => void;
    /** Custom tooltip text for locked state */
    lockedTooltip?: string;
    /** Custom tooltip text for unlocked state */
    unlockedTooltip?: string;
}

export function LockedField({
    label,
    initialLocked = true,
    onLockChange,
    lockedTooltip = "Enable editing",
    unlockedTooltip = "Lock editing",
    ...textInputProps
}: ILockedFieldProps) {
    const [isLocked, setIsLocked] = useState(initialLocked);

    const handleToggleLock = () => {
        const newLocked = !isLocked;
        setIsLocked(newLocked);
        onLockChange?.(newLocked);
    };

    return (
        <TextInput
            {...textInputProps}
            label={label}
            readOnly={isLocked}
            rightSection={
                <Tooltip 
                    label={isLocked ? lockedTooltip : unlockedTooltip}
                    position="left"
                >
                    <ActionIcon
                        variant={isLocked ? "subtle" : "filled"}
                        color={isLocked ? "gray" : "blue"}
                        onClick={handleToggleLock}
                        style={{ cursor: 'pointer' }}
                    >
                        {isLocked ? (
                            <IconLock size="1rem" />
                        ) : (
                            <IconEdit size="1rem" />
                        )}
                    </ActionIcon>
                </Tooltip>
            }
        />
    );
} 