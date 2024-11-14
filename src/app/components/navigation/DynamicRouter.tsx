'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import NotFound from '@/app/not-found'
import { useSelector } from '@/store/hooks'
import { AppState } from '@/store/store'
import { NavigationService } from '@/services/api.service'

export function DynamicRouter() {
   const pathname = usePathname()
   const [showNotFound, setShowNotFound] = useState(false)
   const { availableRoutes, isLoading } = useSelector((state: AppState) => state.routes)

   useEffect(() => {
      NavigationService.initializeRoutes()
   }, [])

   useEffect(() => {
      if (!isLoading && availableRoutes) {
         const isValidRoute = availableRoutes.some(route => 
            pathname === route || pathname.startsWith(`${route}/`)
         )
         setShowNotFound(!isValidRoute)
      }
   }, [pathname, availableRoutes, isLoading])

   return showNotFound ? <NotFound /> : null
}