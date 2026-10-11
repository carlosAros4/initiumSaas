import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { paperFormart } from '../../../../core/utils/document/index/sectionPDF';

/** Un medicamento dentro de la receta. */
export class PrescriptionMedicationDto {
  @ApiProperty({ description: 'Nombre del medicamento', example: 'Amoxicilina' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Dosis', example: '500 mg' })
  @IsString()
  @IsNotEmpty()
  dosis: string;

  @ApiProperty({ description: 'Frecuencia', example: 'Cada 8 horas' })
  @IsString()
  @IsNotEmpty()
  frecuencia: string;
}
/**
 * DTO para generar/probar una receta veterinaria.
 * Contiene los datos del paciente, su tutor y la lista de medicamentos.
 */
export class CreatePrescriptionDto {
  // ─── Paciente ───
  @ApiProperty({ description: 'Nombre del paciente', example: 'Firulais' })
  @IsString()
  @IsNotEmpty()
  nombrePaciente?: string;

  @ApiPropertyOptional({ description: 'Raza', example: 'Labrador' })
  @IsOptional()
  @IsString()
  raza?: string;

  @ApiPropertyOptional({ description: 'Especie', example: 'Canino' })
  @IsOptional()
  @IsString()
  especie?: string;

  @ApiPropertyOptional({ description: 'Sexo', example: 'Macho' })
  @IsOptional()
  @IsString()
  sexo?: string;

  @ApiPropertyOptional({ description: 'Edad', example: '3 años' })
  @IsOptional()
  @IsString()
  edad?: string;

  @ApiPropertyOptional({ description: 'Peso', example: '12 kg' })
  @IsOptional()
  @IsString()
  peso?: string;

  // ─── Tutor ───
  @ApiPropertyOptional({ description: 'Nombre del tutor', example: 'Carlos Pérez' })
  @IsOptional()
  @IsString()
  tutor?: string;

  @ApiPropertyOptional({ description: 'Teléfono del tutor', example: '+56 9 1234 5678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  // ─── Medicamentos ───
  @ApiProperty({
    description: 'Lista de medicamentos',
    type: [PrescriptionMedicationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionMedicationDto)
  medicamentos: PrescriptionMedicationDto[];
}

export interface PrescriptionResponse {
  message: string;
}

/**
 * DTO para subir/actualizar la plantilla de receta.
 * Ambos campos son opcionales: se puede subir una plantilla nueva (`content`),
 * cambiar solo el formato de papel (`paperformat`), o ambos.
 */
export class UploadPrescriptionTemplateDto {
  @ApiPropertyOptional({
    description: 'Plantilla Handlebars/HTML de la receta (opcional)',
    example: '<html><body>{{paciente_nombre}}</body></html>',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'content no puede estar vacío' })
  content?: string;

  @ApiPropertyOptional({
    description: 'Formato de papel (opcional)',
    enum: ['letter', 'legal', 'tabloid', 'ledger', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'],
    example: 'a4',
  })
  @IsOptional()
  @IsIn(['letter', 'legal', 'tabloid', 'ledger', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6'])
  paperformat?: paperFormart;
}
