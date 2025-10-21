# Configuration Files Reference

## Core Configuration Files

### API Configuration (`src/config/api.config.ts`)
```typescript
export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        // Authentication endpoints
        AUTH_LOGIN: '/auth/login',
        AUTH_REFRESH_TOKEN: '/auth/refresh-token',

        // Page endpoints
        PAGES_GET_ONE: (keyword: string) => `/pages/${keyword}`,
        ADMIN_PAGES_GET_ALL: '/admin/pages',

        // ... more endpoints
    },
    CORS_CONFIG: {
        credentials: true,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client-Type': 'web'
        },
    },
};
```

### React Query Configuration (`src/config/react-query.config.ts`)
```typescript
export const REACT_QUERY_CONFIG = {
    CACHE: {
        staleTime: 30 * 1000,     // 30 seconds
        gcTime: 60 * 1000,        // 60 seconds
    },
    SPECIAL_CONFIGS: {
        STATIC_DATA: {
            staleTime: 5 * 60 * 1000,   // 5 minutes
            gcTime: 10 * 60 * 1000,     // 10 minutes
        },
        REAL_TIME: {
            staleTime: 0,               // Always stale
            gcTime: 1000,               // 1 second
        }
    }
};
```

### Debug Configuration (`src/config/debug.config.ts`)
```typescript
export const DEBUG_CONFIG = {
    ENABLED: process.env.NODE_ENV === 'development',
    LOG_LEVEL: 'info',
    FEATURES: {
        API_LOGGING: true,
        COMPONENT_INSPECTOR: true,
        PERFORMANCE_MONITORING: true,
    },
};
```

### Mentions Configuration (`src/config/mentions.config.ts`)
```typescript
export interface IVariableSuggestion {
    id: string;
    text: string;
}

export const createMentionConfig = (variables: IVariableSuggestion[]) => ({
    // Tiptap Mention extension configuration
});
```

## Environment Variables

### Required Environment Variables
```
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
NEXT_PUBLIC_APP_ENV=development|staging|production
NEXT_PUBLIC_DEBUG_ENABLED=true|false
```

### Optional Environment Variables
```
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
NEXT_PUBLIC_FEATURE_FLAGS=feature1,feature2
```

## Theme Configuration (`theme.ts`)
```typescript
export const theme = createTheme({
    primaryColor: 'blue',
    defaultColorScheme: 'auto',
    fontFamily: 'Inter, sans-serif',
    components: {
        Button: Button.extend({
            defaultProps: { size: 'sm' },
        }),
    },
});
```

## Route Configuration (`src/config/routes.config.ts`)
```typescript
export const ROUTES = {
    HOME: '/',
    ADMIN: '/admin',
    LOGIN: '/auth/login',
    // ... more routes
};
```

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
