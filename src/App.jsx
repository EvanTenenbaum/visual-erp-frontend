import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { MoreVertical, Package, Users, DollarSign, TrendingUp, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Settings, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from './lib/api.js'
import { AuthProvider, useAuth, AuthGuard, ConnectionStatus } from './components/AuthProvider.jsx'
import { ActionMenu } from './components/ActionMenu.jsx'
import { SalesSheet } from './components/SalesSheet.jsx'
import { AccessibilityLayer, LoadingSkeleton, ErrorBoundary, EmptyState } from './components/AccessibilityLayer.jsx'
import './App.css'

// Design tokens for consistent styling
const designTokens = {
  typography: {
    title: 'text-xl font-bold tracking-tight leading-tight',
    kpi: 'text-3xl font-bold leading-none',
    secondary: 'text-sm font-semibold',
    body: 'text-base font-medium',
    caption: 'text-xs font-medium uppercase tracking-wide'
  },
  colors: {
    primary: 'text-slate-900',
    secondary: 'text-slate-700',
    muted: 'text-slate-500',
    accent: 'text-blue-600',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    error: 'text-red-600',
    onDark: 'text-white',
    onDarkMuted: 'text-slate-300'
  },
  spacing: {
    card: 'p-6',
    section: 'space-y-6',
    compact: 'space-y-3'
  },
  shadows: {
    card: 'shadow-xl shadow-slate-900/10',
    elevated: 'shadow-2xl shadow-slate-900/20'
  },
  gradients: {
    inventory: 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800',
    customers: 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800',
    quotes: 'bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800',
    default: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800'
  }
}

// Enhanced Visual Card Component with improved typography and hierarchy
function VisualCard({ item, type, onAction, isActive = false }) {
  const [showActions, setShowActions] = useState(false)
  
  const formatKPI = (value, format = 'number') => {
    if (!value && value !== 0) return '—'
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value)
      case 'compact':
        return new Intl.NumberFormat('en-US', { 
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(value)
      default:
        return value.toLocaleString()
    }
  }

  const truncateName = (name, maxLength = 35) => {
    if (!name) return 'Unnamed Item'
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name
  }

  const getGradient = () => {
    return designTokens.gradients[type] || designTokens.gradients.default
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Active': { variant: 'default', className: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' },
      'Inactive': { variant: 'secondary', className: 'bg-slate-500/20 text-slate-200 border-slate-400/30' },
      'Pending': { variant: 'default', className: 'bg-amber-500/20 text-amber-100 border-amber-400/30' },
      'Overdue': { variant: 'destructive', className: 'bg-red-500/20 text-red-100 border-red-400/30' }
    }
    
    const config = statusConfig[status] || statusConfig['Active']
    return (
      <Badge className={`${config.className} border font-semibold`}>
        {status}
      </Badge>
    )
  }

  const getCardContent = () => {
    switch (type) {
      case 'inventory':
        return (
          <div className="h-full flex flex-col">
            {/* Header with improved typography */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 min-w-0">
                <h3 className={`${designTokens.typography.title} ${designTokens.colors.onDark} mb-3`}>
                  {truncateName(item.name)}
                </h3>
                {item.status && getStatusBadge(item.status)}
              </div>
              <ActionMenu 
                item={item} 
                type={type} 
                onAction={onAction}
              />
            </div>
            
            {/* Product image placeholder with subtle animation */}
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl h-32 mb-6 flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Package className="h-10 w-10 text-white/70" />
            </motion.div>
            
            {/* Primary KPI with enhanced typography */}
            <div className="mb-6">
              <div className={`${designTokens.typography.kpi} ${designTokens.colors.onDark} mb-2`}>
                {formatKPI(item.stockOnHand, 'compact')}
              </div>
              <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                UNITS IN STOCK
              </div>
            </div>
            
            {/* Secondary KPIs with improved layout */}
            <div className="grid grid-cols-2 gap-6 mt-auto">
              <div>
                <div className={`${designTokens.typography.body} ${designTokens.colors.onDark} mb-1`}>
                  {item.batches || 0}
                </div>
                <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                  BATCHES
                </div>
              </div>
              <div>
                <div className={`${designTokens.typography.body} ${designTokens.colors.onDark} mb-1 font-mono truncate`}>
                  {item.sku || 'N/A'}
                </div>
                <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                  SKU
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'customers':
        return (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 min-w-0">
                <h3 className={`${designTokens.typography.title} ${designTokens.colors.onDark} mb-3`}>
                  {truncateName(item.companyName)}
                </h3>
              </div>
              <ActionMenu 
                item={item} 
                type={type} 
                onAction={onAction}
              />
            </div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl h-32 mb-6 flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <Users className="h-10 w-10 text-white/70" />
            </motion.div>
            
            <div className="mb-6">
              <div className={`${designTokens.typography.kpi} ${designTokens.colors.onDark} mb-2 text-2xl`}>
                {item.contactName || 'No Contact'}
              </div>
              <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                PRIMARY CONTACT
              </div>
            </div>
            
            <div className="mt-auto">
              <div className={`${designTokens.typography.body} ${designTokens.colors.onDark} mb-1 truncate`}>
                {item.email || 'No email'}
              </div>
              <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                EMAIL ADDRESS
              </div>
            </div>
          </div>
        )
      
      case 'quotes':
        return (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1 min-w-0">
                <h3 className={`${designTokens.typography.title} ${designTokens.colors.onDark} mb-3`}>
                  {truncateName(item.title || `Quote #${item.id}`)}
                </h3>
                {item.status && getStatusBadge(item.status)}
              </div>
              <ActionMenu 
                item={item} 
                type={type} 
                onAction={onAction}
              />
            </div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-sm rounded-xl h-32 mb-6 flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <DollarSign className="h-10 w-10 text-white/70" />
            </motion.div>
            
            <div className="mb-6">
              <div className={`${designTokens.typography.kpi} ${designTokens.colors.onDark} mb-2`}>
                {formatKPI(item.total || item.amount, 'currency')}
              </div>
              <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                QUOTE VALUE
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-auto">
              <div>
                <div className={`${designTokens.typography.body} ${designTokens.colors.onDark} mb-1`}>
                  {item.items || 0}
                </div>
                <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                  ITEMS
                </div>
              </div>
              <div>
                <div className={`${designTokens.typography.body} ${designTokens.colors.onDark} mb-1`}>
                  {item.customer || 'N/A'}
                </div>
                <div className={`${designTokens.typography.caption} ${designTokens.colors.onDarkMuted}`}>
                  CUSTOMER
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h3 className={`${designTokens.typography.title} ${designTokens.colors.onDark}`}>
                {truncateName(item.name || item.title || 'Unknown Item')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => onAction(item)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl h-32 mb-6 flex items-center justify-center border border-white/20">
              <Package className="h-10 w-10 text-white/70" />
            </div>
            
            <div className="text-sm text-white/80 font-mono bg-black/20 p-3 rounded-lg overflow-auto flex-1">
              {JSON.stringify(item, null, 2)}
            </div>
          </div>
        )
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300 } }}
      className={`${getGradient()} rounded-2xl ${designTokens.shadows.card} ${designTokens.spacing.card} h-96 transition-all duration-300 ${
        isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-100' : ''
      }`}
    >
      {getCardContent()}
    </motion.div>
  )
}

