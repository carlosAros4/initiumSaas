import { Injectable, Logger } from '@nestjs/common';
import { CreatePrescriptionDto } from '../types/dto/prescription.dto';
import { DocumentGenerator } from '../../../core/utils/DocumentGenerator';

@Injectable()
export class PrescriptionService {
  private readonly logger = new Logger(PrescriptionService.name);

  constructor(private readonly documentGenerator: DocumentGenerator) {}

  async createPrescription(dto: CreatePrescriptionDto): Promise<Buffer> {
    this.logger.log('[createPrescription] Generando PDF de prescription');




    // const dataPDF = {
    //   nombre: dto.nombre,
    //   edad: dto.edad,
    //   medico: dto.medico,
    // };

    
    const dataPDF = {
      medico_nombre: 'carlos',
      edad:22,
      medico: 'medicas',
    };
    const pdf = await this.documentGenerator.generatePDF({
      code: 'receta-pdf',
      data: dataPDF,
    });

    return pdf;
  }
}
