# 1. 🏗️ Architecture Overview

> **For the post-v0.1.0 SSR + BFF architecture**, read
> [`docs/architecture/ssr-bff-architecture.md`](../architecture/ssr-bff-architecture.md)
> first; that file explains the request lifecycle, the cookie model,
> and where to put new code.
> [`docs/reference/ssr-helpers.md`](../reference/ssr-helpers.md) is the
> flat reference of every helper introduced by that refactor
> (`server-providers`, `query-client`, `resolveLanguageSSR`,
> `useAclEventStream`, `writeBrowserCookie`, `cookieColorSchemeManager`,
> `PreviewModeProvider`, `navigation.utils`, etc.).

## Core Principles
- **Server-First**: Prioritize React Server Components, minimize `'use client'`
- **Type Safety**: Full TypeScript coverage with strict typing
- **Modularity**: Reusable, composable components
- **Performance**: Optimized caching and lazy loading
- **Accessibility**: WCAG compliant with proper ARIA support

## Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel routes
│   ├── auth/              # Authentication pages
│   ├── components/        # All React components (organized by usage)
│   │   ├── cms/           # CMS backend components (admin panel)
│   │   │   ├── admin-shell/    # Admin layout and navigation
│   │   │   ├── pages/          # Page management components
│   │   │   ├── sections/       # Section management components
│   │   │   ├── users/          # User management components
│   │   │   ├── groups/         # Group management components
│   │   │   ├── roles/          # Role management components
│   │   │   ├── assets/         # Asset management components
│   │   │   ├── cache/          # Cache management components
│   │   │   ├── data/           # Data management components
│   │   │   ├── actions/        # Action management components
│   │   │   ├── scheduled-jobs/ # Job management components
│   │   │   ├── unused-sections/# Unused sections management
│   │   │   ├── shared/         # Shared CMS components (inspectors, field renderers)
│   │   │   └── ui/             # CMS-specific UI components
│   │   ├── frontend/      # Frontend user-facing components
│   │   │   ├── content/        # Page content rendering
│   │   │   ├── layout/         # Website layout (header, footer)
│   │   │   └── styles/         # Dynamic style components (82+ types)
│   │   ├── shared/        # Components used in both CMS and frontend
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── common/         # Common utilities (loading, modals, etc.)
│   │   │   └── ui/             # Shared UI components
│   │   └── contexts/      # React contexts
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

## Technology Stack Details

### Core Framework
- **Next.js 15**: App Router with SSR/SSG capabilities
- **React 18**: Concurrent features and Suspense
- **TypeScript 5.5**: Strict type checking

### UI & Styling
- **Mantine UI v8**: Primary component library (50+ components)
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Modules**: Component-scoped styling
- **PostCSS**: CSS processing and optimization

### State Management
- **React Query v5**: Server state management and caching. Server-side
  prefetches in `src/app/_lib/server-fetch.ts` are dehydrated by
  `ServerProviders` (`src/providers/server-providers.tsx`) so the first
  client render is zero-network. Both runtimes obtain their client from
  the `getQueryClient()` factory in `src/providers/query-client.ts`
  (fresh per request server-side, singleton on the browser).
- **Zustand**: Lightweight client state — currently `isSidebarCollapsed`
  in `ui.store.ts` and `selectedKeyword` in `admin.store.ts`. Never used
  for SSR-visible state (preview mode, color scheme, language all live
  in cookies + contexts).
- **React Context**: SSR-visible UI state — `LanguageContext`,
  `PreviewModeContext` (cookie-backed, seeded by `resolveLanguageSSR`
  / `resolvePreviewSSR`).

### Additional Libraries
- **Refine.dev**: Admin panel framework
- **Pragmatic Drag & Drop**: Modern drag-and-drop (4.7kB)
- **Monaco Editor**: Code editing capabilities
- **React Markdown**: Markdown rendering

---

**[← Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)** | **[Next: Authentication System →](02-authentication-system.md)**
