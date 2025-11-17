import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full"
  padding?: "none" | "sm" | "md" | "lg" | "xl"
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md", 
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full"
}

const paddingClasses = {
  none: "",
  sm: "px-2 sm:px-4",
  md: "px-4 sm:px-6",
  lg: "px-4 sm:px-6 lg:px-8",
  xl: "px-4 sm:px-6 lg:px-8 xl:px-12"
}

export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = "7xl",
  padding = "lg"
}: ResponsiveContainerProps) {
  return (
    <div 
      className={cn(
        "mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

// Mobile-first responsive grid component
interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: "sm" | "md" | "lg" | "xl"
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-6",
  xl: "gap-6 sm:gap-8"
}

export function ResponsiveGrid({ 
  children, 
  className, 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = "md"
}: ResponsiveGridProps) {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols["2xl"] && `2xl:grid-cols-${cols["2xl"]}`
  ].filter(Boolean).join(" ")

  return (
    <div 
      className={cn(
        "grid",
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

// Mobile-first responsive text component
interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl"
  weight?: "light" | "normal" | "medium" | "semibold" | "bold"
  color?: string
}

const textSizeClasses = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-xl sm:text-2xl",
  "3xl": "text-2xl sm:text-3xl",
  "4xl": "text-3xl sm:text-4xl",
  "5xl": "text-4xl sm:text-5xl",
  "6xl": "text-5xl sm:text-6xl"
}

const textWeightClasses = {
  light: "font-light",
  normal: "font-normal", 
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold"
}

export function ResponsiveText({ 
  children, 
  className, 
  size = "base",
  weight = "normal",
  color
}: ResponsiveTextProps) {
  return (
    <div 
      className={cn(
        textSizeClasses[size],
        textWeightClasses[weight],
        color,
        className
      )}
    >
      {children}
    </div>
  )
}

// Mobile-first responsive button component
interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  className?: string
}

const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-600 hover:bg-gray-700 text-white",
  outline: "border border-gray-300 hover:bg-gray-50 text-gray-700",
  ghost: "hover:bg-gray-100 text-gray-700"
}

const buttonSizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base",
  lg: "px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
}

export function ResponsiveButton({ 
  children, 
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: ResponsiveButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

