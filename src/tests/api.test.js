import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiService from '../lib/api.js'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('testConnection', () => {
    it('should return success when API is reachable', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok' })
      })

      const result = await apiService.testConnection()
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/health'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      )
    })

    it('should return failure when API is unreachable', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await apiService.testConnection()
      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should use mock data when API_URL is not set', async () => {
      const originalApiUrl = process.env.VITE_API_URL
      delete process.env.VITE_API_URL

      const result = await apiService.testConnection()
      expect(result.success).toBe(true)
      expect(result.mockData).toBe(true)

      process.env.VITE_API_URL = originalApiUrl
    })
  })

  describe('getProducts', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', sku: 'P001', stockOnHand: 100 },
        { id: 2, name: 'Product 2', sku: 'P002', stockOnHand: 50 }
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, products: mockProducts })
      })

      const result = await apiService.getProducts()
      expect(result.success).toBe(true)
      expect(result.products).toEqual(mockProducts)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/inventory/products'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      })

      const result = await apiService.getProducts()
      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTP error! status: 500')
    })

    it('should retry failed requests', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, products: [] })
        })

      const result = await apiService.getProducts()
      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('authenticate', () => {
    it('should authenticate successfully with valid credentials', async () => {
      const mockResponse = {
        token: 'mock-jwt-token',
        user: { id: 1, username: 'testuser', role: 'admin' }
      }

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiService.authenticate({
        username: 'testuser',
        password: 'password123'
      })

      expect(result.token).toBe('mock-jwt-token')
      expect(result.user.username).toBe('testuser')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            username: 'testuser',
            password: 'password123'
          })
        })
      )
    })

    it('should handle authentication failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' })
      })

      await expect(apiService.authenticate({
        username: 'testuser',
        password: 'wrongpassword'
      })).rejects.toThrow('HTTP error! status: 401')
    })
  })

  describe('formatters', () => {
    it('should format currency correctly', () => {
      expect(apiService.formatCurrency(1234.56)).toBe('$1,235')
      expect(apiService.formatCurrency(0)).toBe('$0')
      expect(apiService.formatCurrency(null)).toBe('—')
    })

    it('should format numbers correctly', () => {
      expect(apiService.formatNumber(1234)).toBe('1,234')
      expect(apiService.formatNumber(1234567)).toBe('1.2M')
      expect(apiService.formatNumber(null)).toBe('—')
    })

    it('should truncate names correctly', () => {
      expect(apiService.truncateName('Short name')).toBe('Short name')
      expect(apiService.truncateName('This is a very long product name that should be truncated'))
        .toBe('This is a very long product name t...')
      expect(apiService.truncateName('')).toBe('Unnamed Item')
    })
  })
})
