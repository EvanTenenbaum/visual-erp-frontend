import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown,
  Keyboard,
  Mouse,
  Eye,
  Volume2,
  Settings,
  X,
  Info,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'

// Accessibility Layer Component
export function AccessibilityLayer({ 
  onNavigate, 
  currentIndex, 
  totalItems, 
  isLoading = false,
  hasError = false,
  className = '' 
}) {
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('online')
  
  // Screen reader announcements
  const announce = (message, priority = 'polite') => {
    const announcement = {
      id: Date.now(),
      message,
      priority,
      timestamp: new Date()
    }
    setAnnouncements(prev => [...prev.slice(-4), announcement])
    
    // Remove announcement after 5 seconds
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== announcement.id))
    }, 5000)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent default for navigation keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter'].includes(event.code)) {
        event.preventDefault()
      }

      switch (event.code) {
        case 'ArrowLeft':
        case 'ArrowUp':
          if (currentIndex > 0) {
            onNavigate('prev')
            announce(`Navigated to item ${currentIndex} of ${totalItems}`)
          } else {
            announce('Already at first item')
          }
          break
        case 'ArrowRight':
        case 'ArrowDown':
        case 'Space':
          if (currentIndex < totalItems - 1) {
            onNavigate('next')
            announce(`Navigated to item ${currentIndex + 2} of ${totalItems}`)
          } else {
            announce('Already at last item')
          }
          break
        case 'Home':
          onNavigate('first')
          announce('Navigated to first item')
          break
        case 'End':
          onNavigate('last')
          announce('Navigated to last item')
          break
        case 'KeyH':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            setShowKeyboardHelp(!showKeyboardHelp)
          }
          break
        case 'Escape':
          setShowKeyboardHelp(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, totalItems, onNavigate, showKeyboardHelp])

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online')
      announce('Connection restored')
    }
    
    const handleOffline = () => {
      setConnectionStatus('offline')
      announce('Connection lost. Some features may not work.', 'assertive')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Announce loading states
  useEffect(() => {
    if (isLoading) {
      announce('Loading content, please wait')
    }
  }, [isLoading])

  // Announce errors
  useEffect(() => {
    if (hasError) {
      announce('Error loading content. Please try again.', 'assertive')
    }
  }, [hasError])

  return (
    <div className={`accessibility-layer ${className}`}>
      {/* Screen Reader Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcements.map(announcement => (
          <div key={announcement.id} aria-live={announcement.priority}>
            {announcement.message}
          </div>
        ))}
      </div>

      {/* Skip Links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <Button
          onClick={() => document.querySelector('[data-main-content]')?.focus()}
          className="bg-blue-600 text-white"
        >
          Skip to main content
        </Button>
      </div>

      {/* Keyboard Navigation Controls */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('prev')}
              disabled={currentIndex === 0 || isLoading}
              aria-label="Previous item"
              className="focus:ring-2 focus:ring-blue-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="px-2 py-1 bg-slate-100 rounded text-sm font-medium min-w-[60px] text-center">
              {isLoading ? '...' : `${currentIndex + 1}/${totalItems}`}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('next')}
              disabled={currentIndex === totalItems - 1 || isLoading}
              aria-label="Next item"
              className="focus:ring-2 focus:ring-blue-500"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
            connectionStatus === 'online' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {connectionStatus === 'online' ? (
            <Wifi className="h-4 w-4 mr-2" />
          ) : (
            <WifiOff className="h-4 w-4 mr-2" />
          )}
          {connectionStatus === 'online' ? 'Connected' : 'Offline'}
        </motion.div>

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"
            />
            Loading...
          </motion.div>
        )}

        {/* Error Indicator */}
        {hasError && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Error
          </motion.div>
        )}
      </div>

      {/* Keyboard Help Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowKeyboardHelp(true)}
          className="bg-white/90 backdrop-blur-sm border-slate-200 focus:ring-2 focus:ring-blue-500"
          aria-label="Show keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Keyboard Help Modal */}
      <AnimatePresence>
        {showKeyboardHelp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowKeyboardHelp(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 bg-white rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                    <Keyboard className="h-5 w-5 mr-2" />
                    Keyboard Shortcuts
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowKeyboardHelp(false)}
                    aria-label="Close help"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Navigate previous</span>
                      <div className="flex space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">←</kbd>
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">↑</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Navigate next</span>
                      <div className="flex space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">→</kbd>
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">↓</kbd>
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Space</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">First item</span>
                      <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Home</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Last item</span>
                      <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">End</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Show this help</span>
                      <div className="flex space-x-1">
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Ctrl</kbd>
                        <span className="text-slate-400">+</span>
                        <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">H</kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Close dialogs</span>
                      <kbd className="px-2 py-1 bg-slate-100 rounded text-xs font-mono">Esc</kbd>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Accessibility Features</p>
                      <p>This interface supports screen readers, keyboard navigation, and high contrast modes. Use Tab to navigate between interactive elements.</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Loading Skeleton Component
export function LoadingSkeleton({ type = 'card', className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      {type === 'card' && (
        <div className="bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl h-96 p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="h-6 bg-white/50 rounded-lg mb-3 w-3/4"></div>
              <div className="h-4 bg-white/30 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-white/30 rounded-full"></div>
          </div>
          
          <div className="bg-white/20 rounded-xl h-32 mb-6"></div>
          
          <div className="mb-6">
            <div className="h-8 bg-white/50 rounded-lg mb-2 w-1/3"></div>
            <div className="h-4 bg-white/30 rounded w-1/2"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="h-5 bg-white/40 rounded mb-1 w-2/3"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
            <div>
              <div className="h-5 bg-white/40 rounded mb-1 w-2/3"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      )}
      
      {type === 'list' && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Error Boundary Component
export function ErrorBoundary({ error, onRetry, className = '' }) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md mx-auto px-6"
      >
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-slate-900 mb-3">
          Something went wrong
        </h2>
        
        <p className="text-slate-600 mb-6">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full">
            Try Again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Refresh Page
          </Button>
        </div>
        
        <details className="mt-6 text-left">
          <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg overflow-auto">
            {error?.stack || 'No additional details available'}
          </pre>
        </details>
      </motion.div>
    </div>
  )
}

// Empty State Component
export function EmptyState({ 
  icon: Icon = AlertCircle, 
  title = "No items found", 
  description = "There are no items to display at the moment.",
  action,
  className = '' 
}) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto px-6"
      >
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-slate-400" />
        </div>
        
        <h2 className="text-xl font-semibold text-slate-900 mb-3">
          {title}
        </h2>
        
        <p className="text-slate-600 mb-6">
          {description}
        </p>
        
        {action && (
          <div>
            {action}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default AccessibilityLayer
