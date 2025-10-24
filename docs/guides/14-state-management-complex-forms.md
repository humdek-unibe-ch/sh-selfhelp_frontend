# State Management for Complex Forms

## Overview

This guide explains the Zustand store pattern used for managing complex forms with multiple fields, languages, and nested data structures. This pattern prevents unnecessary re-renders and ensures optimal performance in forms with many fields.

## When to Use This Pattern

Use Zustand stores for complex forms when:

1. **Multiple fields** (10+ fields) that update independently
2. **Multi-language support** with separate values per language
3. **Complex nested data** (properties, content fields, global fields)
4. **Frequent updates** where re-render performance matters
5. **Large forms** where React Context would cause cascading re-renders

## Problem: Re-render Cascades

Traditional form state management (useState, React Context) causes re-render cascades:

```typescript
// ❌ Traditional approach - causes cascading re-renders
const [formData, setFormData] = useState({
    sectionName: '',
    properties: {},
    fields: {},
    globalFields: {}
});

// When ANY field changes, ALL components re-render
setFormData({ ...formData, properties: { ...formData.properties, field1: 'new' }});
  ↓
Entire form re-renders ❌
  ↓
All field components re-render ❌
```

## Solution: Zustand with Granular Selectors

Zustand stores allow components to subscribe to specific state slices:

```typescript
// ✅ Zustand approach - granular subscriptions
const useSectionFormStore = create<ISectionFormStore>((set) => ({
    sectionName: '',
    properties: {},
    fields: {},
    globalFields: {},
    
    // Granular update actions
    setContentField: (fieldName, languageId, value) => set((state) => ({
        fields: {
            ...state.fields,
            [fieldName]: {
                ...(state.fields[fieldName] || {}),
                [languageId]: value
            }
        }
    })),
    // ... more actions
}));

// Component subscribes ONLY to its specific field
const value = useSectionFormStore(
    (state) => state.fields[fieldName]?.[languageId] ?? ''
);
```

## Architecture Pattern

### Store Structure

```typescript
interface ISectionFormState {
    // Section name
    sectionName: string;
    
    // Section properties (non-translatable fields)
    properties: Record<string, string | boolean>;
    
    // Field values by language (translatable fields)
    fields: Record<string, Record<number, string>>;
    
    // Global section-level properties
    globalFields: {
        condition: string;
        data_config: string;
        css: string;
        css_mobile: string;
        debug: boolean;
    };
}

interface ISectionFormStore extends ISectionFormState {
    // Granular update actions
    setSectionName: (name: string) => void;
    setContentField: (fieldName: string, languageId: number, value: string) => void;
    setPropertyField: (fieldName: string, value: string | boolean) => void;
    setGlobalField: (fieldName: keyof ISectionFormState['globalFields'], value: string | boolean) => void;
    
    // Bulk actions
    setFormValues: (values: ISectionFormState) => void;
    reset: () => void;
}
```

### Component Hierarchy with Store Subscriptions

```
SectionInspector (parent component)
├── No store subscriptions in parent (only action references)
├── SectionInfoPanel (subscribes to: sectionName only)
├── Content Fields Section
│   └── SectionContentField × N (each subscribes to: fields[fieldName][languageId])
├── Global Fields Section
│   └── SectionGlobalFields (subscribes to: globalFields)
│       └── FieldRenderer × N (receives values via props)
├── Properties Section
│   └── SectionProperties (subscribes to: properties)
│       └── SectionPropertyField × N (each subscribes to: properties[fieldName])
└── Mantine Properties Section
    └── SectionMantineProperties (subscribes to: properties.use_mantine_style)
        └── SectionPropertyField × N (each subscribes to: properties[fieldName])
```

### Store-Connected Field Components

Create memoized wrapper components that handle store subscriptions:

