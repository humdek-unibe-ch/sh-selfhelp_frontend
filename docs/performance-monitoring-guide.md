# Performance Monitoring Guide

## Overview

This guide explains how to use the performance monitoring utilities to detect and fix re-render issues, infinite loops, and performance bottlenecks in React components.

## Quick Start

### 1. Enable Performance Monitoring

Set the environment variable in your `.env.local`:

```bash
NEXT_PUBLIC_DEBUG_PERF=true
```

### 2. Monitor a Component

Add the `useRenderMonitor` hook to any component you want to track:

```typescript
import { useRenderMonitor } from '@/utils/performance-monitor.utils';

export function MyComponent({ userId, data }: IMyComponentProps) {
    // Monitor renders and track prop changes
    useRenderMonitor('MyComponent', { userId, data });
    
    // Your component code...
    return <div>...</div>;
}
```

### 3. View Performance Data

Open the Performance Monitor Panel in your debug tools to see:
- Render counts for each component
- Average render times
- Props that changed between renders
- Performance warnings and issues

## Available Monitoring Hooks

### `useRenderMonitor(componentName, props)`

Tracks component renders, timing, and prop changes.

```typescript
const { renderCount, warnings } = useRenderMonitor('MyComponent', props);
```

**Parameters:**
- `componentName` (string): Name of the component
- `props` (object, optional): Props to track for changes

**Returns:**
- `renderCount`: Number of times component has rendered
- `warnings`: Array of performance warnings for this component

### `useWhyDidYouUpdate(componentName, props)`

Logs which props changed between renders.

```typescript
useWhyDidYouUpdate('MyComponent', { userId, data, onUpdate });
```

**Console Output:**
```
[Why Did You Update] MyComponent
{
  data: { from: {...}, to: {...} },
  onUpdate: { from: Function, to: Function }
}
```

### `useMountMonitor(componentName)`

Tracks component mount/unmount cycles.

```typescript
useMountMonitor('MyComponent');
```

**Console Output:**
```
[Mount Monitor] MyComponent remounted (3 times, 150ms since last mount)
[Mount Monitor] MyComponent is remounting frequently. Check if parent is creating new keys.
```

### HOC: `withPerformanceMonitor(Component, name)`

Wraps a component with automatic performance monitoring.

```typescript
const MonitoredComponent = withPerformanceMonitor(MyComponent, 'MyComponent');
```

## Performance Warnings

The system automatically detects and warns about:

### 1. Excessive Renders

**Trigger:** Component renders more than 50 times in 10 seconds

**Causes:**
- Unstable dependencies in useEffect
- Context values recreated on every render
- Props with new object/function references

**Fix:**
- Memoize context values with `useMemo`
- Wrap callbacks with `useCallback`
- Stabilize dependencies

### 2. Infinite Loop

**Trigger:** Component renders more than 100 times in 5 seconds

**Causes:**
- useEffect that triggers state update → causing re-render → triggering effect again
- Context provider creating new values → consumers re-render → context updates → loop

**Fix:**
- Review useEffect dependencies
- Add guard conditions
- Use refs for values that shouldn't trigger re-renders

### 3. Slow Renders

**Trigger:** Single render takes longer than 16ms (60fps threshold)

**Causes:**
- Heavy computations in render
- Large list rendering without virtualization
- Complex DOM manipulations

**Fix:**
- Use `useMemo` for expensive calculations
- Implement virtualization for long lists
- Optimize or defer heavy operations

### 4. Unstable Props

**Trigger:** Props change on 80%+ of renders

**Causes:**
- Parent creating new objects/functions on every render
- Inline object/function creation in JSX

**Fix:**
- Memoize objects and functions in parent
- Move static values outside component
- Use `useMemo`/`useCallback`

## Best Practices

### 1. Memoize Context Values

❌ **Bad:**
```typescript
export function MyProvider({ children }) {
    const [state, setState] = useState(initialState);
    
    const contextValue = {
        state,
        setState,
        helper: () => doSomething(state)
    };
    
    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
```

✅ **Good:**
```typescript
export function MyProvider({ children }) {
    const [state, setState] = useState(initialState);
    
    const helper = useCallback(() => {
        doSomething(state);
    }, [state]);
    
    const contextValue = useMemo(() => ({
        state,
        setState,
        helper
    }), [state, helper]);
    
    return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}
```

### 2. Stabilize useEffect Dependencies

