"use client";

import { useState, useRef, useCallback } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Button,
  Group,
  Text,
  Switch,
  Progress,
  Alert,
  Paper,
  Center,
  List,
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { IconUpload, IconFile, IconAlertCircle, IconX, IconCloudUpload } from '@tabler/icons-react';
import { useCreateAsset } from '../../../../../hooks/useAssets';

interface IUploadAssetModalProps {
  opened: boolean;
  onClose: () => void;
}

interface IUploadAssetFormValues {
  files: FileWithPath[];
  folder: string;
  fileName: string;
  overwrite: boolean;
}

export function UploadAssetModal({ opened, onClose }: IUploadAssetModalProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const createAssetMutation = useCreateAsset();
  const openRef = useRef<() => void>(null);

  const form = useForm<IUploadAssetFormValues>({
    initialValues: {
      files: [],
      folder: '',
      fileName: '',
      overwrite: false,
    },
    validate: {
      files: (value: FileWithPath[]) => (value.length === 0 ? 'Please select at least one file to upload' : null),
    },
  });

  const handleDrop = useCallback((files: FileWithPath[]) => {
    form.setFieldValue('files', [...form.values.files, ...files]);
    // Clear custom filename when multiple files are selected
    if (form.values.files.length + files.length > 1) {
      form.setFieldValue('fileName', '');
    }
  }, [form]);

  const removeFile = (index: number) => {
    const newFiles = form.values.files.filter((_, i) => i !== index);
    form.setFieldValue('files', newFiles);
    // Re-enable custom filename if only one file remains
    if (newFiles.length <= 1) {
      // Keep the current fileName value if it exists
    }
  };

  const handleSubmit = async (values: IUploadAssetFormValues) => {
    if (values.files.length === 0) return;

    try {
      setUploadProgress(5);
      const totalFiles = values.files.length;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < totalFiles; i++) {
        setCurrentFileIndex(i);
        const file = values.files[i];
        
        try {
          const assetData = {
            file,
            folder: values.folder || undefined,
            // Only use custom filename for single file uploads
            file_name: totalFiles === 1 ? (values.fileName || undefined) : undefined,
            overwrite: values.overwrite,
          };

          await createAssetMutation.mutateAsync(assetData);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to upload ${file.name}:`, error);
        }

        // Update progress
        const progress = Math.round(((i + 1) / totalFiles) * 95) + 5;
        setUploadProgress(progress);
      }

      setUploadProgress(100);

      // Show appropriate notification
      if (errorCount === 0) {
        notifications.show({
          title: 'Success',
          message: `${successCount} asset${successCount > 1 ? 's' : ''} uploaded successfully`,
          color: 'green',
        });
      } else if (successCount > 0) {
        notifications.show({
          title: 'Partial Success',
          message: `${successCount} asset${successCount > 1 ? 's' : ''} uploaded successfully, ${errorCount} failed`,
          color: 'yellow',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'All uploads failed',
          color: 'red',
        });
      }

      form.reset();
      setUploadProgress(0);
      setCurrentFileIndex(0);
      onClose();
    } catch (error: any) {
      setUploadProgress(0);
      setCurrentFileIndex(0);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to upload assets',
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    if (!createAssetMutation.isPending) {
      form.reset();
      setUploadProgress(0);
      setCurrentFileIndex(0);
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
  const hasMultipleFiles = form.values.files.length > 1;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconUpload size={20} />
          <Text size="lg" fw={600}>
            Upload Assets
          </Text>
        </Group>
      }
      size="lg"
      centered
      closeOnClickOutside={!isUploading}
      closeOnEscape={!isUploading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Dropzone */}
          <Dropzone
            openRef={openRef}
            onDrop={handleDrop}
            multiple
            disabled={isUploading}
            {...form.getInputProps('files')}
          >
            <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
              <Dropzone.Accept>
                <IconCloudUpload size={52} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={52} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconCloudUpload size={52} stroke={1.5} />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  Drag files here or click to select files
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  You can upload multiple files at once
                </Text>
              </div>
            </Group>
          </Dropzone>

          {/* Selected Files List */}
          {form.values.files.length > 0 && (
            <Paper withBorder p="md">
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={500}>
                  Selected Files ({form.values.files.length})
                </Text>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => form.setFieldValue('files', [])}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </Group>
              
              <List spacing="xs">
                {form.values.files.map((file, index) => (
                  <List.Item key={`${file.name}-${index}`}>
                    <Group justify="space-between">
                      <Group gap="sm">
                        <IconFile size={16} />
                        <div>
                          <Text size="sm">{file.name}</Text>
                          <Group gap="xs">
                            <Badge size="xs" variant="light">
                              {formatFileSize(file.size)}
                            </Badge>
                            <Badge size="xs" variant="outline">
                              {file.type || 'Unknown'}
                            </Badge>
                          </Group>
                        </div>
                      </Group>
                      <Button
                        variant="subtle"
                        size="xs"
                        color="red"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <IconX size={14} />
                      </Button>
                    </Group>
                  </List.Item>
                ))}
              </List>
            </Paper>
          )}

          {/* Upload Options */}
          <Stack gap="sm">
            <TextInput
              label="Folder (Optional)"
              placeholder="e.g., images, documents"
              description="Leave empty to upload to root folder"
              disabled={isUploading}
              {...form.getInputProps('folder')}
            />

            <TextInput
              label="Custom File Name (Optional)"
              placeholder="custom-name.ext"
              description={hasMultipleFiles ? "Custom filename is disabled for multiple file uploads" : "Leave empty to use original file name"}
              disabled={isUploading || hasMultipleFiles}
              {...form.getInputProps('fileName')}
            />

            <Switch
              label="Overwrite if files exist"
              description="Replace files if they already exist with the same name"
              disabled={isUploading}
              {...form.getInputProps('overwrite', { type: 'checkbox' })}
            />
          </Stack>

          {/* Multiple Files Warning */}
          {hasMultipleFiles && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              <Text size="sm">
                <strong>Multiple Files:</strong> Custom file names are disabled when uploading multiple files. 
                Original file names will be used.
              </Text>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Uploading file {currentFileIndex + 1} of {form.values.files.length}... {uploadProgress}%
              </Text>
              <Text size="xs" c="dimmed">
                {form.values.files[currentFileIndex]?.name}
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
              disabled={form.values.files.length === 0}
            >
              Upload {form.values.files.length > 1 ? `${form.values.files.length} Assets` : 'Asset'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
} 