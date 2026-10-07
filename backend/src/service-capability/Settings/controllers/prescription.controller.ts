import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrescriptionService } from '../service/prescription.service';
import { CreatePrescriptionDto, PrescriptionResponse } from '../types/dto/prescription.dto';
import { Response } from 'express';
@ApiTags('settings')
@Controller({ path: 'settings/prescription' })
export class PrescriptionController {
  private readonly logger = new Logger(PrescriptionController.name);

  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prescription',
    description: 'Recibe un arreglo de pares [string, string] y los registra.',
  })
  @ApiResponse({ status: 201, description: 'Prescription creada exitosamente' })
  async createPrescription(@Body() body: CreatePrescriptionDto,@Res() response: Response,) {


    const pdf = await this.prescriptionService.createPrescription(body);

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="tsssb2.pdf"',
      'Content-Length': pdf.length,
    });

    response.end(pdf);
  }
}
