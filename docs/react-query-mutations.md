# React Query Mutations: State-of-the-Art Data Manipulation

## Overview

React Query's `useMutation` is the **state-of-the-art** approach for handling data manipulation operations (Create, Update, Delete) in modern React applications. This document outlines our project's standardized approach to implementing mutations.

## Why React Query Mutations?

### ✅ Pros

1. **Declarative State Management**: Automatic loading, error, and success states
2. **Optimistic Updates**: Update UI immediately, rollback on failure
3. **Cache Invalidation**: Automatic cache management and synchronization
4. **Error Handling**: Centralized, consistent error handling patterns
5. **Loading States**: Built-in pending states for better UX
6. **Retry Logic**: Configurable retry mechanisms
7. **Side Effects**: Structured onSuccess/onError callbacks
8. **DevTools Integration**: Excellent debugging capabilities
9. **TypeScript Support**: Full type safety for mutations
10. **Consistency**: Standardized patterns across the application

### ❌ Cons

1. **Learning Curve**: Requires understanding React Query concepts
2. **Bundle Size**: Additional dependency (though minimal impact)
3. **Over-engineering**: Might be overkill for very simple operations

### 🏆 State-of-the-Art Status

React Query mutations are considered **industry standard** because:
- **Adopted by major companies**: Netflix, Airbnb, Facebook teams
- **Community consensus**: Most popular data fetching library for React
- **Active development**: Regular updates and improvements
- **Performance optimized**: Built-in optimizations for React rendering
- **Framework agnostic**: Works with any backend/API

## Project Implementation Standards

### 1. Mutation Hook Structure

All mutation hooks should follow this pattern:

```typescript
// src/hooks/mutations/use[Entity][Action]Mutation.ts
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX } from '@tabler/icons-react';
import { [Entity]Api } from '../../api/[entity].api';

interface I[Entity][Action]MutationOptions {
    onSuccess?: (data: [ReturnType]) => void;
    onError?: (error: any) => void;
    showNotifications?: boolean;
}

export function use[Entity][Action]Mutation(options: I[Entity][Action]MutationOptions = {}) {
    const queryClient = useQueryClient();
    const { onSuccess, onError, showNotifications = true } = options;

    return useMutation({
        mutationFn: (data: [InputType]) => [Entity]Api.[action](data),
        
        onSuccess: async (result: [ReturnType]) => {
            debug('[Action] successful', 'use[Entity][Action]Mutation', result);
            
            // Invalidate relevant queries
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['[entity]'] }),
                queryClient.invalidateQueries({ queryKey: ['[relatedEntity]'] }),
            ]);
            
            if (showNotifications) {
                notifications.show({
                    title: '[Action] Successful',
                    message: `[Entity] was [action]ed successfully!`,
                    icon: React.createElement(IconCheck, { size: '1rem' }),
                    color: 'green',
                    autoClose: 5000,
                    position: 'top-center',
                });
            }
            
            onSuccess?.(result);
        },
        
        onError: (error: any) => {
            debug('Error [action]ing [entity]', 'use[Entity][Action]Mutation', { error });
            
            // Standardized error handling
            const { errorMessage, errorTitle } = parseApiError(error);
            
            if (showNotifications) {
                notifications.show({
                    title: errorTitle,
                    message: errorMessage,
                    icon: React.createElement(IconX, { size: '1rem' }),
                    color: 'red',
                    autoClose: 8000,
                    position: 'top-center',
                });
            }
            
            onError?.(error);
        },
    });
}
```

### 2. Component Usage Pattern

```typescript
// In React components
export function [Entity]Form() {
    const [entity][Action]Mutation = use[Entity][Action]Mutation({
        onSuccess: (data) => {
            // Custom success handling
            form.reset();
            onClose();
        },
        onError: (error) => {
            // Custom error handling
            console.error('Custom error handling:', error);
        }
    });

    const handleSubmit = (values: FormValues) => {
        [entity][Action]Mutation.mutate(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            {/* Form fields */}
            <Button 
                type="submit"
                loading={[entity][Action]Mutation.isPending}
                disabled={[entity][Action]Mutation.isPending}
            >
                [Action] [Entity]
            </Button>
        </form>
    );
}
```

### 3. Required Mutations for Each Entity

For every data entity, implement these mutations:

#### Create Operations
- `useCreate[Entity]Mutation` - Create new entity
- `useBulkCreate[Entity]Mutation` - Create multiple entities (if needed)

#### Update Operations  
- `useUpdate[Entity]Mutation` - Update existing entity
- `useBulkUpdate[Entity]Mutation` - Update multiple entities (if needed)

