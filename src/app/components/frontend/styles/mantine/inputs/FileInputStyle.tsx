import React, { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FileInput, Text, Alert, Box, rem, Paper, Group, Button, Stack, Badge, List } from '@mantine/core';
import { castMantineSize, castMantineRadius, getFieldContent } from '../../../../../../utils/style-field-extractor';
import { IconComponent } from '../../../../shared';
import { IFileInputStyle } from '../../../../../../types/common/styles.types';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX, IconUpload, IconFile, IconTrash, IconClearAll } from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import { FileInputRegistrationContext } from '../../FormStyle';

/**
 * Props interface for FileInputStyle component
 */
interface IFileInputStyleProps {
    style: IFileInputStyle;
}

/**
 * Ref interface for FileInputStyle component to expose selected files
 */
export interface IFileInputStyleRef {
    getSelectedFiles: () => File[];
    getFieldName: () => string;
    clearFiles: () => void;
}

/**
 * FileInputStyle component renders a Mantine FileInput component for file uploads.
 * Supports form submission, file validation, drag & drop, and comprehensive configuration options.
 *
 * IMPORTANT: For file uploads to work properly, the parent form MUST have:
 * - enctype="multipart/form-data"
 * - method="POST"
 *
 * Example:
 * <form enctype="multipart/form-data" method="POST" onSubmit={handleSubmit}>
 *   <FileInputStyle style={style} />
 *   <button type="submit">Submit</button>
 * </form>
 *
 * @component
 * @param {IFileInputStyleProps} props - Component props
 * @returns {JSX.Element | null} Rendered Mantine FileInput or null if Mantine styling disabled
 */
