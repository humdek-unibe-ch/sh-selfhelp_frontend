/**
 * Mention System Type Definitions
 * 
 * Shared types for the Tiptap-based mention system used across
 * rich text editors and plain text inputs with mention functionality.
 */

/**
 * Variable suggestion item for mention dropdowns
 */
export interface IVariableSuggestion {
    id: string;
    label: string;
}

/**
 * Props for the variable suggestion list component
 */
export interface IVariableListProps {
    items: IVariableSuggestion[];
    command: (item: IVariableSuggestion) => void;
    maxVisibleRows?: number;
    maxItems?: number;
}

/**
 * Keyboard handler interface for suggestion lists
 */
export interface IKeyboardHandler {
    onKeyDown: (params: { event: KeyboardEvent }) => boolean;
}

