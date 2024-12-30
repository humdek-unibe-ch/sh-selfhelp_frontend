# SelfHelp CMS - Research Content Management System

## Project Overview
SelfHelp CMS is a modern research-oriented content management system built with a decoupled architecture, featuring a PHP RESTful backend API and a powerful React-based frontend.

## Technical Stack

### Frontend Architecture
- **Framework**: Next.js 15.0.1
- **UI Framework**: Mantine v7.15.0
- **Admin Framework**: Refine v4.56.0
- **State Management**:
  - React Query v5.62.2 (for server state)
  - Zustand v5.0.2 (for local state)
- **Styling**: 
  - TailwindCSS v3.4.16
  - Mantine's built-in styling system
  - PostCSS with Mantine preset

### Backend Architecture
- PHP RESTful API
- Simple REST data provider (@refinedev/simple-rest v5.0.8)

### Key Dependencies
- **Data Fetching**: Axios v1.7.9
- **UI Components**: 
  - @mantine/core & @mantine/hooks
  - @mantine/notifications
  - @tabler/icons-react
- **Data Grid**: @tanstack/react-table v8.20.5
- **Content Rendering**: react-markdown v9.0.1

## Core Features
- Research-focused content management
- Modern, responsive admin interface
- RESTful API integration
- Advanced state management with React Query and Zustand
- Server-side rendering with Next.js
- Component-based architecture
- Efficient data caching and persistence

## UI/UX Design Requirements

### CMS Interface Layout
The interface is divided into three main sections:

1. **Left Sidebar - Page Navigation**
   - Page tree structure/hierarchy
   - Create new page functionality
   - Page selection and navigation
   - Page reordering capabilities

2. **Main Content Area - Page Builder**
   - Section-based content display
   - Visual representation of page sections
   - Section management:
     - Add new sections
     - Reorder sections via drag-and-drop
     - Remove sections
     - Edit section content
   - Preview mode for sections
   - Section types:
     - Container sections
     - Image sections
     - Heading sections
     - Markdown sections
     - Custom component sections

3. **Right Sidebar - Properties Panel**
   - Context-aware property editor
   - Two modes:
     - Page properties when no section is selected
     - Section properties when a section is selected
   - Property types:
     - Basic text inputs
     - Rich text editors
     - Image uploaders
     - Section-specific configurations

### Key UI Features
- **Section Management**:
  - Sections displayed as abstract elements rather than rendered content
  - Clear visual hierarchy of section types
  - Intuitive section manipulation tools
  
- **Interactive Elements**:
  - Drag-and-drop functionality for reordering
  - Context menus for quick actions
  - Real-time preview capabilities
  
- **Visual Feedback**:
  - Clear section type indicators
  - Selection state visualization
  - Drag-and-drop preview
  - Loading and saving states

### Workflow Improvements
- Quick access to frequently used sections
- Keyboard shortcuts for common operations
- Bulk section operations
- Undo/Redo functionality
- Auto-save feature

## User Management System

### User List Interface
1. **Main Features**
   - Data table with sortable columns
   - Custom search builder
   - Export functionality (Copy, CSV, Excel)
   - Bulk actions support

2. **Table Columns**
   - ID (#)
   - Email
   - Status (active/inactive)
   - User Code
   - User Name
   - Groups
   - User Type
   - Last Login
   - Activity
   - Progress

3. **Action Buttons**
   - Create New User
   - Generate Validation Codes
   - Custom search conditions

### User Creation Interface
1. **Form Fields**
   - Unique User Code (required)
   - Email address (required)
   - Group Assignment (multi-select)

2. **Features**
   - Email validation
   - Automatic activation link generation
   - Multiple group assignment capability
   - Cancel/Create actions

### User Detail/Edit Interface
1. **User Information Display**
   - Status indicator with tooltip
   - User Code
   - User Name
   - Groups
   - User Type
   - Last Login timestamp
   - Activity metrics
   - Progress visualization

2. **Action Cards**
   - Email Activation
     - Send activation email functionality
   - User Status Management
     - Block/Unblock user
   - Data Management
     - Clean user data
     - Delete user
   - Administrative Tools
     - Impersonate user (for debugging)

### Technical Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /users
        UserList.tsx
        UserCreate.tsx
        UserEdit.tsx
        UserDetail.tsx
        components/
          - SearchBuilder.tsx
          - UserTable.tsx
          - ActionCards.tsx
          - UserForm.tsx
```

2. **State Management**
   - User list state with React Query
   - Form state with Mantine form
   - Search/filter state with Zustand
   - Table state with TanStack Table

3. **API Integration**
   - GET /cms-api/v1/users (list)
   - POST /cms-api/v1/users (create)
   - GET /cms-api/v1/users/:id (detail)
   - PUT /cms-api/v1/users/:id (update)
   - DELETE /cms-api/v1/users/:id (delete)
   - POST /cms-api/v1/users/:id/activate (send activation)
   - POST /cms-api/v1/users/:id/block (block/unblock)
   - POST /cms-api/v1/users/:id/clean (clean data)
   - POST /cms-api/v1/users/:id/impersonate (impersonate)

4. **UI Components (Mantine v7)**
   - `Table` for user list
   - `Card` for action cards
   - `TextInput`, `Select`, `MultiSelect` for forms
   - `Button`, `ActionIcon` for actions
   - `Progress` for progress visualization
   - `Badge` for status indicators
   - `Tooltip` for information hints
   - `Modal` for confirmations

5. **Features**
   - Real-time updates using React Query
   - Responsive design
   - Error handling and validation
   - Loading states and skeletons
   - Optimistic updates
   - Infinite scrolling or pagination
   - Sort and filter persistence
   - Export functionality

### Security Considerations
- Role-based access control
- Email verification
- Secure password handling
- Action confirmation dialogs
- Audit logging
- Session management
- Rate limiting

## Development Tools
- TypeScript v5.5.2
- ESLint v8.57.0
- React Query DevTools
- PostCSS tooling

## Project Goals
- Create a robust research-oriented CMS
- Provide an intuitive admin interface
- Ensure high performance and scalability
- Maintain clean and maintainable code structure
- Enable efficient content management workflows
- Seamless migration from PHP to React frontend