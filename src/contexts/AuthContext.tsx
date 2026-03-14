import { createContext, useContext, ReactNode } from 'react'

interface User {
  id: string
  email: string
}

interface AuthContextValue {
  user: User | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Mock user — replace with Supabase auth later
const MOCK_USER: User = {
  id: 'mock-user-001',
  email: 'user@example.com',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: MOCK_USER }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
