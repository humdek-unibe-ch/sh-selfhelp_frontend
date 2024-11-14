'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import NotFound from '@/app/not-found'
import { useRoutes } from '@/hooks/useRoutes'

export function DynamicRouter() {
  const pathname = usePathname()
  const [showNotFound, setShowNotFound] = useState(false)
  const { data: availableRoutes, isLoading } = useRoutes()

  useEffect(() => {
    if (!isLoading && availableRoutes) {
      const isValidRoute = availableRoutes.some((route) => 
        pathname === route.path || pathname.startsWith(`${route.path}/`)
      )
      setShowNotFound(!isValidRoute)
    }
  }, [pathname, availableRoutes, isLoading])

  return showNotFound ? <NotFound /> : null
}