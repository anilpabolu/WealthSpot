/**
 * Shared Zod validators for WealthSpot domain fields.
 *
 * Import into web/mobile forms and backend FastAPI request models.
 * All schemas transform to a canonical form after parse.
 */

import { z } from "zod";

// ── Indian document ID formats ────────────────────────────────────────────

/** Permanent Account Number — 10-character alphanumeric */
export const panSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN — expected format: ABCDE1234F"));

/** Aadhaar number — 12 digits */
export const aadhaarSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+/g, ""))
  .pipe(z.string().regex(/^\d{12}$/, "Invalid Aadhaar — expected 12 digits"));

/** IFSC code — 4 alpha + 0 + 6 alphanumeric */
export const ifscSchema = z
  .string()
  .trim()
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"));

/** Indian bank account number — 9 to 18 digits */
export const bankAccountSchema = z
  .string()
  .trim()
  .regex(/^\d{9,18}$/, "Bank account must be 9–18 digits");

// ── Contact ───────────────────────────────────────────────────────────────

/** Indian mobile number — starts 6–9, 10 digits */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+|-/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Invalid 10-digit Indian mobile number"));

/** 6-digit PIN code */
export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Pincode must be exactly 6 digits");

// ── Financial ─────────────────────────────────────────────────────────────

/** Positive rupee amount (float OK, min 1 paisa) */
export const amountSchema = z
  .number({ invalid_type_error: "Amount must be a number" })
  .positive("Amount must be greater than 0")
  .finite("Amount cannot be infinite");

/** Investment units — positive integer */
export const unitsSchema = z
  .number({ invalid_type_error: "Units must be a number" })
  .int("Units must be a whole number")
  .positive("Units must be at least 1");

// ── Property ──────────────────────────────────────────────────────────────

/** RERA registration ID — alphanumeric, 10–30 chars */
export const reraIdSchema = z
  .string()
  .trim()
  .regex(/^[A-Z0-9/-]{10,30}$/, "Invalid RERA ID format");

/** Property slug — lowercase kebab-case */
export const slugSchema = z
  .string()
  .trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (e.g. my-property)");

// ── Utility types ─────────────────────────────────────────────────────────

export type PanInput = z.input<typeof panSchema>;
export type PanOutput = z.output<typeof panSchema>;
export type PhoneInput = z.input<typeof phoneSchema>;
export type PhoneOutput = z.output<typeof phoneSchema>;
export type AmountInput = z.input<typeof amountSchema>;
