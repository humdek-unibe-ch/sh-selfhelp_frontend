# Styling System Architecture

## CSS Architecture Overview

### Styling Priority (Most to Least Preferred)
1. **Mantine Components**: Primary styling system
2. **Mantine Props**: Size, color, spacing props
3. **CSS Modules**: Component-specific styles
4. **Tailwind Utilities**: Layout and spacing only

## Mantine-First Approach

### ✅ Preferred: Mantine Components
```typescript
<Container size="xl">
    <Stack gap="lg">
        <Group justify="space-between" align="center">
            <Text size="xl" fw={700}>Title</Text>
            <Button variant="filled">Action</Button>
        </Group>
    </Stack>
</Container>
```

### ❌ Avoid: Custom Tailwind Classes
```typescript
<div className="max-w-7xl mx-auto">
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Title</h1>
            <button className="bg-blue-500 text-white px-4 py-2">Action</button>
        </div>
    </div>
</div>
```

## CSS Modules Pattern

### Component-Scoped Styling
```css
/* ComponentName.module.css */
.container {
    display: flex;
    flex-direction: column;
    gap: var(--mantine-spacing-md);
}

.title {
    color: var(--mantine-color-text);
    font-weight: 600;
}

@media (max-width: 768px) {
    .container {
        gap: var(--mantine-spacing-sm);
    }
}
```

### Usage in Components
```typescript
import styles from './ComponentName.module.css';

export function ComponentName() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Title</h1>
        </div>
    );
}
```

## Tailwind CSS Integration

### CMS User Customization System

The application uses a comprehensive safelist system that allows CMS users to apply Tailwind classes directly through the admin interface.

#### How Classes Are Applied
```typescript
// Every style component extracts CSS classes
const cssClass = getFieldContent(style, 'css');

// Classes are applied directly to components
<div className={cssClass}>           // ContainerStyle
<Card className={cssClass}>          // CardStyle
<Button className={cssClass}>        // ButtonStyle
```

#### Field Extraction System
```typescript
export const getFieldContent = (style: any, fieldName: string): string => {
    // Handles both direct properties and nested fields structure
    if (style[fieldName]?.content) {
        return String(style[fieldName].content || '');
    }

    // For CSS field, tries 'all' language (non-translatable)
    if (style.fields?.[fieldName]?.all?.content) {
        return String(style.fields[fieldName].all.content || '');
    }

    return '';
};
```

### Safelist Configuration

#### Static Classes (`src/utils/css-safelist.ts`)
```typescript
export const CSS_SAFELIST = {
    layout: ['container', 'mx-auto', 'px-4', 'py-8', ...],
    typography: ['text-sm', 'text-lg', 'font-bold', 'text-center', ...],
    spacing: ['m-0', 'm-1', 'm-2', 'p-0', 'p-1', 'p-2', ...],
    backgrounds: ['bg-white', 'bg-gray-100', 'bg-blue-500', ...],
    borders: ['border', 'border-2', 'rounded-lg', 'rounded-full', ...],
    // ... 15+ categories with 1000+ classes
};
```

#### Dynamic Patterns (`tailwind.config.ts`)
```typescript
safelist: [
    ...ALL_CSS_CLASSES, // All static classes

    // Color system - ALL variants with states
    {
        pattern: /^(bg|text|border)-(slate|gray|red|blue|green|purple|...)-(50|100|200|300|400|500|600|700|800|900|950)$/,
        variants: ['hover', 'focus', 'active', 'dark', 'dark:hover'],
    },

    // Spacing system - Complete responsive spacing
    {
        pattern: /^(p|m|px|py|pl|pr|pt|pb|mx|my|ml|mr|mt|mb)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
        variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },

    // Grid system - Complete grid support
    {
        pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12|none)$/,
        variants: ['sm', 'md', 'lg', 'xl', '2xl'],
    },

    // ... 10+ more comprehensive patterns
];
```

## Theme System

### Mantine Theme Configuration
```typescript
export const theme = createTheme({
    primaryColor: 'blue',
    defaultColorScheme: 'auto',
    fontFamily: 'Inter, sans-serif',
    headings: {
        fontFamily: 'Inter, sans-serif',
    },
    components: {
        Button: Button.extend({
            defaultProps: {
                size: 'sm',
            },
            styles: {
                root: {
                    '&:hover': {
                        transform: 'translateY(-1px)',
                    },
                },
            },
        }),
    },
});
```

### Dark/Light Mode Support
```typescript
// Automatic theme switching based on system preference
<MantineProvider defaultColorScheme="auto" theme={theme}>
    <App />
</MantineProvider>
```

## Responsive Design

### Mobile-First Approach
All components are designed mobile-first with progressive enhancement:

```typescript
<Container size="xl">
    <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3 }}  // 1 col mobile, 2 tablet, 3 desktop
        spacing={{ base: 'sm', sm: 'md' }}
    >
        {items.map(item => (
            <Card key={item.id}>
                <Text size={{ base: 'sm', sm: 'md' }}>
                    {item.title}
                </Text>
            </Card>
        ))}
    </SimpleGrid>
</Container>
```

## CSS-in-JS Patterns

### Mantine Styles API
```typescript
// Component-level styling
<Container
    styles={{
        root: {
            backgroundColor: 'var(--mantine-color-blue-light)',
            borderRadius: 'var(--mantine-radius-md)',
        },
    }}
>
    Content
</Container>
```

### CSS Variables Usage
```css
/* Using Mantine CSS variables */
.myComponent {
    color: var(--mantine-color-text);
    background: var(--mantine-color-default-color);
    border-radius: var(--mantine-radius-md);
    padding: var(--mantine-spacing-md);
}
```

## Performance Considerations

### CSS Optimization
- **Tree Shaking**: Only used styles included in bundle
- **Purging**: Unused CSS automatically removed
- **Minification**: CSS compressed for production
- **Critical CSS**: Above-the-fold styles prioritized

### Bundle Size Management
- **Code Splitting**: CSS split by route/component
- **Lazy Loading**: Styles loaded on demand
- **Caching**: Long-term caching for static assets

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
