'use client';

import { memo } from 'react';
import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

interface IAddSectionButtonProps {
    onAddSection: () => void;
}

export const AddSectionButton = memo<IAddSectionButtonProps>(
    function AddSectionButton({ onAddSection }) {
        return (
            <Button 
                leftSection={<IconPlus size={16} />} 
                size="sm" 
                variant="filled"
                onClick={onAddSection}
            >
                Add Section
            </Button>
        );
    }
    // No custom comparison needed - function is stable with useCallback
);
