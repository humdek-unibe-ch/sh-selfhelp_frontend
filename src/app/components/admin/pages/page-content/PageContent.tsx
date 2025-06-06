'use client';

import { 
    Paper, 
    Title, 
    Text, 
    Group, 
    Badge, 
    Stack,
    Divider,
    Box,
    Alert,
    ScrollArea,
    Button,
    TextInput,
    Textarea,
    Checkbox,
    ActionIcon,
    Modal,
    Collapse
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconFile, 
    IconDeviceFloppy, 
    IconPlus, 
    IconTrash,
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useState, useEffect } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { LockedField } from '../../../ui/locked-field/LockedField';
import { debug } from '../../../../../utils/debug-logger';

interface PageContentProps {
    page: IAdminPage | null;
}

interface IPageFormValues {
    // Page properties
    keyword: string;
    url: string;
    protocol: string;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
    pageType: string;
    
    // Field values (dynamic based on API response)
    fields: Record<string, string>;
}

export function PageContent({ page }: PageContentProps) {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [contentExpanded, setContentExpanded] = useState(true);
    const [propertiesExpanded, setPropertiesExpanded] = useState(true);
    
    // Fetch page fields when page is selected
    const { 
        data: pageFieldsData, 
        isLoading: fieldsLoading, 
        error: fieldsError 
    } = usePageFields(page?.keyword || null, !!page);

    // Form for page editing
    const form = useForm<IPageFormValues>({
        initialValues: {
            keyword: '',
            url: '',
            protocol: 'GET|POST',
            headless: false,
            navPosition: null,
            footerPosition: null,
            openAccess: false,
            pageAccessType: '',
            pageType: '',
            fields: {}
        }
    });

    // Update form when page data changes
    useEffect(() => {
        if (page && pageFieldsData) {
            const pageDetails = pageFieldsData.page;
            const fields = pageFieldsData.fields;
            
            // Create fields object from API response
            const fieldsObject: Record<string, string> = {};
            fields.forEach(field => {
                // Get the content from the first translation (assuming de-CH or property)
                const translation = field.translations.find(t => t.language_code === 'de-CH') || 
                                  field.translations.find(t => t.language_code === 'property') ||
                                  field.translations[0];
                fieldsObject[field.name] = translation?.content || field.default_value || '';
            });

            form.setValues({
                keyword: pageDetails.keyword,
                url: pageDetails.url,
                protocol: pageDetails.protocol,
                headless: pageDetails.headless,
                navPosition: pageDetails.navPosition,
                footerPosition: pageDetails.footerPosition,
                openAccess: pageDetails.openAccess,
                pageAccessType: pageDetails.pageAccessType.lookupCode,
                pageType: pageDetails.pageType.name,
                fields: fieldsObject
            });
        }
    }, [page, pageFieldsData]);

    // Save hotkey (Ctrl+S)
    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleSave = () => {
        debug('Saving page data', 'PageContent', form.values);
        // TODO: Implement save mutation
        console.log('Save page:', form.values);
    };

    const handleCreateChildPage = () => {
        debug('Creating child page', 'PageContent', { parentPage: page });
        // TODO: Open create page modal with parent set
        console.log('Create child page for:', page?.keyword);
    };

    const handleDeletePage = () => {
        if (deleteConfirmText === page?.keyword) {
            debug('Deleting page', 'PageContent', { page: page?.keyword });
            // TODO: Implement delete mutation
            console.log('Delete page:', page?.keyword);
            setDeleteModalOpened(false);
            setDeleteConfirmText('');
        }
    };

    if (!page) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <IconFile size="3rem" color="var(--mantine-color-gray-5)" />
                    <Title order={3} c="dimmed">No Page Selected</Title>
                    <Text c="dimmed" ta="center">
                        Select a page from the navigation to view and edit its content.
                    </Text>
                </Stack>
            </Paper>
        );
    }

    if (fieldsLoading) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <Text>Loading page details...</Text>
                </Stack>
            </Paper>
        );
    }

    if (fieldsError) {
        return (
            <Paper p="xl" withBorder>
                <Alert color="red" title="Error loading page details">
                    {fieldsError.message}
                </Alert>
            </Paper>
        );
    }

    const pageDetails = pageFieldsData?.page;
    const fields = pageFieldsData?.fields || [];
    
    // Separate content fields (display: true) from property fields (display: false)
    const contentFields = fields.filter(field => field.display);
    const propertyFields = fields.filter(field => !field.display);

    return (
        <Stack gap={0} h="100%">
            {/* Fixed Save Button */}
            <Paper p="md" withBorder style={{ borderBottom: 'none' }}>
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <Title order={2}>{page.keyword}</Title>
                        <Badge color="blue" variant="light">
                            ID: {pageDetails?.id}
                        </Badge>
                    </Group>
                    <Button
                        leftSection={<IconDeviceFloppy size="1rem" />}
                        onClick={handleSave}
                        variant="filled"
                    >
                        Save
                    </Button>
                </Group>
            </Paper>

            {/* Scrollable Content */}
            <ScrollArea flex={1}>
                <Stack gap="lg" p="md">
                    {/* Content Section */}
                    <Paper withBorder>
                        <Group 
                            p="md" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setContentExpanded(!contentExpanded)}
                        >
                            <Title order={3}>Content</Title>
                            <ActionIcon variant="subtle">
                                {contentExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={contentExpanded}>
                            <Divider />
                            <Box p="md">
                                <Text size="sm" c="dimmed" mb="md">
                                    Content settings for {page.keyword} will be loaded dynamically
                                </Text>
                                
                                <Stack gap="md">
                                    {contentFields.length > 0 ? (
                                        contentFields.map(field => (
                                            <Box key={field.id}>
                                                {field.type === 'textarea' ? (
                                                    <Textarea
                                                        label={field.name}
                                                        description={field.help}
                                                        placeholder={field.default_value || ''}
                                                        {...form.getInputProps(`fields.${field.name}`)}
                                                        autosize
                                                        minRows={3}
                                                    />
                                                ) : field.type === 'markdown-inline' ? (
                                                    <TextInput
                                                        label={field.name}
                                                        description={field.help}
                                                        placeholder={field.default_value || ''}
                                                        {...form.getInputProps(`fields.${field.name}`)}
                                                    />
                                                ) : (
                                                    <TextInput
                                                        label={field.name}
                                                        description={field.help}
                                                        placeholder={field.default_value || ''}
                                                        {...form.getInputProps(`fields.${field.name}`)}
                                                    />
                                                )}
                                            </Box>
                                        ))
                                    ) : (
                                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                                            No content fields available for this page.
                                        </Alert>
                                    )}
                                </Stack>
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Properties Section */}
                    <Paper withBorder>
                        <Group 
                            p="md" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                        >
                            <Title order={3}>Properties</Title>
                            <ActionIcon variant="subtle">
                                {propertiesExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={propertiesExpanded}>
                            <Divider />
                            <Box p="md">
                                <Text size="sm" c="dimmed" mb="md">
                                    Properties for {page.keyword} will be loaded dynamically
                                </Text>
                                
                                <Stack gap="md">
                                    {/* Page Basic Properties */}
                                    <LockedField
                                        label="Keyword"
                                        {...form.getInputProps('keyword')}
                                        lockedTooltip="Enable keyword editing"
                                        unlockedTooltip="Lock keyword editing"
                                    />
                                    
                                    <LockedField
                                        label="URL"
                                        {...form.getInputProps('url')}
                                        lockedTooltip="Enable URL editing"
                                        unlockedTooltip="Lock URL editing"
                                    />

                                    <TextInput
                                        label="Protocol"
                                        {...form.getInputProps('protocol')}
                                        readOnly
                                    />

                                    <Group grow>
                                        <TextInput
                                            label="Navigation Position"
                                            type="number"
                                            {...form.getInputProps('navPosition')}
                                        />
                                        <TextInput
                                            label="Footer Position"
                                            type="number"
                                            {...form.getInputProps('footerPosition')}
                                        />
                                    </Group>

                                    <Group>
                                        <Checkbox
                                            label="Headless Page"
                                            {...form.getInputProps('headless', { type: 'checkbox' })}
                                        />
                                        <Checkbox
                                            label="Open Access"
                                            {...form.getInputProps('openAccess', { type: 'checkbox' })}
                                        />
                                    </Group>

                                    <Group grow>
                                        <TextInput
                                            label="Page Access Type"
                                            value={pageDetails?.pageAccessType.lookupValue || ''}
                                            readOnly
                                        />
                                        <TextInput
                                            label="Page Type"
                                            value={pageDetails?.pageType.name || ''}
                                            readOnly
                                        />
                                    </Group>

                                    {/* Property Fields */}
                                    {propertyFields.map(field => (
                                        <Box key={field.id}>
                                            {field.type === 'textarea' ? (
                                                <Textarea
                                                    label={field.name}
                                                    description={field.help}
                                                    placeholder={field.default_value || ''}
                                                    {...form.getInputProps(`fields.${field.name}`)}
                                                    autosize
                                                    minRows={2}
                                                />
                                            ) : (
                                                <TextInput
                                                    label={field.name}
                                                    description={field.help}
                                                    placeholder={field.default_value || ''}
                                                    {...form.getInputProps(`fields.${field.name}`)}
                                                />
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Action Buttons */}
                    <Paper p="md" withBorder>
                        <Stack gap="md">
                            <Title order={4}>Actions</Title>
                            <Group>
                                <Button
                                    leftSection={<IconPlus size="1rem" />}
                                    variant="outline"
                                    onClick={handleCreateChildPage}
                                >
                                    Create Child Page
                                </Button>
                                <Button
                                    leftSection={<IconTrash size="1rem" />}
                                    color="red"
                                    variant="outline"
                                    onClick={() => setDeleteModalOpened(true)}
                                >
                                    Delete Page
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Stack>
            </ScrollArea>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={() => {
                    setDeleteModalOpened(false);
                    setDeleteConfirmText('');
                }}
                title="Delete Page"
                centered
            >
                <Stack gap="md">
                    <Alert color="red" title="Warning">
                        This action cannot be undone. The page and all its content will be permanently deleted.
                    </Alert>
                    
                    <Text>
                        To confirm deletion, type the page keyword: <Text span fw={700}>{page.keyword}</Text>
                    </Text>
                    
                    <TextInput
                        placeholder={`Type "${page.keyword}" to confirm`}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                    
                    <Group justify="flex-end">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setDeleteModalOpened(false);
                                setDeleteConfirmText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            disabled={deleteConfirmText !== page.keyword}
                            onClick={handleDeletePage}
                        >
                            Delete Page
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
} 