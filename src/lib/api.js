// API Service for Visual ERP Frontend
// Connects to production ERP backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.headers = {
      'Content-Type': 'application/json',
      ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const config = {
      headers: this.headers,
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Inventory API methods
  async getProducts() {
    return this.request('/api/inventory/products')
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
    return this.request('/api/customers')
  }

  async getCustomer(id) {
    return this.request(`/api/customers/${id}`)
  }

  // Sales API methods
  async getQuotes() {
    return this.request('/api/quotes')
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
    return this.request('/api/health')
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
  healthCheck
} = apiService
