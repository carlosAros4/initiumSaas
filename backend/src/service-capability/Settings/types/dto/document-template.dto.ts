import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export type TemplateType = 'pdf' | 'excel';

/**
 * DTO para crear/guardar una plantilla de documento.
 * - type 'pdf'   → requiere `content` (string Handlebars)
 * - type 'excel' → requiere `fileBase64` (archivo .xlsx en base64)
 */
export class CreateDocumentTemplateDto {
  @ApiProperty({ description: 'Código lógico único de la plantilla', example: 'recibo-venta' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Descripción de la plantilla', example: 'Recibo de venta en PDF' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Tipo de plantilla', enum: ['pdf', 'excel'], example: 'pdf' })
  @IsIn(['pdf', 'excel'])
  type: TemplateType;

  @ApiPropertyOptional({
    description: 'Plantilla Handlebars (solo type=pdf)',
    example: '<html><body>Hola {{cliente}}</body></html>',
  })
  @ValidateIf((o) => o.type === 'pdf')
  @IsString()
  @IsNotEmpty({ message: 'content es requerido para plantillas de tipo pdf' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Archivo .xlsx base en base64 (solo type=excel)',
  })
  @ValidateIf((o) => o.type === 'excel')
  @IsString()
  @IsNotEmpty({ message: 'fileBase64 es requerido para plantillas de tipo excel' })
  fileBase64?: string;
}

/** DTO para actualizar una plantilla existente (todos los campos opcionales). */
export class UpdateDocumentTemplateDto {
  @ApiPropertyOptional({ description: 'Descripción de la plantilla' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Plantilla Handlebars (type=pdf)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Archivo .xlsx base en base64 (type=excel)' })
  @IsOptional()
  @IsString()
  fileBase64?: string;
}

/** Item de plantilla para listados (sin el binario/content pesado). */
export interface DocumentTemplateItem {
  id: number;
  code: string;
  description: string | null;
  type: TemplateType;
  created_at: Date;
  updated_at: Date;
}

export interface DocumentTemplateResponse {
  message: string;
  id?: number;
}
