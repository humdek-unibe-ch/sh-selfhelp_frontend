/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useState } from 'react';
import { Alert, List, Stack, Text, TextInput } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';

interface ICleanUserDataModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
  isLoading: boolean;
}

/** Cleaning keeps the account but destroys everything the user produced, and
 *  the row stays in the list afterwards — so a misclick would otherwise be
 *  silent. Spell out what goes and require the email, like the delete flow. */
export function CleanUserDataModal({
  opened,
  onClose,
  onConfirm,
  userEmail,
  isLoading,
}: ICleanUserDataModalProps) {
  const [confirmEmail, setConfirmEmail] = useState('');

  const handleClose = () => {
    setConfirmEmail('');
    onClose();
  };

  return (
    <ModalWrapper
      opened={opened}
      onClose={handleClose}
      title="Clean user data"
      size="md"
      onDelete={onConfirm}
      deleteLabel="Clean user data"
      deleteVariant="filled"
      onCancel={handleClose}
      isLoading={isLoading}
      disabled={confirmEmail !== userEmail}
      disableScroll
    >
      <Stack gap="md">
        <Alert color="red" icon={<IconAlertTriangle size={16} />}>
          This cannot be undone.
        </Alert>

        <div>
          <Text size="sm" mb={4}>
            Cleaning the data of <strong>{userEmail}</strong> permanently removes:
          </Text>
          <List size="sm" spacing={2}>
            <List.Item>all activity logs</List.Item>
            <List.Item>all input data entered by this user</List.Item>
            <List.Item>all scheduled actions for this user</List.Item>
          </List>
          <Text size="sm" c="dimmed" mt={4}>
            The user account itself is kept.
          </Text>
        </div>

        <TextInput
          label="Type the user's email to confirm"
          placeholder={userEmail}
          value={confirmEmail}
          onChange={(e) => setConfirmEmail(e.currentTarget.value)}
          error={confirmEmail && confirmEmail !== userEmail ? 'Email does not match' : null}
        />
      </Stack>
    </ModalWrapper>
  );
}
