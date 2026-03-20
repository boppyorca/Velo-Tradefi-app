/**
 * Supabase Auth Server Utilities
 *
 * Server-side utilities for authentication.
 * Use these in Server Components, Route Handlers, and Middleware.
 */

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server client with service role (bypasses RLS)
export const supabaseServerClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Get current user from server-side session cookie
 * Use this in Server Components and Route Handlers
 */
export async function getUser() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  const refreshToken = cookieStore.get('sb-refresh-token')?.value

  if (!accessToken) {
    return null
  }

  const { data: { user }, error } = await supabaseServerClient.auth.getUser(accessToken)

  if (error || !user) {
    // Token expired, try refresh
    if (refreshToken) {
      const { data: refreshData, error: refreshError } =
        await supabaseServerClient.auth.refreshSession({ refresh_token: refreshToken })

      if (!refreshError && refreshData?.user) {
        // Update cookies
        cookieStore.set('sb-access-token', refreshData.session?.access_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60, // 1 hour
        })
        cookieStore.set('sb-refresh-token', refreshData.session?.refresh_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
        return refreshData.user
      }
    }

    // Clear invalid cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')
    return null
  }

  return user
}

/**
 * Verify user session for Route Handlers
 * Returns user ID if authenticated, null otherwise
 */
export async function verifySession() {
  const user = await getUser()
  return user ? { userId: user.id, email: user.email } : null
}

/**
 * Set auth cookies after client-side login
 * Call this from client components after successful Supabase login
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  cookieStore.set('sb-access-token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
  })

  cookieStore.set('sb-refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

/**
 * Clear auth cookies
 * Call this on logout
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('sb-access-token')
  cookieStore.delete('sb-refresh-token')
}

/**
 * Get access token from cookies (for API calls)
 */
export async function getAccessToken() {
  const cookieStore = await cookies()
  return cookieStore.get('sb-access-token')?.value ?? null
}
