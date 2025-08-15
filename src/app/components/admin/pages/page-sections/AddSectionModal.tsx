'use client';

import { useState } from 'react';
import {
    Modal,
    Tabs,
    Text,
    Button,
    Group,
    Stack,
    ScrollArea,
    Card,
    Badge,
    TextInput,
    Loader,
    Alert,
    ActionIcon,
    Tooltip,
    Box,
    FileInput,
    Select
} from '@mantine/core';
import {
    IconX,
    IconPlus,
    IconSearch,
    IconInfoCircle,
    IconAlertCircle,
    IconUpload
} from '@tabler/icons-react';
import { useStyleGroups } from '../../../../../hooks/useStyleGroups';
import { useSectionOperations } from '../../../../../hooks/useSectionOperations';
import { useUnusedSections, useRefContainerSections } from '../../../../../hooks/useSectionUtility';
import { IStyle, IStyleGroup } from '../../../../../types/responses/admin/styles.types';
import { IUnusedSection, IRefContainerSection } from '../../../../../types/responses/admin/section-utility.types';
import styles from './AddSectionModal.module.css';
import { ISectionExportData } from '../../../../../api/admin/section.api';
import { readJsonFile, isValidJsonFile } from '../../../../../utils/export-import.utils';
import { ISectionOperationOptions } from '../../../../../utils/section-operations.utils';

interface IAddSectionModalProps {
    opened: boolean;
    onClose: () => void;
    pageKeyword?: string;
    parentSectionId?: number | null;
    title?: string;
    specificPosition?: number;
    onSectionCreated?: (sectionId: number) => void;
    onSectionsImported?: (sectionIds: number[]) => void;
}

