/**
 * Field definitions for the condition builder.
 * Uses only built-in React Query Builder operators for maximum compatibility.
 *
 * @module components/admin/shared/condition-builder-modal/conditionFields
 */

import type { Field } from 'react-querybuilder';
import { defaultOperators, toFullOption } from 'react-querybuilder';

/**
 * Validator function to ensure rules have values
 */
const validator = (rule: any) => !!rule.value;


/**
 * Creates field definitions with dynamic data using only built-in operators
 */
export function createConditionFields(
    groups: Record<string, string>,
    languages: Record<string, string>,
    platforms: Record<string, string>,
    pages: Record<string, string>
): Field[] {
    const fields: Field[] = [
        {
            name: 'user_group',
            label: 'User Group',
            valueEditorType: 'multiselect',
            values: Object.entries(groups).map(([value, label]) => ({ name: label, label })),
            operators: defaultOperators.filter(op => ['in', 'notIn', '=', '!='].includes(op.name)),
            validator,
            valueSources: ['value'],
        },
        {
            name: 'current_date',
            label: 'Current Date',
            inputType: 'date',
            datatype: 'date',
            operators: defaultOperators.filter(op => 
                ['=', '!=', '<', '<=', '>', '>=', 'between', 'notBetween'].includes(op.name)
            ),
            validator,
        },
        {
            name: 'current_datetime',
            label: 'Current Datetime',
            inputType: 'datetime-local',
            datatype: 'datetime',
            operators: defaultOperators.filter(op => 
                ['<', '<=', '>', '>=', 'between', 'notBetween'].includes(op.name)
            ),
            validator,
        },
        {
            name: 'current_time',
            label: 'Current Time',
            inputType: 'time',
            operators: defaultOperators.filter(op => 
                ['<', '<=', '>', '>=', 'between', 'notBetween'].includes(op.name)
            ),
            validator,
        },
        {
            name: 'page_keyword',
            label: 'Page Keyword',
            valueEditorType: 'select',
            values: Object.entries(pages).map(([value, label]) => ({ name: value, label: value })),
            operators: defaultOperators.filter(op => ['=', '!='].includes(op.name)),
            validator,
            valueSources: ['value'],
        },
        {
            name: 'platform',
            label: 'Platform',
            valueEditorType: 'select',
            values: Object.entries(platforms).map(([value, label]) => ({ name: value, label })),
            operators: defaultOperators.filter(op => ['=', '!='].includes(op.name)),
            validator,
            valueSources: ['value'],
        },
        {
            name: 'language',
            label: 'Language',
            valueEditorType: 'select',
            values: Object.entries(languages).map(([value, label]) => ({ name: value, label })),
            operators: defaultOperators.filter(op => ['=', '!='].includes(op.name)),
            validator,
            valueSources: ['value'],
        },
        {
            name: 'last_login',
            label: 'Last Login',
            inputType: 'datetime-local',
            datatype: 'datetime',
            operators: defaultOperators.filter(op => 
                ['=', '!=', '<', '<=', '>', '>=', 'between', 'notBetween'].includes(op.name)
            ),
            validator,
        },
    ];

    // Convert all fields to full option format
    return fields.map(field => toFullOption(field));
}