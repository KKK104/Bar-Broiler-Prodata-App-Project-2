"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import { Input } from "../ui/input"

interface StableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
  readOnly?: boolean
}

export const StableInput = forwardRef<HTMLInputElement, StableInputProps>(
  ({ value, onChange, placeholder, type = "text", className = "", readOnly = false }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const lastValueRef = useRef(value)

    useImperativeHandle(ref, () => inputRef.current!)

    // Only update if value actually changed from external source
    useEffect(() => {
      if (value !== lastValueRef.current) {
        lastValueRef.current = value
        if (inputRef.current) {
          inputRef.current.value = value
        }
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      lastValueRef.current = newValue
      onChange(newValue)
    }

    return (
      <Input
        ref={inputRef}
        type={type}
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        readOnly={readOnly}
      />
    )
  }
)

StableInput.displayName = "StableInput"
