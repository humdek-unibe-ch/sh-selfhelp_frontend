# Mantine Style Generation Process

## Process Overview

This document outlines the systematic process for integrating new Mantine components into the SelfHelp frontend system. The process involves three main phases:

1. **Information Gathering & Analysis**
2. **SQL Structure Implementation**
3. **Frontend Component Generation**

## Phase 1: Information Gathering & Analysis

### Required Information Template

For each Mantine component, gather the following information:

**Component Name:** `{COMPONENT_NAME}` (e.g., "accordion", "button", "modal")

**Mantine Documentation URL:** `https://mantine.dev/core/{COMPONENT_NAME}`

### Critical Rules for Mantine Styles

1. **ALWAYS CHECK EXISTING FIELDS FIRST**: Before creating new fields, search the codebase for existing fields like `mantine_radius`, `mantine_color`, `mantine_size`, etc. Reuse them instead of creating duplicates.

2. **MANTINE STYLES DON'T NEED FALLBACKS**: Unless explicitly requested by the user, Mantine components should return `null` when `use_mantine_style` is disabled. No fallback HTML/CSS implementations needed.

3. **USE_MANTINE_STYLE FIELD**: Always set `use_mantine_style` to `'1'` as default value and make it `hidden: 1` in the SQL. Mantine styles should be enabled by default.

4. **CREATABLE FIELDS FOR SIZES/DURATIONS**: Fields that represent sizes in pixels or durations in milliseconds should use `text` field type with `{"creatable": true}` configuration, allowing users to input custom values.

5. **FOLDER ORGANIZATION**: Group related components (parent-child relationships) in dedicated folders. Example: accordion and accordion-item should be in `/accordion/` folder.

6. **DEFAULT VALUE HINTS**: Include explanatory hints about fallback logic in field help text. Example: "Either a custom value or falls back to section-${style.id}".

7. **ICON HANDLING**: Use `IconComponent` for icon fields, not raw strings. Import from `'../../shared/common/IconComponent'` and use as `<IconComponent iconName={iconName} size={16} />`.

### Data Collection Checklist

#### 1. Component Structure Analysis
- [ ] **Main Component**: Identify the primary component and its import path
- [ ] **Sub-components**: List all sub-components (e.g., `Accordion.Item`, `Accordion.Control`, `Accordion.Panel`)
- [ ] **Component Variants**: Document available variants (default, filled, outline, etc.)
- [ ] **Component Hierarchy**: Determine if component can have children (`can_have_children`)

#### 2. Props Analysis
For each prop, document:
- [ ] **Prop Name**: The actual prop name used in Mantine
- [ ] **Type**: String, number, boolean, array, object, etc.
- [ ] **Default Value**: The default value if any
- [ ] **Required**: Whether the prop is required
- [ ] **Description**: What the prop does
- [ ] **Options**: For select/segment type props, list available options

#### 3. Field Type Mapping
Map Mantine prop types to system field types:
- [ ] `string` → `text` or `textarea`
- [ ] `number` → `select` with `{"creatable": true}` for sizes/durations (provides presets + custom input), `select` for predefined options only
- [ ] `boolean` → `checkbox`
- [ ] `enum` → `segment` or `select`
- [ ] `ReactNode` → `text` (for content)
- [ ] Arrays → `textarea` with JSON validation
- [ ] Objects → `textarea` with JSON validation
- [ ] **Icon fields** → `select-icon` (always use this for Mantine icon props)
- [ ] **Size values (px)** → `select` with creatable: true and preset options (14px, 16px, 18px, 20px, 24px, 32px)
- [ ] **Duration values (ms)** → `select` with creatable: true and preset options (150ms, 200ms, 300ms, 400ms, 0ms, 500ms)

#### 4. Special Field Requirements
- [ ] **Display Field**: `display = 1` for content fields (translatable)
- [ ] **Property Fields**: `display = 0` for configuration (non-translatable)
- [ ] **Custom Fields**: New fields that need to be created in the system
- [ ] **Field Configuration**: JSON config for select/segment options

## Phase 2: SQL Structure Implementation

### SQL Generation Template

