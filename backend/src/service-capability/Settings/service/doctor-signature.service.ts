import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';

import {
  DOCTORSIGNATURE_REPOSITORY,
  IDoctorSignatureRepository,
} from '../types/interfaces/doctorSignature.repository';
import { UpsertDoctorSignatureRequest } from '../types/dto/doctor-signature.dto';

@Injectable()
export class DoctorSignatureService {
  private readonly logger = new Logger(DoctorSignatureService.name);

  constructor(
    @Inject(DOCTORSIGNATURE_REPOSITORY) private readonly repository: IDoctorSignatureRepository,
     
  ) {}

  async getMySignature() {
    const signature = await this.repository.getDoctorSignature();
    return signature
  }

  async upsertMySignature(data: UpsertDoctorSignatureRequest) {

    if (!data.professionalRegistry?.trim()) {
      throw new BadRequestException('El registro profesional es obligatorio');
    }
    if (data.signatureImage && !/^data:image\/(png|jpe?g);base64,/.test(data.signatureImage)) {
      throw new BadRequestException('La firma debe ser una imagen PNG o JPG');
    }
    await this.repository.upsertDoctorSignature({
      professionalRegistry: data.professionalRegistry.trim(),
      specialty: data.specialty ?? null,
      signatureImage: data.signatureImage ?? null,
    });
  }

  }
