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
import { formatRut } from '../../../../core/utils/rut.utils';

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

    // ─── Tutor ───
  @ApiPropertyOptional({ description: 'diagnostico', example: '' })
  @IsOptional()
  @IsString()
  diagnostico?: string;
  /**
   * Construye el objeto de datos usado para renderizar la plantilla de receta,
   * combinando los datos del paciente con los del médico (usuario + firma).
   */
  buildDataPrescription(
    user: { firstName: string; lastName: string; rut: string; dv: string; email: string },
    signature: { professionalRegistry?: string; specialty?: string; signatureImage?: string ,rcmv:number},
  ): Record<string, unknown> {
    return {
      medico_nombre: `${user.firstName} ${user.lastName}`,
      medico_profesion: signature.professionalRegistry ?? '',
      medico_especialidad: signature.specialty ?? '',
      medico_rut: formatRut(user.rut, user.dv),
      medico_firma: signature.signatureImage ?? '',
      medico_email: user.email,
      medico_rcmv:signature.rcmv,
      paciente_nombre: this.nombrePaciente,
      paciente_especie: this.especie,
      paciente_raza: this.raza,
      paciente_sexo: this.sexo,
      paciente_edad: this.edad,
      paciente_peso: this.peso,
      paciente_tutor: this.tutor,
      paciente_telefono: this.telefono,
      fecha: new Date().toLocaleDateString('es-CL'),
      diagnostico:this.diagnostico,
      medicamentos: this.medicamentos?.map((map) => ({
          medicamento_nombre: map.nombre,
          medicamento_dosis: map.dosis,
          medicamento_frecuencia: map.frecuencia,
      })),
    };
  }
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
