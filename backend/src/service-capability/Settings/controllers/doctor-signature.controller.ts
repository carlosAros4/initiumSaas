import { Body, Controller, Get, HttpCode, HttpStatus, Logger,Post} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DoctorSignatureService } from '../service/doctor-signature.service';
import { UpsertDoctorSignatureRequest } from '../types/dto/doctor-signature.dto';

@ApiTags('settings')
@Controller({ path: 'settings/doctor-signature' })
export class DoctorSignatureController {
  private readonly logger = new Logger(DoctorSignatureController.name);

  constructor(private readonly service: DoctorSignatureService) {}
 @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener la firma y datos profesionales del doctor conectado' })
  async getSignature() {
    this.logger.log('[getSignature]');
    return this.service.getMySignature();
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crear o actualizar la firma del doctor conectado' })
  async upsertSignature(@Body() body: UpsertDoctorSignatureRequest) {
    this.logger.log('[upsertSignature]');
    return this.service.upsertMySignature(body);
  }
}
