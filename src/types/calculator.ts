export interface FarmData {
  volumeDelivered: number | undefined
  deadOnArrival: number | undefined
  shortCount: number | undefined
  reject: number | undefined
  totalBegInv: number | undefined
  initialGrams: number | undefined
  building: number | undefined
  drNo: string
  docSource: string
  feeds: string
  batchStartDate: string
  targetWeight: number | undefined
  targetAge: number | undefined
  feedSourceImage?: string
  docImage?: string
}

export interface CalculatorSession {
  id: string
  buildingId: string
  farmData: FarmData
  dailyRecords: DailyRecord[]
  createdAt: string
  updatedAt: string
}

export interface PerformanceMetrics {
  totalMortality: number
  avgFCR: number | null
  avgWeight: number | null
}

export interface DailyRecord {
  date: string
  age: number
  dailyFeeds: number | undefined
  cumulativeFeeds: number
  feedsDelivery: number | undefined
  remainingFeeds: number
  dailyMortality: number | undefined
  cumulativeMortality: number
  mortalityPercent: number
  endingHeads: number
  alw: number | undefined
  adg: number
  remarks: string
  mortalityImage?: string
}

// Cost Input Types
export interface CostExpense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  quantity: number
  unitPrice: number
  totalAmount: number
  supplier?: string
  remarks?: string
}

export type ExpenseCategory = 
  | 'Feed Booster'
  | 'Feed Starter' 
  | 'Feed Finisher'
  | 'Medicine'
  | 'Vitamins'
  | 'Vaccines'
  | 'Labor'
  | 'Utilities'
  | 'Equipment'
  | 'Maintenance'
  | 'Transportation'
  | 'Other'

export interface CostSummary {
  totalExpenses: number
  expensesByCategory: Record<ExpenseCategory, number>
  costPerBird: number
  costPerKg: number
}

export interface CostInputData {
  buildingId: string
  cycleNumber: number
  expenses: CostExpense[]
  summary: CostSummary
  createdAt: string
  updatedAt: string
}

// Harvest Types
export interface HarvestInput {
  id: string
  buildingId: string
  farmId: string
  cycleNumber: number
  plateNumber: string
  buyerName: string
  totalBirds: number
  totalWeight: number
  pricePerKilogram: number
  documentationUrl?: string
  harvestDate: string
  createdAt: string
  updatedAt: string
}

export interface HarvestOutput {
  id: string
  buildingId: string
  farmId: string
  cycleNumber: number
  harvestInputs: HarvestInput[]
  finalALW: number
  totalRevenuePerBuyer: Record<string, number>
  grandTotalRevenue: number
  harvestRecoveryPercent: number
  totalMortality: number
  averageMortalityRate: number
  avgWeight: number
  adg: number
  fcr: number
  grossIncome: number
  netIncome: number
  createdAt: string
  updatedAt: string
}

export interface HarvestPerformance {
  buildingId: string
  totalFeedsConsumed: number
  totalHarvestChickens: number
  totalHarvestWeight: number
  harvestRecoveryPercent: number
  totalMortality: number
  averageMortalityRate: number
  finalALW: number
  adg: number
  fcr: number
  grossIncome: number
  netIncome: number
}