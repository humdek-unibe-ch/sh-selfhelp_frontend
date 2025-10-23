import { notifications } from '@mantine/notifications';
import { ISectionExportData } from '../api/admin/section.api';

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
                
                // Validate that it's an array of sections
                if (!Array.isArray(data)) {
                    throw new Error('Invalid file format: Expected an array of sections');
                }
                
                // Basic validation of section structure
                for (const section of data) {
                    if (!section.section_name || !section.style_name) {
                        throw new Error('Invalid section format: Missing required fields (name, style_name)');
                    }
                }
                
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
 * Validates if a file is a valid JSON file
 */
export function isValidJsonFile(file: File): boolean {
    return file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
} 