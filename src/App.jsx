import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { MoreVertical, Package, Users, DollarSign, TrendingUp } from 'lucide-react'
import apiService from './lib/api.js'
import './App.css'

// Visual Card Component
function VisualCard({ item, type, onAction }) {
  const getCardContent = () => {
    switch (type) {
      case 'inventory':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                <Badge variant={item.status === 'Active' ? 'default' : 'secondary'} className="mb-3">
                  {item.status}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => onAction(item)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300">STOCK ON HAND</p>
                <p className="text-2xl font-bold text-white">{item.stockOnHand || 0}</p>
              </div>
              <div>
                <p className="text-gray-300">BATCHES</p>
                <p className="text-2xl font-bold text-white">{item.batches || 0}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-gray-300 text-sm">SKU</p>
              <p className="text-white font-mono">{item.sku}</p>
            </div>
          </div>
        )
      
      case 'customers':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{item.companyName}</h3>
                <Badge variant="outline" className="mb-3 text-white border-white/20">
                  Customer
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => onAction(item)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-300">Contact</p>
                <p className="text-white">{item.contactName}</p>
              </div>
              <div>
                <p className="text-gray-300">Email</p>
                <p className="text-white">{item.email}</p>
              </div>
            </div>
          </div>
        )
      
      default:
        return <div className="text-white">Unknown item type</div>
    }
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 min-h-[300px] w-full max-w-sm mx-auto">
      <CardContent className="p-6">
        {getCardContent()}
      </CardContent>
    </Card>
  )
}

// Visual Feed Component
function VisualFeed({ module = 'inventory' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    // TODO: Implement action menu
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {module}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700">
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No {module} found</h2>
          <p className="text-gray-600">Connect to your ERP backend to see data here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual ERP</h1>
          <p className="text-gray-600">Mobile-first interface for your ERP system</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <VisualCard
              key={item.id || index}
              item={item}
              type={module}
              onAction={handleAction}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/visual/inventory" replace />} />
          <Route path="/visual" element={<Navigate to="/visual/inventory" replace />} />
          <Route path="/visual/:module" element={<VisualFeedWrapper />} />
        </Routes>
      </div>
    </Router>
  )
}

// Wrapper component to handle route params
function VisualFeedWrapper() {
  const { module } = useParams()
  return <VisualFeed module={module} />
}

export default App
