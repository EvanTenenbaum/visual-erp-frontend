import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MoreVertical, 
  Edit3, 
  Share2, 
  DollarSign, 
  FileText, 
  Eye, 
  Copy,
  ExternalLink,
  CreditCard,
  Package,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

// Enhanced Action Menu with contextual icons and improved accessibility
export function ActionMenu({ item, type, onAction, className = '' }) {
  const [isOpen, setIsOpen] = useState(false)

  const getContextualActions = () => {
    const baseActions = [
      {
        id: 'view',
        label: 'View Details',
        icon: Eye,
        description: 'Open detailed view',
        primary: false
      },
      {
        id: 'share',
        label: 'Share Sheet',
        icon: Share2,
        description: 'Create external sales sheet',
        primary: false
      },
      {
        id: 'copy',
        label: 'Copy Link',
        icon: Copy,
        description: 'Copy link to this item',
        primary: false
      }
    ]

    switch (type) {
      case 'inventory':
        return [
          {
            id: 'quote',
            label: 'Start Quote',
            icon: FileText,
            description: 'Create quote with this product',
            primary: true,
            color: 'text-blue-600'
          },
          {
            id: 'edit',
            label: 'Edit Product',
            icon: Edit3,
            description: 'Modify product details',
            primary: false
          },
          ...baseActions
        ]
      
      case 'customers':
        return [
          {
            id: 'new-order',
            label: 'New Order',
            icon: Package,
            description: 'Create order for this customer',
            primary: true,
            color: 'text-emerald-600'
          },
          {
            id: 'edit',
            label: 'Edit Customer',
            icon: Edit3,
            description: 'Modify customer details',
            primary: false
          },
          ...baseActions
        ]
      
      case 'quotes':
        return [
          {
            id: 'convert',
            label: 'Convert to Order',
            icon: DollarSign,
            description: 'Convert quote to sales order',
            primary: true,
            color: 'text-purple-600'
          },
          {
            id: 'edit',
            label: 'Edit Quote',
            icon: Edit3,
            description: 'Modify quote details',
            primary: false
          },
          ...baseActions
        ]
      
      default:
        return baseActions
    }
  }

  const handleActionClick = (actionId) => {
    setIsOpen(false)
    onAction({ item, action: actionId })
  }

  const actions = getContextualActions()
  const primaryActions = actions.filter(action => action.primary)
  const secondaryActions = actions.filter(action => !action.primary)

  return (
    <div className={`relative ${className}`}>
      {/* Main action button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Open actions menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="h-5 w-5 text-white" />
      </motion.button>

      {/* Action menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            
            {/* Menu panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
              role="menu"
              aria-orientation="vertical"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Primary actions */}
              {primaryActions.length > 0 && (
                <div className="p-2">
                  {primaryActions.map((action) => {
                    const IconComponent = action.icon
                    return (
                      <motion.button
                        key={action.id}
                        whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionClick(action.id)}
                        className="w-full flex items-center px-3 py-3 text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        role="menuitem"
                      >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3`}>
                          <IconComponent className={`h-4 w-4 ${action.color || 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">
                            {action.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {action.description}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}

              {/* Divider */}
              {primaryActions.length > 0 && secondaryActions.length > 0 && (
                <div className="border-t border-slate-100" />
              )}

              {/* Secondary actions */}
              {secondaryActions.length > 0 && (
                <div className="p-2">
                  {secondaryActions.map((action) => {
                    const IconComponent = action.icon
                    return (
                      <motion.button
                        key={action.id}
                        whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleActionClick(action.id)}
                        className="w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1"
                        role="menuitem"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                          <IconComponent className="h-3.5 w-3.5 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700">
                            {action.label}
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Inline action buttons for primary actions
export function InlineActions({ item, type, onAction, className = '' }) {
  const getPrimaryAction = () => {
    switch (type) {
      case 'inventory':
        return {
          id: 'quote',
          label: 'Quote',
          icon: FileText,
          color: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'customers':
        return {
          id: 'new-order',
          label: 'Order',
          icon: Package,
          color: 'bg-emerald-600 hover:bg-emerald-700'
        }
      case 'quotes':
        return {
          id: 'convert',
          label: 'Convert',
          icon: DollarSign,
          color: 'bg-purple-600 hover:bg-purple-700'
        }
      default:
        return null
    }
  }

  const primaryAction = getPrimaryAction()
  
  if (!primaryAction) return null

  const IconComponent = primaryAction.icon

  return (
    <div className={`flex space-x-2 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onAction({ item, action: primaryAction.id })}
        className={`flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/20 ${primaryAction.color}`}
      >
        <IconComponent className="h-4 w-4 mr-2" />
        {primaryAction.label}
      </motion.button>
    </div>
  )
}

export default ActionMenu
