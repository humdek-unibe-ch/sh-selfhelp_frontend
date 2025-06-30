"use client";

import { useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Switch,
  FileInput,
  Progress,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconFile, IconAlertCircle } from '@tabler/icons-react';
import { useCreateAsset } from '../../../../../hooks/useAssets';

interface IUploadAssetModalProps {
  opened: boolean;
  onClose: () => void;
}

interface IUploadAssetFormValues {
  file: File | null;
  folder: string;
  fileName: string;
  overwrite: boolean;
}

export function UploadAssetModal({ opened, onClose }: IUploadAssetModalProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const createAssetMutation = useCreateAsset();

  const form = useForm<IUploadAssetFormValues>({
    initialValues: {
      file: null,
      folder: '',
      fileName: '',
      overwrite: false,
    },
    validate: {
      file: (value) => (!value ? 'Please select a file to upload' : null),
    },
  });

  const handleSubmit = async (values: IUploadAssetFormValues) => {
    if (!values.file) return;

    try {
      setUploadProgress(10);

      const assetData = {
        file: values.file,
        folder: values.folder || undefined,
        file_name: values.fileName || undefined,
        overwrite: values.overwrite,
      };

      setUploadProgress(50);

      await createAssetMutation.mutateAsync(assetData);

      setUploadProgress(100);

      notifications.show({
        title: 'Success',
        message: 'Asset uploaded successfully',
        color: 'green',
      });

      form.reset();
      setUploadProgress(0);
      onClose();
    } catch (error: any) {
      setUploadProgress(0);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to upload asset',
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    if (!createAssetMutation.isPending) {
      form.reset();
      setUploadProgress(0);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isUploading = createAssetMutation.isPending || uploadProgress > 0;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconUpload size={20} />
          <Text size="lg" fw={600}>
            Upload Asset
          </Text>
        </Group>
      }
      size="md"
      centered
      closeOnClickOutside={!isUploading}
      closeOnEscape={!isUploading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* File Selection */}
          <FileInput
            label="Select File"
            placeholder="Choose a file to upload"
            leftSection={<IconFile size={16} />}
            required
            {...form.getInputProps('file')}
            accept="*/*"
          />

          {/* File Info */}
          {form.values.file && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              <Stack gap="xs">
                <Text size="sm">
                  <strong>File:</strong> {form.values.file.name}
                </Text>
                <Text size="sm">
                  <strong>Size:</strong> {formatFileSize(form.values.file.size)}
                </Text>
                <Text size="sm">
                  <strong>Type:</strong> {form.values.file.type || 'Unknown'}
                </Text>
              </Stack>
            </Alert>
          )}

          {/* Upload Options */}
          <Stack gap="sm">
            <TextInput
              label="Folder (Optional)"
              placeholder="e.g., images, documents"
              description="Leave empty to upload to root folder"
              {...form.getInputProps('folder')}
            />

            <TextInput
              label="Custom File Name (Optional)"
              placeholder="custom-name.ext"
              description="Leave empty to use original file name"
              {...form.getInputProps('fileName')}
            />

            <Switch
              label="Overwrite if file exists"
              description="Replace the file if it already exists with the same name"
              {...form.getInputProps('overwrite', { type: 'checkbox' })}
            />
          </Stack>

          {/* Upload Progress */}
          {isUploading && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Uploading... {uploadProgress}%
              </Text>
              <Progress value={uploadProgress} animated />
            </Stack>
          )}

          {/* Actions */}
          <Group justify="flex-end" gap="sm">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={isUploading}
              leftSection={<IconUpload size={16} />}
            >
              Upload Asset
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 