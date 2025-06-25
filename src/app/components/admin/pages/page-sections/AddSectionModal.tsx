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
    FileInput
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
import { useCreateSectionInPageMutation, useCreateSectionInSectionMutation } from '../../../../../hooks/mutations';
import { IStyle, IStyleGroup } from '../../../../../types/responses/admin/styles.types';
import styles from './AddSectionModal.module.css';
import { importSectionsToPage, importSectionsToSection, ISectionExportData } from '../../../../../api/admin/section.api';
import { readJsonFile, isValidJsonFile } from '../../../../../utils/export-import.utils';
import { notifications } from '@mantine/notifications';

interface IAddSectionModalProps {
    opened: boolean;
    onClose: () => void;
    pageKeyword?: string;
    parentSectionId?: number | null;
    title?: string;
    specificPosition?: number;
}

export function AddSectionModal({
    opened,
    onClose,
    pageKeyword,
    parentSectionId = null,
    title = 'Add Section',
    specificPosition
}: IAddSectionModalProps) {
    const [activeTab, setActiveTab] = useState<string>('new-section');
    const [selectedStyle, setSelectedStyle] = useState<IStyle | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sectionName, setSectionName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);

    const { data: styleGroups, isLoading: isLoadingStyles, error: stylesError } = useStyleGroups(opened);

    // Mutations
    const createSectionInPageMutation = useCreateSectionInPageMutation({
        showNotifications: true,
        onSuccess: () => {
            handleClose();
        }
    });

    const createSectionInSectionMutation = useCreateSectionInSectionMutation({
        showNotifications: true,
        pageKeyword,
        onSuccess: () => {
            handleClose();
        }
    });

    const handleClose = () => {
        setSelectedStyle(null);
        setSectionName('');
        setSearchQuery('');
        setActiveTab('new-section');
        setSelectedFile(null);
        setIsImporting(false);
        onClose();
    };

    const handleStyleSelect = (style: IStyle) => {
        setSelectedStyle(style);
    };

    const handleAddSection = async () => {
        if (!selectedStyle) {
            return;
        }

        // Use specific position if provided, otherwise default to -1 (first)
        const calculatedPosition = specificPosition ?? -1;

        const sectionData = {
            styleId: selectedStyle.id,
            name: sectionName || undefined,
            position: calculatedPosition,
        };



        try {
            if (parentSectionId !== null) {
                // Create section in another section
                if (!pageKeyword) {
                    throw new Error('Page keyword is required for section operations');
                }
                await createSectionInSectionMutation.mutateAsync({
                    keyword: pageKeyword,
                    parentSectionId,
                    sectionData
                });
            } else if (pageKeyword) {
                // Create section in page
                await createSectionInPageMutation.mutateAsync({
                    keyword: pageKeyword,
                    sectionData
                });
            }
        } catch (error) {
            // Error handling is done by the mutation hooks
        }
    };

    const handleImportSections = async () => {
        if (!selectedFile || !pageKeyword) return;

        setIsImporting(true);

        try {
            // Read and parse the JSON file
            const sectionsData = await readJsonFile(selectedFile);

            // Import sections
            if (parentSectionId !== null) {
                // Import to parent section
                await importSectionsToSection(pageKeyword, parentSectionId, sectionsData);
            } else {
                // Import to page
                await importSectionsToPage(pageKeyword, sectionsData);
            }

            notifications.show({
                title: 'Import Successful',
                message: `Successfully imported ${sectionsData.length} section(s)`,
                color: 'green'
            });

            handleClose();
        } catch (error) {
            console.error('Error importing sections:', error);
            notifications.show({
                title: 'Import Failed',
                message: error instanceof Error ? error.message : 'Failed to import sections',
                color: 'red'
            });
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

    const isProcessing = createSectionInPageMutation.isPending || createSectionInSectionMutation.isPending || isImporting;

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
                            <Tabs.Tab value="unassigned-section" disabled>
                                Unassigned Section
                            </Tabs.Tab>
                            <Tabs.Tab value="reference-section" disabled>
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

                        {/* Placeholder panels for other tabs */}
                        <Tabs.Panel value="unassigned-section">
                            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                Unassigned Section functionality coming soon.
                            </Alert>
                        </Tabs.Panel>

                        <Tabs.Panel value="reference-section">
                            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                Reference Section functionality coming soon.
                            </Alert>
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
                            ) : (
                                <Button
                                    leftSection={<IconPlus size={16} />}
                                    onClick={handleAddSection}
                                    disabled={!selectedStyle || isProcessing}
                                    loading={createSectionInPageMutation.isPending || createSectionInSectionMutation.isPending}
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