# Tailwind CSS Troubleshooting Guide

## Problem: CSS Classes Not Loading or Appearing as `[object Object]`

When using dynamic CSS classes from JSON data or database content, you may encounter two main issues:

1. **CSS classes not being applied** (classes get purged from the final bundle)
2. **`[object Object]` appearing instead of CSS classes** (field extraction issues)

## Root Causes

### 1. Tailwind Purging (Content Detection)
Tailwind CSS only includes classes in the final bundle that it can detect during build time. Classes loaded dynamically from JSON, APIs, or databases may get purged.

### 2. Field Structure Changes
With the new field structure (`fields.field_name.language.content`), style components need to properly extract field values.

## Solutions Implemented

### 1. Comprehensive Safelist Configuration

**File:** `tailwind.config.ts`
- Added comprehensive safelist with 500+ commonly used classes
- Included pattern matching for dynamic class generation
- Added content detection for JSON files and documentation

```typescript
// Key features:
safelist: [
  ...ALL_CSS_CLASSES, // Comprehensive list from css-safelist.ts
  {
    pattern: /^(bg|text|border)-(red|green|blue|yellow|gray)-(50|100|200|300|400|500|600|700|800|900)$/,
    variants: ['hover', 'focus'],
  },
  // ... more patterns
]
```

### 2. CSS Safelist Utility

**File:** `src/utils/css-safelist.ts`
- Centralized registry of all commonly used Tailwind classes
- Organized by category (layout, typography, colors, etc.)
- Validation functions to check if classes are safe

### 3. Field Extraction Utility

**File:** `src/utils/style-field-extractor.ts`
- Handles both old and new field structures
- Always returns strings to prevent `[object Object]` rendering
- Prioritizes appropriate language codes

```typescript
// Usage in style components:
const cssClass = getFieldContent(style, 'css', 'all');
const title = getFieldContent(style, 'title', 'en-GB');
```

### 4. CSS Class Validator (Debug Tool)

**File:** `src/app/components/common/debug/CssClassValidator.tsx`
- Interactive tool to test CSS class availability
- Visual testing of common classes
- Available in Debug Menu → CSS Validator tab

## How to Fix Missing CSS Classes

### Step 1: Check if Classes are in Safelist
1. Open Debug Menu (red bug icon in development)
2. Go to "CSS Validator" tab
3. Enter your CSS classes to test if they're in the safelist
4. Classes marked with ✗ need to be added to the safelist

### Step 2: Add Missing Classes to Safelist

**Option A: Add to existing safelist**
Edit `src/utils/css-safelist.ts` and add your classes to the appropriate category:

```typescript
// Example: Adding new background colors
backgrounds: [
  'bg-transparent', 'bg-white', 'bg-black',
  'bg-purple-500', // Add your new class here
  // ... existing classes
],
```

**Option B: Add to Tailwind config patterns**
Edit `tailwind.config.ts` to add pattern matching:

```typescript
{
  pattern: /^bg-purple-(50|100|200|300|400|500|600|700|800|900)$/,
  variants: ['hover', 'focus'],
}
```

### Step 3: Fix Field Extraction Issues

If you see `[object Object]` in CSS classes:

1. **Check style component implementation**
   ```typescript
   // ❌ Wrong - direct field access
   const cssClass = style.css;
   
   // ✅ Correct - use field extractor
   const cssClass = getFieldContent(style, 'css', 'all');
   ```

2. **Import and use the field extractor**
   ```typescript
   import { getFieldContent } from '../../utils/style-field-extractor';
   ```

3. **Use appropriate language codes**
   - `'all'` for technical fields (CSS, URLs, etc.)
   - `'en-GB'` for translatable content (titles, text, etc.)

## Testing Your Changes

### 1. Visual Testing
1. Create content with your CSS classes
2. Check in browser inspector that classes appear correctly
3. Verify styles are applied visually

### 2. Debug Menu Validation
1. Use CSS Validator in Debug Menu
2. Test common classes with "Test Common Classes" button
3. Check visual test section shows proper styling

### 3. Build Testing
```bash
npm run build
```
Check that your classes survive the production build process.

## Common CSS Classes Reference

### Layout & Container
```css
container mx-auto px-4 py-8 max-w-6xl
```

### Grid System
```css
grid grid-cols-1 grid-cols-2 md:grid-cols-3 gap-4 gap-6
```

### Flexbox
```css
flex flex-col flex-row justify-center items-center gap-4
```

### Typography
```css
text-xl text-2xl font-bold font-semibold text-center text-gray-700
```

### Spacing
```css
p-4 px-6 py-8 m-4 mb-6 mt-8
```

### Borders & Radius
```css
border border-gray-300 rounded-lg rounded-t-lg rounded-md
```

### Background & Colors
```css
bg-white bg-gray-100 bg-blue-500 shadow-md shadow-lg
```

### Images
```css
w-full h-48 object-cover rounded
```

## Troubleshooting Steps

1. **Check browser inspector**: Look for the class in the DOM and see if CSS rules exist
2. **Use CSS Validator**: Test classes in Debug Menu
3. **Check field extraction**: Ensure style components use `getFieldContent()`
4. **Verify safelist**: Add missing classes to safelist
5. **Test in production**: Run build to ensure classes survive purging
6. **Check console**: Look for any JavaScript errors that might prevent class application

## Best Practices

1. **Always use the field extractor utility** for dynamic content
2. **Test CSS classes in the validator** before using in production
3. **Use semantic class names** that are likely to be in the safelist
4. **Prefer Mantine components** over custom Tailwind styling when possible
5. **Add commonly used classes** to the safelist proactively

## Getting Help

If you continue to have issues:
1. Check the browser console for JavaScript errors
2. Use the Debug Menu CSS Validator to test specific classes
3. Verify that your classes follow Tailwind naming conventions
4. Check if the issue occurs in both development and production builds 