export function AddSectionModal({
    opened,
    onClose,
    pageKeyword,
    parentSectionId = null,
    title = 'Add Section',
    specificPosition,
    onSectionCreated,
    onSectionsImported
}: IAddSectionModalProps) {
    const [activeTab, setActiveTab] = useState<string>('new-section');
    const [selectedStyle, setSelectedStyle] = useState<IStyle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sectionName, setSectionName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedUnusedSection, setSelectedUnusedSection] = useState<string | null>(null);
    const [selectedRefContainerSection, setSelectedRefContainerSection] = useState<string | null>(null);

    const { data: styleGroups, isLoading: isLoadingStyles, error: stylesError } = useStyleGroups(opened);
    const { data: unusedSections, isLoading: isLoadingUnused, error: unusedError } = useUnusedSections();
    const { data: refContainerSections, isLoading: isLoadingRefContainers, error: refContainersError } = useRefContainerSections();



    // Section operations hook
    const sectionOperations = useSectionOperations({
        pageKeyword,
        showNotifications: true,
        onSuccess: () => {
            handleClose();
        },
        onSectionCreated: (sectionId) => {
            onSectionCreated?.(sectionId);
        },
        onSectionsImported: (sectionIds) => {
            onSectionsImported?.(sectionIds);
        }
    });

    const handleClose = () => {
        setSelectedStyle(null);
        setSectionName('');
        setSearchQuery('');
        setActiveTab('new-section');
        setSelectedFile(null);
        setIsImporting(false);
        setSelectedUnusedSection(null);
        setSelectedRefContainerSection(null);
        onClose();
    };

    const handleStyleSelect = (style: IStyle) => {
        setSelectedStyle(style);
    };

    const handleAddUnusedSection = async () => {
        if (!selectedUnusedSection || !pageKeyword) {
            return;
        }

        const sectionId = parseInt(selectedUnusedSection);
        const operationOptions: ISectionOperationOptions = {
            specificPosition,
        };

        try {
            if (parentSectionId !== null) {
                // Add unused section to another section
                await sectionOperations.addSectionToSection(parentSectionId, sectionId, operationOptions);
            } else {
                // Add unused section to page
                await sectionOperations.addSectionToPage(sectionId, operationOptions);
            }
        } catch (error) {
            // Error handling is done by the section operations hook
        }
    };

    const handleAddRefContainerSection = async () => {
        if (!selectedRefContainerSection || !pageKeyword) {
            return;
        }

        const sectionId = parseInt(selectedRefContainerSection);
        const operationOptions: ISectionOperationOptions = {
            specificPosition,
        };

        try {
            if (parentSectionId !== null) {
                // Add ref container section to another section
                await sectionOperations.addSectionToSection(parentSectionId, sectionId, operationOptions);
            } else {
                // Add ref container section to page
                await sectionOperations.addSectionToPage(sectionId, operationOptions);
            }
        } catch (error) {
            // Error handling is done by the section operations hook
        }
    };

    const handleAddSection = async () => {
        if (!selectedStyle) {
            return;
        }

        const operationOptions: ISectionOperationOptions & { name?: string } = {
            specificPosition,
            name: sectionName || undefined
        };

        try {
            if (parentSectionId !== null) {
                // Create section in another section
                await sectionOperations.createSectionInSection(parentSectionId, selectedStyle.id, operationOptions);
            } else {
                // Create section in page
                await sectionOperations.createSectionInPage(selectedStyle.id, operationOptions);
            }
        } catch (error) {
            // Error handling is done by the section operations hook
        }
    };

    const handleImportSections = async () => {
        if (!selectedFile || !pageKeyword) return;

        setIsImporting(true);

        try {
            // Read and parse the JSON file
            const sectionsData = await readJsonFile(selectedFile);

            const operationOptions: ISectionOperationOptions = {
                specificPosition
            };

            // Import sections with position using the section operations hook
            if (parentSectionId !== null) {
                // Import to parent section
                await sectionOperations.importSectionsToSection(parentSectionId, sectionsData, operationOptions);
            } else {
                // Import to page
                await sectionOperations.importSectionsToPage(sectionsData, operationOptions);
            }

            handleClose();
        } catch (error) {
            console.error('Error importing sections:', error);
        } finally {
            setIsImporting(false);
        }
    };

    // Filter styles based on search query
    const filteredStyleGroups = styleGroups?.map(group => ({
        ...group,
        styles: group.styles.filter(style =>
            style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            style.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.styles.length > 0) || [];

    const isProcessing = sectionOperations.isLoading || isImporting;

    return (
        <Modal
                opened={opened}
                onClose={handleClose}
                title={title}
                size="lg"
                centered
                closeButtonProps={{
                    icon: <IconX size={16} />
                }}
                styles={{
                    body: { padding: 0 },
                    header: { paddingBottom: 0 }
                }}
                overlayProps={{
                    backgroundOpacity: 0.5,
                    blur: 3,
                }}
                zIndex={1000}
            >
            <Box className={styles.modalContainer}>
                {/* Header Section */}
                <Box p="md" pb="sm" className={styles.headerSection}>
                    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'new-section')}>
                        <Tabs.List>
                            <Tabs.Tab value="new-section">New Section</Tabs.Tab>
                            <Tabs.Tab value="unassigned-section">
                                Unused Section
                            </Tabs.Tab>
                            <Tabs.Tab value="reference-section">
                                Reference Section
                            </Tabs.Tab>
                            <Tabs.Tab value="import-section">
                                Import Section
                            </Tabs.Tab>
                        </Tabs.List>

                        {/* Search Input - only for new-section tab */}
                        {activeTab === 'new-section' && (
                            <TextInput
                                placeholder="Search styles..."
                                leftSection={<IconSearch size={16} />}
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.currentTarget.value)}
                                mt="sm"
                                size="sm"
                            />
                        )}

                        {/* Section Name Input - only for new-section tab */}
                        {activeTab === 'new-section' && (
                            <TextInput
                                label="Section Name (Optional)"
                                placeholder="Enter custom section name..."
                                value={sectionName}
                                onChange={(event) => setSectionName(event.currentTarget.value)}
                                description="Leave empty to use the style name"
                                mt="sm"
                                size="sm"
                            />
                        )}

                        {/* Selected Style Display - only for new-section tab */}
                        {activeTab === 'new-section' && selectedStyle && (
                            <Card withBorder p="xs" bg="blue.0" mt="sm">
                                <Group justify="space-between" gap="xs">
                                    <Group gap="xs" className={styles.selectedStyleGroup}>
                                        <Text fw={500} size="sm">Selected:</Text>
                                        <Text size="sm" truncate>{selectedStyle.name}</Text>
                                        <Badge size="xs" variant="light" color="blue">
                                            {selectedStyle.type}
                                        </Badge>
                                    </Group>
                                    <ActionIcon
                                        variant="subtle"
                                        size="sm"
                                        onClick={() => setSelectedStyle(null)}
                                    >
                                        <IconX size={14} />
                                    </ActionIcon>
                                </Group>
                            </Card>
                        )}

                        {/* Instructions - only for new-section tab */}
                        {activeTab === 'new-section' && (
                            <Text size="xs" c="dimmed" mt="sm">
                                Click on a style below to select it for your new section
                            </Text>
                        )}
                    </Tabs>
                </Box>

                {/* Scrollable Content */}
                <ScrollArea className={styles.scrollableContent} p="md">
                    <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'new-section')}>
                        <Tabs.Panel value="new-section">
                            {isLoadingStyles ? (
                                <Group justify="center" p="xl">
                                    <Loader size="sm" />
                                    <Text size="sm">Loading styles...</Text>
                                </Group>
                            ) : stylesError ? (
                                <Alert icon={<IconAlertCircle size={16} />} color="red">
                                    Failed to load styles. Please try again.
                                </Alert>
                            ) : filteredStyleGroups.length === 0 ? (
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    {searchQuery ? 'No styles found matching your search.' : 'No styles available.'}
                                </Alert>
                            ) : (
                                <Stack gap="sm">
                                    {filteredStyleGroups.map((group: IStyleGroup) => (
                                        <div key={group.id}>
                                            <Group gap="xs" mb="xs">
                                                <Text fw={600} size="sm" c="blue">
                                                    {group.name}
                                                </Text>
                                                <Badge size="xs" variant="outline">
                                                    {group.styles.length}
                                                </Badge>
                                            </Group>
                                            {group.description && (
                                                <Text size="xs" c="dimmed" mb="xs">
                                                    {group.description}
                                                </Text>
                                            )}
                                            <Stack gap="xs" mb="md">
                                                {group.styles.map((style: IStyle) => (
                                                    <Card
                                                        key={style.id}
                                                        withBorder
                                                        p="xs"
                                                        className={`${styles.styleCard} ${selectedStyle?.id === style.id ? styles.selected : ''}`}
                                                        onClick={() => handleStyleSelect(style)}
                                                    >
                                                        <Group justify="space-between" wrap="nowrap" gap="xs">
                                                            <div className={styles.styleInfo}>
                                                                <Group gap="xs" mb={style.description ? "xs" : 0}>
                                                                    <Text fw={500} size="sm">
                                                                        {style.name}
                                                                    </Text>
                                                                    <Badge size="xs" variant="light" color="gray">
                                                                        {style.type}
                                                                    </Badge>
                                                                    {selectedStyle?.id === style.id && (
                                                                        <Badge size="xs" variant="filled" color="blue">
                                                                            SELECTED
                                                                        </Badge>
                                                                    )}
                                                                </Group>
                                                                {style.description && (
                                                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                                                        {style.description}
                                                                    </Text>
                                                                )}
                                                            </div>
                                                            {selectedStyle?.id === style.id && (
                                                                <ActionIcon variant="filled" color="blue" size="sm">
                                                                    <IconPlus size={14} />
                                                                </ActionIcon>
                                                            )}
                                                        </Group>
                                                    </Card>
                                                ))}
                                            </Stack>
                                        </div>
                                    ))}
                                </Stack>
                            )}
                        </Tabs.Panel>

                        {/* Unused Section Tab Panel */}
                        <Tabs.Panel value="unassigned-section">
                            <Stack gap="md">
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    Select an unused section to add to this {parentSectionId ? 'section' : 'page'}. Unused sections are sections that exist but are not currently assigned to any page or section.
                                </Alert>

                                {isLoadingUnused ? (
                                    <Group justify="center" p="xl">
                                        <Loader size="sm" />
                                        <Text size="sm">Loading unused sections...</Text>
                                    </Group>
                                ) : unusedError ? (
                                    <Alert icon={<IconAlertCircle size={16} />} color="red">
                                        Failed to load unused sections. Please try again.
                                    </Alert>
                                ) : !unusedSections || unusedSections.length === 0 ? (
                                    <Alert icon={<IconInfoCircle size={16} />} color="gray">
                                        No unused sections available. All sections are currently assigned to pages or other sections.
                                    </Alert>
                                ) : (
                                    <Select
                                        label="Select Unused Section"
                                        placeholder="Choose an unused section to add..."
                                        data={unusedSections.map((section: IUnusedSection) => ({
                                            value: section.id.toString(),
                                            label: `${section.name} (ID: ${section.id}) - ${section.styleName || 'No style'}`
                                        }))}
                                        value={selectedUnusedSection}
                                        onChange={setSelectedUnusedSection}
                                        searchable
                                        clearable
                                        size="sm"
                                    />
                                )}
                            </Stack>
                        </Tabs.Panel>

                        {/* Reference Section Tab Panel */}
                        <Tabs.Panel value="reference-section">
                            <Stack gap="md">
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    Select a reference container section to add to this {parentSectionId ? 'section' : 'page'}. Reference containers are special sections that can be reused across different pages.
                                </Alert>

                                {isLoadingRefContainers ? (
                                    <Group justify="center" p="xl">
                                        <Loader size="sm" />
                                        <Text size="sm">Loading reference containers...</Text>
                                    </Group>
                                ) : refContainersError ? (
                                    <Alert icon={<IconAlertCircle size={16} />} color="red">
                                        Failed to load reference containers. Please try again.
                                    </Alert>
                                ) : !refContainerSections || refContainerSections.length === 0 ? (
                                    <Alert icon={<IconInfoCircle size={16} />} color="gray">
                                        No reference container sections available.
                                    </Alert>
                                ) : (
                                    <Select
                                        label="Select Reference Container"
                                        placeholder="Choose a reference container to add..."
                                        data={refContainerSections.map((section: IRefContainerSection) => ({
                                            value: section.id.toString(),
                                            label: `${section.name} (ID: ${section.id}) - ${section.styleName}`
                                        }))}
                                        value={selectedRefContainerSection}
                                        onChange={setSelectedRefContainerSection}
                                        searchable
                                        clearable
                                        size="sm"
                                    />
                                )}
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="import-section">
                            <Stack gap="md">
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    Import sections from a previously exported JSON file. The file should contain section data in the correct format.
                                </Alert>

                                <FileInput
                                    label="Select JSON file to import"
                                    placeholder="Choose a JSON file..."
                                    leftSection={<IconUpload size={16} />}
                                    value={selectedFile}
                                    onChange={setSelectedFile}
                                    accept=".json,application/json"
                                    clearable
                                />

                                {selectedFile && (
                                    <Card withBorder p="sm" bg="green.0">
                                        <Group gap="xs">
                                            <Text size="sm" fw={500}>Selected file:</Text>
                                            <Text size="sm">{selectedFile.name}</Text>
                                            <Badge size="xs" color="green">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </Badge>
                                        </Group>
                                    </Card>
                                )}

                                {selectedFile && !isValidJsonFile(selectedFile) && (
                                    <Alert color="red" icon={<IconAlertCircle size={16} />}>
                                        Please select a valid JSON file.
                                    </Alert>
                                )}
                            </Stack>
                        </Tabs.Panel>
                    </Tabs>
                </ScrollArea>

                {/* Fixed Footer */}
                <Box 
                    p="md" 
                    pt="sm"
                    className={styles.footerSection}
                >
                    <Group justify="space-between" align="center">
                        <Text size="sm" c="dimmed">
                            {activeTab === 'import-section' 
                                ? (selectedFile ? `Ready to import from "${selectedFile.name}"` : 'Select a JSON file to import')
                                : activeTab === 'unassigned-section'
                                ? (selectedUnusedSection ? `Ready to add unused section` : 'Select an unused section to continue')
                                : activeTab === 'reference-section'
                                ? (selectedRefContainerSection ? `Ready to add reference container` : 'Select a reference container to continue')
                                : (selectedStyle ? `Ready to add "${selectedStyle.name}" section` : 'Select a style to continue')
                            }
                        </Text>
                        <Group gap="sm">
                            <Button variant="subtle" onClick={handleClose} disabled={isProcessing} size="sm">
                                Cancel
                            </Button>
                            {activeTab === 'import-section' ? (
                                <Button
                                    leftSection={<IconUpload size={16} />}
                                    onClick={handleImportSections}
                                    disabled={!selectedFile || !isValidJsonFile(selectedFile!) || isProcessing}
                                    loading={isImporting}
                                    size="sm"
                                    color="green"
                                >
                                    Import Sections
                                </Button>
                            ) : activeTab === 'unassigned-section' ? (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={handleAddUnusedSection}
                                    disabled={!selectedUnusedSection || isProcessing}
                                    loading={sectionOperations.isLoading}
                                    size="sm"
                                    color="orange"
                                >
                                    Add Unused Section
                                </Button>
                            ) : activeTab === 'reference-section' ? (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={handleAddRefContainerSection}
                                    disabled={!selectedRefContainerSection || isProcessing}
                                    loading={sectionOperations.isLoading}
                                    size="sm"
                                    color="violet"
                                >
                                    Add Reference Section
                                </Button>
                            ) : (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={handleAddSection}
                                    disabled={!selectedStyle || isProcessing}
                                    loading={sectionOperations.isLoading}
                                    size="sm"
                                >
                                    Add Section
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Box>
            </Box>
        </Modal>
    );
} 