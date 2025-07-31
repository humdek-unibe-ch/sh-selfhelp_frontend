/**
 * CSS Safelist for Tailwind CSS
 * This file ensures that commonly used CSS classes from dynamic content are not purged.
 * 
 * USAGE:
 * 1. Static classes are defined here and imported in tailwind.config.ts
 * 2. Dynamic patterns are defined in tailwind.config.ts using regex patterns
 * 3. User customization classes should be added to the appropriate category below
 * 
 * HOW TO ADD NEW CLASSES:
 * 1. Add static classes to the appropriate category (layout, typography, etc.)
 * 2. For dynamic classes, add patterns to tailwind.config.ts safelist
 * 3. Use the utility functions below to check and validate classes
 */

export const CSS_SAFELIST = {
  // Layout & Container Classes
  layout: [
    'container',
    'mx-auto',
    'px-4', 'px-6', 'px-8',
    'py-4', 'py-6', 'py-8',
    'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 
    'max-w-2xl', 'max-w-3xl', 'max-w-4xl', 'max-w-5xl', 'max-w-6xl', 'max-w-7xl',
    'max-w-none', 'max-w-full',
  ],

  // Grid Classes
  grid: [
    'grid',
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6', 'grid-cols-12',
    'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4',
    'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-6',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 'lg:grid-cols-6',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
  ],

  // Flexbox Classes
  flex: [
    'flex', 'inline-flex',
    'flex-row', 'flex-col',
    'flex-wrap', 'flex-nowrap',
    'justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around',
    'items-start', 'items-center', 'items-end', 'items-stretch',
    'gap-1', 'gap-2', 'gap-3', 'gap-4', 'gap-6', 'gap-8',
  ],

  // Spacing Classes
  spacing: [
    // Margin
    'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8',
    'mx-0', 'mx-1', 'mx-2', 'mx-3', 'mx-4', 'mx-6', 'mx-8', 'mx-auto',
    'my-0', 'my-1', 'my-2', 'my-3', 'my-4', 'my-6', 'my-8',
    'mt-0', 'mt-1', 'mt-2', 'mt-3', 'mt-4', 'mt-6', 'mt-8',
    'mb-0', 'mb-1', 'mb-2', 'mb-3', 'mb-4', 'mb-6', 'mb-8',
    'ml-0', 'ml-1', 'ml-2', 'ml-3', 'ml-4', 'ml-6', 'ml-8',
    'mr-0', 'mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-6', 'mr-8',
    
    // Padding
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
    'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8',
    'py-0', 'py-1', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8',
    'pt-0', 'pt-1', 'pt-2', 'pt-3', 'pt-4', 'pt-6', 'pt-8',
    'pb-0', 'pb-1', 'pb-2', 'pb-3', 'pb-4', 'pb-6', 'pb-8',
    'pl-0', 'pl-1', 'pl-2', 'pl-3', 'pl-4', 'pl-6', 'pl-8',
    'pr-0', 'pr-1', 'pr-2', 'pr-3', 'pr-4', 'pr-6', 'pr-8',
  ],

  // Typography Classes
  typography: [
    // Font sizes
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl',
    'sm:text-xs', 'sm:text-sm', 'sm:text-base', 'sm:text-lg', 'sm:text-xl', 'sm:text-2xl',
    'md:text-xs', 'md:text-sm', 'md:text-base', 'md:text-lg', 'md:text-xl', 'md:text-2xl', 'md:text-3xl',
    'lg:text-xs', 'lg:text-sm', 'lg:text-base', 'lg:text-lg', 'lg:text-xl', 'lg:text-2xl', 'lg:text-3xl',
    
    // Font weights
    'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black',
    
    // Text alignment
    'text-left', 'text-center', 'text-right', 'text-justify',
    
    // Line height
    'leading-none', 'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
    
    // Text colors
    'text-white', 'text-black',
    'text-gray-50', 'text-gray-100', 'text-gray-200', 'text-gray-300', 'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-50', 'text-blue-100', 'text-blue-200', 'text-blue-300', 'text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800', 'text-blue-900',
    'text-red-50', 'text-red-100', 'text-red-200', 'text-red-300', 'text-red-400', 'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800', 'text-red-900',
    'text-green-50', 'text-green-100', 'text-green-200', 'text-green-300', 'text-green-400', 'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800', 'text-green-900',
    'text-purple-50', 'text-purple-100', 'text-purple-200', 'text-purple-300', 'text-purple-400', 'text-purple-500', 'text-purple-600', 'text-purple-700', 'text-purple-800', 'text-purple-900',
    'text-pink-50', 'text-pink-100', 'text-pink-200', 'text-pink-300', 'text-pink-400', 'text-pink-500', 'text-pink-600', 'text-pink-700', 'text-pink-800', 'text-pink-900',
    'text-orange-50', 'text-orange-100', 'text-orange-200', 'text-orange-300', 'text-orange-400', 'text-orange-500', 'text-orange-600', 'text-orange-700', 'text-orange-800', 'text-orange-900',
    'text-indigo-50', 'text-indigo-100', 'text-indigo-200', 'text-indigo-300', 'text-indigo-400', 'text-indigo-500', 'text-indigo-600', 'text-indigo-700', 'text-indigo-800', 'text-indigo-900',
    
    // Dark mode text colors
    'dark:text-white', 'dark:text-black',
    'dark:text-gray-50', 'dark:text-gray-100', 'dark:text-gray-200', 'dark:text-gray-300', 'dark:text-gray-400', 'dark:text-gray-500', 'dark:text-gray-600', 'dark:text-gray-700', 'dark:text-gray-800', 'dark:text-gray-900',
    'dark:text-blue-50', 'dark:text-blue-100', 'dark:text-blue-200', 'dark:text-blue-300', 'dark:text-blue-400', 'dark:text-blue-500', 'dark:text-blue-600', 'dark:text-blue-700', 'dark:text-blue-800', 'dark:text-blue-900',
    'dark:text-red-50', 'dark:text-red-100', 'dark:text-red-200', 'dark:text-red-300', 'dark:text-red-400', 'dark:text-red-500', 'dark:text-red-600', 'dark:text-red-700', 'dark:text-red-800', 'dark:text-red-900',
    'dark:text-green-50', 'dark:text-green-100', 'dark:text-green-200', 'dark:text-green-300', 'dark:text-green-400', 'dark:text-green-500', 'dark:text-green-600', 'dark:text-green-700', 'dark:text-green-800', 'dark:text-green-900',
    'dark:text-purple-50', 'dark:text-purple-100', 'dark:text-purple-200', 'dark:text-purple-300', 'dark:text-purple-400', 'dark:text-purple-500', 'dark:text-purple-600', 'dark:text-purple-700', 'dark:text-purple-800', 'dark:text-purple-900',
    'dark:text-pink-50', 'dark:text-pink-100', 'dark:text-pink-200', 'dark:text-pink-300', 'dark:text-pink-400', 'dark:text-pink-500', 'dark:text-pink-600', 'dark:text-pink-700', 'dark:text-pink-800', 'dark:text-pink-900',
    'dark:text-orange-50', 'dark:text-orange-100', 'dark:text-orange-200', 'dark:text-orange-300', 'dark:text-orange-400', 'dark:text-orange-500', 'dark:text-orange-600', 'dark:text-orange-700', 'dark:text-orange-800', 'dark:text-orange-900',
    'dark:text-indigo-50', 'dark:text-indigo-100', 'dark:text-indigo-200', 'dark:text-indigo-300', 'dark:text-indigo-400', 'dark:text-indigo-500', 'dark:text-indigo-600', 'dark:text-indigo-700', 'dark:text-indigo-800', 'dark:text-indigo-900',
  ],

  // Sizing Classes
  sizing: [
    // Width
    'w-auto', 'w-full', 'w-screen',
    'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-40', 'w-48', 'w-56', 'w-64',
    'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-2/4', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5',
    
    // Height
    'h-auto', 'h-full', 'h-screen',
    'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-40', 'h-48', 'h-56', 'h-64',
  ],

  // Border & Radius Classes
  borders: [
    'border', 'border-0', 'border-2', 'border-4', 'border-8',
    'border-t', 'border-r', 'border-b', 'border-l',
    'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500', 'border-gray-600', 'border-gray-700', 'border-gray-800',
    'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500', 'border-blue-600', 'border-blue-700', 'border-blue-800',
    'border-white', 'border-black',
    
    // Dark mode borders
    'dark:border-gray-100', 'dark:border-gray-200', 'dark:border-gray-300', 'dark:border-gray-400', 'dark:border-gray-500', 'dark:border-gray-600', 'dark:border-gray-700', 'dark:border-gray-800',
    'dark:border-blue-100', 'dark:border-blue-200', 'dark:border-blue-300', 'dark:border-blue-400', 'dark:border-blue-500', 'dark:border-blue-600', 'dark:border-blue-700', 'dark:border-blue-800',
    'dark:border-white', 'dark:border-black',
    
    // Border radius
    'rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-3xl', 'rounded-full',
    'rounded-t-none', 'rounded-t-sm', 'rounded-t', 'rounded-t-md', 'rounded-t-lg', 'rounded-t-xl', 'rounded-t-2xl', 'rounded-t-3xl',
    'rounded-r-none', 'rounded-r-sm', 'rounded-r', 'rounded-r-md', 'rounded-r-lg', 'rounded-r-xl', 'rounded-r-2xl', 'rounded-r-3xl',
    'rounded-b-none', 'rounded-b-sm', 'rounded-b', 'rounded-b-md', 'rounded-b-lg', 'rounded-b-xl', 'rounded-b-2xl', 'rounded-b-3xl',
    'rounded-l-none', 'rounded-l-sm', 'rounded-l', 'rounded-l-md', 'rounded-l-lg', 'rounded-l-xl', 'rounded-l-2xl', 'rounded-l-3xl',
  ],

  // Background Classes
  backgrounds: [
    'bg-transparent', 'bg-white', 'bg-black',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700', 'bg-blue-800', 'bg-blue-900',
    'bg-red-50', 'bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-red-800', 'bg-red-900',
    'bg-green-50', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600', 'bg-green-700', 'bg-green-800', 'bg-green-900',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-200', 'bg-yellow-300', 'bg-yellow-400', 'bg-yellow-500', 'bg-yellow-600', 'bg-yellow-700', 'bg-yellow-800', 'bg-yellow-900',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-200', 'bg-purple-300', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800', 'bg-purple-900',
    'bg-pink-50', 'bg-pink-100', 'bg-pink-200', 'bg-pink-300', 'bg-pink-400', 'bg-pink-500', 'bg-pink-600', 'bg-pink-700', 'bg-pink-800', 'bg-pink-900',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-200', 'bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700', 'bg-orange-800', 'bg-orange-900',
    'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-200', 'bg-indigo-300', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700', 'bg-indigo-800', 'bg-indigo-900',
    
    // Dark mode backgrounds
    'dark:bg-transparent', 'dark:bg-white', 'dark:bg-black',
    'dark:bg-gray-50', 'dark:bg-gray-100', 'dark:bg-gray-200', 'dark:bg-gray-300', 'dark:bg-gray-400', 'dark:bg-gray-500', 'dark:bg-gray-600', 'dark:bg-gray-700', 'dark:bg-gray-800', 'dark:bg-gray-900',
    'dark:bg-blue-50', 'dark:bg-blue-100', 'dark:bg-blue-200', 'dark:bg-blue-300', 'dark:bg-blue-400', 'dark:bg-blue-500', 'dark:bg-blue-600', 'dark:bg-blue-700', 'dark:bg-blue-800', 'dark:bg-blue-900',
    'dark:bg-red-50', 'dark:bg-red-100', 'dark:bg-red-200', 'dark:bg-red-300', 'dark:bg-red-400', 'dark:bg-red-500', 'dark:bg-red-600', 'dark:bg-red-700', 'dark:bg-red-800', 'dark:bg-red-900',
    'dark:bg-green-50', 'dark:bg-green-100', 'dark:bg-green-200', 'dark:bg-green-300', 'dark:bg-green-400', 'dark:bg-green-500', 'dark:bg-green-600', 'dark:bg-green-700', 'dark:bg-green-800', 'dark:bg-green-900',
    'dark:bg-purple-50', 'dark:bg-purple-100', 'dark:bg-purple-200', 'dark:bg-purple-300', 'dark:bg-purple-400', 'dark:bg-purple-500', 'dark:bg-purple-600', 'dark:bg-purple-700', 'dark:bg-purple-800', 'dark:bg-purple-900',
    'dark:bg-pink-50', 'dark:bg-pink-100', 'dark:bg-pink-200', 'dark:bg-pink-300', 'dark:bg-pink-400', 'dark:bg-pink-500', 'dark:bg-pink-600', 'dark:bg-pink-700', 'dark:bg-pink-800', 'dark:bg-pink-900',
    'dark:bg-orange-50', 'dark:bg-orange-100', 'dark:bg-orange-200', 'dark:bg-orange-300', 'dark:bg-orange-400', 'dark:bg-orange-500', 'dark:bg-orange-600', 'dark:bg-orange-700', 'dark:bg-orange-800', 'dark:bg-orange-900',
    'dark:bg-indigo-50', 'dark:bg-indigo-100', 'dark:bg-indigo-200', 'dark:bg-indigo-300', 'dark:bg-indigo-400', 'dark:bg-indigo-500', 'dark:bg-indigo-600', 'dark:bg-indigo-700', 'dark:bg-indigo-800', 'dark:bg-indigo-900',
  ],

  // Shadow Classes
  shadows: [
    'shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    'shadow-inner',
    
    // Dark mode shadows
    'dark:shadow-none', 'dark:shadow-sm', 'dark:shadow', 'dark:shadow-md', 'dark:shadow-lg', 'dark:shadow-xl', 'dark:shadow-2xl',
    'dark:shadow-inner',
  ],

  // Display & Position Classes
  display: [
    'block', 'inline-block', 'inline', 'hidden',
    'relative', 'absolute', 'fixed', 'sticky',
    'overflow-hidden', 'overflow-visible', 'overflow-auto', 'overflow-scroll',
    'overflow-x-hidden', 'overflow-x-visible', 'overflow-x-auto', 'overflow-x-scroll',
    'overflow-y-hidden', 'overflow-y-visible', 'overflow-y-auto', 'overflow-y-scroll',
  ],

  // Object Fit Classes
  objectFit: [
    'object-contain', 'object-cover', 'object-fill', 'object-none', 'object-scale-down',
    'object-bottom', 'object-center', 'object-left', 'object-left-bottom', 'object-left-top',
    'object-right', 'object-right-bottom', 'object-right-top', 'object-top',
  ],

  // Hover & Focus States
  states: [
    'hover:bg-white', 'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:bg-gray-300', 'hover:bg-gray-800',
    'hover:bg-blue-50', 'hover:bg-blue-100', 'hover:bg-blue-200', 'hover:bg-blue-300', 'hover:bg-blue-400', 'hover:bg-blue-500', 'hover:bg-blue-600',
    'hover:text-white', 'hover:text-gray-600', 'hover:text-gray-700', 'hover:text-gray-800', 'hover:text-gray-900',
    'hover:text-blue-600', 'hover:text-blue-700', 'hover:text-blue-800', 'hover:text-purple-800', 'hover:text-green-800', 'hover:text-orange-800', 'hover:text-pink-800',
    'hover:shadow-sm', 'hover:shadow', 'hover:shadow-md', 'hover:shadow-lg', 'hover:shadow-xl', 'hover:shadow-2xl',
    'focus:outline-none', 'focus:ring-1', 'focus:ring-2', 'focus:ring-4', 'focus:ring-blue-500',
    
    // Dark mode hover states
    'dark:hover:bg-white', 'dark:hover:bg-gray-50', 'dark:hover:bg-gray-100', 'dark:hover:bg-gray-200', 'dark:hover:bg-gray-700', 'dark:hover:bg-gray-800',
    'dark:hover:text-white', 'dark:hover:text-gray-100', 'dark:hover:text-gray-200', 'dark:hover:text-gray-300',
    'dark:hover:text-blue-400', 'dark:hover:text-blue-300', 'dark:hover:text-purple-400', 'dark:hover:text-green-400', 'dark:hover:text-orange-400', 'dark:hover:text-pink-400',
  ],

  // Transition Classes
  transitions: [
    'transition-none', 'transition-all', 'transition',
    'transition-colors', 'transition-opacity', 'transition-shadow', 'transition-transform',
    'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 'duration-500', 'duration-700', 'duration-1000',
    'ease-linear', 'ease-in', 'ease-out', 'ease-in-out',
  ],

  // Prose Classes (for markdown)
  prose: [
    'prose', 'prose-sm', 'prose-lg', 'prose-xl', 'prose-2xl',
    'prose-gray', 'prose-blue', 'prose-red', 'prose-green',
    'max-w-none', 'prose-headings:text-gray-900', 'prose-p:text-gray-700',
  ],

  // Responsive Breakpoints
  responsive: [
    'sm:block', 'sm:hidden', 'sm:flex', 'sm:grid',
    'md:block', 'md:hidden', 'md:flex', 'md:grid',
    'lg:block', 'lg:hidden', 'lg:flex', 'lg:grid',
    'xl:block', 'xl:hidden', 'xl:flex', 'xl:grid',
  ],

  // User Customization Classes (Add new categories here)
  userCustomization: [
    // Animation classes
    'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce',
    
    // Advanced transforms
    'transform', 'rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', 'rotate-45', 'rotate-90', 'rotate-180',
    '-rotate-1', '-rotate-2', '-rotate-3', '-rotate-6', '-rotate-12', '-rotate-45', '-rotate-90', '-rotate-180',
    'translate-x-0', 'translate-x-1', 'translate-x-2', 'translate-x-4', 'translate-x-8',
    'translate-y-0', 'translate-y-1', 'translate-y-2', 'translate-y-4', 'translate-y-8',
    'skew-x-0', 'skew-x-1', 'skew-x-2', 'skew-x-3', 'skew-x-6', 'skew-x-12',
    'skew-y-0', 'skew-y-1', 'skew-y-2', 'skew-y-3', 'skew-y-6', 'skew-y-12',
    
    // Backdrop filters
    'backdrop-blur-none', 'backdrop-blur-sm', 'backdrop-blur', 'backdrop-blur-md', 'backdrop-blur-lg', 'backdrop-blur-xl',
    'backdrop-brightness-0', 'backdrop-brightness-50', 'backdrop-brightness-75', 'backdrop-brightness-100', 'backdrop-brightness-125', 'backdrop-brightness-150', 'backdrop-brightness-200',
    
    // Advanced spacing
    'space-x-0', 'space-x-1', 'space-x-2', 'space-x-3', 'space-x-4', 'space-x-6', 'space-x-8',
    'space-y-0', 'space-y-1', 'space-y-2', 'space-y-3', 'space-y-4', 'space-y-6', 'space-y-8',
    
    // Divide utilities
    'divide-x-0', 'divide-x', 'divide-x-2', 'divide-x-4', 'divide-x-8',
    'divide-y-0', 'divide-y', 'divide-y-2', 'divide-y-4', 'divide-y-8',
    'divide-gray-100', 'divide-gray-200', 'divide-gray-300', 'divide-gray-400', 'divide-gray-500',
    
    // Ring utilities
    'ring-0', 'ring-1', 'ring-2', 'ring-4', 'ring-8',
    'ring-gray-100', 'ring-gray-200', 'ring-gray-300', 'ring-gray-400', 'ring-gray-500',
    'ring-blue-100', 'ring-blue-200', 'ring-blue-300', 'ring-blue-400', 'ring-blue-500',
    'ring-inset', 'ring-offset-0', 'ring-offset-1', 'ring-offset-2', 'ring-offset-4', 'ring-offset-8',
    
    // Aspect ratio
    'aspect-auto', 'aspect-square', 'aspect-video',
    
    // Scroll behavior
    'scroll-smooth', 'scroll-auto',
    'snap-none', 'snap-x', 'snap-y', 'snap-both', 'snap-mandatory', 'snap-proximity',
    'snap-start', 'snap-end', 'snap-center', 'snap-align-none',
  ],

  // CMS-specific classes for dynamic content
  cmsContent: [
    // Content alignment
    'content-center', 'content-start', 'content-end', 'content-between', 'content-around', 'content-evenly',
    
    // List styling
    'list-none', 'list-disc', 'list-decimal', 'list-inside', 'list-outside',
    
    // Table styling
    'table', 'table-auto', 'table-fixed', 'table-caption', 'table-cell', 'table-column', 'table-column-group',
    'table-footer-group', 'table-header-group', 'table-row', 'table-row-group',
    'border-collapse', 'border-separate',
    
    // Form styling
    'appearance-none', 'resize-none', 'resize-y', 'resize-x', 'resize',
    
    // Cursor styles
    'cursor-auto', 'cursor-default', 'cursor-pointer', 'cursor-wait', 'cursor-text', 'cursor-move', 'cursor-help', 'cursor-not-allowed',
    
    // User select
    'select-none', 'select-text', 'select-all', 'select-auto',
    
    // Pointer events
    'pointer-events-none', 'pointer-events-auto',
    
    // Common CMS patterns
    'hero-section', 'content-wrapper', 'card-grid', 'feature-list',
    'call-to-action', 'testimonial-card', 'pricing-table', 'gallery-grid',
    
    // Gradient backgrounds (common patterns)
    'bg-gradient-to-r', 'bg-gradient-to-l', 'bg-gradient-to-t', 'bg-gradient-to-b',
    'bg-gradient-to-tr', 'bg-gradient-to-tl', 'bg-gradient-to-br', 'bg-gradient-to-bl',
    'from-blue-400', 'from-blue-500', 'from-blue-600', 'to-purple-500', 'to-purple-600', 'to-purple-700',
    'from-green-400', 'from-green-500', 'to-blue-500', 'to-blue-600',
    'from-pink-400', 'from-pink-500', 'to-red-500', 'to-red-600',
    'from-yellow-400', 'from-yellow-500', 'to-orange-500', 'to-orange-600',
    
    // Image and media
    'object-cover', 'object-contain', 'object-center', 'object-top', 'object-bottom',
    'aspect-square', 'aspect-video', 'aspect-auto',
    
    // Interactive elements
    'group', 'group-hover:scale-105', 'group-hover:opacity-75', 'group-hover:shadow-lg',
    'peer', 'peer-focus:text-blue-600', 'peer-checked:bg-blue-600',
  ],
};

