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
    ActionIcon,
    NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconPlus,
    IconSearch,
    IconUpload,
    IconX,
} from '@tabler/icons-react';
import { ModalWrapper } from '../../../../shared';
import { useStyleGroups } from '../../../../../../hooks/useStyleGroups';
import { useSectionOperations } from '../../../../../../hooks/useSectionOperations';
import { useUnusedSections, useRefContainerSections } from '../../../../../../hooks/useSectionUtility';
import { useSectionDetails } from '../../../../../../hooks/useSectionDetails';
import { IStyle } from '../../../../../../types/responses/admin/styles.types';
import { readJsonFile, parseImportValidationErrors } from '../../../../../../utils/export-import.utils';
import { fetchAiSectionPromptTemplate, IImportValidationError } from '../../../../../../api/admin/section.api';
import { ISectionOperationOptions } from '../../../../../../utils/section-operations.utils';
import { isStyleRelationshipValid, findStyleById } from '../../../../../../utils/style-relationship.utils';
import { NewSectionTab } from './tabs/NewSectionTab';
import { ImportSectionTab } from './tabs/ImportSectionTab';
import { ReferenceSectionTab } from './tabs/ReferenceSectionTab';
import { UnusedSectionTab } from './tabs/UnusedSectionTab';
import { useQueryClient } from '@tanstack/react-query';
import { AddSectionTab, ADD_SECTION_TAB, MAX_SECTIONS, MAX_UNUSED_SECTIONS } from './addSectionModal.constants';
import { getNewSectionLimitState, getUnusedSectionLimitState, getStatusText, isSingleMode } from './addSectionModal.utils';

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
}: Readonly<IAddSectionModalProps>) {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<AddSectionTab>(
    ADD_SECTION_TAB.NEW_SECTION
    );
    const [selectedStyles, setSelectedStyles] = useState<
    { style: IStyle; quantity: number }[]
    >([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sectionName, setSectionName] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importErrors, setImportErrors] = useState<IImportValidationError[]>([]);
    const [isCopyingPrompt, setIsCopyingPrompt] = useState(false);
    const [selectedUnusedSections, setSelectedUnusedSections] = useState<
    { sectionId: number }[]
    >([]);
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

    // Get the parent style with relationships from the full styles list
    const parentStyleWithRelationships = useMemo(() => {
        if (!parentSectionDetails?.section?.style || !styleGroups) {
            return null;
        }

        const parentStyleId = parentSectionDetails.section.style.id;
        return findStyleById(parentStyleId, styleGroups);
    }, [parentSectionDetails, styleGroups]);

      const refContainerSectionsSelectData = useMemo(() => {
        return refContainerSections
          .filter((section) => {
            // If no parent or no style groups, allow all ref container sections
            if (!parentStyleWithRelationships || !styleGroups) return true;

            // Find the style of this ref container section
            const sectionStyle = findStyleById(section.idStyles, styleGroups);
            if (!sectionStyle) return true; // If style not found, allow it

            // Check if this section's style is allowed as a child of the parent
            return isStyleRelationshipValid(sectionStyle, parentStyleWithRelationships);
          })
          .map((section) => ({
            value: String(section.id),
            label: `${section.name} (ID: ${section.id}) - ${section.styleName}`
          }));
      }, [refContainerSections, parentStyleWithRelationships, styleGroups]);


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

    // Filtered Unused Sections
    const filteredUnusedSections = useMemo(() => {
    if (!searchQuery) return unusedSections;

    const query = searchQuery.toLowerCase();
    return unusedSections.filter(
        (section) =>
        section.name.toLowerCase().includes(query) ||
        String(section.id).includes(query) ||
        (section.styleName && section.styleName.toLowerCase().includes(query)),
    );
    }, [unusedSections, searchQuery]);



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

    const handleTabChange = (value: AddSectionTab) => {
        setActiveTab(value || ADD_SECTION_TAB.NEW_SECTION);
        // Data is already prefetched when modal opens, no need to refetch
    };

    const handleClose = () => {
        setSelectedStyles([]);
        setSectionName('');
        setSearchQuery('');
        setActiveTab(ADD_SECTION_TAB.NEW_SECTION);
        setSelectedFile(null);
        setIsImporting(false);
        setImportErrors([]);
        setIsCopyingPrompt(false);
        setSelectedUnusedSections([]);
        setSelectedRefContainerSection(null);
        onClose();
    };

   const handleStyleToggle = (style: IStyle) => {
     const exists = selectedStyles.some((s) => s.style.id === style.id);

     if (!exists && selectedStyles.length >= MAX_SECTIONS) {
       notifications.show({
         title: "Limit reached",
         message: `Maximum of ${MAX_SECTIONS} styles allowed`,
         color: "orange",
       });
       return;
     }

     setSelectedStyles((prev) => {
       if (exists) {
         return prev.filter((s) => s.style.id !== style.id);
       }

       return [...prev, { style, quantity: 1 }];
     });
   };
   

     // ==================== Unused Section Functions ====================
    const toggleUnusedSection = (section: {
    id: number;
    name: string;
    }) => {
    setSelectedUnusedSections((prev) => {
        const exists = prev.some((s) => s.sectionId === section.id);

        if (exists) {
        return prev.filter((s) => s.sectionId !== section.id);
        }

        if (prev.length >= MAX_UNUSED_SECTIONS) {
        notifications.show({
            title: "Limit reached",
            message: `Maximum of ${MAX_UNUSED_SECTIONS} sections allowed`,
            color: "orange",
        });
        return prev;
        }

        return [
        ...prev,
        {
            sectionId: section.id,
        },
        ];
    });
    };

   const handleAddUnusedSection = async () => {
     if (selectedUnusedSections.length === 0) return;

     const operationOptions: ISectionOperationOptions = {
       specificPosition,
     };

     try {
        // Additional safety check: validate relationship before adding
       const validSections = selectedUnusedSections.filter((item) => {
         if (!parentStyleWithRelationships || !styleGroups) return true;

         const unusedSection = unusedSections.find((s) => s.id === item.sectionId);
         if (!unusedSection) return false;

         const sectionStyle = findStyleById(
           unusedSection.idStyles,
           styleGroups,
         );

         return sectionStyle
           ? isStyleRelationshipValid(
               sectionStyle,
               parentStyleWithRelationships,
             )
           : true;
       });

       if (validSections.length === 0) return;

       if (parentSectionId !== null) {
         await sectionOperations.addSectionToSection(
           parentSectionId,
           validSections,
           operationOptions,
         );
       } else if (pageId) {
         await sectionOperations.addSectionToPage(
           validSections,
           operationOptions,
         );
       }

       handleClose();
       queryClient.invalidateQueries({queryKey: ['admin', 'sections', 'unused']})
     } catch (error) {
       // handled by hook
     }
   };

    const handleAddRefContainerSection = async () => {
        if (!selectedRefContainerSection) {
            return;
        }

        const sectionId = parseInt(selectedRefContainerSection);

        // Additional safety check: validate relationship before adding
        if (parentStyleWithRelationships && styleGroups) {
            const refContainerSection = refContainerSections.find(s => s.id === sectionId);
            if (refContainerSection) {
                const sectionStyle = findStyleById(refContainerSection.idStyles, styleGroups);
                if (sectionStyle && !isStyleRelationshipValid(sectionStyle, parentStyleWithRelationships)) {
                    return;
                }
            }
        }

        const operationOptions: ISectionOperationOptions = {
            specificPosition,
        };

        try {
            if (parentSectionId !== null) {
                // Add ref container section to another section
                await sectionOperations.addSectionToSection(parentSectionId,  [{ sectionId: sectionId }], operationOptions);
            } else if (pageId) {
                // Add ref container section to page
                await sectionOperations.addSectionToPage(  [{ sectionId: sectionId}], operationOptions);
            }
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleAddSection = async () => {
    if (selectedStyles.length === 0) return;

    try {

        if (parentSectionId !== null) {
       await sectionOperations.createSectionInSection(
         parentSectionId,
         selectedStyles,
         {
           specificPosition,
           name: sectionName,
         },
        );
        } else if (pageId) {
        await sectionOperations.createSectionInPage(selectedStyles, {
          specificPosition,
          name: sectionName,
        });
        }
    } catch (error) {
        // handled by hook
    }
    };

    const handleImportSections = async () => {
        if (!selectedFile || !pageId) return;

        setIsImporting(true);
        setImportErrors([]);

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
            const validationErrors = parseImportValidationErrors(error);
            if (validationErrors.length > 0) {
                setImportErrors(validationErrors);
                notifications.show({
                    title: 'Import validation failed',
                    message: `${validationErrors.length} issue(s) found in the JSON. See details below.`,
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Import Failed',
                    message: error instanceof Error ? error.message : 'An unknown error occurred during import',
                    color: 'red',
                });
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleCopyAiPrompt = async () => {
        setIsCopyingPrompt(true);
        try {
            const prompt = await fetchAiSectionPromptTemplate();

            if (!navigator?.clipboard?.writeText) {
                throw new Error('Clipboard API is not available in this browser');
            }
            await navigator.clipboard.writeText(prompt);

            notifications.show({
                title: 'AI prompt copied',
                message:
                    'Paste it into ChatGPT / Gemini, describe what you need, ' +
                    'download the returned JSON, then upload it here.',
                color: 'teal',
                autoClose: 6000,
            });
        } catch (error) {
            notifications.show({
                title: 'Failed to copy AI prompt',
                message: error instanceof Error ? error.message : 'Unknown error',
                color: 'red',
            });
        } finally {
            setIsCopyingPrompt(false);
        }
    };

    const updateStyleQuantity = (styleId: number, quantity: number) => {
        setSelectedStyles((prev) =>
        prev.map((item) =>
            item.style.id === styleId
            ? { ...item, quantity: Math.min(Math.max(quantity, 1), 10) }
            : item,
        ),
        );
    };

    // Helpers
    const { styleCount, isNearLimit, isLimit } =
    getNewSectionLimitState(selectedStyles.length);

    const {
    unusedCount,
    isUnusedNearLimit,
    isUnusedLimit,
    } = getUnusedSectionLimitState(selectedUnusedSections.length);

    const statusText = getStatusText({
    activeTab,
    newSectionCount: styleCount,
    isNearLimit,
    isLimit,
    unusedSectionCount: unusedCount,
    isUnusedNearLimit,
    isUnusedLimit,
    hasRefContainerSelection: !!selectedRefContainerSection,
    hasImportFile: !!selectedFile,
    importFileName: selectedFile?.name || null,
    });

    const isProcessing = sectionOperations.isLoading || isImporting;
    const singleMode = isSingleMode(selectedStyles);

    // Custom actions for the footer based on active tab
    const getCustomActions = () => (
      <Group justify="space-between" align="center" w="100%">
       <Text size="sm" c={isLimit || isNearLimit ? "orange" : "dimmed"}>
        {statusText}
        </Text>
        <Group gap="sm">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
            size="sm"
          >
            Cancel
          </Button>
          {activeTab === ADD_SECTION_TAB.IMPORT_SECTION ? (
            <Button
              leftSection={<IconUpload size={16} />}
              onClick={handleImportSections}
              disabled={!selectedFile || isProcessing}
              loading={isImporting}
              size="sm"
              color="green"
            >
              Import Sections
            </Button>
          ) : activeTab === ADD_SECTION_TAB.UNASSIGNED_SECTION ? (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddUnusedSection}
              disabled={selectedUnusedSections.length === 0 || isProcessing}
              loading={sectionOperations.isLoading}
              size="sm"
              color="orange"
            >
              Add Unused Section
            </Button>
          ) : activeTab === ADD_SECTION_TAB.REFERENCE_SECTION ? (
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
              disabled={
                selectedStyles.length === 0 ||
                selectedStyles.length > MAX_SECTIONS ||
                isProcessing
              }
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
            <Tabs.Tab value={ADD_SECTION_TAB.NEW_SECTION}>New Section</Tabs.Tab>
            <Tabs.Tab value={ADD_SECTION_TAB.UNASSIGNED_SECTION}>Unused Section</Tabs.Tab>
            <Tabs.Tab value={ADD_SECTION_TAB.REFERENCE_SECTION}>Reference Section</Tabs.Tab>
            <Tabs.Tab value={ADD_SECTION_TAB.IMPORT_SECTION}>Import Section</Tabs.Tab>
            </Tabs.List>
          </Group>

          {/* Search Input - only for new-section tab */}
          {activeTab === ADD_SECTION_TAB.NEW_SECTION && (
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
          {activeTab === ADD_SECTION_TAB.NEW_SECTION && singleMode && (
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
          {activeTab === ADD_SECTION_TAB.NEW_SECTION && selectedStyles.length > 0 && (
            <Stack mb="sm">
              {selectedStyles.map((item) => (
                <Card key={item.style.id} withBorder p="xs" bg="blue.0">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <Text size="sm" fw={500}>
                        {item.style.name}
                      </Text>
                      <Badge size="xs">{item.style.type}</Badge>
                    </Group>

                    <Group gap="xs">
                      <NumberInput
                        size="xs"
                        min={1}
                        max={10}
                        value={item.quantity}
                        onChange={(val) =>
                          updateStyleQuantity(item.style.id, Number(val) || 1)
                        }
                        style={{ width: 70 }}
                      />

                      <ActionIcon
                        size="sm"
                        variant="filled"
                        onClick={() =>
                          setSelectedStyles((prev) =>
                            prev.filter((s) => s.style.id !== item.style.id),
                          )
                        }
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          )}

          {/* Instructions - only for new-section tab */}
          {activeTab === ADD_SECTION_TAB.NEW_SECTION && (
            <Text size="xs" c="dimmed" mb="sm">
              Click on a style below to select it for your new section
            </Text>
          )}

          {/* Tab Content */}
         <Tabs.Panel value={ADD_SECTION_TAB.NEW_SECTION}>
                    <NewSectionTab
                        isLoadingStyles={isLoadingStyles}
                        isLoadingParentDetails={isLoadingParentDetails}
                        stylesError={stylesError}
                        filteredStyleGroups={filteredStyleGroups}
                        parentSectionId={parentSectionId}
                        searchQuery={searchQuery}
                        selectedStyles={selectedStyles}
                        handleStyleToggle={handleStyleToggle}
                        updateStyleQuantity={updateStyleQuantity}
                    />
                </Tabs.Panel>

                <Tabs.Panel value={ADD_SECTION_TAB.UNASSIGNED_SECTION}>
                    <UnusedSectionTab
                        isLoadingUnused={isLoadingUnused}
                        isFetchingUnused={isFetchingUnused}
                        unusedError={unusedError}
                        unusedSections={unusedSections}
                        filteredUnusedSections={filteredUnusedSections}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedUnusedSections={selectedUnusedSections}
                        toggleUnusedSection={toggleUnusedSection}
                        parentSectionId={parentSectionId}
                    />
                </Tabs.Panel>

                <Tabs.Panel value={ADD_SECTION_TAB.REFERENCE_SECTION}>
                    <ReferenceSectionTab
                        isLoadingRefContainers={isLoadingRefContainers}
                        isFetchingRefContainers={isFetchingRefContainers}
                        refContainersError={refContainersError}
                        refContainerSections={refContainerSections}
                        refContainerSectionsSelectData={refContainerSectionsSelectData}
                        selectedRefContainerSection={selectedRefContainerSection}
                        setSelectedRefContainerSection={setSelectedRefContainerSection}
                        parentSectionId={parentSectionId}
                    />
                </Tabs.Panel>

                <Tabs.Panel value={ADD_SECTION_TAB.IMPORT_SECTION}>
                    <ImportSectionTab
                        selectedFile={selectedFile}
                        setSelectedFile={setSelectedFile}
                        isCopyingPrompt={isCopyingPrompt}
                        handleCopyAiPrompt={handleCopyAiPrompt}
                        importErrors={importErrors}
                        setImportErrors={setImportErrors}
                        pageId={pageId}
                    />
                </Tabs.Panel>
        </Tabs>
      </ModalWrapper>
    );
} 