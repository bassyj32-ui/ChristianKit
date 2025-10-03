// DEPRECATED: AuthService is now integrated into SupabaseAuthProvider
// This file is kept for backward compatibility only
// Use SupabaseAuthProvider for all authentication operations

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  isAuthenticated: boolean
}

// Legacy export for any code still importing this
export const authService = {
  // All methods now throw deprecation warnings
  async initialize() {
    console.warn('⚠️ authService is deprecated. Use SupabaseAuthProvider instead.')
    return null
  },
  async signInWithGoogle() {
    console.warn('⚠️ authService is deprecated. Use SupabaseAuthProvider instead.')
    return null
  },
  async signOut() {
    console.warn('⚠️ authService is deprecated. Use SupabaseAuthProvider instead.')
  },
  getCurrentUser() {
    console.warn('⚠️ authService is deprecated. Use SupabaseAuthProvider instead.')
    return null
  },
  isAuthenticated() {
    console.warn('⚠️ authService is deprecated. Use SupabaseAuthProvider instead.')
    return false
  }
}
