import { supabase } from './supabaseClient'

export const authService = {
  // Sign up new user
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.fullName || '',
            role: metadata.role || 'user',
            ...metadata
          }
        }
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('✅ User signed up:', email)
      return data
      
    } catch (error) {
      console.error('Error in signUp:', error)
      throw error
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('✅ User signed in:', email)
      return data
      
    } catch (error) {
      console.error('Error in signIn:', error)
      throw error
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('✅ User signed out')
      
    } catch (error) {
      console.error('Error in signOut:', error)
      throw error
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return user
      
    } catch (error) {
      console.error('Error in getCurrentUser:', error)
      return null
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      callback(event, session)
    })
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('✅ Password reset email sent to:', email)
      
    } catch (error) {
      console.error('Error in resetPassword:', error)
      throw error
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })
      
      if (error) {
        throw new Error(error.message)
      }
      
      console.log('✅ Profile updated')
      return data
      
    } catch (error) {
      console.error('Error in updateProfile:', error)
      throw error
    }
  }
}