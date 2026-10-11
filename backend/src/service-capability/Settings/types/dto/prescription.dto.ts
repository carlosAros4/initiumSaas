import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
