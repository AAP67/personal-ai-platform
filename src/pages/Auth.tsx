import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FirebaseError } from 'firebase/app'
import { useAuth } from '../contexts/AuthContext'

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':            return 'Invalid email address.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':       return 'Incorrect email or password.'
    case 'auth/wrong-password':           return 'Incorrect email or password.'
    case 'auth/email-already-in-use':     return 'An account with this email already exists.'
    case 'auth/weak-password':            return 'Password must be at least 6 characters.'
    case 'auth/too-many-requests':        return 'Too many attempts. Please try again later.'
    default:                              return 'Something went wrong. Please try again.'
  }
}

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(friendlyError(err.code))
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <nav className="px-8 py-5 border-b border-zinc-800">
        <Link to="/" className="text-lg font-semibold tracking-tight hover:text-indigo-400 transition-colors">
          Personal AI
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h1>
              <p className="text-zinc-500 text-sm mt-2">
                {mode === 'signin'
                  ? 'Sign in to access your AI platform.'
                  : 'Get started with your personal AI.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-zinc-800 border border-zinc-700 focus:border-indigo-500 focus:outline-none rounded-lg px-4 py-3 text-white text-sm placeholder:text-zinc-600 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-zinc-400" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-zinc-800 border border-zinc-700 focus:border-indigo-500 focus:outline-none rounded-lg px-4 py-3 text-white text-sm placeholder:text-zinc-600 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white font-semibold py-3 rounded-xl text-sm"
              >
                {submitting
                  ? 'Please wait…'
                  : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={switchMode}
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
