import { DocumentTemplateItem, TemplateType } from '../dto/document-template.dto';

export const DOCUMENT_TEMPLATE_REPOSITORY = 'DOCUMENT_TEMPLATE_REPOSITORY';

export interface CreateTemplateData {
  code: string;
  description: string | null;
  type: TemplateType;
  content: string | null;
  file: Buffer | null;
}

export interface UpdateTemplateData {
  description: string | null;
  content: string | null;
  file: Buffer | null;
}

export interface IDocumentTemplateRepository {
  listTemplates(tenant: string): Promise<DocumentTemplateItem[]>;
  existsByCode(tenant: string, code: string): Promise<boolean>;
  createTemplate(tenant: string, data: CreateTemplateData): Promise<number>;
  updateTemplate(tenant: string, id: number, data: UpdateTemplateData): Promise<void>;
  deleteTemplate(tenant: string, id: number): Promise<void>;
}
