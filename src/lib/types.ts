export type ID = string
export type Plan = 'free' | 'premium'

export interface Dog {
  id: ID
  name: string
  birth_date: string | null // ISO yyyy-mm-dd
  approx_age_months: number | null
  breed: string
  sex: 'male' | 'female' | 'unknown'
  weight_kg: number | null
  notes: string
  created_at: string
}

export interface WeightEntry { id: ID; dog_id: ID; date: string; kg: number }

export type ExpenseCategory =
  | 'vet' | 'medication' | 'food' | 'insurance' | 'grooming'
  | 'training' | 'boarding' | 'accessories' | 'toys' | 'other'

export interface Expense {
  id: ID; dog_id: ID; date: string
  amount: number // in the user's chosen currency at entry time; no FX conversion
  category: ExpenseCategory
  merchant: string; note: string
  insurance_refund: number | null
}

export type HealthKind = 'vaccine' | 'antiparasitic' | 'treatment' | 'allergy' | 'history'
export interface HealthRecord {
  id: ID; dog_id: ID; kind: HealthKind
  title: string
  date: string // administration / start date
  next_date: string | null // next due (user defined)
  end_date: string | null
  provider: string
  dose: string // free text as written on product/prescription; never computed
  category: string
  notes: string
  vet_confirmed: boolean // professional-confirmed vs personal observation
}

export interface Appointment {
  id: ID; dog_id: ID
  at: string // local "yyyy-mm-ddTHH:mm"
  reason: string; vet: string; address: string; phone: string; notes: string
  remind_minutes: number | null
}

export type ActivityType = 'walk' | 'play' | 'training' | 'observation' | 'other'
export interface Activity { id: ID; dog_id: ID; date: string; type: ActivityType; minutes: number; notes: string }

export interface Meal {
  id: ID; dog_id: ID; at: string; kind: string; product: string; grams: number | null; appetite: string
}

export interface Routine { id: ID; dog_id: ID; label: string; enabled: boolean; done_dates: string[] }

export interface Collections {
  dogs: Dog[]
  weights: WeightEntry[]
  expenses: Expense[]
  health: HealthRecord[]
  appointments: Appointment[]
  activities: Activity[]
  meals: Meal[]
  routines: Routine[]
}
export type TableName = keyof Collections
export type Row<T extends TableName> = Collections[T][number]

export interface Settings {
  language: string
  currency: string
  theme: string
  budget_monthly: number | null
  display_name: string
}
export const emptyCollections = (): Collections => ({
  dogs: [], weights: [], expenses: [], health: [], appointments: [], activities: [], meals: [], routines: [],
})
