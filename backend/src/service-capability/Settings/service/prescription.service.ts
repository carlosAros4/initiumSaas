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
import { RedisService } from 'src/core/redis';
import { DataCliente } from 'src/service-capability/PostLogin/types/dto/data-cliente';
import { DOCTORSIGNATURE_REPOSITORY, IDoctorSignatureRepository } from '../types/interfaces/doctorSignature.repository';

export const PRESCRIPTION_TEMPLATE_CODE = 'receta-digital';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(
    private readonly documentGenerator: DocumentGenerator,
    @Inject(PRESCRIPTION_REPOSITORY) private readonly repository: IPrescriptionRepository,
    @Inject(DOCTORSIGNATURE_REPOSITORY) private readonly repoSignature: IDoctorSignatureRepository,
    private readonly redis: RedisService,
  ) {}

  async createPrescription(dto: CreatePrescriptionDto,preview?:boolean): Promise<Buffer> {

    //obtenemos los datos basicos del cliente 
    const user = await this.redis.get<DataCliente>('data_cliente');
    //obtener firma y especialidad
    const signature = await this.repoSignature.getDoctorSignature();

    this.logger.log('[createPrescription] Generando PDF de receta');
    return this.documentGenerator.createDocument({
      type: 'PDF',
      code: PRESCRIPTION_TEMPLATE_CODE,
      data: dto.buildDataPrescription(user, signature),
      
    },preview);
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
