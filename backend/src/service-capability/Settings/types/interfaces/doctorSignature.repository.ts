import { DoctorSignatureData } from "../dto/doctor-signature.dto";

export const DOCTORSIGNATURE_REPOSITORY = 'DOCTORSIGNATURE_REPOSITORY';

export interface IDoctorSignatureRepository {
  getDoctorSignature(
  ): Promise<DoctorSignatureData | null>;
  upsertDoctorSignature(
    data: DoctorSignatureData,
  );
}
