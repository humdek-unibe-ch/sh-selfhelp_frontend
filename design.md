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

## CMS Preferences Interface

### Overview
The CMS Preferences section provides system-wide configuration options for the content management system, including language settings, API configurations, and system preferences.

### Key Features

1. **Language Management**
   - Create new language support
   - List of available languages
   - Default language selection
   - Language-specific settings
   - Language codes (e.g., "Deutsch (Schweiz)", "English (GB)")

2. **System Configuration**
   - CMS Content Language selection
   - Anonymous Users toggle
   - Test Mode indicator
   - System-wide preferences

3. **API Configuration**
   - Callback API Key management
   - Firebase configuration
   - API endpoints setup
   - Authentication settings

### Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /preferences
        CMSPreferences.tsx
        components/
          - LanguageManager.tsx
          - APIConfiguration.tsx
          - SystemSettings.tsx
          - PreferenceForm.tsx
```

2. **API Integration**
```
# Preferences Management
GET    /cms-api/v1/preferences                # Get all preferences
PUT    /cms-api/v1/preferences                # Update preferences
GET    /cms-api/v1/preferences/languages      # Get language settings
POST   /cms-api/v1/preferences/languages      # Add new language
DELETE /cms-api/v1/preferences/languages/:id  # Remove language

# API Configuration
GET    /cms-api/v1/config/api-keys            # Get API keys
PUT    /cms-api/v1/config/api-keys            # Update API keys
GET    /cms-api/v1/config/firebase            # Get Firebase config
PUT    /cms-api/v1/config/firebase            # Update Firebase config
```


3. **Security Considerations**
   - Encrypted storage of sensitive data
   - Role-based access control
   - Audit logging for changes
   - Validation of configuration values
   - Secure key management

4. **Features**
   - Real-time validation
   - Configuration backup/restore
   - Change history tracking
   - Environment-specific settings
   - Configuration health checks

5. **UI Layout**
   - Tabbed interface for different sections
   - Form-based configuration
   - Visual feedback for changes
   - Confirmation dialogs for critical changes
   - Error handling and validation messages

6. **Workflow**
   - Changes require admin privileges
   - Some changes may require system restart
   - Validation before saving
   - Automatic backup before changes
   - Change notification system

## Data Panel Interface

### Overview
The Data Panel provides a comprehensive interface for viewing and analyzing user data across multiple tables, with flexible selection and filtering capabilities.

### Key Features

1. **Data Selection Controls**
   - User selector (single user or all users)
   - Table selector (multiple tables or all)
   - Date range filters
   - Custom search parameters

2. **Table Display**
   - Multi-table view with tabs
   - Sortable columns
   - Pagination controls
   - Data export options
   - Column visibility toggles

3. **Data Grid Features**
   - Column sorting and filtering
   - Row selection
   - Bulk actions
   - Custom column rendering
   - Responsive layout

### Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /data-panel
        DataPanel.tsx
        components/
          - UserSelector.tsx
          - TableSelector.tsx
          - DataGrid.tsx
          - FilterControls.tsx
          - ExportOptions.tsx
```

2. **API Integration**
```
# Data Queries
GET    /cms-api/v1/data                    # Get data with filters
GET    /cms-api/v1/data/tables             # Get available tables
GET    /cms-api/v1/data/users              # Get user list for selector
POST   /cms-api/v1/data/export             # Export selected data

Query Parameters:
- userId: string | 'all'
- tables: string[] | 'all'
- startDate: string
- endDate: string
- page: number
- limit: number
- sort: string
- order: 'asc' | 'desc'
- filters: Record<string, any>
```

3. **Export Functionality**
   - Export formats: CSV, Excel
   - Custom column selection
   - Filtered data export
   - Progress indicator for large datasets

4. **Performance Optimizations**
   - Virtual scrolling for large datasets
   - Debounced search/filter inputs
   - Cached table configurations
   - Efficient condition evaluation
   - Background processing

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

## Forms Actions System

### Overview
The Forms Actions System provides a powerful workflow automation tool that triggers actions based on datatable events (start, update, delete, finish). It allows administrators to create complex action chains with conditional logic, scheduling, and various job types.

### Key Features

