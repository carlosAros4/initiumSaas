import { TypeDocument } from '../../../../core/utils/document/DocumentGenerator';

export const PRESCRIPTION_REPOSITORY = 'PRESCRIPTION_REPOSITORY';

/** Plantilla de receta recuperada para descarga. */
export interface PrescriptionTemplateRow {
  id: number;
  code: string;
  type: TypeDocument;
  content: string | null;
  file: Buffer | null;
}

export interface IPrescriptionRepository {
  /** Obtiene la plantilla de receta del tenant (o null si no existe). */
  getTemplate(tenant: string, code: string): Promise<PrescriptionTemplateRow | null>;

  /** Elimina (resetea) la plantilla de receta del tenant. Devuelve true si borró algo. */
  resetTemplate(tenant: string, code: string): Promise<boolean>;
}
