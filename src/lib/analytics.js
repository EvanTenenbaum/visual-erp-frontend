// Analytics and Error Logging Service
class AnalyticsService {
  constructor() {
    this.isProduction = import.meta.env.PROD
    this.userId = null
    this.sessionId = this.generateSessionId()
    this.errorQueue = []
    this.eventQueue = []
    this.isOnline = navigator.onLine
    
    // Initialize error tracking
    this.initializeErrorTracking()
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring()
    
    // Handle online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushQueues()
    })
    
    window.addEventListener('offline', () => {
      this.isOnline = false
    })
    
    // Flush queues before page unload
    window.addEventListener('beforeunload', () => {
      this.flushQueues(true)
    })
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setUser(user) {
    this.userId = user?.id || user?.username || 'anonymous'
    this.trackEvent('user_identified', { userId: this.userId })
  }

  // Error Tracking
  initializeErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'unhandled_promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      })
    })

    // React error boundary integration
    window.addEventListener('react-error', (event) => {
      this.logError({
        type: 'react_error',
        message: event.detail.message,
        componentStack: event.detail.componentStack,
        stack: event.detail.stack,
        timestamp: new Date().toISOString()
      })
    })
  }

  logError(errorData) {
    const enrichedError = {
      ...errorData,
      sessionId: this.sessionId,
      userId: this.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: errorData.timestamp || new Date().toISOString(),
      severity: this.determineSeverity(errorData)
    }

    // Log to console in development
    if (!this.isProduction) {
      console.error('Analytics Error:', enrichedError)
    }

    // Add to queue
    this.errorQueue.push(enrichedError)

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue()
    }
  }

  determineSeverity(errorData) {
    if (errorData.type === 'javascript_error' && errorData.message?.includes('ChunkLoadError')) {
      return 'low'
    }
    if (errorData.type === 'api_error' && errorData.status >= 500) {
      return 'high'
    }
    if (errorData.type === 'react_error') {
      return 'medium'
    }
    return 'medium'
  }

  // Performance Monitoring
  initializePerformanceMonitoring() {
    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0]
        if (perfData) {
          this.trackEvent('page_load_performance', {
            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          })
        }
      }, 0)
    })

    // Core Web Vitals
    this.trackWebVitals()
  }

  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
    return firstPaint ? firstPaint.startTime : null
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    return fcp ? fcp.startTime : null
  }

  trackWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.trackEvent('web_vital_lcp', { value: lastEntry.startTime })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            this.trackEvent('web_vital_fid', { value: entry.processingStart - entry.startTime })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift (CLS)
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

        // Report CLS on page unload
        window.addEventListener('beforeunload', () => {
          this.trackEvent('web_vital_cls', { value: clsValue })
        })
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }
  }

  // Event Tracking
  trackEvent(eventName, properties = {}) {
    const event = {
      name: eventName,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        userId: this.userId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }

    // Log to console in development
    if (!this.isProduction) {
      console.log('Analytics Event:', event)
    }

    // Add to queue
    this.eventQueue.push(event)

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushEventQueue()
    }
  }

  // User Interaction Tracking
  trackPageView(path) {
    this.trackEvent('page_view', {
      path: path || window.location.pathname,
      referrer: document.referrer,
      title: document.title
    })
  }

  trackClick(element, properties = {}) {
    this.trackEvent('click', {
      element: element.tagName,
      text: element.textContent?.substring(0, 100),
      id: element.id,
      className: element.className,
      ...properties
    })
  }

  trackFormSubmit(formName, success = true, errorMessage = null) {
    this.trackEvent('form_submit', {
      formName,
      success,
      errorMessage
    })
  }

  trackAPICall(endpoint, method, duration, success, statusCode, errorMessage = null) {
    this.trackEvent('api_call', {
      endpoint,
      method,
      duration,
      success,
      statusCode,
      errorMessage
    })

    // Also log API errors
    if (!success) {
      this.logError({
        type: 'api_error',
        message: errorMessage || `API call failed: ${method} ${endpoint}`,
        endpoint,
        method,
        status: statusCode,
        timestamp: new Date().toISOString()
      })
    }
  }

  trackFeatureUsage(featureName, properties = {}) {
    this.trackEvent('feature_usage', {
      feature: featureName,
      ...properties
    })
  }

  // Business Metrics
  trackBusinessEvent(eventType, properties = {}) {
    this.trackEvent('business_event', {
      eventType,
      ...properties
    })
  }

  // Queue Management
  async flushQueues(synchronous = false) {
    if (synchronous) {
      // Use sendBeacon for synchronous sending during page unload
      this.sendBeacon()
    } else {
      await Promise.all([
        this.flushErrorQueue(),
        this.flushEventQueue()
      ])
    }
  }

  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    const errors = [...this.errorQueue]
    this.errorQueue = []

    try {
      await this.sendData('/api/analytics/errors', { errors })
    } catch (error) {
      // Re-queue errors if sending failed
      this.errorQueue.unshift(...errors)
      console.warn('Failed to send error data:', error)
    }
  }

  async flushEventQueue() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      await this.sendData('/api/analytics/events', { events })
    } catch (error) {
      // Re-queue events if sending failed
      this.eventQueue.unshift(...events)
      console.warn('Failed to send event data:', error)
    }
  }

  sendBeacon() {
    if (!navigator.sendBeacon) return

    const data = {
      errors: this.errorQueue,
      events: this.eventQueue,
      sessionEnd: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics/beacon', blob)
  }

  async sendData(endpoint, data) {
    // In development or when no API is configured, store locally
    if (!this.isProduction || !import.meta.env.VITE_API_URL) {
      this.storeLocally(endpoint, data)
      return
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`)
    }
  }

  storeLocally(endpoint, data) {
    try {
      const key = `analytics_${endpoint.replace(/\//g, '_')}`
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const updated = [...existing, ...data.errors || [], ...data.events || []]
      
      // Keep only last 100 items to prevent localStorage bloat
      const trimmed = updated.slice(-100)
      localStorage.setItem(key, JSON.stringify(trimmed))
    } catch (error) {
      console.warn('Failed to store analytics data locally:', error)
    }
  }

  // Utility methods for React components
  withErrorTracking(componentName) {
    return (WrappedComponent) => {
      return class extends React.Component {
        componentDidCatch(error, errorInfo) {
          analyticsService.logError({
            type: 'react_error',
            message: error.message,
            componentName,
            componentStack: errorInfo.componentStack,
            stack: error.stack,
            timestamp: new Date().toISOString()
          })
        }

        render() {
          return React.createElement(WrappedComponent, this.props)
        }
      }
    }
  }

  // React hook for tracking component lifecycle
  useComponentTracking(componentName) {
    React.useEffect(() => {
      this.trackEvent('component_mount', { componentName })
      
      return () => {
        this.trackEvent('component_unmount', { componentName })
      }
    }, [componentName])
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService()

// Export both the service and utility functions
export default analyticsService

export const trackEvent = (name, properties) => analyticsService.trackEvent(name, properties)
export const trackPageView = (path) => analyticsService.trackPageView(path)
export const trackClick = (element, properties) => analyticsService.trackClick(element, properties)
export const trackFormSubmit = (formName, success, errorMessage) => analyticsService.trackFormSubmit(formName, success, errorMessage)
export const trackAPICall = (endpoint, method, duration, success, statusCode, errorMessage) => analyticsService.trackAPICall(endpoint, method, duration, success, statusCode, errorMessage)
export const trackFeatureUsage = (featureName, properties) => analyticsService.trackFeatureUsage(featureName, properties)
export const trackBusinessEvent = (eventType, properties) => analyticsService.trackBusinessEvent(eventType, properties)
export const logError = (errorData) => analyticsService.logError(errorData)
export const setUser = (user) => analyticsService.setUser(user)
