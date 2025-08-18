import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from './src/config/api.config';

/**
 * Middleware for authentication gate and token management
 * Runs at edge before any server components to handle auth validation
 */
export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Skip middleware for public assets and auth pages
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/auth/login') ||
        pathname.startsWith('/auth/two-factor-authentication') ||
        pathname === '/not-found' ||
        pathname === '/no-access'
    ) {
        return NextResponse.next();
    }

    // Check if route requires admin access
    const isAdminRoute = pathname.startsWith('/admin');
    
    // Get auth token from HttpOnly cookie (or Authorization header as fallback)
    const accessToken = request.cookies.get('access_token')?.value || 
                       request.headers.get('authorization')?.replace('Bearer ', '');

    // No token found - redirect to login for admin routes, allow public access for others
    if (!accessToken) {
        if (isAdminRoute) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        // Allow public access - just add headers for server components
        const response = NextResponse.next();
        response.headers.set('x-auth', '0');
        response.headers.set('x-public-access', '1');
        return response;
    }

    // Validate token by attempting to refresh it
    try {
        const refreshToken = request.cookies.get('refresh_token')?.value;
        
        // Check if token needs refresh (this is a lightweight check)
        // If refresh is needed, call the refresh endpoint
        if (refreshToken) {
            const refreshResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                
                // Update tokens in cookies if new ones provided
                const response = NextResponse.next();
                if (refreshData.data?.access_token) {
                    response.cookies.set('access_token', refreshData.data.access_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 60 * 60, // 1 hour
                        path: '/',
                    });
                }
                if (refreshData.data?.refresh_token) {
                    response.cookies.set('refresh_token', refreshData.data.refresh_token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 7 * 24 * 60 * 60, // 7 days
                        path: '/',
                    });
                }
                
                // Add auth flag for server components
                response.headers.set('x-auth', '1');
                response.headers.set('x-access-token', refreshData.data?.access_token || accessToken);
                
                // For admin routes, optionally fetch lightweight user validation
                if (isAdminRoute) {
                    response.headers.set('x-admin-check', '1');
                }
                
                return response;
            } else {
                // Token refresh failed - redirect to login
                const response = NextResponse.redirect(new URL('/auth/login', request.url));
                response.cookies.delete('access_token');
                response.cookies.delete('refresh_token');
                return response;
            }
        }
    } catch (error) {
        console.error('Middleware auth check failed:', error);
        
        // On error, redirect admin routes to login, allow public routes
        if (isAdminRoute) {
            const response = NextResponse.redirect(new URL('/auth/login', request.url));
            response.cookies.delete('access_token');
            response.cookies.delete('refresh_token');
            return response;
        }
    }

    // Valid token - continue with auth flag
    const response = NextResponse.next();
    response.headers.set('x-auth', '1');
    response.headers.set('x-access-token', accessToken);
    
    if (isAdminRoute) {
        response.headers.set('x-admin-check', '1');
    }
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
