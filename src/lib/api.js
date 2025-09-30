// API Service for Visual ERP Frontend
// Connects to the production ERP backend with enhanced error handling and authentication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

// Response format mapping for different endpoints based on developer feedback
const RESPONSE_MAPPERS = {
  '/api/inventory/products': (data) => data.products || data,
  '/api/customers': (data) => data.customers || data,
  '/api/quotes': (data) => data.quotes || data,
  '/api/health': (data) => data
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.apiKey = API_KEY
    this.isOnline = navigator.onLine
    this.retryAttempts = 3
    this.retryDelay = 1000

    // Monitor connection status
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Connection restored')
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Connection lost')
    })
  }

  get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
    }
  }

  async request(endpoint, options = {}) {
    if (!this.isOnline) {
      throw new Error('No internet connection available')
    }

    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: {
        ...this.headers,
        ...options.headers
      },
      ...options
    }

    let lastError
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`API Request (attempt ${attempt}):`, url)
        
        const response = await fetch(url, config)
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Use default error message if response isn't JSON
          }
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = 'Authentication required. Please check your API credentials.'
          } else if (response.status === 403) {
            errorMessage = 'Access denied. Insufficient permissions.'
          } else if (response.status === 404) {
            errorMessage = 'Resource not found.'
          } else if (response.status >= 500) {
            errorMessage = 'Server error. Please try again later.'
          }
          
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        console.log('API Response:', data)
        
        // Apply response mapping if available
        const mapper = RESPONSE_MAPPERS[endpoint]
        return mapper ? mapper(data) : data
        
      } catch (error) {
        lastError = error
        console.error(`API request failed (attempt ${attempt}):`, error)
        
        // Don't retry on authentication errors or client errors (4xx)
        if (error.message.includes('401') || error.message.includes('403') || 
            error.message.includes('400') || error.message.includes('404')) {
          throw error
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }
    
    throw lastError
  }

  // Inventory API methods
  async getProducts() {
    try {
      return await this.request('/api/inventory/products')
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // Return mock data as fallback for development
      if (this.baseURL.includes('localhost') && !this.apiKey) {
        console.warn('Using mock data for products (development mode)')
        return this.getMockProducts()
      }
      throw error
    }
  }

  async getProduct(id) {
    return this.request(`/api/inventory/products/${id}`)
  }

  async getBatches() {
    return this.request('/api/inventory/batches')
  }

  async getLots() {
    return this.request('/api/inventory/lots')
  }

  // Customer API methods
  async getCustomers() {
    try {
      return await this.request('/api/customers')
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      // Return mock data as fallback for development
      if (this.baseURL.includes('localhost') && !this.apiKey) {
        console.warn('Using mock data for customers (development mode)')
        return this.getMockCustomers()
      }
      throw error
    }
  }

  async getCustomer(id) {
    return this.request(`/api/customers/${id}`)
  }

  // Sales API methods
  async getQuotes() {
    try {
      return await this.request('/api/quotes')
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
      // Return mock data as fallback for development
      if (this.baseURL.includes('localhost') && !this.apiKey) {
        console.warn('Using mock data for quotes (development mode)')
        return this.getMockQuotes()
      }
      throw error
    }
  }

  async getQuote(id) {
    return this.request(`/api/quotes/${id}`)
  }

  async createQuote(data) {
    return this.request('/api/quotes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Finance API methods
  async getAccountsReceivable() {
    return this.request('/api/finance/ar')
  }

  async getAccountsPayable() {
    return this.request('/api/finance/ap')
  }

  // Analytics API methods
  async getDashboardData() {
    return this.request('/api/analytics/dashboard')
  }

  async getReports() {
    return this.request('/api/analytics/reports')
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/api/health')
    } catch (error) {
      console.error('Health check failed:', error)
      throw error
    }
  }

  // Authentication helper
  async authenticate(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })
  }

  // Connection test
  async testConnection() {
    try {
      const health = await this.healthCheck()
      return { success: true, data: health }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Mock data for development fallback (when no API key is provided)
  getMockProducts() {
    return [
      {
        id: '1',
        name: 'Premium Hemp Flower - Strain A',
        sku: 'HF-001',
        status: 'Active',
        stockOnHand: 275,
        batches: 2,
        category: 'Hemp Products',
        imageUrl: null
      },
      {
        id: '2',
        name: 'CBD Oil Tincture - 1000mg',
        sku: 'CBD-1000',
        status: 'Active',
        stockOnHand: 150,
        batches: 3,
        category: 'CBD Products',
        imageUrl: null
      },
      {
        id: '3',
        name: 'Hemp Gummies - Mixed Berry',
        sku: 'HG-MB',
        status: 'Inactive',
        stockOnHand: 0,
        batches: 0,
        category: 'Edibles',
        imageUrl: null
      }
    ]
  }

  getMockCustomers() {
    return [
      {
        id: '1',
        companyName: 'Green Valley Dispensary',
        contactName: 'Sarah Johnson',
        email: 'sarah@greenvalley.com',
        phone: '+1 (555) 123-4567',
        website: 'greenvalley.com',
        totalOrders: 45000,
        orderCount: 12
      },
      {
        id: '2',
        companyName: 'Natural Wellness Co.',
        contactName: 'Mike Chen',
        email: 'mike@naturalwellness.com',
        phone: '+1 (555) 987-6543',
        website: 'naturalwellness.com',
        totalOrders: 28000,
        orderCount: 8
      }
    ]
  }

  getMockQuotes() {
    return [
      {
        id: '1',
        title: 'Q2024-001 - Green Valley Order',
        customer: 'Green Valley Dispensary',
        status: 'Pending',
        total: 12500,
        amount: 12500,
        items: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Q2024-002 - Natural Wellness Bulk',
        customer: 'Natural Wellness Co.',
        status: 'Approved',
        total: 8750,
        amount: 8750,
        items: 3,
        createdAt: new Date().toISOString()
      }
    ]
  }
}

// Create singleton instance
const apiService = new ApiService()

export default apiService

// Named exports for specific API calls
export const {
  getProducts,
  getProduct,
  getBatches,
  getLots,
  getCustomers,
  getCustomer,
  getQuotes,
  getQuote,
  createQuote,
  getAccountsReceivable,
  getAccountsPayable,
  getDashboardData,
  getReports,
  healthCheck,
  authenticate,
  testConnection
} = apiService
