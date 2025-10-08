"use client";

import { useEffect, useState } from 'react';
import { Card, Group, Select, Stack, Text, TextInput, Textarea, Badge, ActionIcon, Tooltip } from '@mantine/core';
import { IconLanguage, IconCheck, IconX } from '@tabler/icons-react';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { useActionTranslations } from '../../../../../hooks/useActionTranslations';

interface ITranslationInputProps {
  actionId: number;
  translationKey: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  minRows?: number;
  required?: boolean;
}

export function TranslationInput({
  actionId,
  translationKey,
  label,
  placeholder,
  multiline = false,
  minRows = 3,
  required = false
}: ITranslationInputProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<number>(1); // Default to 'all' locale
  const [localValue, setLocalValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { languages: languagesData } = useAdminLanguages();
  const { data: translations, isLoading: translationsLoading } = useActionTranslations(actionId);
  const createTranslation = useActionTranslations(actionId).createMutation;

  // Get current translation for selected language
  const currentTranslation = translations?.find(
    (t: any) => t.translation_key === translationKey && t.id_languages === selectedLanguage
  );

  // Get translation status for all languages
  const translationStatus = languagesData?.map(language => {
    const hasTranslation = translations?.some(
      (t: any) => t.translation_key === translationKey && t.id_languages === language.id
    );
    return {
      id: language.id,
      locale: language.locale,
      language: language.language,
      hasTranslation
    };
  }) || [];

  // Update local value when translation changes
  useEffect(() => {
    setLocalValue(currentTranslation?.content || '');
  }, [currentTranslation]);

  const handleSave = async () => {
    if (!localValue.trim()) return;

    setIsSaving(true);
    try {
      await createTranslation.mutateAsync({
        translation_key: translationKey,
        id_languages: selectedLanguage,
        content: localValue.trim()
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (value: string | null) => {
    if (value) {
      const newLangId = Number(value);
      setSelectedLanguage(newLangId);
    }
  };

  const InputComponent = multiline ? Textarea : TextInput;

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-end">
        <Text size="sm" fw={500}>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Text>

        <Group gap="xs">
          <Select
            size="xs"
            data={languagesData?.map(l => ({
              value: l.id.toString(),
              label: `${l.language} (${l.locale})`
            })) || []}
            value={selectedLanguage.toString()}
            onChange={handleLanguageChange}
            leftSection={<IconLanguage size={14} />}
            style={{ minWidth: 140 }}
          />

          {/* Translation status badges */}
          <Group gap={2}>
            {translationStatus.slice(0, 3).map(status => (
              <Tooltip key={status.id} label={`${status.language} (${status.locale})`}>
                <Badge
                  size="xs"
                  variant={status.hasTranslation ? "filled" : "light"}
                  color={status.hasTranslation ? "green" : "gray"}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedLanguage(status.id)}
                >
                  {status.locale}
                </Badge>
              </Tooltip>
            ))}
            {translationStatus.length > 3 && (
              <Tooltip label={`+${translationStatus.length - 3} more languages`}>
                <Badge size="xs" variant="light">...</Badge>
              </Tooltip>
            )}
          </Group>
        </Group>
      </Group>

      <Group gap="xs" align="flex-end">
        <InputComponent
          placeholder={placeholder || `Enter ${label.toLowerCase()} for selected language`}
          value={localValue}
          onChange={(e) => setLocalValue(e.currentTarget.value)}
          minRows={multiline ? minRows : undefined}
          disabled={translationsLoading}
          style={{ flex: 1 }}
        />

        {localValue !== (currentTranslation?.content || '') && (
          <Group gap="xs">
            <Tooltip label="Save translation">
              <ActionIcon
                variant="filled"
                color="blue"
                size="sm"
                onClick={handleSave}
                loading={isSaving}
                disabled={!localValue.trim()}
              >
                <IconCheck size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Discard changes">
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                onClick={() => setLocalValue(currentTranslation?.content || '')}
              >
                <IconX size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      {translationStatus.some(s => !s.hasTranslation) && (
        <Text size="xs" c="orange">
          ⚠️ Some languages are missing translations for this field
        </Text>
      )}
    </Stack>
  );
}