#### Delete Operations
- `useDelete[Entity]Mutation` - Delete single entity
- `useBulkDelete[Entity]Mutation` - Delete multiple entities (if needed)

#### Special Operations
- `useRestore[Entity]Mutation` - Restore soft-deleted entity (if applicable)
- `useArchive[Entity]Mutation` - Archive entity (if applicable)

### 4. File Organization

```
src/
├── hooks/
│   ├── mutations/
│   │   ├── pages/
│   │   │   ├── useCreatePageMutation.ts
│   │   │   ├── useUpdatePageMutation.ts
│   │   │   ├── useDeletePageMutation.ts
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── useCreateUserMutation.ts
│   │   │   ├── useUpdateUserMutation.ts
│   │   │   ├── useDeleteUserMutation.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── queries/
│       ├── usePages.ts
│       ├── useUsers.ts
│       └── index.ts
```

### 5. Cache Invalidation Strategy

#### Immediate Invalidation
```typescript
// Invalidate immediately after mutation
await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['pages'] }),
    queryClient.invalidateQueries({ queryKey: ['adminPages'] }),
    queryClient.invalidateQueries({ queryKey: ['navigation'] }),
]);
```

#### Optimistic Updates
```typescript
// For better UX, update cache optimistically
onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['pages'] });
    const previousPages = queryClient.getQueryData(['pages']);
    
    queryClient.setQueryData(['pages'], (old: Page[]) => [
        ...old,
        { ...newData, id: 'temp-id' }
    ]);
    
    return { previousPages };
},
onError: (err, newData, context) => {
    queryClient.setQueryData(['pages'], context?.previousPages);
},
onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['pages'] });
},
```

### 6. Error Handling Standards

Create a centralized error parser:

```typescript
// src/utils/mutation-error-handler.ts
export function parseApiError(error: any): { errorMessage: string; errorTitle: string } {
    let errorMessage = 'Operation failed. Please try again.';
    let errorTitle = 'Operation Failed';
    
    // Handle Axios errors
    if (error?.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.error || responseData.message) {
            errorMessage = responseData.error || responseData.message;
            
            const status = responseData.status || error.response.status;
            if (status === 500) {
                errorTitle = 'Server Error';
            } else if (status === 400 || status === 422) {
                errorTitle = 'Validation Error';
            } else if (status === 409) {
                errorTitle = 'Conflict Error';
            }
        }
    }
    // Handle direct error objects
    else if (error?.status && (error.error || error.message)) {
        errorMessage = error.error || error.message;
        if (error.status === 500) {
            errorTitle = 'Server Error';
        } else if (error.status === 400 || error.status === 422) {
            errorTitle = 'Validation Error';
        }
    }
    // Handle network errors
    else if (error?.message) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
            errorTitle = 'Network Error';
            errorMessage = 'Unable to connect to the server. Please check your connection.';
        } else {
            errorMessage = error.message;
        }
    }
    
    return { errorMessage, errorTitle };
}
```

## Migration Strategy

### Phase 1: Create Mutation Hooks
1. Create mutation hooks for all existing API operations
2. Follow the standardized structure above
3. Include proper TypeScript types

### Phase 2: Update Components
1. Replace direct API calls with mutation hooks
2. Remove manual error handling and loading states
3. Use mutation's built-in states (`isPending`, `isError`, `isSuccess`)

### Phase 3: Optimize
1. Add optimistic updates where appropriate
2. Implement bulk operations
3. Add advanced features (retry logic, etc.)

## Best Practices

### ✅ Do's
- Always use mutations for data manipulation (POST, PUT, DELETE)
- Use queries for data fetching (GET)
- Invalidate related queries after mutations
- Provide loading states in UI
- Handle errors gracefully with notifications
- Use TypeScript for type safety
- Follow consistent naming conventions
- Add debug logging for development

### ❌ Don'ts
- Don't use mutations for data fetching
- Don't forget to invalidate cache
- Don't ignore error handling
- Don't mix direct API calls with mutations
- Don't skip loading states
- Don't hardcode error messages

## Performance Considerations

1. **Bundle Size**: React Query adds ~13kb gzipped
2. **Memory Usage**: Efficient cache management with garbage collection
3. **Network Requests**: Automatic deduplication and caching
4. **Rendering**: Optimized to prevent unnecessary re-renders

## Conclusion

React Query mutations provide a robust, scalable, and maintainable approach to data manipulation. By following these standards, we ensure:

- **Consistency** across the application
- **Better UX** with loading states and error handling
- **Maintainability** with centralized patterns
- **Performance** with optimized cache management
- **Developer Experience** with excellent tooling

This approach is **state-of-the-art** and should be used for **all data manipulation operations** in the project. 