/**
 * KYC BFF – Upload & verification flow orchestration
 */

import type { KycStatusView } from "@wealthspot/types";
import { apiGet, apiPost } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { KycStatusView };

// ── BFF Service ───────────────────────────────────────────────────────────

export const kycBff = {
  /**
   * Fetch KYC status + documents + compute step progress.
   */
  async getKycStatus(): Promise<KycStatusView> {
    // API client converts snake_case → camelCase (documentType, verificationStatus, etc.)
    const [profile, documents] = await Promise.all([
      apiGet<{ kycStatus: string }>("/auth/me"),
      apiGet<KycStatusView["documents"]>("/kyc/documents"),
    ]);

    // Derive step completion from documents
    const findDoc = (type: string) =>
      documents.find((d) => d.documentType.toUpperCase() === type.toUpperCase());
    const panDoc = findDoc("PAN");
    const aadhaarDoc = findDoc("AADHAAR");
    const selfieDoc = findDoc("SELFIE");

    const steps = {
      panUploaded: !!panDoc,
      panVerified: panDoc?.verificationStatus === "VERIFIED",
      aadhaarUploaded: !!aadhaarDoc,
      aadhaarVerified: aadhaarDoc?.verificationStatus === "VERIFIED",
      selfieUploaded: !!selfieDoc,
      selfieVerified: selfieDoc?.verificationStatus === "VERIFIED",
    };

    const completed = Object.values(steps).filter(Boolean).length;
    const progressPercentage = Math.round((completed / 6) * 100);

    return {
      kycStatus: profile.kycStatus,
      documents,
      steps,
      progressPercentage,
    };
  },

  /**
   * Get a presigned S3 upload URL, then submit KYC document.
   */
  async uploadDocument(documentType: string, file: File): Promise<{ documentId: string }> {
    // 1. Get presigned upload URL (API client converts response to camelCase)
    const { uploadUrl, fileKey } = await apiPost<{
      uploadUrl: string;
      fileKey: string;
    }>("/kyc/upload-url", {
      document_type: documentType,
      content_type: file.type,
      filename: file.name,
    });

    // 2. Upload to S3 directly (no auth header for presigned URL)
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    // 3. Notify backend
    const result = await apiPost<{ documentId: string }>("/kyc/documents", {
      document_type: documentType,
      file_key: fileKey,
    });

    return result;
  },
};
