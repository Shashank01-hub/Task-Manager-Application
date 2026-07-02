import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const STORAGE_KEY = 'task_orbit_user'
const TOKEN_KEY = 'task_orbit_token'

function readInitialUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (_) {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readInitialUser)
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || ''
    } catch (_) {
      return ''
    }
  })

  function login(nextUser, nextToken) {
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    setToken(nextToken || '')
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  function logout() {
    setUser(null)
    setToken('')
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      token,
      isAdmin: user?.role === 'admin',
      isUser: user?.role === 'user'
    }),
    [token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}