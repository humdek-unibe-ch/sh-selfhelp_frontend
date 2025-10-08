"use client";

import { useEffect, useState } from 'react';
import { Group, Stack, Text, TextInput, Badge } from '@mantine/core';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { RichTextField } from '../../shared/field-components/RichTextField';

interface IGroupedTranslationInputProps {
  subjectValue?: { [languageId: number]: string };
  bodyValue?: { [languageId: number]: string };
  subjectPlaceholder?: string;
  bodyPlaceholder?: string;
  onSubjectChange: (translations: { [languageId: number]: string }) => void;
  onBodyChange: (translations: { [languageId: number]: string }) => void;
  required?: boolean;
}

export function GroupedTranslationInput({
  subjectValue = {},
  bodyValue = {},
  subjectPlaceholder,
  bodyPlaceholder,
  onSubjectChange,
  onBodyChange,
  required = false,
}: IGroupedTranslationInputProps) {
  const [activeLanguage, setActiveLanguage] = useState<string>('');
  const { languages: languagesData } = useAdminLanguages();

  // Get translation status for all languages
  const languagesWithStatus = languagesData?.map(language => {
    const hasSubjectTranslation = !!(subjectValue[language.id] && subjectValue[language.id].trim());
    const hasBodyTranslation = !!(bodyValue[language.id] && bodyValue[language.id].trim());
    const hasAnyTranslation = hasSubjectTranslation || hasBodyTranslation;

    return {
      id: language.id,
      locale: language.locale,
      language: language.language,
      hasSubjectTranslation,
      hasBodyTranslation,
      hasAnyTranslation
    };
  }) || [];

  // Auto-select first language on mount
  useEffect(() => {
    if (languagesWithStatus.length > 0 && !activeLanguage) {
      setActiveLanguage(languagesWithStatus[0].id.toString());
    }
  }, [languagesWithStatus, activeLanguage]);

  const handleSubjectChange = (value: string) => {
    const languageId = parseInt(activeLanguage);
    const newTranslations = { ...subjectValue, [languageId]: value };
    onSubjectChange(newTranslations);
  };

  const handleBodyChange = (value: string) => {
    const languageId = parseInt(activeLanguage);
    const newTranslations = { ...bodyValue, [languageId]: value };
    onBodyChange(newTranslations);
  };

  const activeLanguageData = languagesWithStatus.find(lang => lang.id.toString() === activeLanguage);

  const subjectMissing = languagesWithStatus.some(s => !s.hasSubjectTranslation);
  const bodyMissing = languagesWithStatus.some(s => !s.hasBodyTranslation);

  return (
    <Stack gap="xs">
      <Group justify="space-between" align="flex-end">
        <Text size="sm" fw={500}>
          Content Translations
          {required && <span style={{ color: 'red' }}> *</span>}
        </Text>

        <Group gap={4}>
          {languagesWithStatus.map(language => (
            <Badge
              key={language.id}
              size="xs"
              variant={activeLanguage === language.id.toString() ? "filled" : language.hasAnyTranslation ? "light" : "outline"}
              color={activeLanguage === language.id.toString() ? "blue" : language.hasAnyTranslation ? "green" : "gray"}
              style={{
                cursor: 'pointer',
                minWidth: 24,
                textAlign: 'center',
                fontWeight: activeLanguage === language.id.toString() ? 600 : 400
              }}
              onClick={() => setActiveLanguage(language.id.toString())}
            >
              {language.locale}
            </Badge>
          ))}
        </Group>
      </Group>

      {activeLanguageData && (
        <Stack gap="md">
          {/* Subject Field */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Subject
              {!activeLanguageData.hasSubjectTranslation && (
                <span style={{ color: 'red', marginLeft: 8 }}>•</span>
              )}
            </Text>
            <TextInput
              value={subjectValue[activeLanguageData.id] || ''}
              onChange={(e) => handleSubjectChange(e.currentTarget.value)}
              placeholder={subjectPlaceholder || `Enter subject for ${activeLanguageData.language}`}
              required={required}
            />
          </Stack>

          {/* Body Field */}
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Body
              {!activeLanguageData.hasBodyTranslation && (
                <span style={{ color: 'red', marginLeft: 8 }}>•</span>
              )}
            </Text>
            <RichTextField
              fieldId={parseInt(activeLanguage) * 1000 + 2} // Unique field ID
              value={bodyValue[activeLanguageData.id] || ''}
              onChange={handleBodyChange}
              placeholder={bodyPlaceholder || `Enter body content for ${activeLanguageData.language}`}
              label=""
              required={required}
            />
          </Stack>
        </Stack>
      )}

      {(subjectMissing || bodyMissing) && (
        <Group gap="md">
          {subjectMissing && (
            <Text size="xs" c="orange">
              ⚠️ Some languages are missing subject translations
            </Text>
          )}
          {bodyMissing && (
            <Text size="xs" c="orange">
              ⚠️ Some languages are missing body translations
            </Text>
          )}
        </Group>
      )}
    </Stack>
  );
}
