/**
 * KYC BFF – Upload & verification flow orchestration
 */

import { apiGet, apiPost } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface KycStatusView {
  kyc_status: string;
  documents: Array<{
    id: string;
    document_type: string;
    verification_status: string;
    rejection_reason: string | null;
    created_at: string;
  }>;
  /** Which steps are complete */
  steps: {
    pan_uploaded: boolean;
    pan_verified: boolean;
    aadhaar_uploaded: boolean;
    aadhaar_verified: boolean;
    selfie_uploaded: boolean;
    selfie_verified: boolean;
  };
  /** Overall progress percentage */
  progress_percentage: number;
}

// ── BFF Service ───────────────────────────────────────────────────────────

export const kycBff = {
  /**
   * Fetch KYC status + documents + compute step progress.
   */
  async getKycStatus(): Promise<KycStatusView> {
    const [profile, documents] = await Promise.all([
      apiGet<{ kyc_status: string }>("/users/me"),
      apiGet<KycStatusView["documents"]>("/kyc/documents"),
    ]);

    // Derive step completion from documents
    const findDoc = (type: string) => documents.find((d) => d.document_type === type);
    const panDoc = findDoc("PAN");
    const aadhaarDoc = findDoc("AADHAAR");
    const selfieDoc = findDoc("SELFIE");

    const steps = {
      pan_uploaded: !!panDoc,
      pan_verified: panDoc?.verification_status === "VERIFIED",
      aadhaar_uploaded: !!aadhaarDoc,
      aadhaar_verified: aadhaarDoc?.verification_status === "VERIFIED",
      selfie_uploaded: !!selfieDoc,
      selfie_verified: selfieDoc?.verification_status === "VERIFIED",
    };

    const completed = Object.values(steps).filter(Boolean).length;
    const progress_percentage = Math.round((completed / 6) * 100);

    return {
      kyc_status: profile.kyc_status,
      documents,
      steps,
      progress_percentage,
    };
  },

  /**
   * Get a presigned S3 upload URL, then submit KYC document.
   */
  async uploadDocument(documentType: string, file: File): Promise<{ document_id: string }> {
    // 1. Get presigned upload URL
    const { upload_url, file_key } = await apiPost<{
      upload_url: string;
      file_key: string;
    }>("/kyc/upload-url", {
      document_type: documentType,
      content_type: file.type,
      filename: file.name,
    });

    // 2. Upload to S3
    await fetch(upload_url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    // 3. Notify backend
    const result = await apiPost<{ document_id: string }>("/kyc/documents", {
      document_type: documentType,
      file_key,
    });

    return result;
  },
};
