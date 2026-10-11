import { TypeDocument } from '../../../../core/utils/document/DocumentGenerator';
import { paperFormart } from '../../../../core/utils/document/index/sectionPDF';

export const PRESCRIPTION_REPOSITORY = 'PRESCRIPTION_REPOSITORY';

export interface PrescriptionTemplateRow {
  content: string;
}

export interface PrescriptionInitRow {
  paperformat: paperFormart | null;
}

export interface IPrescriptionRepository {
  downloadTemplate(code: string): Promise<PrescriptionTemplateRow | null>;


  getInit(code: string): Promise<PrescriptionInitRow | null>;

  uploadTemplate(
    code: string,
    content?: string,
    paperformat?: paperFormart,
  ): Promise<boolean>;

  resetTemplate(code: string): Promise<boolean>;
}
