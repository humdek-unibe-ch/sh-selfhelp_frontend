import { Modal, ModalProps, Group, Button, Stack, ScrollArea, Text, CloseButton } from '@mantine/core';
import { ReactNode } from 'react';

interface CustomModalProps extends Omit<ModalProps, 'opened'> {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

export const CustomModal = ({
    isOpen,
    onClose,
    title,
    children,
    ...rest
}: CustomModalProps) => {
    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={title}
            size="md"
            centered
            {...rest}
        >
            {children}
        </Modal>
    );
};

// Enhanced ModalWrapper with structured layout
interface ModalWrapperProps {
    opened: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    centered?: boolean;

    // Action buttons
    onSave?: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
    onCancel?: () => void;
    customActions?: ReactNode;

    // Button states
    isLoading?: boolean;
    saveLabel?: string;
    updateLabel?: string;
    deleteLabel?: string;
    cancelLabel?: string;

    // Button variants
    saveVariant?: 'filled' | 'light' | 'outline' | 'subtle';
    deleteVariant?: 'filled' | 'light' | 'outline' | 'subtle';

    // Additional props
    closeOnClickOutside?: boolean;
    closeOnEscape?: boolean;
    withCloseButton?: boolean;
    scrollAreaHeight?: number | string;
}

export const ModalWrapper = ({
    opened,
    onClose,
    title,
    children,
    size = 'lg',
    centered = true,
    onSave,
    onUpdate,
    onDelete,
    onCancel,
    customActions,
    isLoading = false,
    saveLabel = 'Save',
    updateLabel = 'Update',
    deleteLabel = 'Delete',
    cancelLabel = 'Cancel',
    saveVariant = 'filled',
    deleteVariant = 'light',
    closeOnClickOutside = true,
    closeOnEscape = true,
    withCloseButton = true,
    scrollAreaHeight = 400,
}: ModalWrapperProps) => {
    // Determine which actions to show
    const hasPrimaryAction = onSave || onUpdate;
    const hasDeleteAction = !!onDelete;
    const hasCancelAction = onCancel !== undefined;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            size={size}
            centered={centered}
            closeOnClickOutside={closeOnClickOutside}
            closeOnEscape={closeOnEscape}
            withCloseButton={false} // We'll handle this in the header
            styles={{
                content: {
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                },
                body: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    padding: 0,
                    minHeight: 0,
                },
            }}
        >
            {/* Header */}
            <Group
                justify="space-between"
                align="center"
                p="md"
                style={{
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                    backgroundColor: 'var(--mantine-color-default-hover)',
                }}
            >
                <Text size="lg" fw={600}>
                    {title}
                </Text>
                {withCloseButton && (
                    <CloseButton onClick={onClose} />
                )}
            </Group>

            {/* Scrollable Content */}
            <ScrollArea
                h={scrollAreaHeight}
                p="md"
                style={{ flex: 1 }}
            >
                {children}
            </ScrollArea>

            {/* Footer with Actions */}
            {(hasPrimaryAction || hasDeleteAction || hasCancelAction || customActions) && (
                <Group
                    justify="space-between"
                    align="center"
                    p="md"
                    style={{
                        borderTop: '1px solid var(--mantine-color-default-border)',
                        backgroundColor: 'var(--mantine-color-default-hover)',
                    }}
                >
                    {/* Left side - Delete action */}
                    <Group>
                        {hasDeleteAction && (
                            <Button
                                variant={deleteVariant}
                                color="red"
                                onClick={onDelete}
                                loading={isLoading}
                                size="sm"
                            >
                                {deleteLabel}
                            </Button>
                        )}
                    </Group>

                    {/* Right side - Primary and cancel actions */}
                    <Group>
                        {customActions}
                        {hasCancelAction && (
                            <Button
                                variant="outline"
                                onClick={onCancel || onClose}
                                disabled={isLoading}
                                size="sm"
                            >
                                {cancelLabel}
                            </Button>
                        )}
                        {hasPrimaryAction && (
                            <Button
                                variant={saveVariant}
                                onClick={onSave || onUpdate}
                                loading={isLoading}
                                size="sm"
                            >
                                {onSave ? saveLabel : updateLabel}
                            </Button>
                        )}
                    </Group>
                </Group>
            )}
        </Modal>
    );
};