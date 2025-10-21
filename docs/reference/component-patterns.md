# Component Patterns Reference

## Standard Component Structure

```typescript
// ComponentName.tsx
interface IComponentNameProps {
    // Props interface
}

export function ComponentName(props: IComponentNameProps) {
    // Component logic
    return (
        // JSX
    );
}
```

## Hook Patterns

```typescript
// Custom hook pattern
export function useCustomHook(param: string) {
    return useQuery({
        queryKey: ['custom', param],
        queryFn: () => apiCall(param),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}

// Mutation hook pattern
export function useCustomMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ICustomRequest) => apiCall(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['related-data'] });
        },
    });
}
```

## Form Component Pattern

```typescript
export function FormComponent({ onSubmit }: IFormComponentProps) {
    const [formData, setFormData] = useState(initialData);
    const mutation = useCustomMutation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <Button type="submit" loading={mutation.isPending}>
                Submit
            </Button>
        </form>
    );
}
```

## Inspector Component Pattern

```typescript
export function CustomInspector({ itemId }: ICustomInspectorProps) {
    const { data, isLoading } = useCustomData(itemId);

    return (
        <InspectorLayout loading={isLoading}>
            <InspectorHeader title="Custom Inspector" />
            <FieldsSection title="Properties">
                {/* Field components */}
            </FieldsSection>
        </InspectorLayout>
    );
}
```

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
