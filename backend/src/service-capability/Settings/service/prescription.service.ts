import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePrescriptionDto, UploadPrescriptionTemplateDto } from '../types/dto/prescription.dto';
import { DocumentGenerator, TypeDocument } from '../../../core/utils/document/DocumentGenerator';
import {
  IPrescriptionRepository,
  PRESCRIPTION_REPOSITORY,
  PrescriptionInitRow,
  PrescriptionTemplateRow,
} from '../types/interfaces/prescription.repository';

export const PRESCRIPTION_TEMPLATE_CODE = 'receta-digital';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    private readonly documentGenerator: DocumentGenerator,
    @Inject(PRESCRIPTION_REPOSITORY) private readonly repository: IPrescriptionRepository,
  ) {}

  /** Mapea el DTO al objeto de datos que consume la plantilla (Handlebars / Excel). */
  private buildTemplateData(dto: CreatePrescriptionDto): Record<string, unknown> {
    return {
      nombrePaciente: dto.nombrePaciente,
      raza: dto.raza ?? '',
      especie: dto.especie ?? '',
      sexo: dto.sexo ?? '',
      edad: dto.edad ?? '',
      peso: dto.peso ?? '',
      tutor: dto.tutor ?? '',
      telefono: dto.telefono ?? '',
      fecha: new Date().toLocaleDateString('es-CL'),
      medicamentos: (dto.medicamentos ?? []).map((m) => ({
        nombre: m.nombre,
        dosis: m.dosis,
        frecuencia: m.frecuencia,
      })),
    };
  }

  async createPrescription(dto: CreatePrescriptionDto): Promise<Buffer> {
    this.logger.log('[createPrescription] Generando PDF de receta');
    return this.documentGenerator.createDocument({
      type: 'PDF',
      code: PRESCRIPTION_TEMPLATE_CODE,
      data: this.buildTemplateData(dto),
    });
  }

  async downloadTemplate(): Promise<PrescriptionTemplateRow> {
    this.logger.log('[getTemplate] Obteniendo plantilla de receta');
    const template = await this.repository.downloadTemplate(PRESCRIPTION_TEMPLATE_CODE);
    if (!template) {
      throw new NotFoundException('No existe una plantilla de receta configurada');
    }
    return template;
  }

  /** Devuelve el formato de papel de la plantilla (para inicializar el editor). */
  async getInit(): Promise<PrescriptionInitRow> {
    this.logger.log('[getInit] Obteniendo paperformat de la plantilla de receta');
    const init = await this.repository.getInit(PRESCRIPTION_TEMPLATE_CODE);
    if (!init) {
      throw new NotFoundException('No existe una plantilla de receta configurada');
    }
    return init;
  }

  /**
   * Sube/actualiza la plantilla de receta. Permite subir una plantilla nueva (`content`),
   * cambiar solo el formato de papel (`paperformat`), o ambos.
   */
  async uploadTemplate(dto: UploadPrescriptionTemplateDto): Promise<{ message: string }> {
    this.logger.log('[uploadTemplate] Actualizando plantilla de receta');

    if (dto.content === undefined && dto.paperformat === undefined) {
      throw new BadRequestException('Debes enviar al menos content o paperformat');
    }

    const updated = await this.repository.uploadTemplate(
      PRESCRIPTION_TEMPLATE_CODE,
      dto.content,
      dto.paperformat,
    );
    if (!updated) {
      throw new NotFoundException('No existe una plantilla de receta configurada');
    }
    return { message: 'Plantilla de receta actualizada correctamente' };
  }

  /** Resetea la plantilla de receta restaurando el contenido/paperformat por defecto. */
  async resetTemplate(): Promise<{ message: string }> {
    this.logger.log('[resetTemplate] Reseteando plantilla de receta a la versión por defecto');
    const updated = await this.repository.resetTemplate(PRESCRIPTION_TEMPLATE_CODE);
    if (!updated) {
      throw new NotFoundException('No existe una plantilla de receta configurada');
    }
    return {
      message: 'Plantilla de receta restaurada a la versión por defecto',
    };
  }
}

/** Reexport para uso en el controller. */
export type { TypeDocument };
