// Enhanced API Service with full CRUD functionality
class EnhancedAPIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    this.apiKey = import.meta.env.VITE_API_KEY || ''
    this.retryAttempts = 3
    this.retryDelay = 1000
    this.requestQueue = []
    this.isOnline = navigator.onLine
    
    // Monitor connection status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.processQueue()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Enhanced request method with retry logic, queuing, and error handling
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...options.headers
      },
      ...options
    }

    // If offline, queue the request
    if (!this.isOnline && options.method !== 'GET') {
      return this.queueRequest(url, config)
    }

    let lastError
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || response.statusText}`)
        }
        
        const data = await response.json()
        return data
      } catch (error) {
        lastError = error
        
        // Don't retry on authentication errors
        if (error.message.includes('401') || error.message.includes('403')) {
          throw error
        }
        
        // Wait before retrying
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt))
        }
      }
    }
    
    throw lastError
  }

  // Queue requests when offline
  queueRequest(url, config) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, config, resolve, reject })
    })
  }

  // Process queued requests when back online
  async processQueue() {
    while (this.requestQueue.length > 0) {
      const { url, config, resolve, reject } = this.requestQueue.shift()
      try {
        const response = await fetch(url, config)
        const data = await response.json()
        resolve(data)
      } catch (error) {
        reject(error)
      }
    }
  }

  // Authentication
  async authenticate(credentials) {
    try {
      const response = await this.makeRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })
      
      if (response.token) {
        this.apiKey = response.token
      }
      
      return response
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`)
    }
  }

  async refreshToken() {
    try {
      const response = await this.makeRequest('/api/auth/refresh', {
        method: 'POST'
      })
      
      if (response.token) {
        this.apiKey = response.token
        localStorage.setItem('visual_erp_token', response.token)
      }
      
      return response
    } catch (error) {
      // Clear stored credentials on refresh failure
      localStorage.removeItem('visual_erp_token')
      localStorage.removeItem('visual_erp_user')
      this.apiKey = ''
      throw error
    }
  }

  async testConnection() {
    try {
      if (!this.baseURL || this.baseURL === 'http://localhost:3000') {
        return { success: true, mockData: true, message: 'Using mock data' }
      }
      
      const response = await this.makeRequest('/api/health')
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // INVENTORY CRUD OPERATIONS
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/api/inventory/products${queryParams ? `?${queryParams}` : ''}`
      
      const response = await this.makeRequest(endpoint)
      return response.success ? response : { success: true, products: response }
    } catch (error) {
      console.error('Error fetching products:', error)
      return this.getMockProducts()
    }
  }

  async getProduct(id) {
    try {
      const response = await this.makeRequest(`/api/inventory/products/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching product:', error)
      const mockProducts = this.getMockProducts()
      const product = mockProducts.products.find(p => p.id === id)
      return product ? { success: true, product } : { success: false, error: 'Product not found' }
    }
  }

  async createProduct(productData) {
    try {
      const response = await this.makeRequest('/api/inventory/products', {
        method: 'POST',
        body: JSON.stringify(productData)
      })
      return response
    } catch (error) {
      console.error('Error creating product:', error)
      throw new Error(`Failed to create product: ${error.message}`)
    }
  }

  async updateProduct(id, productData) {
    try {
      const response = await this.makeRequest(`/api/inventory/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
      })
      return response
    } catch (error) {
      console.error('Error updating product:', error)
      throw new Error(`Failed to update product: ${error.message}`)
    }
  }

  async deleteProduct(id) {
    try {
      const response = await this.makeRequest(`/api/inventory/products/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error deleting product:', error)
      throw new Error(`Failed to delete product: ${error.message}`)
    }
  }

  // CUSTOMER CRUD OPERATIONS
  async getCustomers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/api/customers${queryParams ? `?${queryParams}` : ''}`
      
      const response = await this.makeRequest(endpoint)
      return response.success ? response : { success: true, customers: response }
    } catch (error) {
      console.error('Error fetching customers:', error)
      return this.getMockCustomers()
    }
  }

  async getCustomer(id) {
    try {
      const response = await this.makeRequest(`/api/customers/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching customer:', error)
      const mockCustomers = this.getMockCustomers()
      const customer = mockCustomers.customers.find(c => c.id === id)
      return customer ? { success: true, customer } : { success: false, error: 'Customer not found' }
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await this.makeRequest('/api/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      })
      return response
    } catch (error) {
      console.error('Error creating customer:', error)
      throw new Error(`Failed to create customer: ${error.message}`)
    }
  }

  async updateCustomer(id, customerData) {
    try {
      const response = await this.makeRequest(`/api/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      })
      return response
    } catch (error) {
      console.error('Error updating customer:', error)
      throw new Error(`Failed to update customer: ${error.message}`)
    }
  }

  async deleteCustomer(id) {
    try {
      const response = await this.makeRequest(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error deleting customer:', error)
      throw new Error(`Failed to delete customer: ${error.message}`)
    }
  }

  // QUOTE CRUD OPERATIONS
  async getQuotes(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString()
      const endpoint = `/api/quotes${queryParams ? `?${queryParams}` : ''}`
      
      const response = await this.makeRequest(endpoint)
      return response.success ? response : { success: true, quotes: response }
    } catch (error) {
      console.error('Error fetching quotes:', error)
      return this.getMockQuotes()
    }
  }

  async getQuote(id) {
    try {
      const response = await this.makeRequest(`/api/quotes/${id}`)
      return response
    } catch (error) {
      console.error('Error fetching quote:', error)
      const mockQuotes = this.getMockQuotes()
      const quote = mockQuotes.quotes.find(q => q.id === id)
      return quote ? { success: true, quote } : { success: false, error: 'Quote not found' }
    }
  }

  async createQuote(quoteData) {
    try {
      const response = await this.makeRequest('/api/quotes', {
        method: 'POST',
        body: JSON.stringify(quoteData)
      })
      return response
    } catch (error) {
      console.error('Error creating quote:', error)
      throw new Error(`Failed to create quote: ${error.message}`)
    }
  }

  async updateQuote(id, quoteData) {
    try {
      const response = await this.makeRequest(`/api/quotes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(quoteData)
      })
      return response
    } catch (error) {
      console.error('Error updating quote:', error)
      throw new Error(`Failed to update quote: ${error.message}`)
    }
  }

  async deleteQuote(id) {
    try {
      const response = await this.makeRequest(`/api/quotes/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (error) {
      console.error('Error deleting quote:', error)
      throw new Error(`Failed to delete quote: ${error.message}`)
    }
  }

  async convertQuoteToOrder(id) {
    try {
      const response = await this.makeRequest(`/api/quotes/${id}/convert`, {
        method: 'POST'
      })
      return response
    } catch (error) {
      console.error('Error converting quote to order:', error)
      throw new Error(`Failed to convert quote: ${error.message}`)
    }
  }

  // MOCK DATA METHODS (fallback when API is unavailable)
  getMockProducts() {
    return {
      success: true,
      products: [
        {
          id: 1,
          name: 'Premium Hemp Flower - Strain A',
          sku: 'HF-001',
          status: 'Active',
          stockOnHand: 275,
          batches: 2,
          category: 'Hemp Flower',
          price: 45.00,
          cost: 25.00,
          description: 'High-quality hemp flower with excellent terpene profile',
          imageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'CBD Oil Tincture - 1000mg',
          sku: 'CBD-1000',
          status: 'Active',
          stockOnHand: 150,
          batches: 3,
          category: 'CBD Products',
          price: 89.99,
          cost: 35.00,
          description: 'Full-spectrum CBD oil tincture',
          imageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Hemp Gummies - Mixed Berry',
          sku: 'HG-MB-25',
          status: 'Active',
          stockOnHand: 89,
          batches: 1,
          category: 'Edibles',
          price: 34.99,
          cost: 12.00,
          description: 'Delicious hemp-infused gummies',
          imageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  }

  getMockCustomers() {
    return {
      success: true,
      customers: [
        {
          id: 1,
          companyName: 'Green Valley Dispensary',
          contactName: 'Sarah Johnson',
          email: 'sarah@greenvalley.com',
          phone: '+1 (555) 123-4567',
          website: 'https://greenvalley.com',
          address: '123 Main St, Denver, CO 80202',
          totalOrders: 125000,
          orderCount: 45,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 2,
          companyName: 'Mountain Peak Wellness',
          contactName: 'Mike Chen',
          email: 'mike@mountainpeak.com',
          phone: '+1 (555) 987-6543',
          website: 'https://mountainpeak.com',
          address: '456 Oak Ave, Boulder, CO 80301',
          totalOrders: 89000,
          orderCount: 32,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 3,
          companyName: 'Sunrise Health Co.',
          contactName: 'Lisa Rodriguez',
          email: 'lisa@sunrisehealth.com',
          phone: '+1 (555) 456-7890',
          website: 'https://sunrisehealth.com',
          address: '789 Pine St, Fort Collins, CO 80521',
          totalOrders: 67500,
          orderCount: 28,
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    }
  }

  getMockQuotes() {
    return {
      success: true,
      quotes: [
        {
          id: 1,
          title: 'Q2024-001 - Green Valley Order',
          customer: 'Green Valley Dispensary',
          customerId: 1,
          status: 'Pending',
          total: 15750,
          items: 8,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lineItems: [
            { productId: 1, productName: 'Premium Hemp Flower - Strain A', quantity: 50, unitPrice: 45.00, total: 2250 },
            { productId: 2, productName: 'CBD Oil Tincture - 1000mg', quantity: 25, unitPrice: 89.99, total: 2249.75 }
          ]
        },
        {
          id: 2,
          title: 'Q2024-002 - Mountain Peak Bulk',
          customer: 'Mountain Peak Wellness',
          customerId: 2,
          status: 'Approved',
          total: 8900,
          items: 5,
          validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lineItems: [
            { productId: 3, productName: 'Hemp Gummies - Mixed Berry', quantity: 100, unitPrice: 34.99, total: 3499 }
          ]
        },
        {
          id: 3,
          title: 'Q2024-003 - Sunrise Sample Order',
          customer: 'Sunrise Health Co.',
          customerId: 3,
          status: 'Draft',
          total: 2250,
          items: 3,
          validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lineItems: [
            { productId: 1, productName: 'Premium Hemp Flower - Strain A', quantity: 10, unitPrice: 45.00, total: 450 }
          ]
        }
      ]
    }
  }

  // Utility methods
  formatCurrency(value) {
    if (!value && value !== 0) return '—'
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  formatNumber(value, format = 'number') {
    if (!value && value !== 0) return '—'
    
    switch (format) {
      case 'compact':
        return new Intl.NumberFormat('en-US', { 
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(value)
      default:
        return value.toLocaleString()
    }
  }

  truncateName(name, maxLength = 35) {
    if (!name) return 'Unnamed Item'
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }
}

// Create and export singleton instance
const enhancedApiService = new EnhancedAPIService()
export default enhancedApiService
