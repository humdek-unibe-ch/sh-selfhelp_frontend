# SelfHelp Frontend Developer Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Key Best Practices](#key-best-practices)
5. [Getting Started](#getting-started)
6. [Development Workflow](#development-workflow)
7. [Core Concepts](#core-concepts)
8. [Common Patterns](#common-patterns)
9. [API Integration](#api-integration)
10. [Testing and Debugging](#testing-and-debugging)
11. [Troubleshooting](#troubleshooting)
12. [Important Rules](#important-rules)

## Project Overview

The SelfHelp frontend is a comprehensive content management system (CMS) built with modern React/Next.js architecture. It serves as both a public-facing website and an admin panel for content management, user administration, and system configuration.

### Key Features
- **Dual Interface**: Public website + Admin CMS
- **Multi-language Support**: ID-based language system with JWT integration
- **Dynamic Content Rendering**: 82+ style components for flexible content
- **Advanced Permissions**: Role-based access control with granular ACLs
- **Drag & Drop**: Pragmatic drag-and-drop for content organization
- **Real-time Collaboration**: Shared editing capabilities
- **Caching Strategy**: 3-tier caching with React Query

## Technology Stack

### Core Framework
- **Next.js 15** - App Router with React Server Components
- **React 18** - Concurrent features and hooks
- **TypeScript 5.5** - Full type safety with strict configuration

### UI & Styling
- **Mantine UI v8** - Primary component library (Mantine-first approach)
- **Tailwind CSS 4** - Utility classes for custom layouts
- **CSS Modules** - Component-specific styling

### State Management
- **TanStack React Query v5** - Server state management
- **React Context** - UI state and global app state
- **Zustand** - Complex client state when needed

### Development Tools
- **Pragmatic Drag & Drop** - Modern drag-and-drop library
- **Monaco Editor** - Code editing capabilities
- **JWT Decode** - Token handling
- **Axios** - HTTP client

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [[...slug]]/       # Dynamic public pages
│   ├── admin/             # Admin panel routes
│   │   └── [[...slug]]/   # Dynamic admin routes
│   ├── auth/              # Authentication pages
│   ├── api/               # Next.js API routes (BFF pattern)
│   └── components/        # App-specific components
│       ├── cms/           # Admin panel components
│       ├── frontend/      # Public website components
│       ├── shared/        # Shared components
│       └── contexts/      # React contexts
├── api/                   # API service layer
├── config/                # Configuration files
├── constants/             # Application constants
├── hooks/                 # Custom React hooks
├── providers/             # React providers
├── services/              # API interaction functions
├── store/                 # Client state (Zustand)
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

### Component Organization

#### CMS Components (`src/app/components/cms/`)
Admin panel components organized by feature:
- **actions/** - Automated actions management
- **admin-shell/** - Main admin layout and navigation
- **assets/** - File upload and asset management
- **cache/** - Cache monitoring and management
- **groups/** - User groups and permissions
- **pages/** - Page and section management
- **roles/** - User roles and ACLs
- **users/** - User management
- **shared/** - Reusable admin components

#### Frontend Components (`src/app/components/frontend/`)
Public website components:
- **content/** - Page content rendering
- **layout/** - Website header, footer, navigation
- **styles/** - 82+ dynamic style components

#### Shared Components (`src/app/components/shared/`)
Components used in both contexts:
- **auth/** - Authentication components
- **common/** - General-purpose components
- **ui/** - Basic UI components

## Key Best Practices

### 1. Mantine-First Approach
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

### 2. React Query Configuration
Always use the global React Query configuration:
```typescript
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

const { data } = useQuery({
  queryKey: ['my-data'],
  queryFn: fetchMyData,
  staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
  gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
});
```

### 3. TypeScript Naming Conventions
- **Interfaces**: `I` prefix (e.g., `IPageData`)
- **Types**: `T` prefix (e.g., `TApiResponse`)
- **Never use `any`** - Always define proper types

### 4. Component Structure
```typescript
// Component file structure
interface IMyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: IMyComponentProps) {
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### 5. API Integration Pattern
```typescript
// API service layer
export class PageApi {
  static async getPageContent(pageId: number, languageId: number) {
    return apiClient.get(API_CONFIG.ENDPOINTS.PAGES_GET_ONE(pageId), {
      params: { language_id: languageId }
    });
  }
}

// Custom hook
export function usePageContent(pageId: number | null) {
  return useQuery({
    queryKey: ['page-content', pageId],
    queryFn: () => PageApi.getPageContent(pageId!, currentLanguageId),
    enabled: !!pageId,
  });
}
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd sh-selfhelp_frontend_react

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost/symfony
```

### Development Scripts
```bash
# Development with Turbo (recommended)
npm run dev

# Fast development mode
npm run dev:fast

# Production build
npm run build

# Lint code
npm run lint
```

## Development Workflow

### 1. Feature Development
1. **Plan the feature** - Understand requirements and impact
2. **Check existing components** - Don't duplicate functionality
3. **Create/modify components** - Follow established patterns
4. **Add proper types** - Define interfaces for all data structures
5. **Implement API integration** - Use existing API patterns
6. **Add error handling** - Handle loading, error, and empty states
7. **Test the feature** - Use browser developer tools and debugging

### 2. Component Creation Checklist
- [ ] Use Mantine components first
- [ ] Add proper TypeScript interfaces
- [ ] Include error boundaries
- [ ] Add loading states
- [ ] Implement accessibility features
- [ ] Follow naming conventions
- [ ] Add CSS modules if needed
- [ ] Export from appropriate index file

### 3. API Integration Steps
1. **Add endpoint to `api.config.ts`**
2. **Create API service method**
3. **Define request/response types**
4. **Create custom hook with React Query**
5. **Add error handling and loading states**
6. **Update cache invalidation strategy**

## Core Concepts

### Language Management
The application uses **ID-based language system**:
```typescript
// Language context provides current language ID
const { currentLanguageId, setCurrentLanguage } = useLanguageContext();

// API calls use language_id parameter
const { data } = usePageContent(pageId, currentLanguageId);
```

### Content vs Property Fields
- **Content Fields** (`display: true`) - Translatable content
- **Property Fields** (`display: false`) - System configuration (CSS, settings)

### Permission System
Role-based access control with granular permissions:
```typescript
// Check permissions
const { hasPermission } = useHasPermission();
if (hasPermission('admin.users.create')) {
  // Show create user button
}
```

### Caching Strategy
3-tier caching approach:
1. **Real-time data** (0s staleTime) - Live updates
2. **User data** (1s staleTime) - Current user information
3. **Static data** (1s staleTime) - Configuration data

## Common Patterns

### 1. Modal Components
```typescript
interface IMyModalProps {
  opened: boolean;
  onClose: () => void;
  data?: IMyData;
}

export function MyModal({ opened, onClose, data }: IMyModalProps) {
  const form = useForm({ /* form config */ });

  return (
    <Modal opened={opened} onClose={onClose} title="My Modal">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        {/* Form fields */}
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
```

### 2. Data Fetching Hook
```typescript
interface IUseMyDataOptions {
  enabled?: boolean;
}

export function useMyData(options: IUseMyDataOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['my-data'],
    queryFn: MyApi.getData,
    enabled,
    staleTime: REACT_QUERY_CONFIG.CACHE.staleTime,
    gcTime: REACT_QUERY_CONFIG.CACHE.gcTime,
  });
}
```

### 3. Error Handling
```typescript
const { data, isLoading, error } = useMyData();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorAlert error={error} />;

return (
  <div>
    {/* Render data */}
  </div>
);
```

### 4. Form Validation
```typescript
const form = useForm({
  initialValues: {
    name: '',
    email: '',
  },
  validate: {
    name: (value) => value.length < 2 ? 'Name too short' : null,
    email: (value) => !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
  },
});
```

## API Integration

### API Response Structure
All API responses follow this envelope pattern:
```typescript
interface IApiResponse<T> {
  status: number;
  message: string;
  error: string | null;
  logged_in: boolean;
  meta: {
    version: string;
    timestamp: string;
  };
  data: T; // Actual response data
}
```

### Authentication Headers
Always include these headers:
```typescript
const headers = {
  'X-Client-Type': 'web',
  'Authorization': `Bearer ${accessToken}`,
};
```

### Error Handling
```typescript
try {
  const response = await apiClient.post(endpoint, data);
  return response.data.data; // Extract actual data
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
    redirect('/auth/login');
  }
  throw error;
}
```

## Testing and Debugging

### Debug Tools
The application includes comprehensive debugging:
```typescript
import { debug } from '../utils/debug-logger';

// Debug logging
debug('Component', 'action', { data: myData });

// Performance monitoring
debug('Performance', 'render', { duration: 150 });
```

### Browser Developer Tools
1. **React DevTools** - Component tree inspection
2. **Network tab** - API request monitoring
3. **Console** - Debug logs and error tracking
4. **Application tab** - Local storage and session storage

### Common Debug Commands
```typescript
// Clear all caches
queryClient.clear();

// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ['admin-pages'] });

// Log current user permissions
console.log('User permissions:', user?.permissions);
```

## Troubleshooting

### Common Issues

#### 1. "Maximum update depth exceeded"
**Cause**: State updates in useEffect without proper dependencies
**Solution**: Add all dependencies or use useCallback for functions

#### 2. API calls not working
**Cause**: Missing authentication headers or wrong endpoint
**Solution**: Check API configuration and token validity

#### 3. Component not re-rendering
**Cause**: Missing dependencies in useEffect or incorrect state updates
**Solution**: Review dependency arrays and state update patterns

#### 4. Drag and drop not working
**Cause**: Missing drag handle or incorrect drag context
**Solution**: Ensure proper drag handle setup and context hierarchy

#### 5. Language not switching
**Cause**: Language ID not properly set in context
**Solution**: Check language context and JWT token

### Performance Issues
1. **Bundle size** - Use dynamic imports for large components
2. **Re-renders** - Memoize components and callbacks
3. **API calls** - Implement proper caching strategies
4. **Images** - Use WebP format and lazy loading

## Important Rules

### 🚫 NEVER DO THESE
1. **Never use `any` type** - Always define proper TypeScript types
2. **Never hardcode API endpoints** - Use `API_CONFIG.ENDPOINTS`
3. **Never hardcode React Query config** - Use `REACT_QUERY_CONFIG`
4. **Never create duplicate components** - Check existing components first
5. **Never commit without testing** - Test features before committing
6. **Never use `window.location.href`** - Use Next.js router
7. **Never create test pages** - Test in existing application structure

### ✅ ALWAYS DO THESE
1. **Always use Mantine components first** - Mantine-first approach
2. **Always add proper TypeScript interfaces** - Full type safety
3. **Always handle loading and error states** - Better UX
4. **Always use React Query for server state** - Proper caching
5. **Always follow naming conventions** - Consistent codebase
6. **Always add error boundaries** - Graceful error handling
7. **Always use CSS modules for styling** - Scoped styles
8. **Always invalidate queries after mutations** - Data consistency

### 🔧 DEVELOPMENT PRINCIPLES
1. **Server-first**: Prioritize React Server Components
2. **Performance**: Optimize for Web Vitals
3. **Accessibility**: Build inclusive interfaces
4. **Mobile-first**: Responsive design approach
5. **Modularity**: Small, reusable components
6. **Type Safety**: Full TypeScript coverage
7. **Testing**: Comprehensive error handling and debugging

### 🎯 KEY SUCCESS FACTORS
1. **Follow established patterns** - Consistency is key
2. **Read existing code** - Learn from implemented features
3. **Ask questions early** - Don't guess, ask for clarification
4. **Test thoroughly** - Use browser tools and debug features
5. **Document changes** - Update relevant documentation
6. **Code review** - Get feedback on complex changes

### 📚 LEARNING RESOURCES
1. **Architecture Document** (`architecture.md`) - Project structure and principles
2. **Comprehensive Guide** (`docs/COMPREHENSIVE_FRONTEND_GUIDE.md`) - Detailed implementation guide
3. **Debug Configuration** (`docs/debug-configuration.md`) - Debugging setup
4. **Existing Components** - Study implemented patterns
5. **Type Definitions** - Understand data structures

---

**Remember**: This is a complex, well-architected application. Take time to understand the existing patterns and architecture before making changes. When in doubt, ask questions and study the existing codebase thoroughly.

**Happy coding! 🎉**