// Enhanced Visual Feed with swipe affordances
function VisualFeed() {
  const { module = 'inventory' } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchData()
  }, [module])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data
      switch (module) {
        case 'inventory':
          data = await apiService.getProducts()
          break
        case 'customers':
          data = await apiService.getCustomers()
          break
        case 'quotes':
          data = await apiService.getQuotes()
          break
        default:
          data = await apiService.getProducts()
      }
      
      // Handle different response formats
      if (data.success) {
        setItems(data.products || data.customers || data.quotes || data.data || [])
      } else {
        setItems(data || [])
      }
      setCurrentIndex(0)
    } catch (err) {
      console.error(`Error fetching ${module}:`, err)
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (item) => {
    console.log('Action for item:', item)
    // TODO: Implement enhanced action menu
  }

  const nextItem = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }

  const prevItem = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }

  const getModuleTitle = () => {
    const titles = {
      inventory: 'Inventory',
      customers: 'Customers',
      quotes: 'Quotes'
    }
    return titles[module] || 'Items'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <LoadingSkeleton type="card" />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorBoundary 
        error={{ message: error }} 
        onRetry={fetchData}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={`No ${getModuleTitle()}`}
        description={`There are no ${getModuleTitle().toLowerCase()} to display at the moment.`}
        className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
        action={
          <Button onClick={fetchData} variant="outline">
            Refresh Data
          </Button>
        }
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Enhanced header with better typography */}
      <motion.header 
        className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className={`${designTokens.typography.title} ${designTokens.colors.primary}`}>
              {getModuleTitle()}
            </h1>
            <Badge variant="outline" className="font-semibold">
              {currentIndex + 1} of {items.length}
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Enhanced card display with navigation affordances */}
      <div className="max-w-md mx-auto px-6 py-8">
        <div className="relative">
          {/* Swipe affordances */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevItem}
              className="p-3 bg-white/90 hover:bg-white shadow-lg rounded-full border border-slate-200/60 backdrop-blur-sm"
              disabled={items.length <= 1}
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </motion.button>
          </div>
          
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextItem}
              className="p-3 bg-white/90 hover:bg-white shadow-lg rounded-full border border-slate-200/60 backdrop-blur-sm"
              disabled={items.length <= 1}
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </motion.button>
          </div>

          {/* Card with enhanced animations */}
          <AnimatePresence mode="wait">
            <VisualCard
              key={`${module}-${currentIndex}`}
              item={items[currentIndex]}
              type={module}
              onAction={handleAction}
              isActive={true}
            />
          </AnimatePresence>
        </div>

        {/* Enhanced navigation dots */}
        {items.length > 1 && (
          <motion.div 
            className="flex justify-center space-x-2 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {items.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex 
                    ? 'bg-blue-600 w-6' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// Header Component with User Info and Controls
function AppHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-slate-900">Visual ERP</h1>
          <ConnectionStatus />
        </div>
        
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-600">
                Welcome, {user.name || user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-600 hover:text-slate-900"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// Enhanced Visual Feed with Accessibility Layer
function EnhancedVisualFeed() {
  const { module = 'inventory' } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchData()
  }, [module])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data
      switch (module) {
        case 'inventory':
          data = await apiService.getProducts()
          break
        case 'customers':
          data = await apiService.getCustomers()
          break
        case 'quotes':
          data = await apiService.getQuotes()
          break
        default:
          data = await apiService.getProducts()
      }
      
      setItems(Array.isArray(data) ? data : [])
      setCurrentIndex(0)
    } catch (err) {
      console.error(`Error fetching ${module}:`, err)
      setError(err.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (actionData) => {
    console.log('Action triggered:', actionData)
    // TODO: Implement action handlers (create quote, edit item, etc.)
  }

  const handleNavigate = (direction) => {
    switch (direction) {
      case 'prev':
        setCurrentIndex(prev => Math.max(0, prev - 1))
        break
      case 'next':
        setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))
        break
      case 'first':
        setCurrentIndex(0)
        break
      case 'last':
        setCurrentIndex(items.length - 1)
        break
      default:
        break
    }
  }

  return (
    <div className="relative">
      <AppHeader />
      
      <div data-main-content tabIndex="-1">
        <VisualFeed />
      </div>
      
      {/* Accessibility Layer */}
      {items.length > 0 && (
        <AccessibilityLayer
          onNavigate={handleNavigate}
          currentIndex={currentIndex}
          totalItems={items.length}
          isLoading={loading}
          hasError={!!error}
        />
      )}
    </div>
  )
}