// Flatten all classes into a single array
export const ALL_CSS_CLASSES = Object.values(CSS_SAFELIST).flat();

// Function to get all classes as a string (useful for debugging)
export const getAllCssClasses = (): string => {
  return ALL_CSS_CLASSES.join(' ');
};

// Function to check if a class is in the safelist
export const isCssClassSafe = (className: string): boolean => {
  return ALL_CSS_CLASSES.includes(className);
};

// Function to add custom classes dynamically (for user customization)
export const addCustomClasses = (category: keyof typeof CSS_SAFELIST, classes: string[]): void => {
  CSS_SAFELIST[category].push(...classes);
};

// Function to get classes by category
export const getClassesByCategory = (category: keyof typeof CSS_SAFELIST): string[] => {
  return CSS_SAFELIST[category];
};

// Function to validate and sanitize user input classes
export const validateUserClasses = (classes: string[]): string[] => {
  const validClasses: string[] = [];
  const tailwindClassPattern = /^[a-z-]+[a-z0-9-]*$/i;
  
  classes.forEach(className => {
    // Basic validation: check if it looks like a valid Tailwind class
    if (tailwindClassPattern.test(className)) {
      validClasses.push(className);
    }
  });
  
  return validClasses;
};

// Function to generate CSS class combinations for user customization
export const generateClassCombinations = (
  baseClasses: string[],
  modifiers: string[] = ['hover:', 'focus:', 'dark:', 'sm:', 'md:', 'lg:', 'xl:']
): string[] => {
  const combinations: string[] = [...baseClasses];
  
  baseClasses.forEach(baseClass => {
    modifiers.forEach(modifier => {
      combinations.push(`${modifier}${baseClass}`);
    });
  });
  
  return combinations;
}; 