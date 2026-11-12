/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Alert, Code, FileInput, Stack, Text } from '@mantine/core';
import { IconFileTypeCsv, IconInfoCircle } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

interface IImportUsersCsvModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  isLoading: boolean;
}

/** Uploads a CSV of users. The expected columns are stated up front so the
 *  admin can fix the file before uploading rather than after a failed run. */
export function ImportUsersCsvModal({
  opened,
  onClose,
  onConfirm,
  isLoading,
}: IImportUsersCsvModalProps) {
  const [file, setFile] = useState<File | null>(null);

  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={handleClose}
      title="Import users from CSV"
      size="md"
      onSave={() => file && onConfirm(file)}
      saveLabel="Import"
      isLoading={isLoading}
      disabled={!file}
      disableScroll
    >
      <Stack gap="md">
        <Alert color="blue" icon={<IconInfoCircle size={16} />}>
          <Text size="sm" mb={4}>
            The file needs a header row with these columns:
          </Text>
          <Code block>email,name,user_name,groups</Code>
          <Text size="sm" mt={8}>
            <Text span fw={600} inherit>
              email
            </Text>{' '}
            is required and must be unique; existing emails are skipped.{' '}
            <Text span fw={600} inherit>
              groups
            </Text>{' '}
            is an optional list of group names separated by semicolons.
          </Text>
          <Text size="sm" mt={8}>
            Imported users get the{' '}
            <Text span fw={600} inherit>
              Imported
            </Text>{' '}
            status and no activation e-mail. Use{' '}
            <Text span fw={600} inherit>
              Send activation
            </Text>{' '}
            to invite them.
          </Text>
        </Alert>

        <FileInput
          label="CSV file"
          placeholder="Pick a .csv file"
          accept=".csv,text/csv"
          leftSection={<IconFileTypeCsv size={16} />}
          value={file}
          onChange={setFile}
          clearable
          data-autofocus
        />
      </Stack>
    </ModalWrapper>
  );
}
