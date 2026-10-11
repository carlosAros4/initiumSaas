import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePrescriptionDto } from '../types/dto/prescription.dto';
import { DocumentGenerator, TypeDocument } from '../../../core/utils/document/DocumentGenerator';
import {
  IPrescriptionRepository,
  PRESCRIPTION_REPOSITORY,
  PrescriptionTemplateRow,
} from '../types/interfaces/prescription.repository';
import { USER_SESSION, UserSession } from 'src/core/providers/user-session';

/** Código lógico de la plantilla de receta en document_template. */
export const PRESCRIPTION_TEMPLATE_CODE = 'prescription';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    private readonly documentGenerator: DocumentGenerator,
    @Inject(PRESCRIPTION_REPOSITORY) private readonly repository: IPrescriptionRepository,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  private getTenant(): string {
    if (!this.userSession || !this.userSession.tenant_id) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return this.userSession.tenant_id;
  }

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

  async createPrescriptionExcel(dto: CreatePrescriptionDto): Promise<Buffer> {
    this.logger.log('[createPrescriptionExcel] Generando Excel de receta');
    return this.documentGenerator.createDocument({
      type: 'EXCEL',
      code: PRESCRIPTION_TEMPLATE_CODE,
      data: this.buildTemplateData(dto),
    });
  }

  /** Devuelve la plantilla cruda (content o file) para descarga. */
  async getTemplate(): Promise<PrescriptionTemplateRow> {
    this.logger.log('[getTemplate] Obteniendo plantilla de receta');
    const tenant = this.getTenant();
    const template = await this.repository.getTemplate(tenant, PRESCRIPTION_TEMPLATE_CODE);
    if (!template) {
      throw new NotFoundException('No existe una plantilla de receta configurada');
    }
    return template;
  }

  /** Elimina la plantilla de receta (reset). */
  async resetTemplate(): Promise<{ message: string }> {
    this.logger.log('[resetTemplate] Reseteando plantilla de receta');
    const tenant = this.getTenant();
    const deleted = await this.repository.resetTemplate(tenant, PRESCRIPTION_TEMPLATE_CODE);
    return {
      message: deleted
        ? 'Plantilla de receta eliminada correctamente'
        : 'No había plantilla de receta que eliminar',
    };
  }
}

/** Reexport para uso en el controller. */
export type { TypeDocument };