1. **Action Triggers**
   - On datatable start
   - On datatable update
   - On datatable delete
   - On datatable finish

2. **Block System**
   - Conditional execution blocks
   - Multiple jobs per block
   - Block randomization
   - Even presentation distribution
   - Block naming and organization

3. **Job Types**
   - Group Management
     - Add users to groups
     - Remove users from groups
   - Notifications
     - Email notifications
     - Push notifications
     - Notifications with reminders
     - Diary-specific notifications

4. **Scheduling System**
   - Immediate execution
   - Fixed datetime scheduling
   - Relative time scheduling (after period)
   - Weekday-based scheduling
   - Recurring schedules
     - Daily repetition
     - Weekly repetition (specific days)
     - Monthly repetition (specific dates)
   - Deadline-based repetition
   - Custom time scheduling

5. **Notification Features**
   - Multiple recipient types
   - Email configuration
     - From email/name
     - Reply-to address
     - Subject and body
     - File attachments
   - Push notification settings
     - Redirect URLs
     - Custom messages
   - Dynamic content
     - User variables (@user, @user_name)
     - Markdown support
     - HTML email templates

6. **Reminder System**
   - Multiple reminders per notification
   - Conditional reminder execution
   - Custom scheduling intervals
   - Validity periods
   - Diary-specific reminder features

7. **Conditional Logic**
   - Complex condition builder
   - JSON Logic implementation
   - Execution conditions
   - Reminder conditions
   - Block-level conditions

### Scheduled Jobs System

1. **Job Management Interface**
   - Grid view of all queued scheduled jobs
   - Detailed job information display:
     - Status (Queued, Running, Completed)
     - Date Created
     - Date To Be Sent
     - Date Sent
     - Recipient
     - Description
     - Data table and record references
     - Configuration details
     - Transaction history

2. **Job Control Features**
   - Manual job execution capability
   - Job deletion option
   - Right-click context menu for quick actions
   - Transaction logging for all job operations
   - Job configuration viewing

3. **Calendar View**
   - Monthly/weekly/daily/list view options
   - User-specific job filtering
   - Action type filtering
   - Interactive calendar navigation
   - Visual job status indicators
   - Right-click menu for job management
   - Job clustering for busy time slots

4. **Execution System**
   - Automated cron-based execution (1-minute default interval)
   - Manual execution override capability
   - Transaction logging for all executions
   - Status tracking and updates
   - Error handling and reporting

5. **Integration Features**
   - Experiment design support
   - Historical tracking and auditing
   - User-specific job views
   - Action type categorization
   - Detailed transaction logging

### Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /forms
        /actions
          FormsActionManager.tsx
          components/
            - ActionBuilder.tsx
            - BlockEditor.tsx
            - JobConfigurator.tsx
            - ScheduleBuilder.tsx
            - NotificationEditor.tsx
            - ConditionBuilder.tsx