❌ **Bad:**
```typescript
useEffect(() => {
    fetchData(options);
}, [options]); // options is recreated on every render
```

✅ **Good:**
```typescript
const options = useMemo(() => ({
    filter: filter,
    sort: sort
}), [filter, sort]);

useEffect(() => {
    fetchData(options);
}, [options]);
```

### 3. Avoid Inline Object Creation

❌ **Bad:**
```typescript
<ChildComponent 
    config={{ theme: 'dark', size: 'large' }}
    onUpdate={() => handleUpdate(data)}
/>
```

✅ **Good:**
```typescript
const config = useMemo(() => ({
    theme: 'dark',
    size: 'large'
}), []);

const handleUpdateCallback = useCallback(() => {
    handleUpdate(data);
}, [data]);

<ChildComponent 
    config={config}
    onUpdate={handleUpdateCallback}
/>
```

### 4. Split Complex useEffects

❌ **Bad:**
```typescript
useEffect(() => {
    if (condition1) {
        doThing1();
    }
    if (condition2) {
        doThing2();
    }
    if (condition3) {
        doThing3();
    }
}, [condition1, condition2, condition3, data1, data2, data3]);
```

✅ **Good:**
```typescript
useEffect(() => {
    if (condition1) {
        doThing1();
    }
}, [condition1, data1]);

useEffect(() => {
    if (condition2) {
        doThing2();
    }
}, [condition2, data2]);

useEffect(() => {
    if (condition3) {
        doThing3();
    }
}, [condition3, data3]);
```

## Debugging Workflow

1. **Enable monitoring** on suspected problematic component
2. **Reproduce the issue** while monitoring is active
3. **Check the Performance Monitor Panel** for warnings
4. **Examine changed props** to identify unstable references
5. **Review useEffect dependencies** and context providers
6. **Apply fixes** (memoization, dependency adjustments, etc.)
7. **Verify** that warnings are resolved and render counts stabilize

## API Reference

### Global Functions

```typescript
// Get all render statistics
const stats = getRenderStats();

// Get all warnings
const warnings = getWarnings();

// Reset all monitoring data
resetPerformanceMonitor();
```

### Statistics Interface

```typescript
interface IRenderInfo {
    componentName: string;
    renderCount: number;
    lastRenderTime: number;
    totalRenderTime: number;
    averageRenderTime: number;
    props?: Record<string, any>;
    changedProps?: string[];
}
```

### Warning Interface

```typescript
interface IPerformanceWarning {
    type: 'excessive-renders' | 'slow-render' | 'unstable-props' | 'infinite-loop';
    componentName: string;
    message: string;
    details?: any;
    timestamp: number;
}
```

## Configuration Thresholds

You can adjust these in `src/utils/performance-monitor.utils.ts`:

```typescript
const THRESHOLDS = {
    EXCESSIVE_RENDERS: 50,           // Warn if > 50 renders in 10 seconds
    SLOW_RENDER: 16,                 // Warn if render > 16ms (60fps)
    INFINITE_LOOP_DETECTION: 100,    // Detect potential infinite loop
    WARNING_WINDOW: 10000,           // Time window for detection (10s)
};
```

## Example: Debugging an Infinite Loop

**Scenario:** Component freezes and becomes unresponsive

```typescript
// 1. Add monitoring
export function ProblematicComponent() {
    useRenderMonitor('ProblematicComponent');
    useMountMonitor('ProblematicComponent');
    
    // Your code...
}

// 2. Check console for warnings:
// [Performance Monitor] Possible infinite loop detected: 150 renders in 2.3s

// 3. Add prop tracking
useWhyDidYouUpdate('ProblematicComponent', props);

// 4. Console shows:
// [Why Did You Update] ProblematicComponent
// {
//   contextValue: { from: {...}, to: {...} }  // ← Context changes every render!
// }

// 5. Fix context provider
const contextValue = useMemo(() => ({
    data,
    update
}), [data, update]);
```

## Tips

- Only monitor components during development
- Focus on components with high render counts first
- Use `useWhyDidYouUpdate` when warnings appear
- Check parent components if child renders excessively
- Monitor after every major refactor
- Keep the Performance Monitor Panel open during development

## Related Documentation

- [React Query Caching Guide](./guides/04-react-query-caching.md)
- [Component Architecture](./guides/05-component-architecture-styling.md)
- [Performance Optimization](./guides/11-performance-optimization.md)


