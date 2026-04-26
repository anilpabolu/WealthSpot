// ============================================================================
// WealthSpot Shield — 7-Layer Trust Framework (single source of truth)
// ============================================================================
// Mirrored in Python at services/api/app/core/assessments.py.
// Parity is enforced by tests/api/tests/test_assessment_parity.py.

export type AssessmentCategoryCode =
  | "builder"
  | "legal"
  | "valuation"
  | "location"
  | "property"
  | "security"
  | "exit";

export enum AssessmentStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  PASSED = "passed",
  FLAGGED = "flagged",
  NOT_APPLICABLE = "not_applicable",
}

export type AssessmentOverallStatus =
  | "not_started"
  | "in_review"
  | "partial"
  | "certified";

export type PerformedBy = "wealthspot" | "law_firm" | "sme";

export type AssessmentInputType = "text" | "number" | "select" | "boolean";

export interface AssessmentSubItem {
  code: string;
  label: string;
  promptForBuilder: string;
  inputType: AssessmentInputType;
  options?: string[];
  requiresDocument: boolean;
  sensitiveDocument: boolean;
}

export interface AssessmentCategory {
  code: AssessmentCategoryCode;
  name: string;
  heroShortDef: string;
  fullDescription: string;
  icon: string;
  accentColor: string;
  performedBy: PerformedBy;
  subItems: AssessmentSubItem[];
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    code: "builder",
    name: "Builder Assessment",
    heroShortDef: "Grade, tenure, cashflows & team capability of the builder",
    fullDescription:
      "We grade every builder on delivery history, balance-sheet health, and the people behind the project before a single rupee goes on the platform.",
    icon: "ShieldCheck",
    accentColor: "text-emerald-500",
    performedBy: "wealthspot",
    subItems: [
      {
        code: "category_grade",
        label: "Category Grade",
        promptForBuilder: "What grade does your firm hold (A / B / C)?",
        inputType: "select",
        options: ["A", "B", "C"],
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "tenure_sqft",
        label: "Tenure & Sqft Delivered",
        promptForBuilder: "Years in business and total sqft delivered to date.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: false,
      },
      {
        code: "proprietor_profile",
        label: "Proprietor Profile",
        promptForBuilder: "Share the proprietor's profile (LinkedIn / bio / public record).",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: false,
      },
      {
        code: "cash_flows",
        label: "Cash Flows",
        promptForBuilder: "Last 3 FY cashflow statement.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "team_capabilities",
        label: "Team Capabilities",
        promptForBuilder: "Key people, credentials, specialities.",
        inputType: "text",
        requiresDocument: false,
        sensitiveDocument: false,
      },
    ],
  },
  {
    code: "legal",
    name: "Legal Assessment",
    heroShortDef: "Title, encumbrance & legal-opinion letter from a vetted law firm",
    fullDescription:
      "An empanelled law firm independently reviews title deeds, the Encumbrance Certificate, and flags every location constraint before listing.",
    icon: "Scale",
    accentColor: "text-sky-500",
    performedBy: "law_firm",
    subItems: [
      {
        code: "title_deeds",
        label: "Title Deeds",
        promptForBuilder: "Upload chain of title deeds.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "known_legal_issues",
        label: "Known Legal Issues",
        promptForBuilder: "Any ongoing disputes or notices?",
        inputType: "boolean",
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "location_constraints",
        label: "Location Constraints",
        promptForBuilder: "Lake buffers, govt encroachments, patta / dotted lands?",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "ec",
        label: "Encumbrance Certificate",
        promptForBuilder: "Latest EC (last 13 years).",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "legal_opinion",
        label: "Legal Opinion Letter",
        promptForBuilder: "Opinion letter from empanelled law firm.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
    ],
  },
  {
    code: "valuation",
    name: "Valuation Assessment",
    heroShortDef: "Market price & appreciation outlook by independent SMEs",
    fullDescription:
      "Independent Subject-Matter Experts triangulate market value today against surrounding transactions and map the 3-5 year appreciation curve.",
    icon: "TrendingUp",
    accentColor: "text-amber-500",
    performedBy: "sme",
    subItems: [
      {
        code: "surrounding_valuation",
        label: "Surrounding Valuation",
        promptForBuilder: "Recent transaction prices within a 2 km radius.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: false,
      },
      {
        code: "market_value",
        label: "Market Value",
        promptForBuilder: "Current fair market value per unit / acre.",
        inputType: "number",
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "appreciation_scope",
        label: "Future Appreciation Scope",
        promptForBuilder: "Projected 3-5 year appreciation narrative.",
        inputType: "text",
        requiresDocument: false,
        sensitiveDocument: false,
      },
    ],
  },
  {
    code: "location",
    name: "Location Assessment",
    heroShortDef: "Buffer-zone, SC/ST, dotted-land & future-development checks",
    fullDescription:
      "WealthSpot verifies the parcel against buffer zones, SC/ST classifications, dotted-land flags and maps upcoming infra (metro, IT parks) that could move value.",
    icon: "MapPin",
    accentColor: "text-fuchsia-500",
    performedBy: "wealthspot",
    subItems: [
      {
        code: "zone_check",
        label: "Buffer / SC-ST / Dotted-Land",
        promptForBuilder: "Any buffer-zone, SC-ST or dotted-land classification?",
        inputType: "boolean",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "future_development",
        label: "Future Development Map",
        promptForBuilder: "Nearby metro, IT park, highway or SEZ plans.",
        inputType: "text",
        requiresDocument: false,
        sensitiveDocument: false,
      },
    ],
  },
  {
    code: "property",
    name: "Property Assessment",
    heroShortDef: "Construction status, parcel size, segment & delivery timelines",
    fullDescription:
      "We inspect ground reality — construction phase, acres on offer, premium / mid / affordable segment, and the timeline the builder is committing to.",
    icon: "Building2",
    accentColor: "text-blue-500",
    performedBy: "wealthspot",
    subItems: [
      {
        code: "construction_status",
        label: "Construction Status",
        promptForBuilder: "Current phase on the ground.",
        inputType: "select",
        options: [
          "planning",
          "land_acquisition",
          "approvals_in_progress",
          "foundation",
          "structure",
          "finishing",
          "possession_ready",
          "completed",
        ],
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "parcel_dimensions",
        label: "Land Parcel Dimensions",
        promptForBuilder: "Total acres / sqft of the parcel.",
        inputType: "number",
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "segment",
        label: "Segment",
        promptForBuilder: "Premium / Mid / Affordable.",
        inputType: "select",
        options: ["premium", "mid", "affordable"],
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "timelines",
        label: "Timelines",
        promptForBuilder: "Expected possession / exit date.",
        inputType: "text",
        requiresDocument: false,
        sensitiveDocument: false,
      },
    ],
  },
  {
    code: "security",
    name: "Security Assessment",
    heroShortDef: "Sale agreement, post-dated cheque cover & MoUs with the builder",
    fullDescription:
      "Binding paperwork that sits under the deal — the sale agreement, investor-protection cheques, and MoUs that codify exit and dispute handling.",
    icon: "Lock",
    accentColor: "text-rose-500",
    performedBy: "wealthspot",
    subItems: [
      {
        code: "sale_agreement",
        label: "Sale Agreement / Deeds",
        promptForBuilder: "Draft or executed sale agreement / sale deed.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "cheque_security",
        label: "Cheque Security",
        promptForBuilder: "Post-dated cheques covering principal / interest.",
        inputType: "boolean",
        requiresDocument: true,
        sensitiveDocument: true,
      },
      {
        code: "mous",
        label: "MoUs",
        promptForBuilder: "Executed MoUs with investors / platform.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
    ],
  },
  {
    code: "exit",
    name: "Exit Assessment",
    heroShortDef: "Lock-in, flex-move and emergency-exit clauses",
    fullDescription:
      "Every deal documents its lock-in window, whether capital can shift between projects, and the emergency-exit waterfall if life happens.",
    icon: "DoorOpen",
    accentColor: "text-violet-500",
    performedBy: "wealthspot",
    subItems: [
      {
        code: "lock_in_period",
        label: "Lock-in Period",
        promptForBuilder: "Minimum lock-in in months.",
        inputType: "number",
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "flex_move",
        label: "Flex Between Properties",
        promptForBuilder: "Can investors move capital between your projects?",
        inputType: "boolean",
        requiresDocument: false,
        sensitiveDocument: false,
      },
      {
        code: "emergency_exit",
        label: "Emergency Exit Clause",
        promptForBuilder: "Terms under which investors can exit early.",
        inputType: "text",
        requiresDocument: true,
        sensitiveDocument: true,
      },
    ],
  },
];

export interface AssessmentSubItemRead {
  code: string;
  label: string;
  status: AssessmentStatus;
  hasEvidence: boolean;
  riskSeverity: "low" | "medium" | "high" | null;
  reviewerNote: string | null;
  documents: AssessmentDocumentRead[];
  builderAnswer: Record<string, unknown> | null;
  reviewedAt: string | null;
  isPublic: boolean;
}

export interface AssessmentDocumentRead {
  id: string;
  filename: string | null;
  contentType: string | null;
  sizeBytes: number | null;
  // Null when the viewer cannot download it yet (EOI gating).
  url: string | null;
  locked: boolean;
}

export interface AssessmentCategoryRead {
  code: AssessmentCategoryCode;
  status: AssessmentStatus;
  passedCount: number;
  totalCount: number;
  subItems: AssessmentSubItemRead[];
}

export interface OpportunityRiskFlagRead {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  note: string | null;
  createdAt: string;
}

export interface AssessmentSummaryRead {
  opportunityId: string;
  overall: AssessmentOverallStatus;
  passedCount: number;
  totalCount: number;
  certified: boolean;
  categories: AssessmentCategoryRead[];
  risks: OpportunityRiskFlagRead[];
}

export interface ShieldMetrics {
  funnel: {
    not_started: number;
    in_review: number;
    partial: number;
    certified: number;
  };
  topFlagged: Array<{
    categoryCode: AssessmentCategoryCode;
    subcategoryCode: string;
    flaggedCount: number;
  }>;
  avgTimeToCertifyDays: number | null;
  riskCounts: { low: number; medium: number; high: number };
}

export function countAssessmentSlots(): number {
  return ASSESSMENT_CATEGORIES.reduce((acc, c) => acc + c.subItems.length, 0);
}

export function findCategory(code: string): AssessmentCategory | undefined {
  return ASSESSMENT_CATEGORIES.find((c) => c.code === code);
}

export function findSubItem(
  categoryCode: string,
  subCode: string,
): AssessmentSubItem | undefined {
  return findCategory(categoryCode)?.subItems.find((s) => s.code === subCode);
}