```

2. **State Management**
   - Action configuration store
   - Job execution status
   - Scheduling queue
   - Notification delivery status
   - Reminder tracking

3. **Security Considerations**
   - Permission validation
   - Execution logging
   - Rate limiting
   - Input sanitization
   - Notification limits

4. **Performance Features**
   - Batch job processing
   - Optimized scheduling
   - Caching of common configurations
   - Efficient condition evaluation
   - Background processing

## Plugin System

1. **Plugin Management**
   - Currently manual server installation (to be improved)
   - Future interface-based installation system
   - Plugin repository integration
   - Version management
   - Dependency handling

2. **Available Plugins**
   - `sh-shp-lab-js`: LabJS integration plugin
   - `sh-shp-survey-js`: SurveyJS integration (https://surveyjs.io)
   - `sh-shp-formula_parser`: Math expression parser based on MathExecutor
   - `sh-shp-video_capture`: Video capture integration
   - `sh-shp-plotly_graphs`: Plotly charts integration
   - `sh-shp-filters`: Content filtering functionality
   - `sh-shp-unipark`: Unipark integration
   - `sh-shp-studybuddy`: Custom styles for StudyBuddy
   - `sh-shp-shepherd`: Shepherd.js integration for guided tours
   - `sh-shp-r_serve`: R integration service
   - `sh-shp-qualtrics`: Qualtrics styles and components
   - `sh-shp-js_plumb`: Drawing connections between elements
   - `sh-shp-fitrockr`: Fitrockr integration
   - `sh-shp-chat`: Chat functionality
   - `sh-shp-calendar`: Mobile app calendar presentation
   - `sh-shp-api`: API extension functionality
   - `sh-shp-search`: Search functionality
   - `sh-shp-mobile_styles`: Mobile-specific styles
   - `sh-shp-mermaid_form`: Mermaid form presentation
   - `sh-shp-book`: Book-style page presentation
   - `sh-shp-message_board`: Message board functionality
   - `sh-shp-sleep_efficiency`: Sleep efficiency calculations

3. **Planned Improvements**
   - Web-based plugin installation interface
   - Plugin marketplace integration
   - Automated dependency resolution
   - Plugin configuration UI
   - Version compatibility checking
   - Plugin health monitoring
   - Update management system
   - Plugin sandbox environment

4. **Plugin Development**
   - Standardized plugin structure
   - Development guidelines
   - Testing framework
   - Documentation requirements
   - Security guidelines
   - Version compatibility specifications

## Asset Management System

### Overview
The Asset Management System provides a centralized interface for managing various types of assets including images, documents, and custom CSS files. This system allows users to upload, organize, and reference these assets throughout the CMS.

### Key Features

1. **Asset Categories**
   - Media files (images, videos, documents)
   - Custom CSS files for webpage styling
   - Asset organization by folders
   - Preview capabilities for supported file types

2. **Asset Management Features**
   - Drag-and-drop file upload
   - Folder-based organization
   - File overwrite protection
   - Bulk upload capability
   - Asset search and filtering
   - File type validation
   - Size limit enforcement

3. **CSS File Management**
   - Custom CSS file upload
   - Live CSS preview
   - CSS validation
   - Scope selection (global/page-specific)
   - CSS priority management
   - Style conflict detection

### Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /assets
        AssetsManager.tsx
        components/
          - FileUploader.tsx
          - AssetBrowser.tsx
          - CSSManager.tsx
          - FolderNavigator.tsx
```

2. **API Integration**
```
# Asset Management
POST   /cms-api/v1/assets/upload           # Upload assets
GET    /cms-api/v1/assets                  # List assets
DELETE /cms-api/v1/assets/:id              # Delete asset
PUT    /cms-api/v1/assets/:id              # Update asset
POST   /cms-api/v1/assets/folder           # Create folder
GET    /cms-api/v1/assets/folder/:id       # List folder contents

# CSS Management
POST   /cms-api/v1/css                     # Upload CSS
GET    /cms-api/v1/css                     # List CSS files
PUT    /cms-api/v1/css/:id                 # Update CSS
DELETE /cms-api/v1/css/:id                 # Delete CSS
```

3. **Security Considerations**
   - File type whitelisting
   - Size limitations
   - Malware scanning
   - Access control per folder
   - Secure file storage
   - CSS injection prevention

4. **Features**
   - Asset versioning
   - Usage tracking
   - Automatic image optimization
   - Thumbnail generation
   - Asset categorization
   - Quick copy asset URL/path

5. **User Experience**
   - Visual file browser
   - Progress indicators
   - Drag-and-drop zones
   - Quick preview
   - Search and filters
   - Bulk operations

6. **Performance**
   - Lazy loading of assets
   - Compressed storage
   - CDN integration
   - Caching strategy
   - Optimized asset delivery

## Cache Management Interface

### Overview
The Cache Management system provides granular control over the CMS's caching mechanisms, allowing administrators to clear specific types of cached data or perform a complete cache reset.

### Key Features

1. **Cache Categories**
   - All (complete cache reset)
   - Pages cache
   - Sections cache
   - Fields cache
   - Styles cache
   - Hooks cache
   - User Input cache
   - Conditions cache
   - Lookups cache

2. **Control Interface**
   - Individual toggle switches for each cache type
   - Master toggle for all caches
   - Clear button for executing cache clearing
   - Visual feedback for clearing process

### Implementation

1. **Component Structure**
```
/app
  /components
    /admin
      /cache
        CacheManager.tsx
        components/
          - CacheToggle.tsx
          - CacheClearButton.tsx
          - CacheStatus.tsx
```

