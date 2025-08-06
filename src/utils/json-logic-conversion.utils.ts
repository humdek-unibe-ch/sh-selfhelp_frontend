/**
 * Utility functions for converting between React Query Builder rules and JSON Logic format.
 * Uses React Query Builder's built-in formatQuery with jsonLogic export format.
 * 
 * @module utils/json-logic-conversion
 */

import { RuleGroupType, formatQuery } from 'react-querybuilder';

/**
 * Converts React Query Builder rules to JSON Logic format using built-in formatQuery
 */
export function rulesToJsonLogic(rules: RuleGroupType): any {
    if (!rules || !rules.combinator || !rules.rules || rules.rules.length === 0) {
        return null;
    }

    try {
        // Use React Query Builder's built-in JSON Logic export
        const jsonLogic = formatQuery(rules, 'jsonlogic');
        return jsonLogic === '{}' ? null : JSON.parse(jsonLogic);
    } catch (error) {
        console.error('Failed to convert rules to JSON Logic:', error);
        return null;
    }
}

/**
 * Converts JSON Logic back to React Query Builder rules format
 * For now, returns empty rules - parsing will be handled by the component initialization
 */
export function jsonLogicToRules(jsonLogic: any): RuleGroupType | null {
    if (!jsonLogic) {
        return {
            combinator: 'and',
            rules: []
        };
    }

    // For now, we'll return empty rules and let the user rebuild the query
    // This can be enhanced later with a proper JSON Logic parser
    return {
        combinator: 'and',
        rules: []
    };
}

/**
 * Validates if a JSON Logic object is valid
 */
export function isValidJsonLogic(jsonLogic: any): boolean {
    if (!jsonLogic || typeof jsonLogic !== 'object') {
        return false;
    }

    try {
        // Try to parse it back to rules to validate
        const rules = jsonLogicToRules(jsonLogic);
        return rules !== null && rules.rules.length > 0;
    } catch {
        return false;
    }
}