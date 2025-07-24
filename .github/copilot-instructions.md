# Copilot & AI Agent Instructions for SH-SelfHelp Frontend (React)

## Project Architecture & Key Concepts
- **Modular, Section-Based CMS**: The app is a Next.js/React frontend for a research CMS. Content is organized as hierarchical "sections" with style-based rendering and multi-language support. See `architecture.md` (root) for all major design decisions.
- **Section Management**: Section CRUD, drag-and-drop, and positioning use a tree structure with Pragmatic Drag and Drop (Atlassian pattern). Section operations are split into "add" (existing section) and "create" (from style) with distinct API endpoints and parameter structures. See `src/api/` and `src/hooks/` for mutation patterns.
- **Inspector Components**: Page and Section inspectors share modular, reusable components for field rendering, validation, and layout. URL structure uses path params (not query) for SEO and clarity.
- **Page Content System**: Pages have dynamic fields, separated into content (display: true) and properties (display: false). Editing uses a fixed save button, keyboard shortcuts (Ctrl+S), and locked fields for critical data.
- **Language Management**: Language selection is ID-based (not locale string), persists in JWT, and is integrated throughout API calls. See `src/hooks/useLanguages.ts` and `src/api/` for usage.
- **State Management**: TanStack React Query is used for all server state. Use custom hooks in `src/hooks/` and service functions in `src/api/`. Use Zustand for complex local state (e.g., permission matrix).
- **Styling**: Uses Tailwind CSS (see `globals.css`, `tailwind.config.ts`). Component styling follows Mantine v7 conventions.

## Developer Workflows
- **Build**: Use `npm run build` for production builds. Next.js handles SSR and static generation.
- **Dev**: Use `npm run dev` to start the local dev server.
- **Lint/Format**: Run `npm run lint` and `npm run format` (ESLint, Prettier, Husky pre-commit hooks).
- **Test**: (If present) Use `npm test` for Jest/React Testing Library. See `architecture.md` for test strategy.
- **Debug**: Debug logging is available throughout (see `src/utils/debug-logger.ts`).

## Project-Specific Patterns & Conventions
- **API Layer**: All API calls are abstracted in `src/api/` and consumed via React Query hooks. Types/interfaces for requests and responses are in `src/types/`.
- **Component Structure**: Shared UI in `src/components/ui/`, layout in `src/components/layout/`, and feature-specific components co-located with routes or in `_components` folders.
- **Section Operations**: Always distinguish between add (PUT, existing section) and create (POST, from style) for section endpoints. See `architecture.md` for parameter details and examples.
- **Positioning**: Section and page positions use a 0, 10, 20... pattern, with backend normalization. Sibling creation uses +/-1 for temporary placement.
- **Language Fields**: All content fields are objects keyed by language code (e.g., `en-GB`, `de-CH`).
- **Inspector UI**: Use hover-based action buttons, tooltips, and color-coded icons for CRUD operations. See `architecture.md` for UI/UX rules.
- **Expansion**: When adding new features, update `architecture.md` and follow the directory and hook/service patterns described there.

## Integration Points & External Dependencies
- **Backend**: All data flows through REST APIs, with endpoints documented in `architecture.md` and `design.md`.
- **Refine.dev**: (If present) Integrate via custom data/auth providers using React Query hooks.
- **Plugins**: Plugin system is described in `design.md` (manual install, planned improvements).

## Quick References
- **architecture.md**: Always consult for up-to-date structure, API, and workflow details.
- **design.md**: For UI/UX, admin, and plugin system details.
- **docs/AI Prompts/ai_generate.md**: For AI JSON generation conventions and import/export structure.

---

For any new architectural or workflow changes, update `architecture.md` and this file.