2. **API Integration**
```
# Cache Management
POST   /cms-api/v1/cache/clear              # Clear selected caches
GET    /cms-api/v1/cache/status             # Get cache status
POST   /cms-api/v1/cache/clear/:type        # Clear specific cache type

Request Body:
{
  "types": ["all" | string[]],  // Cache types to clear
  "force": boolean              // Force immediate clear
}

Response:
{
  "success": boolean,
  "clearedTypes": string[],
  "timestamp": string
}
```

3. **Cache Types**
   ```typescript
   type CacheType = 
     | 'all'
     | 'pages'
     | 'sections'
     | 'fields'
     | 'styles'
     | 'hooks'
     | 'userInput'
     | 'conditions'
     | 'lookups';
   ```

4. **Features**
   - Selective cache clearing
   - Real-time cache status
   - Background cache clearing
   - Cache size monitoring
   - Clear confirmation dialogs
   - Cache clearing history

5. **Security**
   - Admin-only access
   - Rate limiting for cache operations
   - Audit logging of cache clears
   - Prevention of concurrent clearing
   - Validation of cache types

6. **Performance Considerations**
   - Asynchronous cache clearing
   - Progressive cache rebuilding
   - Cache warmup after clearing
   - Impact warnings for production
   - Queue system for large caches

## Database Schema

### Core Tables

1. **Users and Authentication**
   - `users`: User account information
   - `refreshTokens`: JWT refresh tokens
   - `acl_users`: User-specific access control
   - `acl_groups`: Group-based access control
   - `groups`: User groups and roles

2. **Content Management**
   - `pages`: Core content pages
   - `sections`: Page sections
   - `fields`: Content fields
   - `pages_fields`: Page-field relationships
   - `pages_sections`: Page-section relationships
   - `pages_fields_translation`: Multilingual content

3. **Asset Management**
   - `assets`: File and media assets
   - `libraries`: External libraries
   - `plugins`: System plugins

4. **Data Management**
   - `dataTables`: Custom data tables
   - `dataCols`: Table columns
   - `dataRows`: Table rows
   - `dataCells`: Cell values

### Action System Tables

1. **Form Actions**
   - `formActions`: Action definitions
   - `actions`: Available action types
   - `scheduledJobs`: Scheduled tasks
   - `mailQueue`: Email queue
   - `notifications`: System notifications

2. **Logging and Monitoring**
   - `apilogs`: API request logs
   - `callbackLogs`: Callback tracking
   - `log_performance`: Performance metrics
   - `user_activity`: User action tracking

3. **Integration Tables**
   - `qualtricsProjects`: Qualtrics integration
   - `qualtricsSurveys`: Survey definitions
   - `qualtricsSurveysResponses`: Survey responses
   - `labjs`: Lab.js experiment integration

### Configuration Tables

1. **System Settings**
   - `cmsPreferences`: Global settings
   - `languages`: Language support
   - `lookups`: System lookups
   - `hooks`: System hooks

2. **Type Definitions**
   - `pageType`: Page types
   - `fieldType`: Field types
   - `activiTytype`: Activity types
   - `lookups`: Most of the types are defined there

### Key Relationships

1. **Access Control**
   ```
   users -> acl_users -> pages
   groups -> acl_groups -> pages
   users -> groups (many-to-many)
   ```

2. **Content Structure**
   ```
   pages -> sections -> fields
   pages -> pages (self-referential for hierarchy)
   pages -> fields -> translations
   ```

3. **Data Management**
   ```
   dataTables -> datacCls -> dataCells
   dataTables -> dataRows -> dataCells
   ```

4. **Action System**
   ```
   formActions -> scheduledJobs
   formActions -> dataTables
   scheduledJobs -> notifications
   ```

### Schema Notes

1. **Security Features**
   - Role-based access control (RBAC)
   - Group-based permissions
   - Token-based authentication
   - Action logging and auditing

2. **Extensibility**
   - Plugin system support
   - Custom data table creation
   - Flexible field types
   - Multilingual content support

3. **Integration Support**
   - Qualtrics survey integration
   - Lab.js experiment support
   - Email system integration
   - External API logging

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