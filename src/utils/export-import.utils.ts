import { notifications } from '@mantine/notifications';
import { ISectionExportData, IImportValidationError } from '../api/admin/section.api';

/**
 * Downloads JSON data as a file
 */
export function downloadJsonFile(data: any, filename: string): void {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        notifications.show({
            title: 'Export Successful',
            message: `File "${filename}" has been downloaded`,
            color: 'green'
        });
    } catch (error) {

        notifications.show({
            title: 'Export Failed',
            message: 'Failed to download the export file',
            color: 'red'
        });
    }
}

/**
 * Generates a timestamp-based filename
 */
export function generateExportFilename(prefix: string, extension: string = 'json'): string {
    const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, -5); // Remove milliseconds and Z
    
    return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Reads and parses a JSON file
 */
export function readJsonFile(file: File): Promise<ISectionExportData[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const jsonString = event.target?.result as string;
                const data = JSON.parse(jsonString);
                
                // Validate that it's an array of sections. With the minimized
                // export shape, `section_name` is optional (backend will auto-
                // generate one). Only `style_name` is strictly required — every
                // other field/default is filled in by the backend from the
                // style schema.
                if (!Array.isArray(data)) {
                    throw new Error('Invalid file format: Expected an array of sections');
                }

                const checkSection = (section: any, path: string): void => {
                    if (!section || typeof section !== 'object') {
                        throw new Error(`Invalid section at ${path}: expected an object`);
                    }
                    if (!section.style_name || typeof section.style_name !== 'string') {
                        throw new Error(`Invalid section at ${path}: missing required field "style_name"`);
                    }
                    if (Array.isArray(section.children)) {
                        section.children.forEach((child: any, idx: number) =>
                            checkSection(child, `${path}.children[${idx}]`)
                        );
                    }
                };

                data.forEach((section: any, idx: number) =>
                    checkSection(section, `[${idx}]`)
                );

                resolve(data);
            } catch (error) {
                reject(new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Extracts the structured `errors[]` array from a 422 import-validation error.
 * The backend returns them inside `response.data.errors` via `ServiceException`.
 * Falls back to an empty array when the error doesn't match that shape.
 */
export function parseImportValidationErrors(error: unknown): IImportValidationError[] {
    if (!error || typeof error !== 'object') return [];

    const err = error as {
        response?: { status?: number; data?: { errors?: unknown } };
        errors?: unknown;
    };

    if (err.response?.status !== 422) return [];

    const raw = err.response?.data?.errors ?? err.errors;
    if (!Array.isArray(raw)) return [];

    return raw
        .filter(
            (item): item is Record<string, unknown> =>
                !!item && typeof item === 'object'
        )
        .map((item) => ({
            path: typeof item.path === 'string' ? item.path : '',
            type: typeof item.type === 'string' ? item.type : 'unknown',
            detail: typeof item.detail === 'string' ? item.detail : String(item.detail ?? ''),
        }));
}
