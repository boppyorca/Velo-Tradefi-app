/**
 * Supabase Client Configuration
 *
 * This module provides two clients:
 * 1. Browser client - for client-side operations (auth state, real-time subscriptions)
 * 2. Server client - for server-side operations (API routes, middleware)
 *
 * Auth Flow:
 * 1. Frontend uses Supabase Auth (signInWithPassword, signUp)
 * 2. Frontend sends JWT to backend
 * 3. Backend validates JWT using Supabase's anon key
 * 4. Backend uses service_role key for admin operations
 */

import { createClient } from '@supabase/supabase-js'
import type { User } from './types'

// ── Environment Variables ────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
}

// ── Browser Client (Client-side) ─────────────────────────────────────────
// Used in components, hooks, pages (browser context)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh token before it expires
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect logout from other tabs
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      // Add this header to identify requests from the browser client
      'X-Client-Info': 'VeloTradeFi-Browser',
    },
  },
})

// ── Type Helpers ────────────────────────────────────────────────────────
export type { User }

/**
 * Get the current Supabase session
 * Call this in client components to get the current auth state
 */
export async function getSupabaseSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Get the current Supabase user
 */
export async function getSupabaseUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Sign up with email and password
 */
export async function signUp(email: string, password: string, fullName: string) {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (result.error) throw result.error
  return result
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (result.error) throw result.error
  return result
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== 'undefined'
      ? `${window.location.origin}/auth/reset-password`
      : undefined,
  })

  if (error) throw error
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
  return data
}

/**
 * Get the JWT access token for API calls
 * Use this token to authenticate with your backend
 */
export async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ?? null
}
