import { useState, useEffect } from 'react'

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: any | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isAuthenticated: false,
    user: null
  })

  useEffect(() => {
    // Check for stored token
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      setAuthState({
        token: storedToken,
        isAuthenticated: true,
        user: null // TODO: Decode JWT or fetch user info
      })
    }
  }, [])

  const login = (token: string, user?: any) => {
    localStorage.setItem('auth_token', token)
    setAuthState({
      token,
      isAuthenticated: true,
      user
    })
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setAuthState({
      token: null,
      isAuthenticated: false,
      user: null
    })
  }

  return {
    ...authState,
    login,
    logout
  }
}