const FileInputStyle = forwardRef<IFileInputStyleRef, IFileInputStyleProps>(({ style }, ref) => {
    // State for file validation errors
    const [validationError, setValidationError] = useState<string | null>(null);
    // State for selected files (important for form submission) - keeping original File objects
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    // State for drag and drop zone
    const [isDragOver, setIsDragOver] = useState(false);

    // Get the registration context from form
    const fileInputRegistrationContext = React.useContext(FileInputRegistrationContext);

    // Refs for controlling the input elements
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropzoneInputRef = useRef<HTMLInputElement>(null);

    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder') || 'Select files';
    const multiple = getFieldContent(style, 'mantine_file_input_multiple') === '1';
    const accept = getFieldContent(style, 'mantine_file_input_accept');
    const clearable = getFieldContent(style, 'mantine_file_input_clearable') === '1';
    const dragDrop = getFieldContent(style, 'mantine_file_input_drag_drop') === '1';
    const maxSizeStr = getFieldContent(style, 'mantine_file_input_max_size');
    const maxFilesStr = getFieldContent(style, 'mantine_file_input_max_files');
    const name = getFieldContent(style, 'name') || `section-${style.id}`;
    const size = castMantineSize(getFieldContent(style, 'mantine_size')) || 'sm';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius')) || 'sm';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';
    const isRequired = getFieldContent(style, 'is_required') === '1';
    const label = getFieldContent(style, 'label');
    const description = getFieldContent(style, 'description');

    // Parse numeric values
    const maxSize = maxSizeStr ? parseInt(maxSizeStr, 10) : undefined;
    const maxFiles = maxFilesStr ? parseInt(maxFilesStr, 10) : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // File validation function
    const validateFiles = useCallback((files: File[]): string | null => {
        if (!files || files.length === 0) {
            return null; // No files selected is okay
        }

        // Check file count limit
        if (maxFiles && files.length > maxFiles) {
            return `Too many files selected. Maximum allowed: ${maxFiles}`;
        }

        // Check file size limits
        if (maxSize) {
            const oversizedFiles = files.filter(file => file.size > maxSize);
            if (oversizedFiles.length > 0) {
                const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
                return `File(s) too large. Maximum size allowed: ${maxSizeMB} MB`;
            }
        }

        // Check file type restrictions
        if (accept) {
            const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());
            const invalidFiles = files.filter(file => {
                const fileType = file.type.toLowerCase();
                const fileName = file.name.toLowerCase();

                return !acceptedTypes.some(acceptedType => {
                    if (acceptedType.startsWith('.')) {
                        // Extension-based check
                        return fileName.endsWith(acceptedType);
                    } else if (acceptedType.includes('*')) {
                        // MIME type pattern check
                        const pattern = acceptedType.replace('*', '.*');
                        return new RegExp(pattern).test(fileType);
                    } else {
                        // Exact MIME type check
                        return fileType === acceptedType;
                    }
                });
            });

            if (invalidFiles.length > 0) {
                return `Invalid file type(s). Accepted types: ${accept}`;
            }
        }

        return null; // All validations passed
    }, [maxSize, maxFiles, accept]);

    // Helper function to check if a file is already selected
    const isFileAlreadySelected = useCallback((file: File, existingFiles: File[]): boolean => {
        return existingFiles.some(existingFile =>
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );
    }, []);

    // File change handler with validation and duplicate prevention
    const handleFileChange = useCallback((payload: File[] | null) => {
        const newFiles = payload || [];

        // Remove duplicates and files that are already selected
        const uniqueNewFiles = newFiles.filter(file => !isFileAlreadySelected(file, selectedFiles));

        // Combine with existing files if multiple is enabled
        const allFiles = multiple
            ? [...selectedFiles, ...uniqueNewFiles]
            : uniqueNewFiles;

        // Store files in state for form submission
        setSelectedFiles(allFiles);

        const error = validateFiles(allFiles);
        setValidationError(error);

        if (error) {
            // Show error notification
            notifications.show({
                title: 'File Validation Error',
                message: error,
                color: 'red',
                icon: <IconX size={16} />,
            });
        } else if (uniqueNewFiles.length > 0) {
            // Show success notification only for newly added files
            const fileNames = uniqueNewFiles.map(f => f.name).join(', ');
            const message = multiple
                ? `${uniqueNewFiles.length} file(s) added: ${fileNames}`
                : `File selected: ${fileNames}`;

            notifications.show({
                title: 'Files Added',
                message,
                color: 'green',
                icon: <IconCheck size={16} />,
                autoClose: 3000,
            });
        } else if (newFiles.length > 0) {
            // Show warning for duplicate files
            notifications.show({
                title: 'Duplicate Files',
                message: 'Some selected files are already in the list',
                color: 'yellow',
                icon: <IconAlertTriangle size={16} />,
                autoClose: 3000,
            });
        }
    }, [validateFiles, multiple, selectedFiles, isFileAlreadySelected]);

    // Remove individual file
    const removeFile = useCallback((index: number) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles); // Directly update state to trigger useEffect
    }, [selectedFiles]);

    // Clear all files
    const clearAllFiles = useCallback(() => {
        setSelectedFiles([]); // Directly update state to trigger useEffect
    }, []);

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
        getSelectedFiles: () => selectedFiles,
        getFieldName: () => name,
        clearFiles: clearAllFiles
    }), [selectedFiles, name, clearAllFiles]);

    // Register with form context when component mounts
    useEffect(() => {
        if (fileInputRegistrationContext) {
            const fieldName = name;
            const fileInputRef: IFileInputStyleRef = {
                getSelectedFiles: () => selectedFiles,
                getFieldName: () => name,
                clearFiles: clearAllFiles
            };
            
            fileInputRegistrationContext.registerFileInputRef(fieldName, fileInputRef);
            
            // Cleanup: unregister when component unmounts
            return () => {
                fileInputRegistrationContext.registerFileInputRef(fieldName, null);
            };
        }
    }, [fileInputRegistrationContext, name, selectedFiles, clearAllFiles]);

    // Format file size helper
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Update dropzone input when files change (for drag & drop mode)
    useEffect(() => {
        if (dragDrop && dropzoneInputRef.current) {
            if (selectedFiles.length > 0) {
                const dt = new DataTransfer();
                selectedFiles.forEach(file => dt.items.add(file));
                dropzoneInputRef.current.files = dt.files;
                console.log('Updated dropzone input files:', selectedFiles.length, 'files');
            } else {
                dropzoneInputRef.current.files = null;
                console.log('Cleared dropzone input files');
            }
        }
    }, [selectedFiles, dragDrop]);

    // Debug form submission
    const handleFormSubmit = useCallback(() => {
        console.log('FileInput form submission - selected files:', selectedFiles);
        console.log('FileInput name:', name);
        console.log('FileInput multiple:', multiple);
    }, [selectedFiles, name, multiple]);

    // Add form submit listener for debugging
    useEffect(() => {
        const handleSubmit = (e: Event) => {
            handleFormSubmit();
        };

        // Listen for form submit events
        const form = fileInputRef.current?.closest('form') || dropzoneInputRef.current?.closest('form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
            return () => {
                form.removeEventListener('submit', handleSubmit);
            };
        }
    }, [handleFormSubmit, selectedFiles]);

    // Prepare icon components
    const leftIcon = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : undefined;

    // Fix conflict: if right icon is present, disable clearable
    const effectiveClearable = clearable && !rightIconName;
    const rightIcon = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : undefined;

    // Drag and drop configuration
    const dropzoneConfig = {
        multiple,
        accept: accept ? accept.split(',').reduce((acc, type) => {
            const trimmed = type.trim();
            if (trimmed.includes('*')) {
                acc[trimmed] = [];
            } else {
                acc[trimmed] = [];
            }
            return acc;
        }, {} as Record<string, string[]>) : undefined,
        maxSize,
        maxFiles,
        disabled,
        onDrop: (acceptedFiles: File[], rejectedFiles: any[]) => {
            if (rejectedFiles.length > 0) {
                const errors = rejectedFiles.map(rejection =>
                    rejection.errors.map((error: any) => error.message).join(', ')
                ).join('; ');
                setValidationError(`Rejected files: ${errors}`);
                notifications.show({
                    title: 'File Upload Error',
                    message: errors,
                    color: 'red',
                    icon: <IconX size={16} />,
                });
            } else {
                // Use the handleFileChange function which handles duplicates
                handleFileChange(acceptedFiles);
                setIsDragOver(false);
            }
        },
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        // Important: Don't prevent default on drop to allow form submission
        noClick: false,
        noKeyboard: false,
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneConfig);

    // Only render if Mantine styling is enabled
    if (!use_mantine_style) {
        return null;
    }

    // Render drag and drop zone if enabled
    if (dragDrop) {
        return (
            <div className={cssClass}>
                <Stack gap="md">
                    {/* Drag and Drop Zone */}
                    <Box
                        {...getRootProps()}
                        style={{
                            border: `2px dashed ${isDragOver ? '#228be6' : '#ced4da'}`,
                            borderRadius: radius === 'none' ? 0 : rem(4),
                            padding: rem(20),
                            textAlign: 'center',
                            backgroundColor: isDragOver ? '#f8f9fa' : 'transparent',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <input {...getInputProps()} />
                        <IconUpload size={32} style={{ color: isDragOver ? '#228be6' : '#868e96', marginBottom: rem(8) }} />
                        <Text size="sm" c={isDragOver ? 'blue' : 'dimmed'}>
                            {isDragActive
                                ? 'Drop files here...'
                                : selectedFiles.length > 0
                                    ? `${selectedFiles.length} file(s) selected - drag more or click to add`
                                    : `Drag and drop files here, or click to select`
                            }
                        </Text>
                        {label && <Text size="sm" fw={500} mt="xs">{label}</Text>}
                        {description && <Text size="xs" c="dimmed" mt="xs">{description}</Text>}
                        {isRequired && <Text size="xs" c="red" mt="xs">* Required</Text>}
                    </Box>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                        <Paper withBorder p="md">
                            <Group justify="space-between" mb="sm">
                                <Text size="sm" fw={500}>
                                    Selected Files ({selectedFiles.length})
                                </Text>
                                {clearable && (
                                    <Button
                                        variant="subtle"
                                        size="xs"
                                        color="red"
                                        leftSection={<IconClearAll size={14} />}
                                        onClick={clearAllFiles}
                                        disabled={disabled}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </Group>

                            <Stack gap="xs">
                                {selectedFiles.map((file, index) => (
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
                                                <Button
                                                    variant="subtle"
                                                    size="xs"
                                                    color="red"
                                                    onClick={() => removeFile(index)}
                                                    disabled={disabled}
                                                >
                                                    <IconTrash size={14} />
                                                </Button>
                                            </Group>
                                        </Group>
                                    </Paper>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    {/* Use the dropzone input for file submission */}
                    <input {...getInputProps()} name={name} ref={dropzoneInputRef} />

                    {/* Validation error display */}
                    {validationError && (
                        <Alert
                            variant="light"
                            color="red"
                            title="Validation Error"
                            icon={<IconAlertTriangle size={16} />}
                        >
                            <Text size="sm">{validationError}</Text>
                        </Alert>
                    )}
                </Stack>
            </div>
        );
    }

    // Standard FileInput rendering
    return (
        <div className={cssClass}>
            <Stack gap="md">
                <FileInput
                    name={name}
                    label={label}
                    description={description}
                    required={isRequired}
                    placeholder={placeholder}
                    multiple={multiple}
                    accept={accept}
                    size={size}
                    radius={radius === 'none' ? 0 : radius}
                    disabled={disabled}
                    clearable={effectiveClearable}
                    leftSection={leftIcon}
                    rightSection={rightIcon}
                    onChange={(files) => {
                        const fileArray = files ? (Array.isArray(files) ? files : [files]) : [];
                        handleFileChange(fileArray);
                    }}
                    error={validationError}
                />

                {/* Selected Files Display for Standard Input */}
                {selectedFiles.length > 0 && (
                    <Paper withBorder p="sm">
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" fw={500}>
                                Selected Files ({selectedFiles.length})
                            </Text>
                            {clearable && (
                                <Button
                                    variant="subtle"
                                    size="xs"
                                    color="red"
                                    leftSection={<IconClearAll size={12} />}
                                    onClick={clearAllFiles}
                                    disabled={disabled}
                                >
                                    Clear
                                </Button>
                            )}
                        </Group>
                        <Stack gap="xs">
                            {selectedFiles.map((file, index) => (
                                <Group key={index} gap="xs" wrap="nowrap">
                                    <IconFile size={14} />
                                    <Text size="xs" style={{ flex: 1 }}>
                                        {file.name}
                                    </Text>
                                    <Badge size="xs" variant="light">
                                        {formatFileSize(file.size)}
                                    </Badge>
                                    {clearable && (
                                        <Button
                                            variant="subtle"
                                            size="xs"
                                            color="red"
                                            onClick={() => removeFile(index)}
                                            disabled={disabled}
                                        >
                                            <IconX size={12} />
                                        </Button>
                                    )}
                                </Group>
                            ))}
                        </Stack>
                    </Paper>
                )}

                {/* Validation error display */}
                {validationError && (
                    <Alert
                        variant="light"
                        color="red"
                        title="Validation Error"
                        icon={<IconAlertTriangle size={16} />}
                    >
                        <Text size="sm">{validationError}</Text>
                    </Alert>
                )}
            </Stack>
        </div>
    );
});

FileInputStyle.displayName = 'FileInputStyle';

export default FileInputStyle;

