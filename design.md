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

## Role and Group Management System

### Access Control Types

1. **DB Roles (Static Assignment)**
   - System roles that can be modified but not dynamically assigned
   - Full system access control
   - Examples:
     - Super Admin
     - Content Manager
     - Researcher
     - Participant
   - Characteristics:     
     - Can be edited through admin interface
     - Requires system restart to apply changes
     - Provides access to administrative functions
     - Hierarchical permission structure
     - Cannot be assigned through job actions

2. **Groups (Dynamic Assignment)**
   - User-created groups for experiment page access
   - Limited to experiment page permissions only
   - Characteristics:
     - Cannot access administrative functions
     - Specifically designed for research participant management
     - Flexible and project-specific
     - Can be assigned to users via job actions

### DB Role Management

1. **Permission Types**
   - System Administration
   - User Management
   - Content Management
   - Analytics Access
   - API Access
   - Security Settings

2. **Role Assignment**
   - Assigned during user creation
   - Can only be modified by super administrators
   - Audit logging for role changes
### Group Management

1. **Group Interface**
   - Create/Edit/Delete groups
   - Assign users to groups
   - Define experiment page access
   - Set group-specific permissions

2. **Permission Scope**
   - Limited to experiment pages only
   - Available permissions:
     - View experiment
     - Participate in experiment
     - View results
     - Submit responses
   - No access to administrative functions

3. **Group Features**
   - Group name and description
   - Member management
   - Experiment page assignment
   - Access duration settings
   - Activity tracking

### Technical Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /roles
        RoleList.tsx
        RoleDetail.tsx
      /groups
        GroupList.tsx
        GroupCreate.tsx
        GroupEdit.tsx
        GroupDetail.tsx
        components/
          - GroupForm.tsx
          - MemberList.tsx
          - ExperimentAccess.tsx
          - PermissionMatrix.tsx
```

2. **State Management**
   - Role state (read-only, from backend)
   - Group state with React Query
   - Permission matrix state with Zustand
   - Member management state with React Query

3. **API Integration**
   
   DB Roles Endpoints:
   ```
   # Role Management
   GET    /cms-api/v1/db-roles                    # List all roles
   GET    /cms-api/v1/db-roles/:id               # Get role details
   POST   /cms-api/v1/db-roles                    # Create new role
   PUT    /cms-api/v1/db-roles/:id               # Update role
   DELETE /cms-api/v1/db-roles/:id               # Delete role
   
   # Role Permissions
   GET    /cms-api/v1/db-roles/:id/permissions   # Get role permissions
   PUT    /cms-api/v1/db-roles/:id/permissions   # Update role permissions
   
   # Role Users
   GET    /cms-api/v1/db-roles/:id/users         # List users with role
   POST   /cms-api/v1/db-roles/:id/users         # Assign role to users
   DELETE /cms-api/v1/db-roles/:id/users/:userId # Remove role from user
   ```

   Groups Endpoints:
   ```
   # Group Management
   GET    /cms-api/v1/groups                      # List all groups
   GET    /cms-api/v1/groups/:id                 # Get group details
   POST   /cms-api/v1/groups                      # Create new group
   PUT    /cms-api/v1/groups/:id                 # Update group
   DELETE /cms-api/v1/groups/:id                 # Delete group
   
   # Group Members
   GET    /cms-api/v1/groups/:id/members         # List group members
   POST   /cms-api/v1/groups/:id/members         # Add members to group
   DELETE /cms-api/v1/groups/:id/members/:userId # Remove member from group
   
   # Group Experiments
   GET    /cms-api/v1/groups/:id/experiments     # List accessible experiments
   PUT    /cms-api/v1/groups/:id/experiments     # Update experiment access
   GET    /cms-api/v1/groups/:id/permissions     # Get group permissions
   ```

4. **Security Considerations**
   - Regular permission reviews
   - Audit logging for all changes
   - Automatic cleanup of expired permissions
   - Validation of permission scope
   - Prevention of privilege escalation

5. **UI Components (Mantine v7)**
   - `Table` for role and group lists
   - `Select` for role assignment
   - `MultiSelect` for group assignment
   - `Checkbox` for permission matrix
   - `Card` for group details
   - `Tabs` for section organization
   - `Badge` for status indicators
   - `ActionIcon` for quick actions
   - `Modal` for confirmation dialogs
   - `Notification` for action feedback

6. **Permission Inheritance**
   - DB Roles have system-wide permissions
   - Groups inherit experiment-specific permissions
   - No overlap between DB Roles and Group permissions
   - Clear separation of concerns

### Workflow

1. **Role Assignment**
   - Super Admin assigns DB roles during user creation
   - Role changes require elevated permissions
   - Changes are logged in audit trail

2. **Group Management**
   - Researchers create groups for experiments
   - Add/remove members as needed
   - Set experiment-specific permissions
   - Monitor group activity

3. **Permission Validation**
   - System validates all permission requests
   - Ensures groups only access experiment pages
   - Prevents unauthorized elevation of privileges
   - Maintains separation between system and experiment permissions

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