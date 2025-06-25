/**
 * CSS Safelist for Tailwind CSS
 * This file ensures that commonly used CSS classes from dynamic content are not purged
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
    'border-gray-100', 'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-gray-500',
    'border-blue-100', 'border-blue-200', 'border-blue-300', 'border-blue-400', 'border-blue-500',
    
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
  ],

  // Shadow Classes
  shadows: [
    'shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    'shadow-inner',
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
    'hover:bg-white', 'hover:bg-gray-50', 'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:bg-gray-300',
    'hover:bg-blue-50', 'hover:bg-blue-100', 'hover:bg-blue-200', 'hover:bg-blue-300', 'hover:bg-blue-400', 'hover:bg-blue-500', 'hover:bg-blue-600',
    'hover:text-white', 'hover:text-gray-600', 'hover:text-gray-700', 'hover:text-gray-800', 'hover:text-gray-900',
    'hover:text-blue-600', 'hover:text-blue-700', 'hover:text-blue-800',
    'hover:shadow-sm', 'hover:shadow', 'hover:shadow-md', 'hover:shadow-lg', 'hover:shadow-xl',
    'focus:outline-none', 'focus:ring-1', 'focus:ring-2', 'focus:ring-4', 'focus:ring-blue-500',
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