'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ChartModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function ChartModal({ isOpen, onClose, title, children }: ChartModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl max-h-[90vh] w-[95vw] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Chart Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="h-full min-h-[500px]">
            {children}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click outside or press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">ESC</kbd> to close
          </p>
        </div>
      </div>
    </div>
  )
} 