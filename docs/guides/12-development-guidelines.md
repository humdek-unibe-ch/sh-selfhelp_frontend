# 12. 🔧 Development Guidelines

## Code Style & Standards

**TypeScript Best Practices**:
```typescript
// ✅ GOOD - Use interfaces for object shapes
interface IUserProps {
    id: number;
    name: string;
    email: string;
    isActive?: boolean;
}

// ✅ GOOD - Use types for unions and complex types
type TUserStatus = 'active' | 'inactive' | 'pending';
type TUserWithStatus = IUserProps & { status: TUserStatus };

// ✅ GOOD - Prefix interfaces with 'I' and types with 'T'
interface IApiResponse<T> {
    data: T;
    status: number;
    message: string;
}
```

**Component Patterns**:
```typescript
// ✅ GOOD - Function component with proper typing
interface IMyComponentProps {
    title: string;
    onAction: (id: number) => void;
    items?: IItem[];
}

export function MyComponent({ title, onAction, items = [] }: IMyComponentProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback((id: number) => {
        setIsLoading(true);
        onAction(id);
        setIsLoading(false);
    }, [onAction]);

    return (
        <Card>
            <Text size="lg" fw={600}>{title}</Text>
            {items.map(item => (
                <Button
                    key={item.id}
                    loading={isLoading}
                    onClick={() => handleClick(item.id)}
                >
                    {item.name}
                </Button>
            ))}
        </Card>
    );
}
```

## File Organization

**Component Structure**:
```
ComponentName/
├── ComponentName.tsx       # Main component
├── ComponentName.module.css # Styles
├── ComponentName.test.tsx  # Tests
├── index.ts               # Exports
└── types.ts              # Component-specific types
```

**Import Organization**:
```typescript
// 1. React imports
import React, { useState, useCallback } from 'react';

// 2. Third-party libraries
import { Button, Card, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';

// 3. Internal utilities
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

// 4. Internal components
import { LoadingSpinner } from '../common/LoadingSpinner';

// 5. Types
import type { IMyComponentProps } from './types';
```

## Error Handling

**API Error Handling**:
```typescript
// Standardized error handling
export function useApiData() {
    return useQuery({
        queryKey: ['api-data'],
        queryFn: fetchApiData,
        onError: (error) => {
            console.error('API Error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to load data. Please try again.',
                color: 'red',
            });
        },
    });
}
```

**Component Error Boundaries**:
```typescript
// Error boundary for admin components
<AdminErrorBoundary fallback={<AdminErrorFallback />}>
    <AdminComponent />
</AdminErrorBoundary>
```

---

**[← Previous: Performance & Optimization](11-performance-optimization.md)** | **[Next: Expansion Guide →](13-expansion-guide.md)**
