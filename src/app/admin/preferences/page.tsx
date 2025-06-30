'use client';

import { useState, useEffect } from 'react';
import { 
    Container, 
    Paper, 
    Title, 
    Stack, 
    Group, 
    NumberInput, 
    Button, 
    Text,
    Alert,
    Divider,
    Grid,
    Loader,
    Center,
    TextInput,
    Switch,
    Textarea,
    Select
} from '@mantine/core';
import { IconSettings, IconInfoCircle, IconDeviceFloppy } from '@tabler/icons-react';
import { useCmsPreferences, useUpdateCmsPreferences } from '../../../hooks/usePreferences';
import { useLanguages } from '../../../hooks/useLanguages';
import { ICMSPreferences } from '../../../api/admin/preferences.api';
import { notifications } from '@mantine/notifications';

export default function PreferencesPage() {
    const { data: preferences, isLoading, error } = useCmsPreferences();
    const { languages, isLoading: languagesLoading } = useLanguages();
    const updateMutation = useUpdateCmsPreferences();

    const [formData, setFormData] = useState<ICMSPreferences>({
        callback_api_key: '',
        default_language_id: undefined,
        anonymous_users: false,
        firebase_config: ''
    });

    // Update local state when preferences are loaded
    useEffect(() => {
        if (preferences) {
            setFormData({
                callback_api_key: preferences.callback_api_key || '',
                default_language_id: preferences.default_language_id || undefined,
                anonymous_users: preferences.anonymous_users || false,
                firebase_config: preferences.firebase_config || ''
            });
        }
    }, [preferences]);

    const handleSave = async () => {
        // Validate Firebase config if provided
        if (formData.firebase_config && formData.firebase_config.trim()) {
            try {
                JSON.parse(formData.firebase_config);
            } catch (error) {
                notifications.show({
                    title: 'Invalid Firebase Configuration',
                    message: 'Firebase configuration must be valid JSON format.',
                    color: 'red'
                });
                return;
            }
        }
        
        updateMutation.mutate(formData);
    };

    const handleInputChange = (field: keyof ICMSPreferences, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (isLoading || languagesLoading) {
        return (
            <Center h="50vh">
                <Loader size="lg" />
            </Center>
        );
    }

    if (error) {
        return (
            <Container size="md" py="xl">
                <Alert color="red" icon={<IconInfoCircle size="1rem" />}>
                    Failed to load CMS preferences: {error.message}
                </Alert>
            </Container>
        );
    }

    // Prepare language options for select
    const languageOptions = languages?.map(lang => ({
        value: lang.id.toString(),
        label: `${lang.locale} (${lang.language})`
    })) || [];

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <Group>
                    <IconSettings size="2rem" />
                    <Title order={1}>CMS Preferences</Title>
                </Group>

                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                    Configure global CMS settings that affect system behavior and integrations.
                </Alert>

                <Paper p="xl" withBorder>
                    <Stack gap="lg">
                        <Title order={2}>CMS Configuration</Title>
                        
                        <Grid>
                            <Grid.Col span={12}>
                                <TextInput
                                    label="Callback API Key"
                                    description="API key for external callback services"
                                    value={formData.callback_api_key || ''}
                                    onChange={(event) => handleInputChange('callback_api_key', event.currentTarget.value)}
                                    placeholder="Enter callback API key"
                                />
                            </Grid.Col>
                            
                            <Grid.Col span={6}>
                                <Select
                                    label="Default Language"
                                    description="Default language for the CMS"
                                    value={formData.default_language_id?.toString() || ''}
                                    onChange={(value) => handleInputChange('default_language_id', value ? parseInt(value) : undefined)}
                                    data={languageOptions}
                                    placeholder="Select default language"
                                    clearable
                                />
                            </Grid.Col>
                            
                            <Grid.Col span={6}>
                                <Switch
                                    label="Allow Anonymous Users"
                                    description="Enable access for non-authenticated users"
                                    checked={formData.anonymous_users || false}
                                    onChange={(event) => handleInputChange('anonymous_users', event.currentTarget.checked)}
                                />
                            </Grid.Col>
                            
                            <Grid.Col span={12}>
                                <Textarea
                                    label="Firebase Configuration"
                                    description="Firebase configuration in JSON format"
                                    value={formData.firebase_config || ''}
                                    onChange={(event) => handleInputChange('firebase_config', event.currentTarget.value)}
                                    placeholder='{"apiKey": "...", "authDomain": "...", ...}'
                                    minRows={4}
                                    maxRows={8}
                                    autosize
                                />
                            </Grid.Col>
                        </Grid>

                        <Divider />

                        <Group justify="flex-end">
                            <Button 
                                onClick={handleSave} 
                                loading={updateMutation.isPending}
                                leftSection={<IconDeviceFloppy size="1rem" />}
                            >
                                Save Preferences
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            </Stack>
        </Container>
    );
} 