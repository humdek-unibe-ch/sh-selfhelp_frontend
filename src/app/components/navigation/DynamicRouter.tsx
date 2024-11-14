'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function DynamicRouter() {
  const router = useRouter()

  useEffect(() => {
    async function loadRoutes() {
      // In the future, this would be an API call
      // const routes = await fetch('/api/routes').then(res => res.json())
      
      // For now, hardcoded routes
      const routes = {
        availableRoutes: ['/', 'test', 'test2'],
        routeData: {
          test: {
            title: 'Test Page',
            // content: 'This is test page content'
          },
          test2: {
            title: 'Test Page 2',
            // content: 'This is test page 2 content'
          }
        }
      };
      
      // Store route data in localStorage for the dynamic page to use
      localStorage.setItem('routeData', JSON.stringify(routes.routeData));
      
      // Randomly select a route
      const randomRoute = routes.availableRoutes[Math.floor(Math.random() * routes.availableRoutes.length)];
      router.push(randomRoute);
    }
    loadRoutes()
  }, [])

  return null;
} 