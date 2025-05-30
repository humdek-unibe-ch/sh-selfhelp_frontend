import { Modal, ModalProps } from '@mantine/core';
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
