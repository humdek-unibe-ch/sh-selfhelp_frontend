/**
 * Utility functions for converting between React Query Builder rules and JSON Logic format.
 * Uses React Query Builder's built-in formatQuery with jsonLogic export format.
 * 
 * @module utils/json-logic-conversion
 */

import { RQBJsonLogic, RuleGroupType, formatQuery } from 'react-querybuilder';
import { parseJsonLogic } from 'react-querybuilder/parseJsonLogic';

/**
 * Converts React Query Builder rules to JSON Logic format using built-in formatQuery
 * with special handling for custom variable field names
 */
export function rulesToJsonLogic(rules: RuleGroupType): any {
    if (!rules || !rules.combinator || !rules.rules || rules.rules.length === 0) {
        return null;
    }

    try {
        // Custom processing for custom variable field names
        const processedRules = JSON.parse(JSON.stringify(rules)); // Deep clone

        const processRules = (ruleGroup: any) => {
            if (ruleGroup.rules && Array.isArray(ruleGroup.rules)) {
                ruleGroup.rules.forEach((rule: any) => {
                    if (rule.rules) {
                        // This is a nested rule group
                        processRules(rule);
                    } else if (rule.field && typeof rule.field === 'string') {
                        // Check if this is a custom variable field (starts and ends with {{ }})
                        if (rule.field.startsWith('{{') && rule.field.endsWith('}}')) {
                            // For custom variable fields, use the field name directly as the variable
                            // This is already handled by the default formatQuery logic
                        }
                        // For field_name field with a value, use the value as the variable name
                        else if (rule.field === 'field_name' && rule.value) {
                            rule.field = rule.value;
                        }
                    }
                });
            }
        };

        processRules(processedRules);

        // Use React Query Builder's built-in JSON Logic export
        const jsonLogic = formatQuery(processedRules, 'jsonlogic');

        return jsonLogic === '{}' ? null : JSON.stringify(jsonLogic);
    } catch (error) {

        return null;
    }
}

/**
 * Converts JSON Logic back to React Query Builder rules format
 * Basic implementation for simple JSON Logic structures
 * with special handling for custom variable field names
 */
export function jsonLogicToRules(jsonLogic: string | RQBJsonLogic): RuleGroupType | null {

    try {
        const rules = parseJsonLogic(jsonLogic);

        // Post-process rules to handle custom variables
        const processRules = (ruleGroup: any) => {
            if (ruleGroup.rules && Array.isArray(ruleGroup.rules)) {
                ruleGroup.rules.forEach((rule: any) => {
                    if (rule.rules) {
                        // This is a nested rule group
                        processRules(rule);
                    } else if (rule.field && typeof rule.field === 'string') {
                        // Check if this field is a custom variable that should be converted back
                        if (rule.field.startsWith('{{') && rule.field.endsWith('}}')) {
                            // This is a custom variable field - it should stay as-is since
                            // the new approach allows custom field names directly
                        }
                        // For other cases where the field is not a known field, convert to field_name
                        else if (!['user_group', 'language', 'platform', 'page_keyword', 'current_date', 'current_datetime', 'current_time', 'last_login'].includes(rule.field)) {
                            // This might be a custom variable stored in field_name format
                            const tempField = rule.field;
                            rule.field = 'field_name';
                            rule.value = tempField;
                        }
                    }
                });
            }
        };

        if (rules) {
            processRules(rules);
        }

        return rules;
    } catch (error) {

        return {
            combinator: 'and',
            rules: []
        };
    }
}


/**
 * Validates if a JSON Logic object is valid
 */
export function isValidJsonLogic(jsonLogic: any): boolean {
    if (!jsonLogic) {
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