import type { FeedbackItem, FeedbackFilters } from '@/services/FeedbackService'

// Observer Pattern Implementation
export interface FeedbackObserver {
  update(feedback: FeedbackItem[]): void
}

export interface FeedbackState {
  feedback: FeedbackItem[]
  filteredFeedback: FeedbackItem[]
  filters: FeedbackFilters
  loading: boolean
  error: string | null
}

export class FeedbackStateManager {
  private state: FeedbackState
  private observers: FeedbackObserver[] = []

  constructor() {
    this.state = {
      feedback: [],
      filteredFeedback: [],
      filters: {},
      loading: false,
      error: null
    }
  }

  // Observer Pattern: Subscribe to state changes
  subscribe(observer: FeedbackObserver): () => void {
    this.observers.push(observer)
    
    // Return unsubscribe function
    return () => {
      const index = this.observers.indexOf(observer)
      if (index > -1) {
        this.observers.splice(index, 1)
      }
    }
  }

  // Observer Pattern: Notify all observers
  private notify(): void {
    this.observers.forEach(observer => {
      observer.update(this.state.filteredFeedback)
    })
  }

  // Strategy Pattern: Different filtering strategies
  private filterStrategies = {
    search: (item: FeedbackItem, searchTerm: string) => {
      if (!searchTerm) return true
      return item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (item.user_email && item.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
    },
    status: (item: FeedbackItem, status: string) => {
      if (!status || status === "all") return true
      return item.status === status
    },
    type: (item: FeedbackItem, type: string) => {
      if (!type || type === "all") return true
      return item.type === type
    },
    priority: (item: FeedbackItem, priority: string) => {
      if (!priority || priority === "all") return true
      return item.priority === priority
    }
  }

  // Factory Pattern: Create filter functions
  private createFilterFunction(filters: FeedbackFilters) {
    return (item: FeedbackItem) => {
      return Object.entries(filters).every(([key, value]) => {
        const strategy = this.filterStrategies[key as keyof typeof this.filterStrategies]
        return strategy ? strategy(item, value) : true
      })
    }
  }

  // State management methods
  setFeedback(feedback: FeedbackItem[]): void {
    this.state.feedback = feedback
    this.applyFilters()
  }

  setFilters(filters: FeedbackFilters): void {
    this.state.filters = filters
    this.applyFilters()
  }

  setLoading(loading: boolean): void {
    this.state.loading = loading
    this.notify()
  }

  setError(error: string | null): void {
    this.state.error = error
    this.notify()
  }

  private applyFilters(): void {
    const filterFunction = this.createFilterFunction(this.state.filters)
    this.state.filteredFeedback = this.state.feedback.filter(filterFunction)
    this.notify()
  }

  getState(): FeedbackState {
    return { ...this.state }
  }

  // Command Pattern: Undo/Redo functionality
  private history: FeedbackState[] = []
  private currentIndex = -1

  saveState(): void {
    // Remove any states after current index (for redo)
    this.history = this.history.slice(0, this.currentIndex + 1)
    
    // Add current state
    this.history.push({ ...this.state })
    this.currentIndex++
    
    // Keep only last 10 states
    if (this.history.length > 10) {
      this.history.shift()
      this.currentIndex--
    }
  }

  undo(): boolean {
    if (this.currentIndex > 0) {
      this.currentIndex--
      this.state = { ...this.history[this.currentIndex] }
      this.notify()
      return true
    }
    return false
  }

  redo(): boolean {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++
      this.state = { ...this.history[this.currentIndex] }
      this.notify()
      return true
    }
    return false
  }
} 