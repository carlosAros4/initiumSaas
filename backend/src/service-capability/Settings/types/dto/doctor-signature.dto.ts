export interface DoctorSignatureData {
  signatureImage: string | null;
  professionalRegistry:string | null;
  specialty:string | null;
  rcmv:number | null;
}

export interface UpsertDoctorSignatureRequest {
  professionalRegistry: string | null;
  specialty?: string | null;
  signatureImage?: string | null;
  rcmv:number | null;
}
