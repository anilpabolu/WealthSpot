/**
 * Mobile KYC BFF – Upload & verification flow orchestration.
 * Adapted from web's kyc.bff.ts for React Native (expo-image-picker).
 */

import { apiGet, apiPost } from "../../lib/api";

export interface KycStatusView {
  kycStatus: string;
  documents: {
    id: string;
    documentType: string;
    verificationStatus: string;
    rejectionReason: string | null;
    createdAt: string;
  }[];
  steps: {
    panUploaded: boolean;
    panVerified: boolean;
    aadhaarUploaded: boolean;
    aadhaarVerified: boolean;
    selfieUploaded: boolean;
    selfieVerified: boolean;
  };
  progressPercentage: number;
}

export const mobileKycBff = {
  async getKycStatus(): Promise<KycStatusView> {
    const [profile, documents] = await Promise.all([
      apiGet<{ kycStatus: string }>("/auth/me"),
      apiGet<KycStatusView["documents"]>("/kyc/documents"),
    ]);

    const findDoc = (type: string) =>
      documents.find((d) => d.documentType === type);
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

    return {
      kycStatus: profile.kycStatus,
      documents,
      steps,
      progressPercentage: Math.round((completed / 6) * 100),
    };
  },

  /**
   * Upload a KYC document from a React Native image/document picker asset.
   */
  async uploadDocument(
    documentType: string,
    asset: { uri: string; fileName?: string; mimeType?: string }
  ): Promise<{ documentId: string }> {
    // 1. Get presigned upload URL
    const { uploadUrl, fileKey } = await apiPost<{
      uploadUrl: string;
      fileKey: string;
    }>("/kyc/upload-url", {
      document_type: documentType,
      content_type: asset.mimeType ?? "image/jpeg",
      filename: asset.fileName ?? "document.jpg",
    });

    // 2. Upload to S3 using fetch (React Native compatible)
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
    });

    // 3. Notify backend
    const result = await apiPost<{ documentId: string }>("/kyc/documents", {
      document_type: documentType,
      file_key: fileKey,
    });

    return result;
  },
};
