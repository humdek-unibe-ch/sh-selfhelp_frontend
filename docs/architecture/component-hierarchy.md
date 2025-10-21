# Component Hierarchy Architecture

## Three-Tier Component Architecture

### 1. CMS Backend Components (`src/app/components/cms/`)
**Purpose**: Admin panel functionality and content management
**Usage**: Exclusively used in `/admin` routes
**Characteristics**:
- Complex forms and data management interfaces
- Inspector components for editing content
- Administrative tools and dashboards
- Permission-aware components
- Rich interaction patterns (drag-and-drop, modals, etc.)

**Examples**:
- `PageInspector` - Page content editing
- `UsersList` - User management interface
- `AdminShell` - Admin panel layout
- `AclManagement` - Permission management

### 2. Frontend User-Facing Components (`src/app/components/frontend/`)
**Purpose**: Public website rendering and user experience
**Usage**: Exclusively used in public routes (`/`, `/[...slug]`)
**Characteristics**:
- Optimized for performance and SEO
- Dynamic content rendering from CMS data
- Responsive design for all devices
- Minimal JavaScript for better performance
- 82+ dynamic style components for flexible content display

**Examples**:
- `PageRenderer` - Main page rendering
- `WebsiteHeader` - Site navigation
- `BasicStyle` - Dynamic content styling
- `ContainerStyle`, `HeadingStyle`, etc. - Style components

### 3. Shared Components (`src/app/components/shared/`)
**Purpose**: Components used in both CMS and frontend contexts
**Usage**: Used across both admin and public routes
**Characteristics**:
- Authentication components (login/logout)
- Common utilities (loading screens, modals)
- Basic UI components (links, selectors)
- Debug and development tools
- Language and theme management

**Examples**:
- `AuthButton` - Login/logout functionality
- `LoadingScreen` - Loading indicators
- `LanguageSelector` - Language switching
- `MentionEditor` - Rich text with variables

## Component Organization Structure

```
src/app/components/
├── cms/                    # Admin Panel Components
│   ├── admin-shell/        # Layout and navigation
│   ├── pages/             # Page management
│   ├── sections/          # Section management
│   ├── users/             # User management
│   ├── groups/            # Group management
│   ├── roles/             # Role management
│   ├── assets/            # Asset management
│   ├── cache/             # Cache management
│   ├── data/              # Data table management
│   ├── actions/           # Action configuration
│   ├── scheduled-jobs/    # Job scheduling
│   ├── unused-sections/   # Cleanup tools
│   ├── shared/            # CMS shared components
│   │   ├── field-components/     # Form field types
│   │   ├── field-renderer/       # Universal field renderer
│   │   ├── inspector-layout/     # Inspector UI framework
│   │   ├── inspector-header/     # Inspector headers
│   │   ├── fields-section/       # Collapsible sections
│   │   └── acl-selector/         # ACL management
│   └── ui/                # CMS-specific UI
├── frontend/              # Public Website Components
│   ├── content/           # Page content rendering
│   │   ├── PageContentRenderer.tsx
│   │   ├── PageRenderer.tsx
│   │   └── PageContentRendererClient.tsx
│   ├── layout/            # Website layout
│   │   ├── WebsiteHeader.tsx
│   │   ├── WebsiteHeaderOptimized.tsx
│   │   ├── WebsiteHeaderServer.tsx
│   │   ├── WebsiteHeaderMenu.tsx
│   │   ├── WebsiteFooter.tsx
│   │   └── WebsiteFooterOptimized.tsx
│   └── styles/            # Dynamic style components (82+ types)
│       ├── BasicStyle.tsx
│       ├── SelfHelpStyles.ts
│       └── [Component]Style.tsx (75+ components)
├── shared/                # Cross-Context Components
│   ├── auth/              # Authentication
│   │   ├── AuthButton.tsx
│   │   └── AuthButtonClient.tsx
│   ├── common/            # Utilities
│   │   ├── LoadingScreen.tsx
│   │   ├── CustomModal.tsx
│   │   ├── LanguageSelector.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── SelfHelpLogo.tsx
│   │   ├── BurgerMenuClient.tsx
│   │   ├── navbar-links-group/
│   │   └── debug/
│   ├── ui/                # Basic UI
│   │   └── InternalLink.tsx
│   └── contexts/          # React Contexts
│       ├── LanguageContext.tsx
│       ├── EnhancedLanguageProvider.tsx
│       └── PageContentContext.tsx
└── contexts/              # Global Contexts
    ├── LanguageContext.tsx (duplicate - should be removed)
    └── [Other global contexts]
```

## Component Communication Patterns

### Props Drilling Prevention
```typescript
// ❌ Avoid prop drilling
<Parent>
  <Child data={data}>
    <GrandChild data={data} />
  </Child>
</Parent>

// ✅ Use context or React Query
const { data } = useQuery(['data'], fetchData);
// Data available throughout component tree
```

### State Management Strategy
- **React Query**: Server state (API data)
- **Zustand**: Client state (when needed)
- **React Context**: Global UI state
- **Local State**: Component-specific state

## Component Lifecycle

### Server Components (Preferred)
```typescript
// Server component - no 'use client'
export default function ServerComponent({ data }) {
    return <div>{data.title}</div>;
}
```

### Client Components (When Needed)
```typescript
'use client';

export function ClientComponent() {
    const [state, setState] = useState();

    // Client-side logic here
    return <div>{state}</div>;
}
```

---

**[Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)**
