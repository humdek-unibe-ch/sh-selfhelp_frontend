import React from 'react';
import { FileInput } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IFileInputStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for FileInputStyle component
 */
interface IFileInputStyleProps {
    style: IFileInputStyle;
}

/**
 * FileInputStyle component renders a Mantine FileInput component for file uploads.
 * Supports multiple files and file type restrictions.
 *
 * @component
 * @param {IFileInputStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine FileInput with styled configuration
 */
const FileInputStyle: React.FC<IFileInputStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const placeholder = getFieldContent(style, 'placeholder');
    const multiple = getFieldContent(style, 'mantine_file_input_multiple') === '1';
    const accept = getFieldContent(style, 'mantine_file_input_accept');
    const size = getFieldContent(style, 'mantine_size') || 'sm';
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const disabled = getFieldContent(style, 'disabled') === '1';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <FileInput
                placeholder={placeholder || 'Select files'}
                multiple={multiple}
                accept={accept}
                size={size as any}
                radius={radius === 'none' ? 0 : radius}
                disabled={disabled}
                className={cssClass}
                style={styleObj}
            />
        );
    }

    // Fallback to basic input when Mantine styling is disabled
    return (
        <input
            type="file"
            placeholder={placeholder || 'Select files'}
            multiple={multiple}
            accept={accept}
            className={cssClass}
            disabled={disabled}
            style={styleObj}
        />
    );
};

export default FileInputStyle;

