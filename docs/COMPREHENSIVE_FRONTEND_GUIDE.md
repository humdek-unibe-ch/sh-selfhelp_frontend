# 🚀 SelfHelp Frontend - Comprehensive Developer Guide

**Version**: 0.0.2  
**Tech Stack**: Next.js 15, React 18, TypeScript, Mantine UI v7, Tailwind CSS, React Query v5, Refine.dev  
**Target Audience**: Developers, AI Coding Assistants, LLMs

---

## 📋 Table of Contents

1. [🏗️ Architecture Overview](#architecture-overview)
2. [🔐 Authentication System](#authentication-system)
3. [🌐 CMS Structure & Page System](#cms-structure--page-system)
4. [⚡ React Query & Caching Strategy](#react-query--caching-strategy)
5. [🎨 Component Architecture & Styling](#component-architecture--styling)
6. [🔗 API Layer & Endpoint Management](#api-layer--endpoint-management)
7. [🌍 Language System & Internationalization](#language-system--internationalization)
8. [🛠️ Admin Panel & Inspector System](#admin-panel--inspector-system)
9. [👥 User Permissions & ACL System](#user-permissions--acl-system)
10. [📱 Responsive Design & Theming](#responsive-design--theming)
11. [🚀 Performance & Optimization](#performance--optimization)
12. [🔧 Development Guidelines](#development-guidelines)
13. [📈 Expansion Guide](#expansion-guide)

---

## 🏗️ Architecture Overview

### Core Principles
- **Server-First**: Prioritize React Server Components, minimize `'use client'`
- **Type Safety**: Full TypeScript coverage with strict typing
- **Modularity**: Reusable, composable components
- **Performance**: Optimized caching and lazy loading
- **Accessibility**: WCAG compliant with proper ARIA support

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel routes
│   ├── auth/              # Authentication pages
│   ├── components/        # Shared components
│   │   ├── admin/         # Admin-specific components
│   │   ├── auth/          # Auth components
│   │   ├── common/        # Common UI components
│   │   ├── shared/        # Shared business components
│   │   ├── styles/        # Dynamic style components
│   │   ├── ui/            # Basic UI components
│   │   └── website/       # Public website components
│   ├── contexts/          # React contexts
│   └── store/             # Client state management
├── api/                   # API layer
│   ├── admin/             # Admin API endpoints
│   ├── auth.api.ts        # Authentication API
│   ├── base.api.ts        # Base API client
│   └── page.api.ts        # Page content API
├── config/                # Configuration files
├── hooks/                 # Custom React hooks
├── providers/             # React providers
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

### Technology Stack Details

**Core Framework**
- **Next.js 15**: App Router with SSR/SSG capabilities
- **React 18**: Concurrent features and Suspense
- **TypeScript 5.5**: Strict type checking

**UI & Styling**
- **Mantine UI v7**: Primary component library (50+ components)
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Modules**: Component-scoped styling
- **PostCSS**: CSS processing and optimization

**State Management**
- **React Query v5**: Server state management and caching
- **Zustand**: Lightweight client state (when needed)
- **React Context**: Global UI state

**Additional Libraries**
- **Refine.dev**: Admin panel framework
- **Pragmatic Drag & Drop**: Modern drag-and-drop (4.7kB)
- **Monaco Editor**: Code editing capabilities
- **React Markdown**: Markdown rendering

---

## 🔐 Authentication System

### JWT Token Management

The authentication system uses a dual-token approach with automatic refresh:

```typescript
// Token Storage (src/utils/auth.utils.ts)
export const storeTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
};

// Automatic Token Refresh (src/api/base.api.ts)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const newToken = await AuthApi.refreshToken();
            // Retry original request with new token
            return apiClient(originalRequest);
        }
        return Promise.reject(error);
    }
);
```

### Authentication Flow

```mermaid
graph TD
    A[User Login] --> B{Credentials Valid?}
    B -->|Yes| C{2FA Required?}
    B -->|No| D[Login Error]
    C -->|Yes| E[2FA Verification]
    C -->|No| F[Store JWT Tokens]
    E --> G{2FA Valid?}
    G -->|Yes| F
    G -->|No| H[2FA Error]
    F --> I[Update User Context]
    I --> J[Redirect to Dashboard]
```

### Key Features
- **JWT Tokens**: Access token (short-lived) + Refresh token (long-lived)
- **2FA Support**: Time-based one-time passwords
- **Auto Refresh**: Transparent token renewal
- **Permission Checking**: Role-based access control
- **Language Preferences**: Stored in JWT payload

### Auth API Methods
```typescript
// Login with credentials
await AuthApi.login({ email, password });

// Verify 2FA code
await AuthApi.verifyTwoFactor({ user_id, code });

// Refresh tokens
await AuthApi.refreshToken();

// Update language preference
await AuthApi.updateLanguagePreference(languageId);

// Logout
await AuthApi.logout();
```

---

## 🌐 CMS Structure & Page System

### Page-Section Hierarchy

The CMS follows a hierarchical structure where **Pages** contain **Sections**, and sections can contain **child sections**:

```mermaid
graph TD
    A[Page] --> B[Section 1]
    A --> C[Section 2]
    A --> D[Section 3]
    B --> E[Child Section 1.1]
    B --> F[Child Section 1.2]
    C --> G[Child Section 2.1]
    E --> H[Grandchild 1.1.1]
```

### Page Types & Properties

**Page Properties** (non-translatable):
- `keyword`: Unique identifier
- `url`: URL pattern
- `protocol`: HTTP methods allowed
- `headless`: Layout control
- `nav_position`: Header menu position
- `footer_position`: Footer menu position
- `page_access_type_code`: Access control
- `open_access`: Public access flag

**Page Content** (translatable):
- Dynamic fields based on page configuration
- Multi-language support
- Field types: text, textarea, markdown-inline, checkbox

### Section System

**Section Properties**:
- `id`: Unique identifier
- `name`: Display name
- `style_name`: Determines rendering component
- `position`: Order within parent
- `can_have_children`: Nesting capability
- `parent_id`: Parent section reference

**Dynamic Style Components**:
```typescript
// 82+ style components for different content types
const styleComponents = {
    'container': ContainerStyle,
    'heading': HeadingStyle,
    'markdown': MarkdownStyle,
    'image': ImageStyle,
    'button': ButtonStyle,
    'form': FormStyle,
    // ... 75+ more styles
};
```

### Page Rendering Process

1. **Route Resolution**: `[[...slug]]/page.tsx` catches all dynamic routes
2. **Content Fetching**: `usePageContent(keyword, languageId)` fetches page data
3. **Section Rendering**: `BasicStyle` component routes to appropriate style component
4. **Field Extraction**: Helper functions extract content from dual structure

```typescript
// Field extraction pattern
const getFieldContent = (style: TStyle, fieldName: string): any => {
    // Direct property access
    if (style[fieldName]?.content !== undefined) {
        return style[fieldName].content;
    }
    // Nested fields object access
    if (style.fields?.[fieldName]?.content !== undefined) {
        return style.fields[fieldName].content;
    }
    return null;
};
```

---

## ⚡ React Query & Caching Strategy

### Global Configuration

```typescript
// src/config/react-query.config.ts
export const REACT_QUERY_CONFIG = {
    CACHE: {
        staleTime: 30 * 1000,     // 30 seconds - data freshness
        gcTime: 60 * 1000,        // 60 seconds - cache retention
    },
    SPECIAL_CONFIGS: {
        STATIC_DATA: {            // Lookups, styles, etc.
            staleTime: 5 * 60 * 1000,   // 5 minutes
            gcTime: 10 * 60 * 1000,     // 10 minutes
        },
        REAL_TIME: {              // Live data
            staleTime: 0,               // Always stale
            gcTime: 1000,               // 1 second
        }
    }
};
```

### Caching Strategy

**Short Cache (30s)**: Dynamic content that changes frequently
- Page content
- User data
- Admin data

**Medium Cache (5min)**: Semi-static data
- Lookups
- Style groups
- Language lists

**Long Cache (10min)**: Static configuration data
- System preferences
- Style definitions

### Custom Hooks Pattern

```typescript
// Standard query hook pattern
export function usePageContent(keyword: string, languageId?: number) {
    return useQuery({
        queryKey: ['page-content', keyword, languageId],
        queryFn: () => PageApi.getPageContent(keyword, languageId),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
        enabled: !!keyword && !!languageId,
    });
}

// Mutation hook pattern
export function useUpdatePageMutation() {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: IUpdatePageRequest) => 
            AdminPageApi.updatePage(data.keyword, data),
        onSuccess: (data, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['page-content'] });
        },
    });
}
```

### Query Key Patterns

```typescript
// Consistent query key structure
QUERY_KEYS: {
    FRONTEND_PAGES: (languageId: number) => ['frontend-pages', languageId],
    PAGE_CONTENT: (keyword: string, languageId?: number) => 
        languageId ? ['page-content', keyword, languageId] : ['page-content', keyword],
    ADMIN_PAGES: ['admin-pages'],
    LOOKUPS: ['lookups'],
    STYLE_GROUPS: ['style-groups'],
}
```

---

## 🎨 Component Architecture & Styling

### Component Hierarchy

**Mantine-First Approach**: Always prefer Mantine components over custom HTML/Tailwind:

```typescript
// ✅ GOOD - Use Mantine components
<Container size="xl">
    <Stack gap="lg">
        <Group justify="space-between" align="center">
            <Text size="xl" fw={700}>Title</Text>
            <Button variant="filled">Action</Button>
        </Group>
    </Stack>
</Container>

// ❌ AVOID - Custom Tailwind classes
<div className="max-w-7xl mx-auto">
    <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Title</h1>
            <button className="bg-blue-500 text-white px-4 py-2">Action</button>
        </div>
    </div>
</div>
```

### Style System Architecture

**Dynamic Style Components**: 82+ components for different content types

```typescript
// BasicStyle.tsx - Component factory
const BasicStyle: React.FC<IBasicStyleProps> = ({ style }) => {
    switch (style.style_name) {
        case 'container': return <ContainerStyle style={style} />;
        case 'heading': return <HeadingStyle style={style} />;
        case 'markdown': return <MarkdownStyle style={style} />;
        case 'image': return <ImageStyle style={style} />;
        // ... 78+ more cases
        default: return <UnknownStyle style={style} />;
    }
};
```

**Style Categories**:
- **Layout**: container, div, card, jumbotron
- **Content**: heading, markdown, plaintext, rawText
- **Media**: image, video, audio, carousel
- **Forms**: input, textarea, select, checkbox, radio
- **Navigation**: button, link, navigationContainer
- **Interactive**: tabs, accordion, modal, quiz

### Component Organization

```
src/app/components/
├── admin/              # Admin-specific components
│   ├── admin-shell/    # Admin layout shell
│   ├── shared/         # Shared admin components
│   └── pages/          # Page-specific admin components
├── auth/               # Authentication components
├── common/             # Common utilities
├── shared/             # Business logic components
├── styles/             # Dynamic style components
├── ui/                 # Basic UI components
└── website/            # Public website components
```

### Theming System

```typescript
// theme.ts - Mantine theme configuration
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
        }),
    },
});
```

**Dark/Light Theme Support**: Automatic theme switching based on system preference

---

## 🔗 API Layer & Endpoint Management

### Centralized Configuration

All API endpoints are centralized in `src/config/api.config.ts`:

```typescript
export const API_CONFIG = {
    BASE_URL: `${API_BASE_URL}/cms-api/v1`,
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login',
        AUTH_REFRESH_TOKEN: '/auth/refresh-token',
        AUTH_LOGOUT: '/auth/logout',
        
        // Pages
        PAGES_GET_ONE: (keyword: string) => `/pages/${keyword}`,
        ADMIN_PAGES_GET_ALL: '/admin/pages',
        ADMIN_PAGES_CREATE: '/admin/pages',
        
        // Sections
        ADMIN_SECTIONS_CREATE_CHILD: (keyword: string, parentId: number) => 
            `/admin/pages/${keyword}/sections/${parentId}/sections/create`,
            
        // ... 50+ more endpoints
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

### API Client Structure

**Base API Client** (`src/api/base.api.ts`):
- Axios instance with interceptors
- Automatic token refresh
- Request/response logging
- Error handling

**Specialized API Modules**:
- `AuthApi`: Authentication operations
- `PageApi`: Public page content
- `AdminPageApi`: Admin page management
- `AdminUserApi`: User management
- `AdminAssetApi`: File management

### API Call Pattern

```typescript
// API service method
export const AdminPageApi = {
    async getPage(keyword: string): Promise<IAdminPageResponse> {
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_GET_ONE(keyword)
        );
        return response.data;
    },
    
    async updatePage(keyword: string, data: IUpdatePageRequest): Promise<IAdminPageResponse> {
        const response = await apiClient.put(
            API_CONFIG.ENDPOINTS.ADMIN_PAGES_UPDATE(keyword),
            data
        );
        return response.data;
    }
};

// React Query hook
export function usePageDetails(keyword: string) {
    return useQuery({
        queryKey: ['page-details', keyword],
        queryFn: () => AdminPageApi.getPage(keyword),
        enabled: !!keyword,
    });
}
```

### Adding New API Endpoints

1. **Add endpoint to config**:
```typescript
// src/config/api.config.ts
ENDPOINTS: {
    NEW_FEATURE_GET_ALL: '/admin/new-feature',
    NEW_FEATURE_CREATE: '/admin/new-feature',
}
```

2. **Create API service**:
```typescript
// src/api/admin/new-feature.api.ts
export const NewFeatureApi = {
    async getAll(): Promise<INewFeatureResponse[]> {
        const response = await apiClient.get(
            API_CONFIG.ENDPOINTS.NEW_FEATURE_GET_ALL
        );
        return response.data;
    }
};
```

3. **Create React Query hook**:
```typescript
// src/hooks/useNewFeature.ts
export function useNewFeatures() {
    return useQuery({
        queryKey: ['new-features'],
        queryFn: () => NewFeatureApi.getAll(),
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}
```

---

## 🌍 Language System & Internationalization

### Language Architecture

The system supports multiple languages with ID-based backend communication:

```mermaid
graph LR
    A[Language Context] --> B[Language ID: 1,2,3...]
    B --> C[API Calls with language_id]
    C --> D[Backend Translation]
    D --> E[Localized Content]
```

### Language Context Structure

```typescript
// src/app/contexts/LanguageContext.tsx
interface ILanguageContextValue {
    currentLanguageId: number;        // Current language ID (1, 2, 3...)
    setCurrentLanguageId: (id: number) => void;
    languages: ILanguage[];           // Available languages
    setLanguages: (languages: ILanguage[]) => void;
    isUpdatingLanguage: boolean;      // Loading state
}
```

### Authentication-Aware Language System

**Non-Authenticated Users**:
- Language preference stored in localStorage
- Uses public `/languages` endpoint
- URL parameter persistence for language state

**Authenticated Users**:
- Language preference stored in JWT token
- API call to `/auth/set-language` updates preference
- Returns new JWT with updated language info

### Content Translation System

**Field Processing Rules**:

1. **Content Fields** (`display: 1`): Translatable fields
   - Process for ALL available languages
   - Examples: titles, descriptions, content

2. **Property Fields** (`display: 0`): System fields
   - Always save with language ID 1 only
   - Examples: CSS, configuration settings, URLs

```typescript
// Field processing utility
const processFieldsByType = (fields: IField[], languages: ILanguage[]) => {
    return fields.map(field => {
        if (field.display === 1) {
            // Content field - process for all languages
            return processForAllLanguages(field, languages);
        } else {
            // Property field - language ID 1 only
            return processForLanguageOne(field);
        }
    });
};
```

### Language API Integration

```typescript
// Page content with language support
GET /pages/home?language_id=2

// Admin pages with language support
GET /admin/pages/home?language_id=3

// Language preference update
POST /auth/set-language
{
    "language_id": 3
}

// Response includes updated JWT
{
    "data": {
        "access_token": "new_jwt_token",
        "language_id": 3,
        "language_locale": "de-CH"
    }
}
```

---

## 🛠️ Admin Panel & Inspector System

### Admin Shell Layout

The admin panel uses a shell layout with navigation sidebar and main content area:

```typescript
// Admin Shell Structure
<AdminShell>
    <AdminNavbar />      // Left sidebar navigation
    <AdminContent>       // Main content area
        <Inspector />    // Right panel for editing
    </AdminContent>
</AdminShell>
```

### Inspector Architecture

**Modular Inspector Components**:
- `InspectorLayout`: Main layout wrapper
- `InspectorHeader`: Title, badges, and actions
- `FieldsSection`: Collapsible field groups
- `FieldRenderer`: Universal field rendering

```typescript
// Inspector component pattern
<InspectorLayout loading={isLoading} error={error}>
    <InspectorHeader
        title="Page Inspector"
        badges={[{ label: `ID: ${page.id}`, color: 'blue' }]}
        actions={[
            { label: 'Save', icon: <IconSave />, onClick: handleSave },
            { label: 'Delete', icon: <IconTrash />, onClick: handleDelete }
        ]}
    />
    
    <FieldsSection title="Content" collapsible>
        {contentFields.map(field => (
            <FieldRenderer
                key={field.id}
                field={field}
                value={fieldValues[field.name]}
                onChange={handleFieldChange}
            />
        ))}
    </FieldsSection>
</InspectorLayout>
```

### Page Inspector Features

**Content Management**:
- Dynamic field loading based on page configuration
- Multi-language field editing with tabs
- Real-time form validation
- Auto-save functionality (Ctrl+S)

**Page Properties**:
- Locked field editing (keyword, URL)
- Menu position management
- Access control settings
- SEO configuration

### Section Inspector Features

**Section Management**:
- Hierarchical section tree with drag-and-drop
- Section creation from style templates
- Position management
- Nested section support

**Drag & Drop System**:
- Professional visual feedback
- Edge-based drop indicators
- Auto-scroll during drag
- Accessibility support

```typescript
// Drag & Drop Implementation
const handleSectionMove = async (moveData: IMoveData) => {
    const { draggedSectionId, newParentId, newPosition } = moveData;
    
    if (newParentId === null) {
        // Moving to page level
        await updateSectionInPageMutation.mutateAsync({
            keyword: pageKeyword,
            sectionId: draggedSectionId,
            sectionData: { position: newPosition }
        });
    } else {
        // Moving to another section
        await updateSectionInSectionMutation.mutateAsync({
            parentSectionId: newParentId,
            childSectionId: draggedSectionId,
            sectionData: { position: newPosition }
        });
    }
};
```

---

## 👥 User Permissions & ACL System

### Permission Architecture

The system implements role-based access control (RBAC) with granular permissions:

```mermaid
graph TD
    A[User] --> B[Groups]
    A --> C[Roles]
    B --> D[ACLs]
    C --> E[Permissions]
    D --> F[Page Access]
    E --> F
```

### Permission Structure

**Users** can have:
- Direct **Roles** (with permissions)
- **Group** memberships (with ACLs)

**Groups** have:
- **ACLs** (Access Control Lists) for specific pages
- Page-level permissions: Select, Insert, Update, Delete

**Roles** have:
- System-wide **Permissions**
- Administrative capabilities

### ACL Management System

```typescript
// ACL structure for groups
interface IACL {
    page_id: number;
    acl_select: boolean;    // View permission
    acl_insert: boolean;    // Create permission
    acl_update: boolean;    // Edit permission
    acl_delete: boolean;    // Delete permission
}

// ACL management component
<AclManagement
    groupId={groupId}
    collapsible={true}
    showSelectedCount={true}
    onAclsChange={handleAclsChange}
/>
```

### Permission Validation

**Frontend Validation**:
```typescript
// Check if user has specific permission
const hasPermission = (permission: string): boolean => {
    const user = getCurrentUser();
    return user?.permissions?.includes(permission) || false;
};

// Restrict UI based on permissions
{hasPermission('admin.users.create') && (
    <Button onClick={handleCreateUser}>Create User</Button>
)}
```

**Backend Integration**:
- All API calls include JWT token with user permissions
- Backend validates permissions for each request
- Consistent permission checking across frontend and backend

### User Management Features

**User Operations**:
- Create, update, delete users
- Block/unblock users
- Send activation emails
- Clean user data
- Impersonate users (admin)

**Group & Role Assignment**:
- Add/remove users from groups
- Assign/revoke roles
- Permission validation during assignment
- Visual feedback for restricted permissions

---

## 📱 Responsive Design & Theming

### Mobile-First Approach

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

### Theme System

**Automatic Theme Detection**:
```typescript
// Theme provider setup
<MantineProvider
    defaultColorScheme="auto"  // Follows system preference
    theme={theme}
>
    <App />
</MantineProvider>
```

**Custom Theme Configuration**:
```typescript
export const theme = createTheme({
    primaryColor: 'blue',
    fontFamily: 'Inter, sans-serif',
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

### CSS Architecture

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

## 🚀 Performance & Optimization

### React Query Optimization

**Intelligent Caching**:
- Short cache for dynamic content (30s)
- Medium cache for semi-static data (5min)
- Long cache for configuration data (10min)

**Query Optimization**:
```typescript
// Optimized query with select transformation
export function useAdminPages() {
    return useQuery({
        queryKey: ['admin-pages'],
        queryFn: AdminPageApi.getAllPages,
        select: (data) => {
            // Transform data once and cache result
            return data.pages.map(page => ({
                ...page,
                displayName: `${page.title} (${page.keyword})`
            }));
        },
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}
```

### Component Optimization

**React.memo Usage**:
```typescript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data, onUpdate }) => {
    return (
        <ComplexVisualization data={data} onUpdate={onUpdate} />
    );
}, (prevProps, nextProps) => {
    // Custom comparison function
    return prevProps.data.id === nextProps.data.id;
});
```

**Lazy Loading**:
```typescript
// Dynamic imports for large components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const PageEditor = lazy(() => import('./PageEditor'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
    <AdminDashboard />
</Suspense>
```

### Bundle Optimization

**Code Splitting**:
- Route-based splitting with Next.js
- Component-based splitting for large features
- Dynamic imports for admin components

**Asset Optimization**:
- WebP images with fallbacks
- SVG icons for scalability
- Font optimization with `next/font`

---

## 🔧 Development Guidelines

### Code Style & Standards

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

### File Organization

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
import { debug } from '../../utils/debug-logger';
import { REACT_QUERY_CONFIG } from '../../config/react-query.config';

// 4. Internal components
import { LoadingSpinner } from '../common/LoadingSpinner';

// 5. Types
import type { IMyComponentProps } from './types';
```

### Error Handling

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

## 📈 Expansion Guide

### Adding New Pages

1. **Create route file**:
```typescript
// src/app/new-feature/page.tsx
export default function NewFeaturePage() {
    return <NewFeatureComponent />;
}
```

2. **Add to navigation**:
```typescript
// Update navigation configuration
const routes = [
    { path: '/new-feature', label: 'New Feature', icon: <IconNew /> }
];
```

### Adding New API Endpoints

1. **Update API config**:
```typescript
// src/config/api.config.ts
ENDPOINTS: {
    NEW_ENDPOINT: '/api/new-endpoint',
}
```

2. **Create API service**:
```typescript
// src/api/new-feature.api.ts
export const NewFeatureApi = {
    async getData(): Promise<INewFeatureResponse> {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.NEW_ENDPOINT);
        return response.data;
    }
};
```

3. **Create React Query hook**:
```typescript
// src/hooks/useNewFeature.ts
export function useNewFeatureData() {
    return useQuery({
        queryKey: ['new-feature'],
        queryFn: NewFeatureApi.getData,
        staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    });
}
```

### Adding New Style Components

1. **Create style component**:
```typescript
// src/app/components/styles/SelfHelpStyles/NewStyle.tsx
export function NewStyle({ style }: { style: TStyle }) {
    const content = getFieldContent(style, 'content');
    
    return (
        <Box>
            <Text>{content}</Text>
        </Box>
    );
}
```

2. **Register in BasicStyle**:
```typescript
// src/app/components/styles/BasicStyle.tsx
switch (style.style_name) {
    case 'newStyle':
        return <NewStyle style={style} />;
    // ... other cases
}
```

### Adding New Permissions

1. **Define permission constants**:
```typescript
// src/constants/permissions.constants.ts
export const PERMISSIONS = {
    NEW_FEATURE_VIEW: 'new-feature.view',
    NEW_FEATURE_CREATE: 'new-feature.create',
} as const;
```

2. **Use in components**:
```typescript
// Permission-protected component
const hasCreatePermission = hasPermission(PERMISSIONS.NEW_FEATURE_CREATE);

return (
    <div>
        {hasCreatePermission && (
            <Button onClick={handleCreate}>Create New Item</Button>
        )}
    </div>
);
```

---

## 🎯 Key Architectural Decisions

### Why These Technologies?

**Next.js 15**: 
- Server-side rendering for SEO
- App Router for modern routing
- Built-in optimization features

**Mantine UI v7**:
- 50+ accessible components
- Built-in theming system
- TypeScript-first design
- Dark/light mode support

**React Query v5**:
- Intelligent caching
- Background updates
- Optimistic updates
- Offline support

**TypeScript**:
- Type safety
- Better developer experience
- Refactoring confidence
- Documentation through types

### Performance Considerations

**Caching Strategy**:
- Aggressive caching for static data
- Short cache for dynamic content
- Smart invalidation on updates

**Bundle Size**:
- Tree shaking enabled
- Dynamic imports for large components
- Optimized dependencies

**Rendering**:
- Server components by default
- Client components only when needed
- Suspense boundaries for loading states

---

## 🚨 Common Pitfalls & Solutions

### React Query Issues

**Problem**: Stale data after mutations
**Solution**: Proper query invalidation
```typescript
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['related-data'] });
}
```

**Problem**: Infinite re-renders
**Solution**: Stable query keys and dependencies
```typescript
// ❌ BAD - Object in dependency array
useEffect(() => {
    // ...
}, [formData]);

// ✅ GOOD - Stable dependencies
useEffect(() => {
    // ...
}, [formData.id, formData.status]);
```

### Component Issues

**Problem**: Prop drilling
**Solution**: Context or React Query
```typescript
// Use context for UI state
const ThemeContext = createContext();

// Use React Query for server state
const { data } = useQuery(['user', userId], fetchUser);
```

**Problem**: Performance issues
**Solution**: Memoization and optimization
```typescript
const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
}, [data]);
```

---

## 📚 Additional Resources

### Documentation Files
- `architecture.md`: Detailed architecture overview
- `frontend.md`: Development log and changes
- `design.md`: UI/UX design guidelines
- `cms.md`: CMS-specific documentation

### Key Directories to Explore
- `src/app/components/`: All React components
- `src/hooks/`: Custom React hooks
- `src/api/`: API service layer
- `src/types/`: TypeScript definitions
- `src/config/`: Configuration files

### Development Tools
- **React Query Devtools**: Query inspection
- **Mantine Dev Tools**: Theme debugging
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## 🔄 Quick Reference for AI Assistants & LLMs

### Essential Commands for Development

**Start Development Server:**
```bash
npm run dev
```

**Key File Locations:**
- API Configuration: `src/config/api.config.ts`
- React Query Config: `src/config/react-query.config.ts`
- Theme Configuration: `theme.ts`
- Main Layout: `src/app/layout.tsx`
- Admin Shell: `src/app/admin/[[...slug]]/layout.tsx`

**Adding New Features Checklist:**
1. ✅ Add API endpoint to `api.config.ts`
2. ✅ Create API service in `src/api/`
3. ✅ Create React Query hook in `src/hooks/`
4. ✅ Create component in appropriate `src/app/components/` subdirectory
5. ✅ Use Mantine components first, Tailwind utilities only when needed
6. ✅ Add TypeScript interfaces with I/T prefixes
7. ✅ Use global REACT_QUERY_CONFIG for caching
8. ✅ Test with different user permissions if admin feature

**Critical Rules to Remember:**
- 🚫 **NEVER** git commit/push unless explicitly asked
- ✅ Always use REACT_QUERY_CONFIG instead of hardcoded cache times
- ✅ Mantine-first approach: prefer Mantine components over Tailwind classes
- ✅ Language IDs (numbers) instead of locale codes (strings)
- ✅ Content fields (display=1) vs Property fields (display=0)
- ✅ Centralized API endpoints in api.config.ts
- ✅ Consistent query key patterns for React Query

### Architecture Summary for Quick Understanding

**Data Flow:**
```
User Action → React Component → React Query Hook → API Service → Backend
            ← UI Update    ← Cache Update   ← API Response ← 
```

**Component Hierarchy:**
```
App Router → Authentication → Language Context → Admin Shell → Inspector Components
```

**Styling Priority:**
```
1. Mantine Components (primary)
2. Mantine Props (size, color, etc.)
3. CSS Modules (component-specific)
4. Tailwind Utilities (layout only)
```

### 🎨 Tailwind CSS Safelist System for CMS User Customization

**How It Works in the CMS:**
The application uses a comprehensive safelist system that allows users to type Tailwind CSS classes directly in the CMS, which are then applied when the styles render on the frontend.

#### **CMS User Flow:**
1. **User Types Classes**: In the CMS admin panel, users can enter Tailwind classes in the `css` field
2. **Classes Are Stored**: The CSS classes are saved to the database as part of the section/page data
3. **Frontend Rendering**: When the page loads, the classes are extracted and applied to components

#### **How Classes Are Applied in Style Components:**

```typescript
// Every style component extracts CSS classes using getFieldContent()
const cssClass = getFieldContent(style, 'css');

// Classes are applied directly to components
<div className={cssClass}>           // ContainerStyle
<Card className={cssClass}>          // CardStyle  
<Button className={cssClass}>        // ButtonStyle
<Box className={cssClass}>           // DivStyle, PlaintextStyle
<TagComponent className={cssClass}>  // HtmlTagStyle
```

#### **Field Extraction System:**
```typescript
// src/utils/style-field-extractor.ts
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

#### **Safelist Configuration:**

**Static Classes** (`src/utils/css-safelist.ts`) - Always included:
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

**Dynamic Patterns** (`tailwind.config.ts`) - Generated combinations:
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

#### **Real-World CMS Usage Examples:**

**Container with Background and Spacing:**
```
User types in CMS: "bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg shadow-xl"
Frontend result: <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 rounded-lg shadow-xl">
```

**Responsive Card Layout:**
```
User types in CMS: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
Frontend result: <Card className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Interactive Button with Hover Effects:**
```
User types in CMS: "transform hover:scale-105 transition-all duration-300 hover:shadow-lg"
Frontend result: <Button className="transform hover:scale-105 transition-all duration-300 hover:shadow-lg">
```

#### **Adding New Classes for Users:**

**Method 1 - Static Classes** (for commonly used classes):
```typescript
// Add to src/utils/css-safelist.ts
CSS_SAFELIST.userCustomization.push(
  'animate-pulse',        // Animations
  'backdrop-blur-sm',     // Backdrop effects  
  'ring-2',              // Ring utilities
  'divide-y',            // Divide utilities
  'aspect-square'        // Aspect ratios
);
```

**Method 2 - Dynamic Patterns** (for systematic class families):
```typescript
// Add to tailwind.config.ts safelist
{
  // Animation patterns
  pattern: /^animate-(none|spin|ping|pulse|bounce)$/,
  variants: ['hover', 'group-hover'],
},
{
  // Filter effects
  pattern: /^(filter|backdrop-filter|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia)(-\w+)?$/,
  variants: ['hover', 'focus'],
}
```

#### **Benefits for CMS Users:**

✅ **Direct Control**: Users can apply any Tailwind class directly  
✅ **No Coding Required**: Just type class names in the CMS interface  
✅ **Live Preview**: Classes apply immediately when content renders  
✅ **Comprehensive Coverage**: 1000+ precompiled classes available  
✅ **Responsive Design**: Full responsive utility support  
✅ **Interactive States**: Hover, focus, and dark mode variants  
✅ **Performance Optimized**: Only used classes are included in build  

#### **Class Categories Available to Users:**

1. **Layout**: `container`, `mx-auto`, `flex`, `grid`, `block`, `inline`
2. **Spacing**: `p-4`, `m-8`, `px-6`, `py-2`, `gap-4`, `space-y-2`  
3. **Typography**: `text-lg`, `font-bold`, `text-center`, `leading-relaxed`
4. **Colors**: `bg-blue-500`, `text-white`, `border-gray-300`
5. **Borders**: `border`, `border-2`, `rounded-lg`, `shadow-xl`
6. **Sizing**: `w-full`, `h-64`, `max-w-4xl`, `min-h-screen`
7. **Position**: `relative`, `absolute`, `top-4`, `z-10`
8. **Responsive**: `sm:text-lg`, `md:grid-cols-2`, `lg:p-8`
9. **Interactive**: `hover:bg-blue-600`, `focus:ring-2`, `active:scale-95`
10. **Animations**: `transition-all`, `duration-300`, `animate-pulse`
11. **Transforms**: `rotate-45`, `scale-110`, `translate-x-2`
12. **Effects**: `shadow-lg`, `blur-sm`, `opacity-75`

This system gives CMS users complete control over styling while maintaining performance and preventing CSS purging issues.

---

**This guide serves as the definitive reference for understanding and extending the SelfHelp frontend application. Keep it updated as the architecture evolves!**