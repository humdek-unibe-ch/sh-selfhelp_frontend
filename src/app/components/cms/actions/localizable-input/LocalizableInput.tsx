"use client";

import { useEffect, useState } from 'react';
import { Group, Stack, Text, TextInput, Textarea, Badge } from '@mantine/core';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';

interface ILocalizableInputProps {
  label: string;
  placeholder?: string;
  multiline?: boolean;
  minRows?: number;
  required?: boolean;
  value?: { [languageId: number]: string };
  onChange: (translations: { [languageId: number]: string }) => void;
}

export function LocalizableInput({
  label,
  placeholder,
  multiline = false,
  minRows = 3,
  required = false,
  value = {},
  onChange
}: ILocalizableInputProps) {
  const [activeTab, setActiveTab] = useState<string>('');
  const { languages: languagesData } = useAdminLanguages();

  const InputComponent = multiline ? Textarea : TextInput;

  // Get translation status for all languages
  const languagesWithStatus = languagesData?.map(language => {
    const hasTranslation = !!(value[language.id] && value[language.id].trim());
    return {
      id: language.id,
      locale: language.locale,
      language: language.language,
      hasTranslation
    };
  }) || [];

  // Auto-select first language on mount
  useEffect(() => {
    if (languagesWithStatus.length > 0 && !activeTab) {
      setActiveTab(languagesWithStatus[0].id.toString());
    }
  }, [languagesWithStatus, activeTab]);

  const handleValueChange = (languageId: number, newValue: string) => {
    const newTranslations = { ...value, [languageId]: newValue };
    onChange(newTranslations);
  };

  const activeLanguage = languagesWithStatus.find(lang => lang.id.toString() === activeTab);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-end">
        <Text size="sm" fw={500}>
          {label}
          {required && <span style={{ color: 'red' }}> *</span>}
        </Text>

        <Group gap={4}>
          {languagesWithStatus.map(language => (
            <Badge
              key={language.id}
              size="xs"
              variant={activeTab === language.id.toString() ? "filled" : language.hasTranslation ? "light" : "outline"}
              color={activeTab === language.id.toString() ? "blue" : language.hasTranslation ? "green" : "gray"}
              style={{
                cursor: 'pointer',
                minWidth: 24,
                textAlign: 'center',
                fontWeight: activeTab === language.id.toString() ? 600 : 400
              }}
              onClick={() => setActiveTab(language.id.toString())}
            >
              {language.locale}
            </Badge>
          ))}
        </Group>
      </Group>

      {activeLanguage && (
        <InputComponent
          placeholder={placeholder || `Enter ${label.toLowerCase()} for ${activeLanguage.language}`}
          value={value[activeLanguage.id] || ''}
          onChange={(e) => handleValueChange(activeLanguage.id, e.currentTarget.value)}
          minRows={multiline ? minRows : undefined}
        />
      )}

      {languagesWithStatus.some(s => !s.hasTranslation) && (
        <Text size="xs" c="orange">
          ⚠️ Some languages are missing translations for this field
        </Text>
      )}
    </Stack>
  );
}

