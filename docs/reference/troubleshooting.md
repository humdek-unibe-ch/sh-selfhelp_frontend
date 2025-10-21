# Troubleshooting Guide

## Common Issues & Solutions

### React Query Issues

**Problem**: Stale data after mutations
```typescript
// Solution: Proper query invalidation
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['related-data'] });
}
```

**Problem**: Infinite re-renders
```typescript
// Solution: Stable query keys and dependencies
useEffect(() => {
    // ...
}, [formData.id, formData.status]); // Use specific properties
```

### Component Issues

**Problem**: Prop drilling
```typescript
// Solution: Context or React Query for server state
const { data } = useQuery(['user', userId], fetchUser);
```

**Problem**: Performance issues
```typescript
// Solution: Memoization
const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
}, [data]);
```

### Authentication Issues

**Problem**: Token refresh fails
- Check network connectivity
- Verify token storage in localStorage
- Check server availability

**Problem**: 2FA not working
- Verify 2FA setup on backend
- Check time synchronization
- Validate QR code generation

### Language Issues

**Problem**: Content not translating
- Check language ID in API calls
- Verify content exists for language
- Check field display settings (1=translatable, 0=system)

### Permission Issues

**Problem**: Access denied unexpectedly
- Check user roles and group memberships
- Verify ACL settings for specific pages
- Check JWT token contains correct permissions

### CMS Issues

**Problem**: Sections not saving
- Check field validation
- Verify API endpoints
- Check permission levels

**Problem**: Drag & drop not working
- Check section hierarchy limits
- Verify parent-child relationships
- Check browser compatibility

### Performance Issues

**Problem**: Slow page loads
- Check React Query cache settings
- Verify lazy loading implementation
- Check bundle size

**Problem**: Memory leaks
- Clean up subscriptions in useEffect
- Use proper dependency arrays
- Avoid circular references

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
