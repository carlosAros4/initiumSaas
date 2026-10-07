export const PRESCRIPTION_REPOSITORY = 'PRESCRIPTION_REPOSITORY';

export interface IPrescriptionRepository {
  createPrescription(tenant: string, items: [string, string][]): Promise<void>;
}
