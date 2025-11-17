'use client'

import { useState } from 'react'
import { ChartModal } from './ChartModal'

interface SimpleClickableChartProps {
  children: React.ReactNode
  modalContent: React.ReactNode
  title: string
  className?: string
}

export function SimpleClickableChart({ 
  children, 
  modalContent, 
  title, 
  className = '' 
}: SimpleClickableChartProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      {/* Simple Clickable Container */}
      <div 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${className}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        aria-label={`Click to enlarge ${title}`}
        title={`Click to enlarge ${title}`}
      >
        {children}
      </div>

      {/* Modal */}
      <ChartModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={title}
      >
        {modalContent}
      </ChartModal>
    </>
  )
} 