import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('settings')
@Controller({ path: 'settings/prescription' })
export class PrescriptionController {
  private readonly logger = new Logger(PrescriptionController.name);

  // El módulo de prescription se implementará en una tarea posterior.
}