#### 1. Create Component Style Entry
```sql
-- Add {COMPONENT_NAME} style
INSERT IGNORE INTO `styles` (`id`, `name`, `id_type`, `id_group`, `description`, `can_have_children`) VALUES (
    NULL,
    '{COMPONENT_NAME}',
    (SELECT id FROM lookups WHERE type_code = 'styleType' AND lookup_code = 'component' LIMIT 1),
    get_style_group_id('mantine'),
    '{COMPONENT_DESCRIPTION}',
    {CAN_HAVE_CHILDREN} -- 1 for yes, 0 for no
);
```

#### 2. Create Custom Fields (if needed)
```sql
-- Create {COMPONENT_NAME}-specific fields if they don't exist
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_{PROP_NAME}', get_field_type_id('{FIELD_TYPE}'), {DISPLAY}, {CONFIG_JSON});
```

#### 3. Link Fields to Style
```sql
-- Link fields to {COMPONENT_NAME} style
INSERT IGNORE INTO `styles_fields` (`id_styles`, `id_fields`, `default_value`, `help`, `disabled`, `hidden`, `title`) VALUES
(get_style_id('{COMPONENT_NAME}'), get_field_id('mantine_{COMPONENT_NAME}_{PROP_NAME}'), '{DEFAULT_VALUE}', '{HELP_TEXT}', 0, 0, '{TITLE}'),
(get_style_id('{COMPONENT_NAME}'), get_field_id('use_mantine_style'), '1', 'Use Mantine styling for the {COMPONENT_NAME} component', 0, 1, 'Use Mantine Style');
```

### Field Configuration Examples

#### Size Fields (Creatable Select)
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_size', get_field_type_id('select'), 0, '{
"creatable": true,
"searchable": false,
"clearable": false,
"placeholder": "16",
"options": [
{"value": "14", "text": "Small (14px)"},
{"value": "16", "text": "Medium (16px)"},
{"value": "18", "text": "Large (18px)"},
{"value": "20", "text": "Extra Large (20px)"},
{"value": "24", "text": "XL (24px)"},
{"value": "32", "text": "XXL (32px)"}
]
}');
```

#### Duration Fields (Creatable Select)
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_duration', get_field_type_id('select'), 0, '{
"creatable": true,
"searchable": false,
"clearable": false,
"placeholder": "200",
"options": [
{"value": "150", "text": "Fast (150ms)"},
{"value": "200", "text": "Normal (200ms)"},
{"value": "300", "text": "Slow (300ms)"},
{"value": "400", "text": "Very Slow (400ms)"},
{"value": "0", "text": "Instant (0ms)"},
{"value": "500", "text": "Extra Slow (500ms)"}
]
}');
```

#### Icon Fields
```sql
INSERT IGNORE INTO `fields` (`id`, `name`, `id_type`, `display`, `config`) VALUES
(NULL, 'mantine_{COMPONENT_NAME}_icon', get_field_type_id('select-icon'), 0, null);
```

#### Default Value Fields with Hints
```sql
INSERT IGNORE INTO `styles_fields` (`id_styles`, `id_fields`, `default_value`, `help`, `disabled`, `hidden`, `title`) VALUES
(get_style_id('{COMPONENT_NAME}'), get_field_id('mantine_{COMPONENT_NAME}_value'), NULL, 'Unique identifier for the {COMPONENT_NAME}. Either a custom value or falls back to section-${style.id}', 0, 0, 'Item Value');
```

### Field Configuration Structure Reference

When configuring select fields with creatable options, use this structure:

```json
{
  "creatable": true,           // Allows users to add custom values
  "searchable": false,         // Keep simple for size/duration fields
  "clearable": false,          // Usually false for required size/duration values
  "placeholder": "16",         // Default value hint
  "options": [                 // Preset options array
    {"value": "14", "text": "Small (14px)"},
    {"value": "16", "text": "Medium (16px)"},
    {"value": "18", "text": "Large (18px)"},
    {"value": "20", "text": "Extra Large (20px)"},
    {"value": "24", "text": "XL (24px)"},
    {"value": "32", "text": "XXL (32px)"}
  ]
}
```

