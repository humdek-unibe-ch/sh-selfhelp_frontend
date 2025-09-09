'use client';

import { useState, useMemo } from 'react';
import {
    Tabs,
    Text,
    Button,
    Group,
    Stack,
    Card,
    Badge,
    TextInput,
    Loader,
    Alert,
    ActionIcon,
    FileInput,
    Select,
} from '@mantine/core';
import {
    IconPlus,
    IconSearch,
    IconInfoCircle,
    IconAlertCircle,
    IconUpload,
    IconX
} from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared';
import { useStyleGroups } from '../../../../../hooks/useStyleGroups';
import { useSectionOperations } from '../../../../../hooks/useSectionOperations';
import { useUnusedSections, useRefContainerSections } from '../../../../../hooks/useSectionUtility';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { IStyle, IStyleGroup } from '../../../../../types/responses/admin/styles.types';
import { readJsonFile, isValidJsonFile } from '../../../../../utils/export-import.utils';
import { ISectionOperationOptions } from '../../../../../utils/section-operations.utils';
import { isStyleRelationshipValid, findStyleById } from '../../../../../utils/style-relationship.utils';

interface IAddSectionModalProps {
    opened: boolean;
    onClose: () => void;
    pageId?: number;
    parentSectionId?: number | null;
    title?: string;
    specificPosition?: number;
    onSectionCreated?: (sectionId: number) => void;
    onSectionsImported?: (sectionIds: number[]) => void;
}

