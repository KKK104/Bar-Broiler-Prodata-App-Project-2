"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { MessageSquare } from "lucide-react"
import { FeedbackForm } from "./feedback-form"

interface FeedbackButtonProps {
  userEmail?: string
  farmId?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function FeedbackButton({ 
  userEmail, 
  farmId, 
  variant = "outline", 
  size = "default",
  className = ""
}: FeedbackButtonProps) {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowFeedbackForm(true)}
        className={`flex items-center gap-2 ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Feedback
      </Button>

      {showFeedbackForm && (
        <FeedbackForm
          onClose={() => setShowFeedbackForm(false)}
          userEmail={userEmail}
          farmId={farmId}
        />
      )}
    </>
  )
} 