#### Key Configuration Properties:
- **`creatable: true`**: Essential for allowing custom size/duration values
- **`searchable: false`**: Keep false for size/duration presets (they're usually short lists)
- **`clearable: false`**: Usually false since sizes/durations are typically required
- **`placeholder`**: Should show the default value to guide users
- **`options`**: Array of preset options with user-friendly labels

### Help Text Patterns for Size and Duration Fields

#### Size Fields (px values):
```
'Sets the size in pixels. Choose from preset sizes or enter a custom value (e.g., 12, 14, 16, 18, 20, 24, 32).'
```

#### Duration Fields (ms values):
```
'Sets the duration in milliseconds. Choose from preset durations or enter a custom value (e.g., 100, 150, 200, 300, 400, 500).'
```

#### Icon Fields:
```
'Sets the icon. For more information check https://mantine.dev/core/{COMPONENT_NAME}'
```

#### Boolean Fields:
```
'If set, {DESCRIPTION}. For more information check https://mantine.dev/core/{COMPONENT_NAME}'
```

#### 4. Define Parent-Child Relationships (if applicable)
```sql
-- {PARENT_COMPONENT} can contain {CHILD_COMPONENT}
INSERT IGNORE INTO styles_allowed_relationships (id_parent_style, id_child_style)
SELECT s1.id, s2.id FROM styles s1, styles s2
WHERE s1.name = '{PARENT_COMPONENT}' AND s2.name = '{CHILD_COMPONENT}';
```

### Field Naming Convention
- **Standard Fields**: Use existing field names (e.g., `label`, `value`, `disabled`)
- **Mantine-specific Fields**: Prefix with `mantine_` (e.g., `mantine_size`, `mantine_variant`)
- **Component-specific Fields**: Prefix with `mantine_{component}_` (e.g., `mantine_accordion_chevron`)

## Phase 3: Frontend Component Generation

### TypeScript Interface Generation

#### 1. Main Component Interface
```typescript
interface I{COMPONENT_NAME}Style {
    id: number;
    name: string;
    // Standard fields
    label?: string;
    value?: any;
    disabled?: boolean;
    // Mantine-specific fields
    mantine_size?: string;
    mantine_variant?: string;
    // Component-specific fields
    mantine_{COMPONENT_NAME}_{PROP}?: any;
}

interface I{COMPONENT_NAME}StyleProps {
    style: I{COMPONENT_NAME}Style;
}
```

#### 2. Component Implementation Template
```typescript
import React from 'react';
import { {COMPONENT_NAME} } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import IconComponent from '../../shared/common/IconComponent';
import { I{COMPONENT_NAME}Style } from '../../../../../types/common/styles.types';

interface I{COMPONENT_NAME}StyleProps {
    style: I{COMPONENT_NAME}Style;
}

const {COMPONENT_NAME}Style: React.FC<I{COMPONENT_NAME}StyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Extract Mantine-specific props
    const variant = getFieldContent(style, 'mantine_{COMPONENT_NAME}_variant') || 'default';
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const iconName = getFieldContent(style, 'mantine_{COMPONENT_NAME}_icon');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    if (use_mantine_style) {
        return (
            <{COMPONENT_NAME}
                variant={variant}
                size={size}
                icon={icon}
                className={cssClass}
                {...otherProps}
            >
                {children}
            </{COMPONENT_NAME}>
        );
    }

    // Return null if Mantine styling is disabled (no fallback needed)
    return null;
};
```

### Field Value Extraction Pattern
```typescript
const getFieldValue = (style: any, fieldName: string, defaultValue?: any) => {
    const field = style.fields?.find((f: any) => f.name === fieldName);
    return field?.value || defaultValue;
};
```

### Import Requirements
- Import the Mantine component from `@mantine/core`
- Import utility functions for field extraction
- Import CSS modules if custom styling is used

## Implementation Checklist

### Pre-Implementation
- [ ] Review Mantine documentation for the component
- [ ] Identify all props and their types
- [ ] Determine component hierarchy and relationships
- [ ] Plan field mapping strategy

### SQL Implementation
- [ ] Create style entry with correct `can_have_children` value
- [ ] Create any new custom fields needed
- [ ] Link all fields to the style with appropriate defaults
- [ ] Define parent-child relationships if applicable
- [ ] Test SQL execution order and dependencies

### Frontend Implementation
- [ ] Create/update TypeScript interfaces
- [ ] Implement component with proper prop extraction
- [ ] Handle both Mantine and custom styling modes
- [ ] Implement proper error handling and fallbacks
- [ ] Test component rendering and functionality

### Post-Implementation
- [ ] Verify all fields are properly mapped
- [ ] Test component in different scenarios
- [ ] Check for console errors or warnings
- [ ] Validate TypeScript compilation
- [ ] Test with sample data
- [ ] **CRITICAL**: Add style case to BasicStyle.tsx component (see detailed instructions below)

### Adding Style to BasicStyle.tsx Component

**CRITICAL STEP**: After implementing the component, you must add it to the BasicStyle.tsx component so it can be loaded by the system.

#### 1. Add Import Statement
Add the component import to the imports section at the top of `src/app/components/frontend/styles/BasicStyle.tsx`:

```typescript
import {
    // ... existing imports ...
    ActionIconStyle  // Add this line
} from './SelfHelpStyles';
```

#### 2. Add Case Statement
Add a case for your component in the switch statement within the BasicStyle component:

```typescript
switch (style.style_name) {
    // ... existing cases ...
    case 'actionIcon':          // Use the exact style_name from your SQL
        return <ActionIconStyle style={style} />;
    // ... other cases ...
}
```

#### 3. Export the Component
Ensure your component is exported from `src/app/components/frontend/styles/mantine/index.ts`:

```typescript
export { default as ActionIconStyle } from './ActionIconStyle';
```

**Why This Step is Critical:**
- BasicStyle.tsx is the main component router that determines which style component to render
- Without this step, your component will never be loaded, even if the SQL and TypeScript are correct
- The system uses the `style_name` field to route to the appropriate component

**Common Issues:**
- Case sensitivity: Ensure `style_name` matches exactly (e.g., 'actionIcon', not 'ActionIcon')
- Import path: Make sure the import path is correct
- Export: Ensure the component is properly exported from the index file

## Quality Assurance

### Validation Checklist
- [ ] **Existing fields checked**: Searched for reusable fields like `mantine_radius`, `mantine_color`, `mantine_size`
- [ ] **No fallbacks implemented**: Component returns `null` when `use_mantine_style` is disabled
- [ ] **use_mantine_style configured**: Set to `'1'` default and `hidden: 1`
- [ ] **Creatable select fields for sizes/durations**: Select fields with `{"creatable": true}` and preset options for pixel/ms values
- [ ] **Folder organization**: Related components grouped in dedicated folders
- [ ] **Icon handling**: Using `IconComponent` for icon fields, not raw strings
- [ ] **Default value hints**: Field help text explains fallback logic (e.g., "falls back to section-${style.id}")
- [ ] All required Mantine props are implemented
- [ ] Field types match Mantine prop types
- [ ] Default values are appropriate
- [ ] Help text is clear and accurate
- [ ] Component hierarchy is correctly defined
- [ ] No duplicate or conflicting field names
- [ ] SQL executes without errors
- [ ] Component renders without errors
- [ ] TypeScript compilation passes

## Usage Instructions

To use this process for a new component:

1. **Replace `{COMPONENT_NAME}`** with the actual component name (e.g., "accordion")
2. **Review the Mantine documentation** at `https://mantine.dev/core/{COMPONENT_NAME}`
3. **Follow the checklists** in order, checking off completed items
4. **Execute SQL changes** in the correct order (style group → styles → fields → styles_fields → relationships)
5. **Implement the frontend component** using the provided templates
6. **CRITICAL**: Add the component to BasicStyle.tsx (see detailed instructions in Post-Implementation section)
7. **Test thoroughly** before marking as complete

## Common Patterns and Best Practices

### Field Type Selection
- Use `checkbox` for boolean values
- Use `select` for predefined string options
- Use `segment` for mutually exclusive options
- Use `textarea` for JSON data or long text
- Use `text` for short strings and URLs

### Default Value Strategy
- Match Mantine's actual defaults when possible
- Use sensible fallbacks for optional props
- Consider user experience implications

### Error Handling
- Always provide fallback values
- Handle missing or malformed data gracefully
- Log errors for debugging but don't break the UI

### Performance Considerations
- Use React.memo for components with stable props
- Extract field values once at component level
- Avoid unnecessary re-renders with proper memoization
