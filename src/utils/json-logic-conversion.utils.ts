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
 * Basic implementation for simple JSON Logic structures
 */
export function jsonLogicToRules(jsonLogic: any): RuleGroupType | null {
    if (!jsonLogic) {
        return {
            combinator: 'and',
            rules: []
        };
    }

    try {
        // Handle simple JSON Logic structures
        const keys = Object.keys(jsonLogic);
        if (keys.length === 1) {
            const combinator = keys[0];
            if (['and', 'or'].includes(combinator) && Array.isArray(jsonLogic[combinator])) {
                const rules: any[] = [];
                
                // Convert each JSON Logic rule back to RQB format
                jsonLogic[combinator].forEach((rule: any) => {
                    const ruleKeys = Object.keys(rule);
                    if (ruleKeys.length === 1) {
                        const operator = ruleKeys[0];
                        const values = rule[operator];
                        
                        if (Array.isArray(values) && values.length >= 2) {
                            // Simple field comparison
                            rules.push({
                                field: values[0],
                                operator: convertJsonLogicOperatorToRQB(operator),
                                value: values[1]
                            });
                        }
                    }
                });

                return {
                    combinator: combinator as 'and' | 'or',
                    rules
                };
            }
        }
    } catch (error) {
        console.warn('Failed to parse JSON Logic to rules:', error);
    }

    // Return empty structure if parsing fails
    return {
        combinator: 'and',
        rules: []
    };
}

/**
 * Convert JSON Logic operators back to React Query Builder operators
 */
function convertJsonLogicOperatorToRQB(jsonLogicOp: string): string {
    const operatorMap: Record<string, string> = {
        '==': '=',
        '!=': '!=',
        '>': '>',
        '<': '<',
        '>=': '>=',
        '<=': '<=',
        'in': 'in',
    };
    
    return operatorMap[jsonLogicOp] || jsonLogicOp;
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