export function AddSectionModal({
    opened,
    onClose,
    pageId,
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

    const { data: styleGroups, isLoading: isLoadingStyles, error: stylesError } = useStyleGroups();

    // Fetch parent section details when we have a parent section ID
    const {
        data: parentSectionDetails,
        isLoading: isLoadingParentDetails,
        error: parentDetailsError
    } = useSectionDetails(pageId || null, parentSectionId, opened && !!parentSectionId);

    // Prefetch unused sections and ref containers when modal is opened
    const {
        data: unusedSectionsData,
        isLoading: isLoadingUnused,
        error: unusedError,
        isFetching: isFetchingUnused
    } = useUnusedSections(opened);

    const {
        data: refContainerSectionsData,
        isLoading: isLoadingRefContainers,
        error: refContainersError,
        isFetching: isFetchingRefContainers
    } = useRefContainerSections(opened);

    const unusedSections = useMemo(() => unusedSectionsData || [], [unusedSectionsData]);
    const refContainerSections = useMemo(() => refContainerSectionsData || [], [refContainerSectionsData]);

    const unusedSectionsSelectData = useMemo(() => {
        return unusedSections.map((section) => ({
          value: String(section.id),
          label: `${section.name} (ID: ${section.id}) - ${section.styleName || 'No style'}`
        }));
      }, [unusedSections]);

      const refContainerSectionsSelectData = useMemo(() => {
        return refContainerSections.map((section) => ({
          value: String(section.id),
          label: `${section.name} (ID: ${section.id}) - ${section.styleName}`
        }));
      }, [refContainerSections]);

    // Get the parent style with relationships from the full styles list
    const parentStyleWithRelationships = useMemo(() => {
        if (!parentSectionDetails?.section?.style || !styleGroups) {
            return null;
        }

        const parentStyleId = parentSectionDetails.section.style.id;
        return findStyleById(parentStyleId, styleGroups);
    }, [parentSectionDetails, styleGroups]);


    // Function to check if a style is allowed as a child of the parent section
    const isStyleAllowedAsChild = useMemo(() => {
        return (style: IStyle): boolean => {
            return isStyleRelationshipValid(style, parentStyleWithRelationships);
        };
    }, [parentStyleWithRelationships]);

    // Filter styles based on parent relationships and search query
    const filteredStyleGroups = useMemo(() => {
        if (!styleGroups) return [];

        // If we have a parent section but the parent details or relationships aren't loaded yet, show loading state
        if (parentSectionId && (!parentSectionDetails || !parentStyleWithRelationships)) {
            return [];
        }

        let filteredGroups = styleGroups.map(group => {
            const filteredStyles = group.styles.filter(style => {
                // First apply relationship filtering
                const isAllowed = isStyleAllowedAsChild(style);

                // Then apply search filtering (search is an additional layer)
                const matchesSearch = !searchQuery ||
                    style.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    style.description?.toLowerCase().includes(searchQuery.toLowerCase());

                return isAllowed && matchesSearch;
            });

            return {
                ...group,
                styles: filteredStyles
            };
        });

        // Remove groups that have no styles after filtering
        return filteredGroups.filter(group => group.styles.length > 0);
    }, [styleGroups, searchQuery, isStyleAllowedAsChild, parentSectionId]);



    // Section operations hook
    const sectionOperations = useSectionOperations({
        pageId,
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

    const handleTabChange = (value: string | null) => {
        setActiveTab(value || 'new-section');
        // Data is already prefetched when modal opens, no need to refetch
    };

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
        if (!selectedUnusedSection) {
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
            } else if (pageId) {
                // Add unused section to page
                await sectionOperations.addSectionToPage(sectionId, operationOptions);
            }
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleAddRefContainerSection = async () => {
        if (!selectedRefContainerSection) {
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
            } else if (pageId) {
                // Add ref container section to page
                await sectionOperations.addSectionToPage(sectionId, operationOptions);
            }
        } catch (error) {
            // Error is handled by the hook
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
            } else if (pageId) {
                // Create section in page
                await sectionOperations.createSectionInPage(selectedStyle.id, operationOptions);
            }
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleImportSections = async () => {
        if (!selectedFile || !pageId) return;

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
            } else if (pageId) {
                // Import to page
                await sectionOperations.importSectionsToPage(sectionsData, operationOptions);
            }

            handleClose();
        } catch (error) {
            // Error is handled by the hook with notifications
        } finally {
            setIsImporting(false);
        }
    };


    const isProcessing = sectionOperations.isLoading || isImporting;

    // Custom actions for the footer based on active tab
    const getCustomActions = () => (
        <Group justify="space-between" align="center" w="100%">
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
                <Button variant="outline" onClick={handleClose} disabled={isProcessing} size="sm">
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
    );

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title={title}
            size="xl"
            scrollAreaHeight="70vh"
            customActions={getCustomActions()}
            isLoading={isProcessing}
        >
            <Tabs value={activeTab} onChange={handleTabChange}>
                {/* Header Section */}
                <Group justify="space-between" align="center" mb="md">
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
                </Group>

                {/* Search Input - only for new-section tab */}
                {activeTab === 'new-section' && (
                    <TextInput
                        placeholder="Search styles..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.currentTarget.value)}
                        mb="sm"
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
                        mb="sm"
                        size="sm"
                    />
                )}

                {/* Selected Style Display - only for new-section tab */}
                {activeTab === 'new-section' && selectedStyle && (
                    <Card withBorder p="xs" bg="blue.0" mb="sm">
                        <Group justify="space-between" gap="xs">
                            <Group gap="xs" flex={1} style={{ minWidth: 0 }}>
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
                    <Text size="xs" c="dimmed" mb="sm">
                        Click on a style below to select it for your new section
                    </Text>
                )}

                {/* Tab Content */}
                        <Tabs.Panel value="new-section">
                            {(isLoadingStyles || (parentSectionId && isLoadingParentDetails)) ? (
                                <Group justify="center" p="xl">
                                    <Loader size="sm" />
                                    <Text size="sm">
                                        {isLoadingStyles ? 'Loading styles...' : 'Loading parent section details...'}
                                    </Text>
                                </Group>
                            ) : stylesError ? (
                                <Alert icon={<IconAlertCircle size={16} />} color="red">
                                    Failed to load styles. Please try again.
                                </Alert>
                            ) : filteredStyleGroups.length === 0 ? (
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    {searchQuery
                                        ? 'No styles found matching your search criteria.'
                                        : parentSectionId
                                            ? 'No styles are allowed as children of the selected parent section.'
                                            : 'No styles available.'
                                    }
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
                                                        style={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            backgroundColor: selectedStyle?.id === style.id ? 'var(--mantine-color-blue-1)' : undefined,
                                                            borderColor: selectedStyle?.id === style.id ? 'var(--mantine-color-blue-6)' : undefined,
                                                            borderWidth: selectedStyle?.id === style.id ? '2px' : undefined
                                                        }}
                                                        onClick={() => handleStyleSelect(style)}
                                                    >
                                                        <Group justify="space-between" wrap="nowrap" gap="xs">
                                                            <div style={{ flex: 1, minWidth: 0 }}>
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

                                {isLoadingUnused || isFetchingUnused ? (
                                    <Group justify="center" p="xl">
                                        <Loader size="sm" />
                                        <Text size="sm">Loading unused sections...</Text>
                                    </Group>
                                ) : unusedError ? (
                                    <Alert icon={<IconAlertCircle size={16} />} color="red">
                                        Failed to load unused sections. Please try again.
                                    </Alert>
                                ) : unusedSections.length === 0 ? (
                                    <Alert icon={<IconInfoCircle size={16} />} color="gray">
                                        No unused sections available. All sections are currently assigned to pages or other sections.
                                    </Alert>
                                ) : (
                                    <Stack gap="sm">
                                        <Select
                                            label="Select Unused Section"
                                            placeholder="Choose an unused section to add..."
                                            comboboxProps={{ withinPortal: true, zIndex: 10000 }}
                                            data={unusedSectionsSelectData}
                                            value={selectedUnusedSection}
                                            onChange={setSelectedUnusedSection}
                                            searchable
                                            clearable
                                            size="sm"
                                            nothingFoundMessage="No unused sections found"
                                        />
                                    </Stack>
                                )}
                            </Stack>
                        </Tabs.Panel>

                        {/* Reference Section Tab Panel */}
                        <Tabs.Panel value="reference-section">
                            <Stack gap="md">
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    Select a reference container section to add to this {parentSectionId ? 'section' : 'page'}. Reference containers are special sections that can be reused across different pages.
                                </Alert>

                                {isLoadingRefContainers || isFetchingRefContainers ? (
                                    <Group justify="center" p="xl">
                                        <Loader size="sm" />
                                        <Text size="sm">Loading reference containers...</Text>
                                    </Group>
                                ) : refContainersError ? (
                                    <Alert icon={<IconAlertCircle size={16} />} color="red">
                                        Failed to load reference containers. Please try again.
                                    </Alert>
                                ) : refContainerSections.length === 0 ? (
                                    <Alert icon={<IconInfoCircle size={16} />} color="gray">
                                        No reference container sections available.
                                    </Alert>
                                ) : (
                                    <Stack gap="sm">
                                        <Select
                                            comboboxProps={{ withinPortal: true, zIndex: 10000 }}
                                            label="Select Reference Container"
                                            placeholder="Choose a reference container to add..."
                                            data={refContainerSectionsSelectData}
                                            value={selectedRefContainerSection}
                                            onChange={setSelectedRefContainerSection}
                                            searchable
                                            clearable
                                            size="sm"
                                            nothingFoundMessage="No reference containers found"
                                        />
                                    </Stack>
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
        </ModalWrapper>
    );
} 