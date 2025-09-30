import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth, LoginForm, AuthGuard } from '../components/AuthProvider.jsx'
import apiService from '../lib/api.js'

// Mock the API service
vi.mock('../lib/api.js', () => ({
  default: {
    testConnection: vi.fn(),
    authenticate: vi.fn(),
    apiKey: ''
  }
}))

// Test component that uses the auth context
const TestComponent = () => {
  const { isAuthenticated, user, login, logout, isLoading, error } = useAuth()
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="user-info">
        {user ? user.username : 'no-user'}
      </div>
      <div data-testid="loading-status">
        {isLoading ? 'loading' : 'not-loading'}
      </div>
      <div data-testid="error-message">
        {error || 'no-error'}
      </div>
      <button onClick={() => login({ username: 'test', password: 'test' })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should provide initial authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(screen.getByTestId('error-message')).toHaveTextContent('no-error')
  })

  it('should handle successful login', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'admin' }
    const mockToken = 'mock-jwt-token'

    apiService.authenticate.mockResolvedValueOnce({
      token: mockToken,
      user: mockUser
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser')
    })

    expect(localStorage.getItem('visual_erp_token')).toBe(mockToken)
    expect(localStorage.getItem('visual_erp_user')).toBe(JSON.stringify(mockUser))
    expect(apiService.apiKey).toBe(mockToken)
  })

  it('should handle login failure', async () => {
    apiService.authenticate.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    fireEvent.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials')
    })
  })

  it('should handle logout', async () => {
    // Setup authenticated state
    const mockUser = { id: 1, username: 'testuser', role: 'admin' }
    const mockToken = 'mock-jwt-token'
    localStorage.setItem('visual_erp_token', mockToken)
    localStorage.setItem('visual_erp_user', JSON.stringify(mockUser))

    apiService.testConnection.mockResolvedValueOnce({ success: true })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
    })

    // Logout
    fireEvent.click(screen.getByText('Logout'))

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated')
    expect(screen.getByTestId('user-info')).toHaveTextContent('no-user')
    expect(localStorage.getItem('visual_erp_token')).toBeNull()
    expect(localStorage.getItem('visual_erp_user')).toBeNull()
    expect(apiService.apiKey).toBe('')
  })

  it('should restore authentication from localStorage', async () => {
    const mockUser = { id: 1, username: 'testuser', role: 'admin' }
    const mockToken = 'mock-jwt-token'
    localStorage.setItem('visual_erp_token', mockToken)
    localStorage.setItem('visual_erp_user', JSON.stringify(mockUser))

    apiService.testConnection.mockResolvedValueOnce({ success: true })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated')
      expect(screen.getByTestId('user-info')).toHaveTextContent('testuser')
    })

    expect(apiService.apiKey).toBe(mockToken)
  })
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    )

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    const mockOnSuccess = vi.fn()
    apiService.authenticate.mockResolvedValueOnce({
      token: 'mock-token',
      user: { username: 'testuser' }
    })

    render(
      <AuthProvider>
        <LoginForm onSuccess={mockOnSuccess} />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('should show error on failed login', async () => {
    apiService.authenticate.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    )

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    })
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should toggle password visibility', () => {
    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    )

    const passwordInput = screen.getByLabelText(/password/i)
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

describe('AuthGuard', () => {
  it('should render children when authenticated', async () => {
    const mockUser = { id: 1, username: 'testuser' }
    localStorage.setItem('visual_erp_token', 'mock-token')
    localStorage.setItem('visual_erp_user', JSON.stringify(mockUser))
    apiService.testConnection.mockResolvedValueOnce({ success: true })

    render(
      <AuthProvider>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  it('should render login form when not authenticated', () => {
    render(
      <AuthProvider>
        <AuthGuard>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByText(/visual erp login/i)).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Login</div>

    render(
      <AuthProvider>
        <AuthGuard fallback={<CustomFallback />}>
          <div data-testid="protected-content">Protected Content</div>
        </AuthGuard>
      </AuthProvider>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })
})