```typescript
// Content field wrapper - subscribes to specific field + language
export const SectionContentField = React.memo(function SectionContentField({
    field,
    languageId,
    locale,
    dataVariables,
    className
}: ISectionContentFieldProps) {
    // ✅ Granular selector - only this field's value
    const value = useSectionFormStore(
        (state) => state.fields[field.name]?.[languageId] ?? ''
    );

    const setContentField = useSectionFormStore((state) => state.setContentField);

    const handleChange = useCallback((newValue: string | boolean) => {
        setContentField(field.name, languageId, String(newValue));
    }, [field.name, languageId, setContentField]);

    return (
        <FieldRenderer
            field={field}
            value={value}
            onChange={handleChange}
            locale={locale}
            className={className}
            dataVariables={dataVariables}
        />
    );
});
```

### Group Components for Related Fields

For sections with multiple related fields (like global fields), create a group component:

```typescript
// Group component that subscribes to entire section
export const SectionGlobalFields = React.memo(function SectionGlobalFields({
    globalFieldTypes,
    dataVariables
}: ISectionGlobalFieldsProps) {
    // ✅ Subscribe to globalFields object
    // Only this component re-renders when globalFields change
    const globalFields = useSectionFormStore((state) => state.globalFields);
    const setGlobalField = useSectionFormStore((state) => state.setGlobalField);

    return (
        <Stack gap="md">
            {globalFieldTypes.map(fieldType => (
                <FieldRenderer
                    key={fieldType}
                    fieldType={fieldType}
                    value={globalFields[fieldType]}
                    onChange={(value) => setGlobalField(fieldType, value)}
                    dataVariables={dataVariables}
                />
            ))}
        </Stack>
    );
});
```

## Performance Characteristics

### Re-render Isolation

| Action | Components That Re-render |
|--------|--------------------------|
| Type in content field #5 | Only SectionContentField #5 |
| Change CSS global field | Only SectionGlobalFields group |
| Change property field #3 | Only SectionPropertyField #3 |
| Toggle Mantine checkbox | Only SectionMantineProperties group |
| Change section name | Only SectionInfoPanel |

**Result**: Zero cascading re-renders across the form.

### Subscription Patterns

```typescript
// ❌ BAD: Parent subscribes to entire store
const formData = useSectionFormStore((state) => state);
// Re-renders on ANY change

// ❌ BAD: Component subscribes to object
const properties = useSectionFormStore((state) => state.properties);
// Re-renders when ANY property changes

// ✅ GOOD: Component subscribes to specific value
const fieldValue = useSectionFormStore(
    (state) => state.fields[fieldName]?.[languageId] ?? ''
);
// Re-renders ONLY when this specific field changes

// ✅ GOOD: Group component subscribes to related data
const globalFields = useSectionFormStore((state) => state.globalFields);
// Re-renders when any global field changes (but isolated from rest of form)
```

## Implementation Steps

### 1. Create Store

```typescript
// src/app/store/[feature]FormStore.ts
import { create } from 'zustand';

interface IFormState {
    // Define state structure
}

interface IFormStore extends IFormState {
    // Define actions
    setField: (name: string, value: string) => void;
    reset: () => void;
}

export const useFeatureFormStore = create<IFormStore>((set) => ({
    // Initial state
    // ...
    
    // Actions
    setField: (name, value) => set((state) => ({
        fields: { ...state.fields, [name]: value }
    })),
    
    reset: () => set(() => defaultState)
}));
```

### 2. Create Store-Connected Field Components

```typescript
// src/app/components/[feature]/field-connectors.tsx
export const FeatureField = React.memo(function FeatureField({
    fieldName,
    ...props
}: IFeatureFieldProps) {
    // Granular subscription
    const value = useFeatureFormStore(
        (state) => state.fields[fieldName] ?? ''
    );
    
    const setField = useFeatureFormStore((state) => state.setField);
    
    const handleChange = useCallback((newValue: string) => {
        setField(fieldName, newValue);
    }, [fieldName, setField]);
    
    return (
        <FieldRenderer
            value={value}
            onChange={handleChange}
            {...props}
        />
    );
});
```

### 3. Create Group Components

