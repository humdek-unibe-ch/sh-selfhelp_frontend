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
  Badge,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Dropzone, FileWithPath } from '@mantine/dropzone';
import { 
  IconUpload, 
  IconFile, 
  IconAlertCircle, 
  IconX, 
  IconCloudUpload, 
} from '@tabler/icons-react';
import { useCreateAsset, useCreateMultipleAssets } from '../../../../../hooks/useAssets';

interface IUploadAssetModalProps {
  opened: boolean;
  onClose: () => void;
}

interface IUploadAssetFormValues {
  files: FileWithPath[];
  folder: string;
  fileName: string;
  fileNames: string[];
  overwrite: boolean;
}

export function UploadAssetModal({ opened, onClose }: IUploadAssetModalProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const createAssetMutation = useCreateAsset();
  const createMultipleAssetsMutation = useCreateMultipleAssets();
  const openRef = useRef<() => void>(null);

  const form = useForm<IUploadAssetFormValues>({
    initialValues: {
      files: [],
      folder: '',
      fileName: '',
      fileNames: [],
      overwrite: false,
    },
    validate: {
      files: (value: FileWithPath[]) => (value.length === 0 ? 'Please select at least one file to upload' : null),
      fileName: (value: string, values: IUploadAssetFormValues) => {
        // Only validate fileName for single file uploads
        if (values.files.length === 1 && value && !/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(value)) {
          return 'File name must include extension (e.g., image.jpg)';
        }
        return null;
      },
      fileNames: (value: string[], values: IUploadAssetFormValues) => {
        // Validate fileNames for multiple file uploads if provided
        if (values.files.length > 1 && value.length > 0) {
          if (value.length !== values.files.length) {
            return 'Number of custom file names must match number of files';
          }
          for (const fileName of value) {
            if (fileName && !/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(fileName)) {
              return 'All file names must include extension (e.g., image.jpg)';
            }
          }
        }
        return null;
      },
    },
  });

  const handleDrop = useCallback((files: FileWithPath[]) => {
    const newFiles = [...form.values.files, ...files];
    form.setFieldValue('files', newFiles);
    
    // Reset fileName when we have multiple files
    if (newFiles.length > 1) {
      form.setFieldValue('fileName', '');
    }
    
    // Initialize fileNames array for multiple files if not already set
    if (newFiles.length > 1 && form.values.fileNames.length === 0) {
      form.setFieldValue('fileNames', new Array(newFiles.length).fill(''));
    } else if (newFiles.length > 1) {
      // Adjust fileNames array length to match files
      const adjustedFileNames = [...form.values.fileNames];
      while (adjustedFileNames.length < newFiles.length) {
        adjustedFileNames.push('');
      }
      form.setFieldValue('fileNames', adjustedFileNames.slice(0, newFiles.length));
    } else {
      // Single file - clear fileNames array
      form.setFieldValue('fileNames', []);
    }
  }, [form]);

  const removeFile = (index: number) => {
    const newFiles = form.values.files.filter((_, i) => i !== index);
    form.setFieldValue('files', newFiles);
    
    // Adjust fileNames array
    if (newFiles.length > 1) {
      const newFileNames = form.values.fileNames.filter((_, i) => i !== index);
      form.setFieldValue('fileNames', newFileNames);
    } else {
      form.setFieldValue('fileNames', []);
    }
  };

  const updateFileName = (index: number, fileName: string) => {
    const newFileNames = [...form.values.fileNames];
    newFileNames[index] = fileName;
    form.setFieldValue('fileNames', newFileNames);
  };

  const handleSubmit = async (values: IUploadAssetFormValues) => {
    if (values.files.length === 0) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      if (values.files.length === 1) {
        // Single file upload using the existing endpoint
        const assetData = {
          file: values.files[0],
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
      } else {
        // Multiple file upload using the new endpoint
        const assetData = {
          files: values.files,
          folder: values.folder || undefined,
          file_names: values.fileNames.filter(name => name.trim() !== ''),
          overwrite: values.overwrite,
        };

        setUploadProgress(50);
        const result = await createMultipleAssetsMutation.mutateAsync(assetData);
        setUploadProgress(100);

        // Show detailed results
        if (result.failed_uploads === 0) {
          notifications.show({
            title: 'Success',
            message: `All ${result.successful_uploads} assets uploaded successfully`,
            color: 'green',
          });
        } else if (result.successful_uploads > 0) {
          notifications.show({
            title: 'Partial Success',
            message: `${result.successful_uploads} assets uploaded successfully, ${result.failed_uploads} failed`,
            color: 'yellow',
          });
        } else {
          notifications.show({
            title: 'Upload Failed',
            message: `All ${result.failed_uploads} uploads failed`,
            color: 'red',
          });
        }

        // Show individual errors if any
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(error => {
            notifications.show({
              title: `Failed: ${error.file_name}`,
              message: error.error,
              color: 'red',
              autoClose: false,
            });
          });
        }
      }

      // Reset form and close modal
      form.reset();
      setUploadProgress(0);
      setIsUploading(false);
      onClose();
    } catch (error: any) {
      setUploadProgress(0);
      setIsUploading(false);
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to upload assets',
        color: 'red',
      });
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      form.reset();
      setUploadProgress(0);
      setIsUploading(false);
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

  const hasMultipleFiles = form.values.files.length > 1;
  const isPending = createAssetMutation.isPending || createMultipleAssetsMutation.isPending;

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
                  onClick={() => {
                    form.setFieldValue('files', []);
                    form.setFieldValue('fileNames', []);
                  }}
                  disabled={isUploading}
                >
                  Clear All
                </Button>
              </Group>
              
              <Stack gap="xs">
                {form.values.files.map((file, index) => (
                  <Paper key={`${file.name}-${index}`} withBorder p="sm">
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
                      <Group gap="xs">
                        {hasMultipleFiles && (
                          <TextInput
                            placeholder="Custom filename (optional)"
                            value={form.values.fileNames[index] || ''}
                            onChange={(e) => updateFileName(index, e.currentTarget.value)}
                            disabled={isUploading}
                            size="xs"
                            style={{ minWidth: 150 }}
                          />
                        )}
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
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Upload Options */}
          <Stack gap="sm">
            <TextInput
              label="Folder (Optional)"
              placeholder="e.g., images, documents"
              description="Leave empty to upload to root folder. Use alphanumeric, underscore, or dash only."
              disabled={isUploading}
              {...form.getInputProps('folder')}
            />

            {!hasMultipleFiles && (
              <TextInput
                label="Custom File Name (Optional)"
                placeholder="custom-name.ext"
                description="Leave empty to use original file name. Must include extension (e.g., image.jpg)"
                disabled={isUploading}
                {...form.getInputProps('fileName')}
              />
            )}

            <Switch
              label="Overwrite if files exist"
              description="Replace files if they already exist with the same name"
              disabled={isUploading}
              {...form.getInputProps('overwrite', { type: 'checkbox' })}
            />
          </Stack>

          {/* Multiple Files Info */}
          {hasMultipleFiles && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
              <Stack gap="xs">
                <Text size="sm">
                  <strong>Multiple Files Upload:</strong> You can provide custom file names for each file individually.
                </Text>
                <Text size="xs" c="dimmed">
                  • Custom file names are optional and must include file extensions
                  • Leave blank to use original file names
                  • All files will be uploaded in a single request for better performance
                </Text>
              </Stack>
            </Alert>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Uploading {form.values.files.length} file{form.values.files.length > 1 ? 's' : ''}... {uploadProgress}%
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
              loading={isUploading || isPending}
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