/**
 * @fileoverview Root application component that initializes global styles and imports.
 */

"use client";
import "@/utils/i18n";

/**
 * Root application component.
 * All providers have been moved to src/store/providers.tsx for better organization.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 */
const MyApp = ({ children }: { children: React.ReactNode }) => {
  return children;
};

export default MyApp;
