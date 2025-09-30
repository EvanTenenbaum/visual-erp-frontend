import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  FileText,
  DollarSign,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react'
import enhancedApiService from '../lib/api-enhanced.js'
import { trackEvent, trackFormSubmit, trackFeatureUsage } from '../lib/analytics.js'

const QuoteCRUD = ({ onUpdate }) => {
  const [quotes, setQuotes] = useState([])
  const [customers, setCustomers] = useState([]) // For customer dropdown
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingQuote, setEditingQuote] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    status: 'Draft',
    validUntil: '',
    lineItems: []
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadQuotes()
    loadCustomersForDropdown()
  }, [])

  const loadQuotes = async () => {
    try {
      setLoading(true)
      const response = await enhancedApiService.getQuotes()
      if (response.success) {
        setQuotes(response.quotes)
        trackEvent('quotes_loaded', { count: response.quotes.length })
      } else {
        setError('Failed to load quotes')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomersForDropdown = async () => {
    try {
      const response = await enhancedApiService.getCustomers()
      if (response.success) {
        setCustomers(response.customers)
      } else {
        console.error('Failed to load customers for dropdown:', response.error)
      }
    } catch (err) {
      console.error('Error loading customers for dropdown:', err.message)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) {
      errors.title = 'Quote title is required'
    }
    
    if (!formData.customerId) {
      errors.customerId = 'Customer is required'
    }
    
    if (!formData.validUntil) {
      errors.validUntil = 'Valid until date is required'
    }

    if (formData.lineItems.length === 0) {
      errors.lineItems = 'At least one line item is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      trackFormSubmit('quote_form', false, 'Validation failed')
      return
    }

    setSubmitting(true)
    
    try {
      const quoteData = {
        ...formData,
        customerId: parseInt(formData.customerId),
        total: formData.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      }

      let response
      if (editingQuote) {
        response = await enhancedApiService.updateQuote(editingQuote.id, quoteData)
        trackFeatureUsage('quote_update', { quoteId: editingQuote.id })
      } else {
        response = await enhancedApiService.createQuote(quoteData)
        trackFeatureUsage('quote_create')
      }

      if (response.success) {
        await loadQuotes()
        resetForm()
        trackFormSubmit('quote_form', true)
        if (onUpdate) onUpdate()
      } else {
        setError(response.error || 'Failed to save quote')
        trackFormSubmit('quote_form', false, response.error)
      }
    } catch (err) {
      setError(err.message)
      trackFormSubmit('quote_form', false, err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (quote) => {
    setEditingQuote(quote)
    setFormData({
      title: quote.title,
      customerId: quote.customerId?.toString() || '',
      status: quote.status || 'Draft',
      validUntil: quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '',
      lineItems: quote.lineItems || []
    })
    setShowForm(true)
    trackFeatureUsage('quote_edit_start', { quoteId: quote.id })
  }

  const handleDelete = async (quote) => {
    if (!confirm(`Are you sure you want to delete quote "${quote.title}"?`)) {
      return
    }

    try {
      const response = await enhancedApiService.deleteQuote(quote.id)
      if (response.success) {
        await loadQuotes()
        trackFeatureUsage('quote_delete', { quoteId: quote.id })
        if (onUpdate) onUpdate()
      } else {
        setError(response.error || 'Failed to delete quote')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const handleConvert = async (quote) => {
    if (!confirm(`Are you sure you want to convert quote "${quote.title}" to an order?`)) {
      return
    }

    try {
      const response = await enhancedApiService.convertQuoteToOrder(quote.id)
      if (response.success) {
        await loadQuotes()
        trackFeatureUsage('quote_convert_to_order', { quoteId: quote.id })
        if (onUpdate) onUpdate()
      } else {
        setError(response.error || 'Failed to convert quote to order')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      customerId: '',
      status: 'Draft',
      validUntil: '',
      lineItems: []
    })
    setFormErrors({})
    setEditingQuote(null)
    setShowForm(false)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...formData.lineItems]
    newLineItems[index][field] = value
    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { productId: '', productName: '', quantity: 1, unitPrice: 0 }]
    }))
  }

  const removeLineItem = (index) => {
    const newLineItems = [...formData.lineItems]
    newLineItems.splice(index, 1)
    setFormData(prev => ({ ...prev, lineItems: newLineItems }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading quotes...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Quote Management</h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setShowForm(true)
            trackFeatureUsage('quote_create_start')
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quote
        </motion.button>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingQuote ? 'Edit Quote' : 'Create New Quote'}
                </h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter quote title"
                  />
                  {formErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
                  )}
                </div>

                {/* Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer *
                  </label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.customerId ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.companyName}
                      </option>
                    ))}
                  </select>
                  {formErrors.customerId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.customerId}</p>
                  )}
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.validUntil ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.validUntil && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.validUntil}</p>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-semibold">Line Items</h4>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </motion.button>
                </div>
                {formErrors.lineItems && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.lineItems}</p>
                )}
                {formData.lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => handleLineItemChange(index, 'productName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        placeholder="Product Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-grow">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {submitting ? 'Saving...' : editingQuote ? 'Update Quote' : 'Create Quote'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quotes List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Quotes ({quotes.length})</h3>
        </div>
        
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No quotes found. Create your first quote to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <motion.tr
                    key={quote.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quote.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {quote.items} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {quote.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {enhancedApiService.formatCurrency(quote.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.status === 'Approved' 
                          ? 'bg-green-100 text-green-800'
                          : quote.status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : quote.status === 'Converted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {quote.status !== 'Converted' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleConvert(quote)}
                            className="text-green-600 hover:text-green-900"
                            title="Convert to Order"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleEdit(quote)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit quote"
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDelete(quote)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete quote"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuoteCRUD
