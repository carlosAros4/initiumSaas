export interface DoctorSignatureData {
  signatureImage: string | null;
  professionalRegistry:string | null;
  specialty:string | null;

}

export interface UpsertDoctorSignatureRequest {
  professionalRegistry: string;
  specialty?: string | null;
  signatureImage?: string | null;
}
