# Debug System Configuration

## Overview
The debug system provides comprehensive development and testing tools that can be enabled/disabled through environment variables and configuration flags.

## Environment Variables

### Master Debug Flag
- `NEXT_PUBLIC_DEBUG=true` - Enables all debug features (overrides individual flags)

### Debug Logging
- `NEXT_PUBLIC_DEBUG_LOGGING=true` - Enable debug logging
- `NEXT_PUBLIC_DEBUG_LEVEL=debug|info|warn|error` - Set minimum log level

### Debug Components
- `NEXT_PUBLIC_DEBUG_NAV=true` - Enable navigation debug component
- `NEXT_PUBLIC_DEBUG_PERF=true` - Enable performance monitor
- `NEXT_PUBLIC_DEBUG_STATE=true` - Enable state inspector
- `NEXT_PUBLIC_DEBUG_API=true` - Enable API logger

### Debug Features
- `NEXT_PUBLIC_DEBUG_BOXES=true` - Show component bounding boxes
- `NEXT_PUBLIC_DEBUG_RENDERS=true` - Highlight component re-renders
- `NEXT_PUBLIC_DEBUG_DEVTOOLS=true` - Show React Query DevTools

## Usage

### Debug Logger
```typescript
import { debug, info, warn, error } from '../utils/debug-logger';

// Basic logging
debug('Debug message', 'ComponentName');
info('Info message', 'ComponentName', { data: 'optional' });
warn('Warning message', 'ComponentName');
error('Error message', 'ComponentName', errorObject);

// Performance timing
debugLogger.time('operation-name', 'ComponentName');
// ... some operation
debugLogger.timeEnd('operation-name', 'ComponentName');

// Grouped logging
debugLogger.group('Group Label', 'ComponentName');
debug('Message 1');
debug('Message 2');
debugLogger.groupEnd();
```

### Debug Components
Debug components are automatically enabled/disabled based on configuration:

```typescript
import { isDebugEnabled, isDebugComponentEnabled } from '../config/debug.config';

// Check if debug is enabled
if (isDebugEnabled()) {
    // Debug code here
}

// Check specific component
if (isDebugComponentEnabled('navigationDebug')) {
    // Component-specific debug code
}
```

### Debug Menu
The debug menu provides:
- **Overview**: Current debug configuration and status
- **Logs**: Real-time log viewer with filtering and export
- **Config**: Current debug configuration display

Access via the red bug icon in the top-right corner (development only).

## Development vs Production

- **Development**: Debug features are enabled by default
- **Production**: All debug features are disabled unless explicitly enabled via environment variables
- **Testing**: Debug logging can be enabled for test debugging

## Log Management

- Logs are stored in memory (max 1000 entries)
- Logs are accessible via `window.__DEBUG_LOGS__`
- Export logs as JSON for analysis
- Clear logs to free memory

## Adding New Debug Components

1. Create component in `src/app/components/common/debug/`
2. Add configuration flag to `debug.config.ts`
3. Import and add to `DebugMenu.tsx`
4. Export from `debug/index.ts`

## Best Practices

1. Use appropriate log levels (debug for detailed info, error for actual errors)
2. Include component names for better traceability
3. Use structured data objects for complex information
4. Group related log messages
5. Clear logs periodically in long-running applications 