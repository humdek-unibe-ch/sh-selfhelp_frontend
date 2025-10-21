# 1. 🏗️ Architecture Overview

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
- **React Query v5**: Server state management and caching
- **Zustand**: Lightweight client state (when needed)
- **React Context**: Global UI state

### Additional Libraries
- **Refine.dev**: Admin panel framework
- **Pragmatic Drag & Drop**: Modern drag-and-drop (4.7kB)
- **Monaco Editor**: Code editing capabilities
- **React Markdown**: Markdown rendering

---

**[← Back to Main Guide](../COMPREHENSIVE_FRONTEND_GUIDE.md)** | **[Next: Authentication System →](02-authentication-system.md)**
