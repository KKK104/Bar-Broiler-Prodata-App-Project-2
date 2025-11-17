export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  id: string
  type: ErrorType
  message: string
  details?: string
  timestamp: Date
  context?: Record<string, any>
  userFriendlyMessage: string
}

export class ErrorManager {
  private static instance: ErrorManager
  private errors: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []

  private constructor() {}

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager()
    }
    return ErrorManager.instance
  }

  // Singleton Pattern: Ensure only one instance
  static get errorManager(): ErrorManager {
    return ErrorManager.getInstance()
  }

  // Observer Pattern: Subscribe to error events
  subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notify(error: AppError): void {
    this.listeners.forEach(listener => listener(error))
  }

  // Factory Pattern: Create different types of errors
  createError(
    type: ErrorType,
    message: string,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      message,
      details,
      timestamp: new Date(),
      context,
      userFriendlyMessage: this.getUserFriendlyMessage(type, message)
    }

    this.errors.push(error)
    this.notify(error)
    
    // Log error for debugging
    console.error('ErrorManager:', error)
    
    return error
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserFriendlyMessage(type: ErrorType, message: string): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Connection error. Please check your internet connection and try again.'
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please log in again.'
      case ErrorType.VALIDATION:
        return 'Please check your input and try again.'
      case ErrorType.DATABASE:
        return 'Data error. Please try again or contact support.'
      case ErrorType.UNKNOWN:
        return 'An unexpected error occurred. Please try again.'
      default:
        return message
    }
  }

  // Strategy Pattern: Different error handling strategies
  private errorHandlers = {
    [ErrorType.NETWORK]: (error: AppError) => {
      // Retry logic for network errors
      console.log('Handling network error:', error.message)
    },
    [ErrorType.AUTHENTICATION]: (error: AppError) => {
      // Redirect to login or refresh token
      console.log('Handling authentication error:', error.message)
    },
    [ErrorType.VALIDATION]: (error: AppError) => {
      // Show validation errors to user
      console.log('Handling validation error:', error.message)
    },
    [ErrorType.DATABASE]: (error: AppError) => {
      // Log database errors and show generic message
      console.log('Handling database error:', error.message)
    },
    [ErrorType.UNKNOWN]: (error: AppError) => {
      // Log unknown errors for debugging
      console.log('Handling unknown error:', error.message)
    }
  }

  handleError(error: AppError): void {
    const handler = this.errorHandlers[error.type]
    if (handler) {
      handler(error)
    }
  }

  // Utility methods
  getRecentErrors(limit: number = 10): AppError[] {
    return this.errors.slice(-limit)
  }

  clearErrors(): void {
    this.errors = []
  }

  getErrorCount(): number {
    return this.errors.length
  }

  // Error categorization
  getErrorsByType(type: ErrorType): AppError[] {
    return this.errors.filter(error => error.type === type)
  }

  getErrorsByTimeRange(startTime: Date, endTime: Date): AppError[] {
    return this.errors.filter(error => 
      error.timestamp >= startTime && error.timestamp <= endTime
    )
  }
}

// Convenience functions
export const createError = (
  type: ErrorType,
  message: string,
  details?: string,
  context?: Record<string, any>
): AppError => {
  return ErrorManager.errorManager.createError(type, message, details, context)
}

export const handleError = (error: AppError): void => {
  ErrorManager.errorManager.handleError(error)
}

export const subscribeToErrors = (listener: (error: AppError) => void): (() => void) => {
  return ErrorManager.errorManager.subscribe(listener)
} 