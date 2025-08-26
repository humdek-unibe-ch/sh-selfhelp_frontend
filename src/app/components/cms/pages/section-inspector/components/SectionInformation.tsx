'use client';

import { memo } from 'react';
import { Box, Text, TextInput } from '@mantine/core';
import { InspectorInfoSection } from '../../../shared';

interface ISectionInformationProps {
    section: {
        id: number;
        name: string;
        style: {
            name: string;
            type: string;
            description?: string;
        };
    };
    sectionName: string;
    onSectionNameChange: (value: string) => void;
}

export const SectionInformation = memo<ISectionInformationProps>(
    function SectionInformation({ section, sectionName, onSectionNameChange }) {
        return (
            <InspectorInfoSection
                title="Section Information"
                infoItems={[
                    { label: 'Style', value: section.style.name },
                    { label: 'Type', value: section.style.type },
                    { label: 'Section ID', value: section.id }
                ]}
            >
                {/* Editable Section Name */}
                <Box>
                    <Text size="xs" fw={500} c="dimmed" mb="xs">Section Name</Text>
                    <TextInput
                        value={sectionName}
                        onChange={(e) => onSectionNameChange(e.currentTarget.value)}
                        placeholder="Enter section name"
                        size="sm"
                    />
                </Box>
                
                {section.style.description && (
                    <Box mt="sm">
                        <Text size="xs" fw={500} c="dimmed">Description</Text>
                        <Text size="sm">{section.style.description}</Text>
                    </Box>
                )}
            </InspectorInfoSection>
        );
    },
    // Custom comparison - only re-render if section data or name changes
    (prevProps, nextProps) => {
        return (
            prevProps.section.id === nextProps.section.id &&
            prevProps.section.name === nextProps.section.name &&
            prevProps.section.style.name === nextProps.section.style.name &&
            prevProps.section.style.type === nextProps.section.style.type &&
            prevProps.section.style.description === nextProps.section.style.description &&
            prevProps.sectionName === nextProps.sectionName
        );
    }
);
