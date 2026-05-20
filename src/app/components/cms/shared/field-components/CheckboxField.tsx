/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { Checkbox, Stack, Group, Badge } from "@mantine/core";
import { FieldLabelWithTooltip } from "../../ui/field-label-with-tooltip/FieldLabelWithTooltip";

interface ICheckboxFieldProps {
  fieldId: number;
  fieldName: string;
  fieldTitle: string | null;
  value: boolean;
  onChange: (value: boolean) => void;
  help?: string;
  locale?: string;
  disabled?: boolean;
}

export function CheckboxField({
  fieldId,
  fieldName,
  fieldTitle,
  value,
  onChange,
  help,
  locale,
  disabled = false,
}: ICheckboxFieldProps) {
  // Helper function to get field label (use title when available, fallback to name)
  const getFieldLabel = () => {
    return fieldTitle && fieldTitle.trim() ? fieldTitle : fieldName;
  };

  return (
    <Stack gap="xs" key={fieldId}>
      <Group gap="xs" align="center">
        <Checkbox
          label={
            <FieldLabelWithTooltip
              label={getFieldLabel()}
              tooltip={help || ""}
              locale={locale}
            />
          }
          checked={!!value}
          onChange={(event) => onChange(event.currentTarget.checked)}
          disabled={disabled}
        />
        <Badge size="xs" variant="light" color="pink">
          checkbox
        </Badge>
      </Group>
    </Stack>
  );
}
