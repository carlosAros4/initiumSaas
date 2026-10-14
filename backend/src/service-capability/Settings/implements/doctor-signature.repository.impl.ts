import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../../core/database/database.module';
import { IDoctorSignatureRepository } from '../types/interfaces/doctorSignature.repository';
import { DoctorSignatureData } from '../types/dto/doctor-signature.dto';
import { SessionContextService } from 'src/core/providers/user-session';


@Injectable()
export class DoctorSignatureRepositoryImpl implements IDoctorSignatureRepository {
  private readonly logger = new Logger(DoctorSignatureRepositoryImpl.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly session: SessionContextService,
  ) { }

 
  async getDoctorSignature(): Promise<DoctorSignatureData | null> {
    const tenant = this.session.getTenant();
    const rut = this.session.getRut();

    const result = await this.pool.query(
      `SELECT * FROM "${tenant}".doctor_signature
       WHERE rut = $1`,
      [rut],
    );
    if (result.rowCount === 0) return null;

    const {professional_registry,specialty,signature_image,rcmv} =  result.rows[0]
    return {
      professionalRegistry: professional_registry,
      specialty: specialty,
      signatureImage: signature_image,
      rcmv
    };
  }

  async upsertDoctorSignature(data: DoctorSignatureData) {
    const tenant = this.session.getTenant();
    const rut = this.session.getRut();

    this.logger.log(
      `[upsertDoctorSignature] tenant: ${tenant} — user: ${rut}`,
    );
    await this.pool.query(
      `INSERT INTO "${tenant}".doctor_signature
      (rut, professional_registry, specialty, signature_image,rcmv)
    VALUES ($1, $2, $3, $4,$5)
    ON CONFLICT (rut)
    DO UPDATE SET
      professional_registry = EXCLUDED.professional_registry,
      specialty = EXCLUDED.specialty,
      signature_image = EXCLUDED.signature_image,
      rcmv= EXCLUDED.rcmv;`,
      [
        rut,
        data.professionalRegistry,
        data.specialty ?? null,
        data.signatureImage ?? null,
        data.rcmv ?? null
      ],
    );
  }
}
