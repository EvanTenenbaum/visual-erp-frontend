import React, { createContext, useContext, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import apiService from '../lib/api.js'

// Authentication Context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  isLoading: false,
  error: null
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Authentication Provider Component
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check if we have stored credentials
      const storedToken = localStorage.getItem('visual_erp_token')
      const storedUser = localStorage.getItem('visual_erp_user')

      if (storedToken && storedUser) {
        // Verify token is still valid by making a test request
        const connectionTest = await apiService.testConnection()
        
        if (connectionTest.success) {
          setIsAuthenticated(true)
          setUser(JSON.parse(storedUser))
          // Update API service with token
          apiService.apiKey = storedToken
        } else {
          // Token is invalid, clear stored data
          localStorage.removeItem('visual_erp_token')
          localStorage.removeItem('visual_erp_user')
          setError('Session expired. Please log in again.')
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setError('Authentication check failed')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await apiService.authenticate(credentials)
      
      if (response.token && response.user) {
        // Store authentication data
        localStorage.setItem('visual_erp_token', response.token)
        localStorage.setItem('visual_erp_user', JSON.stringify(response.user))
        
        // Update API service
        apiService.apiKey = response.token
        
        // Update state
        setIsAuthenticated(true)
        setUser(response.user)
        
        return { success: true }
      } else {
        throw new Error('Invalid response from authentication server')
      }
    } catch (error) {
      console.error('Login failed:', error)
      setError(error.message || 'Login failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear stored data
    localStorage.removeItem('visual_erp_token')
    localStorage.removeItem('visual_erp_user')
    
    // Clear API service token
    apiService.apiKey = ''
    
    // Update state
    setIsAuthenticated(false)
    setUser(null)
    setError(null)
  }

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Login Form Component
export function LoginForm({ onSuccess }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await login(credentials)
    
    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.error)
    }
    
    setIsSubmitting(false)
  }

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error when user starts typing
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Visual ERP Login
            </CardTitle>
            <p className="text-slate-600 mt-2">
              Sign in to access your ERP data
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your username"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700"
                  >
                    <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || !credentials.username || !credentials.password}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-3 text-base font-medium"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Development Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Development Mode</p>
                  <p>If authentication is not configured on your backend, the app will use mock data for demonstration purposes.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

// Authentication Guard Component
export function AuthGuard({ children, fallback }) {
  const { isAuthenticated, isLoading, error } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Checking authentication...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || <LoginForm />
  }

  return children
}

// Connection Status Component
export function ConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    try {
      const result = await apiService.testConnection()
      setStatus(result.success ? 'connected' : 'error')
      setLastCheck(new Date())
    } catch (error) {
      setStatus('error')
      setLastCheck(new Date())
    }
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'Connected'
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'Connection Error'
        }
      default:
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'Checking...'
        }
    }
  }

  const config = getStatusConfig()
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${config.bg} ${config.color} border ${config.border}`}
    >
      <IconComponent className={`h-4 w-4 mr-2 ${status === 'checking' ? 'animate-spin' : ''}`} />
      {config.text}
      {lastCheck && (
        <span className="ml-2 text-xs opacity-75">
          {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </motion.div>
  )
}

export default AuthProvider
