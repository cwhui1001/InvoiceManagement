import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Define route access rules
  const protectedRoutes = ['/dashboard']
  const publicRoutes = ['/login', '/']
  const excludedRoutes = ['/dashboard/unauthorized'] // Add this line

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // Allow excluded routes (like unauthorized page)
  if (excludedRoutes.includes(pathname)) {
    return supabaseResponse
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Redirect to login if not authenticated
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated, allow access to basic dashboard pages
  // UI-level role checking will handle showing/hiding admin management links
  if (user && isProtectedRoute) {
    return supabaseResponse
  }

  return supabaseResponse
}

