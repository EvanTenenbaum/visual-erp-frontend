import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  Users, 
  DollarSign, 
  QrCode, 
  Download, 
  Share2, 
  Eye,
  EyeOff,
  Building2,
  Mail,
  Phone,
  Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'

// Enhanced Sales Sheet Component with better branding and layout
export function SalesSheet({ item, type, companyInfo, isPublic = false, onToggleRedaction }) {
  const [isRedacted, setIsRedacted] = useState(true)
  const sheetRef = useRef(null)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0)
  }

  const generateQRCode = () => {
    // In a real implementation, this would generate a QR code linking back to the app
    return `https://visual-erp.app/share/${type}/${item.id}`
  }

  const getSheetIcon = () => {
    switch (type) {
      case 'inventory':
        return Package
      case 'customers':
        return Users
      case 'quotes':
        return DollarSign
      default:
        return Package
    }
  }

  const getSheetTitle = () => {
    switch (type) {
      case 'inventory':
        return 'Product Information'
      case 'customers':
        return 'Customer Profile'
      case 'quotes':
        return 'Quote Summary'
      default:
        return 'Information Sheet'
    }
  }

  const getSheetColor = () => {
    switch (type) {
      case 'inventory':
        return 'from-blue-600 to-indigo-700'
      case 'customers':
        return 'from-emerald-600 to-teal-700'
      case 'quotes':
        return 'from-purple-600 to-indigo-700'
      default:
        return 'from-slate-600 to-slate-700'
    }
  }

  const renderInventorySheet = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Package className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {item.name || 'Product Name'}
        </h2>
        <p className="text-blue-100 text-lg">
          SKU: {isRedacted ? '***-***' : (item.sku || 'N/A')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {isRedacted ? '***' : formatNumber(item.stockOnHand)}
          </div>
          <div className="text-blue-100 text-sm uppercase tracking-wide">
            Units Available
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {isRedacted ? '*' : (item.batches || 0)}
          </div>
          <div className="text-blue-100 text-sm uppercase tracking-wide">
            Batches
          </div>
        </div>
      </div>

      {/* Status */}
      {item.status && (
        <div className="text-center">
          <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            {item.status}
          </Badge>
        </div>
      )}

      {/* Additional Details */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Product Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-blue-100">Category</span>
            <span className="text-white font-medium">
              {isRedacted ? 'Redacted' : (item.category || 'General')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-100">Last Updated</span>
            <span className="text-white font-medium">
              {isRedacted ? 'Redacted' : new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCustomerSheet = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {item.companyName || 'Company Name'}
        </h2>
        <p className="text-emerald-100 text-lg">
          {isRedacted ? 'Contact Redacted' : (item.contactName || 'Primary Contact')}
        </p>
      </div>

      {/* Contact Information */}
      <div className="bg-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Contact Information
        </h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <Mail className="h-4 w-4 text-emerald-200 mr-3" />
            <span className="text-white">
              {isRedacted ? 'email@redacted.com' : (item.email || 'No email provided')}
            </span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 text-emerald-200 mr-3" />
            <span className="text-white">
              {isRedacted ? '+1 (***) ***-****' : (item.phone || 'No phone provided')}
            </span>
          </div>
          <div className="flex items-center">
            <Globe className="h-4 w-4 text-emerald-200 mr-3" />
            <span className="text-white">
              {isRedacted ? 'website-redacted.com' : (item.website || 'No website provided')}
            </span>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {isRedacted ? '***' : formatCurrency(item.totalOrders || 0)}
          </div>
          <div className="text-emerald-100 text-sm uppercase tracking-wide">
            Total Orders
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {isRedacted ? '**' : (item.orderCount || 0)}
          </div>
          <div className="text-emerald-100 text-sm uppercase tracking-wide">
            Order Count
          </div>
        </div>
      </div>
    </div>
  )

  const renderQuoteSheet = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <DollarSign className="h-12 w-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Quote #{item.id || '0000'}
        </h2>
        <p className="text-purple-100 text-lg">
          {isRedacted ? 'Customer Redacted' : (item.customer || 'Customer Name')}
        </p>
      </div>

      {/* Quote Value */}
      <div className="text-center">
        <div className="text-5xl font-bold text-white mb-2">
          {isRedacted ? '$***,***' : formatCurrency(item.total || item.amount)}
        </div>
        <div className="text-purple-100 text-lg uppercase tracking-wide">
          Quote Value
        </div>
      </div>

      {/* Quote Details */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {isRedacted ? '**' : (item.items || 0)}
          </div>
          <div className="text-purple-100 text-sm uppercase tracking-wide">
            Line Items
          </div>
        </div>
        <div className="bg-white/10 rounded-xl p-6 text-center">
          <div className="text-lg font-bold text-white mb-2">
            {item.status && (
              <Badge className="bg-white/20 text-white border-white/30">
                {item.status}
              </Badge>
            )}
          </div>
          <div className="text-purple-100 text-sm uppercase tracking-wide">
            Status
          </div>
        </div>
      </div>

      {/* Quote Timeline */}
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Timeline</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-purple-100">Created</span>
            <span className="text-white font-medium">
              {isRedacted ? 'Redacted' : new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-100">Valid Until</span>
            <span className="text-white font-medium">
              {isRedacted ? 'Redacted' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSheetContent = () => {
    switch (type) {
      case 'inventory':
        return renderInventorySheet()
      case 'customers':
        return renderCustomerSheet()
      case 'quotes':
        return renderQuoteSheet()
      default:
        return renderInventorySheet()
    }
  }

  const SheetIcon = getSheetIcon()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header Controls */}
      {!isPublic && (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Sales Sheet Preview</h1>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsRedacted(!isRedacted)
                  onToggleRedaction?.(!isRedacted)
                }}
                className="flex items-center"
              >
                {isRedacted ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {isRedacted ? 'Show Details' : 'Hide Details'}
              </Button>
              <Button size="sm" className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button size="sm" variant="outline" className="flex items-center">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Sheet */}
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          ref={sheetRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${getSheetColor()} rounded-2xl shadow-2xl overflow-hidden`}
        >
          {/* Header with Company Branding */}
          <div className="bg-black/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {companyInfo?.name || 'Your Company'}
                  </h1>
                  <p className="text-white/80 text-sm">
                    {getSheetTitle()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/80 text-sm">
                  Generated on
                </div>
                <div className="text-white font-medium">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-8">
            {renderSheetContent()}
          </div>

          {/* Footer with QR Code and CTA */}
          <div className="bg-black/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mr-4">
                  <QrCode className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <div className="text-white font-medium mb-1">
                    Scan to view in app
                  </div>
                  <div className="text-white/80 text-sm">
                    {generateQRCode()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Button 
                  className="bg-white text-slate-900 hover:bg-white/90"
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Information */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>
            This sales sheet was generated by Visual ERP. 
            {!isRedacted && ' Sensitive information may be visible.'}
          </p>
          {companyInfo?.website && (
            <p className="mt-2">
              Learn more at <a href={companyInfo.website} className="text-blue-600 hover:underline">{companyInfo.website}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact sales sheet for sharing
export function CompactSalesSheet({ item, type, className = '' }) {
  const getSheetColor = () => {
    switch (type) {
      case 'inventory':
        return 'from-blue-500 to-blue-600'
      case 'customers':
        return 'from-emerald-500 to-emerald-600'
      case 'quotes':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-slate-500 to-slate-600'
    }
  }

  const getSheetIcon = () => {
    switch (type) {
      case 'inventory':
        return Package
      case 'customers':
        return Users
      case 'quotes':
        return DollarSign
      default:
        return Package
    }
  }

  const SheetIcon = getSheetIcon()

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br ${getSheetColor()} rounded-xl p-6 text-white ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
            <SheetIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {item.name || item.companyName || `${type} #${item.id}`}
            </h3>
            <p className="text-white/80 text-sm">
              Sales Sheet
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/10"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="text-sm text-white/80">
        Generated {new Date().toLocaleDateString()}
      </div>
    </motion.div>
  )
}

export default SalesSheet
