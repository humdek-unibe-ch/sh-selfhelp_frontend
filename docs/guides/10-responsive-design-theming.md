# 10. 📱 Responsive Design & Theming

## Mobile-First Approach

All components are designed mobile-first with progressive enhancement:

```typescript
// Responsive component example
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

## Theme System

**Automatic Theme Detection**:
```typescript
// Theme provider setup
<MantineProvider
    defaultColorScheme="auto"  // Follows system preference
    theme={theme}
/>
```

**Custom Theme Configuration**:
```typescript
export const theme = createTheme({
    primaryColor: 'blue',
    fontFamily: 'Inter, sans-serif',
    headings: {
        fontFamily: 'Inter, sans-serif',
    },
    components: {
        Button: Button.extend({
            defaultProps: { size: 'sm' },
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

## CSS Architecture

**Styling Priority**:
1. **Mantine Components**: Primary styling system
2. **Mantine Props**: Size, color, spacing props
3. **CSS Modules**: Component-specific styles
4. **Tailwind Utilities**: Layout and spacing only

**CSS Modules Pattern**:
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

---

**[← Previous: User Permissions & ACL System](09-user-permissions-acl.md)** | **[Next: Performance & Optimization →](11-performance-optimization.md)**