```typescript
// src/app/components/[feature]/field-groups.tsx
export const FeatureFieldGroup = React.memo(function FeatureFieldGroup({
    fields
}: IFeatureFieldGroupProps) {
    // Subscribe to related data only
    const groupData = useFeatureFormStore((state) => state.groupData);
    const setGroupField = useFeatureFormStore((state) => state.setGroupField);
    
    return (
        <Stack gap="md">
            {fields.map(field => (
                <FieldRenderer
                    key={field.name}
                    value={groupData[field.name]}
                    onChange={(value) => setGroupField(field.name, value)}
                />
            ))}
        </Stack>
    );
});
```

### 4. Use in Parent Component

```typescript
export const FeatureInspector = React.memo(function FeatureInspector() {
    // ✅ Parent doesn't subscribe to store for rendering
    // Only gets actions for form submission
    const setFormValues = useFeatureFormStore((state) => state.setFormValues);
    const reset = useFeatureFormStore((state) => state.reset);
    
    // Load initial data into store
    useEffect(() => {
        if (data) {
            setFormValues(transformDataToFormState(data));
        }
    }, [data, setFormValues]);
    
    const handleSave = useCallback(async () => {
        // Read from store at submission time
        const formData = useFeatureFormStore.getState();
        await submitMutation.mutateAsync(formData);
    }, []);
    
    return (
        <form>
            <FeatureFieldGroup fields={groupFields} />
            {individualFields.map(field => (
                <FeatureField key={field.name} fieldName={field.name} />
            ))}
            <Button onClick={handleSave}>Save</Button>
        </form>
    );
});
```

## Key Principles

1. **Granular Subscriptions**: Subscribe at the lowest level possible
2. **Component Isolation**: Each component handles its own subscriptions
3. **Memoization**: Use React.memo to prevent re-renders from prop changes
4. **Action-Only Parents**: Parent components should only use actions, not state
5. **Group Related Fields**: When fields change together, group their subscriptions

## Common Pitfalls

### ❌ Subscribing to Entire Store

```typescript
// ❌ This causes re-renders on ANY change
const formData = useFeatureFormStore((state) => state);
```

### ❌ Parent Component Subscribes to State

```typescript
// ❌ Parent re-renders on every field change
export function Form() {
    const fields = useFormStore((state) => state.fields);
    return <div>{/* render fields */}</div>;
}
```

### ❌ Creating New Objects in Selectors

```typescript
// ❌ Creates new object every time, causes unnecessary re-renders
const data = useFormStore((state) => ({
    field1: state.field1,
    field2: state.field2
}));
```

### ✅ Correct Patterns

```typescript
// ✅ Subscribe to primitive value
const fieldValue = useFormStore((state) => state.fields[name]);

// ✅ Parent only uses actions
const setField = useFormStore((state) => state.setField);

// ✅ Group component subscribes to object (isolated from parent)
const groupData = useFormStore((state) => state.groupData);
```

## Testing

When implementing this pattern, verify:

1. **Re-render counts**: Use React DevTools Profiler to confirm isolated updates
2. **Performance**: Typing in fields should feel instant with no lag
3. **Memory**: Store should reset properly when component unmounts
4. **Correctness**: All fields should save with correct values

## Example: SectionInspector

The SectionInspector implements this pattern perfectly:

- **72+ fields** across content, properties, and global fields
- **Multi-language support** with separate values per language
- **Zero cascading re-renders** - each field updates independently
- **Sub-100ms update latency** even with all fields rendered

See `src/app/store/sectionFormStore.ts` and `src/app/components/cms/pages/section-inspector/` for full implementation.

## Related Documentation

- [11-performance-optimization.md](./11-performance-optimization.md) - General performance patterns
- [05-component-architecture-styling.md](./05-component-architecture-styling.md) - Component structure
- [12-development-guidelines.md](./12-development-guidelines.md) - Code standards

## Summary

✅ **Use Zustand stores** for complex forms with many fields  
✅ **Granular selectors** to subscribe to specific values only  
✅ **Store-connected wrappers** to isolate field updates  
✅ **Group components** for related fields that change together  
✅ **Action-only parents** to prevent cascading re-renders  
✅ **React.memo** on all connected components  

**Result**: Performant, scalable forms that handle hundreds of fields with perfect re-render isolation. 🚀

