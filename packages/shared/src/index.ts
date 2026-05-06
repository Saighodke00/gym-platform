// GDK Shared Types & Constants

// ─── USER ROLES ──────────────────────────────────────────────────────────────
export const ROLES = {
  ADMIN: 'admin',
  TRAINER: 'trainer',
  MEMBER: 'member',
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

// ─── MEMBER STATUS ───────────────────────────────────────────────────────────
export const MEMBER_STATUS = {
  ACTIVE: 'active',
  EXPIRING_SOON: 'expiring_soon',
  EXPIRED: 'expired',
  ARCHIVED: 'archived',
} as const

export type MemberStatus = typeof MEMBER_STATUS[keyof typeof MEMBER_STATUS]

// ─── PLAN DURATIONS ──────────────────────────────────────────────────────────
export const PLAN_DURATIONS = [
  { label: 'Weekly', days: 7 },
  { label: 'Monthly', days: 30 },
  { label: 'Quarterly', days: 90 },
  { label: 'Half-Yearly', days: 180 },
  { label: 'Annual', days: 365 },
] as const

// ─── FITNESS GOALS ───────────────────────────────────────────────────────────
export const FITNESS_GOALS = [
  'weight_loss',
  'muscle_building',
  'endurance',
  'flexibility',
  'rehabilitation',
  'general_fitness',
  'strength',
  'muscle_definition',
  'lean_body',
] as const

// ─── ACTIVITY LEVELS ─────────────────────────────────────────────────────────
export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light Activity' },
  { value: 'moderate', label: 'Moderate Activity' },
  { value: 'active', label: 'Active' },
  { value: 'very_active', label: 'Very Active' },
] as const

// ─── PAYMENT METHODS ─────────────────────────────────────────────────────────
export const PAYMENT_METHODS = {
  RAZORPAY: 'razorpay',
  CASH: 'cash',
  UPI: 'upi',
} as const

// ─── MEMBER CODE FORMAT ──────────────────────────────────────────────────────
export const MEMBER_CODE_PREFIX = 'GDK'
