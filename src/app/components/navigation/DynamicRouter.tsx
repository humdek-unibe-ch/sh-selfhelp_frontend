'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import NotFound from '@/app/not-found'
import { useNavigation } from '@/hooks/useNavigation'

export function DynamicRouter() {
  const pathname = usePathname()
  const [showNotFound, setShowNotFound] = useState(false)
  const { routes, isLoading } = useNavigation()

  useEffect(() => {
    if (!isLoading && routes) {
      const isValidRoute = routes.some((route) => 
        pathname === route.path || pathname.startsWith(`${route.path}/`)
      )
      setShowNotFound(!isValidRoute)
    }
  }, [pathname, routes, isLoading])

  return showNotFound ? <NotFound /> : null
}