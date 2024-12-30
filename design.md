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