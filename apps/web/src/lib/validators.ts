import { z } from 'zod'

// ─── PAN Card ─────────────────────────────────────────
export const panSchema = z
  .string()
  .transform((v) => v.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format (e.g. ABCDE1234F)'))

// ─── RERA Number ──────────────────────────────────────
export const reraNumberSchema = z
  .string()
  .min(5, 'RERA number is required')
  .max(100, 'RERA number too long')

// ─── Email ────────────────────────────────────────────
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255)

// ─── Indian Phone ─────────────────────────────────────
export const indianPhoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number')

// ─── Investment Amount ────────────────────────────────
export const investmentAmountSchema = z
  .string()
  .refine(
    (val) => {
      const num = Number(val)
      return !Number.isNaN(num) && num >= 10000
    },
    { message: 'Minimum investment is ₹10,000' }
  )

// ─── Property Filter ──────────────────────────────────
export const propertyFilterSchema = z.object({
  status: z.enum(['live', 'upcoming', 'fully_funded', 'closed']).optional(),
  city: z.string().optional(),
  assetType: z.enum(['residential', 'commercial', 'warehouse', 'data_center', 'hospitality']).optional(),
  minXirr: z.number().min(0).max(100).optional(),
  budgetMax: z.number().positive().optional(),
  sort: z
    .enum(['xirr_desc', 'launch_date_asc', 'raised_desc', 'featured_first'])
    .optional()
    .default('featured_first'),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(50).optional().default(20),
})

// ─── Investment Initiation ────────────────────────────
export const investmentInitiateSchema = z.object({
  propertyId: z.string().uuid(),
  amount: z.number().positive().min(10000),
  paymentMethod: z.string().optional(),
  useCredits: z.boolean().optional().default(false),
})

// ─── Referral Code ────────────────────────────────────
export const referralCodeSchema = z
  .string()
  .regex(/^[A-Z0-9]{6,8}$/, 'Invalid referral code')

// ─── User Registration ───────────────────────────────
export const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: emailSchema,
  dpdpConsent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to Terms & Privacy Policy' }),
  }),
})

// ─── KYC Bank Verification ───────────────────────────
export const bankVerificationSchema = z.object({
  accountNumber: z.string().min(9).max(18),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
  accountHolderName: z.string().min(2).max(100),
})

// ─── Type Exports ─────────────────────────────────────
export type PropertyFilter = z.infer<typeof propertyFilterSchema>
export type InvestmentInitiate = z.infer<typeof investmentInitiateSchema>
export type Signup = z.infer<typeof signupSchema>
export type BankVerification = z.infer<typeof bankVerificationSchema>