// Sales Sheet Route
function SalesSheetRoute() {
  const { module, id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchItem()
  }, [module, id])

  const fetchItem = async () => {
    try {
      setLoading(true)
      setError(null)

      let data
      switch (module) {
        case 'inventory':
          data = await apiService.getProduct(id)
          break
        case 'customers':
          data = await apiService.getCustomer(id)
          break
        case 'quotes':
          data = await apiService.getQuote(id)
          break
        default:
          throw new Error('Invalid module')
      }

      setItem(data)
    } catch (err) {
      console.error(`Error fetching ${module} item:`, err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSkeleton type="card" className="min-h-screen" />
  }

  if (error || !item) {
    return (
      <ErrorBoundary 
        error={{ message: error || 'Item not found' }} 
        onRetry={fetchItem}
        className="min-h-screen"
      />
    )
  }

  return (
    <SalesSheet
      item={item}
      type={module}
      companyInfo={{
        name: import.meta.env.VITE_COMPANY_NAME || 'Your Company',
        website: import.meta.env.VITE_COMPANY_WEBSITE || ''
      }}
      isPublic={true}
    />
  )
}

// Main App component with Authentication
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AuthGuard>
            <Routes>
              <Route path="/" element={<Navigate to="/visual/inventory" replace />} />
              <Route path="/visual" element={<Navigate to="/visual/inventory" replace />} />
              <Route path="/visual/:module" element={<EnhancedVisualFeed />} />
              <Route path="/share/:module/:id" element={<SalesSheetRoute />} />
            </Routes>
          </AuthGuard>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
