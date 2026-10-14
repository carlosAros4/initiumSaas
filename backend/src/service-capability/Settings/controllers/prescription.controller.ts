import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Post, Put, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrescriptionService } from '../service/prescription.service';
import { CreatePrescriptionDto, UploadPrescriptionTemplateDto } from '../types/dto/prescription.dto';
import { PrescriptionInitRow } from '../types/interfaces/prescription.repository';
import { Response } from 'express';
import { DocumentGenerator } from 'src/core/utils/document/DocumentGenerator';

@ApiTags('settings')
@Controller({ path: 'settings/prescription' })
export class PrescriptionController {
  private readonly logger = new Logger(PrescriptionController.name);

  constructor(private readonly prescriptionService: PrescriptionService
     
  ) {}

  @Get('init')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Init plantilla de receta',
    description: 'Obtiene el formato de papel (paperformat) de la plantilla de receta configurada.',
  })
  @ApiResponse({ status: 200, description: 'Paperformat obtenido correctamente' })
  @ApiResponse({ status: 404, description: 'No existe plantilla de receta configurada' })
  async init(): Promise<PrescriptionInitRow> {
    this.logger.log('[init] Obteniendo paperformat de la plantilla de receta');
    return this.prescriptionService.getInit();
  }

  @Get('download')
  @ApiOperation({
    summary: 'Descargar plantilla de receta',
    description: 'Descarga la plantilla cruda de receta: HTML (type PDF) o archivo .xlsx (type EXCEL).',
  })
  @ApiResponse({ status: 200, description: 'Plantilla descargada correctamente' })
  @ApiResponse({ status: 404, description: 'No existe plantilla de receta configurada' })
  async download(@Res() response: Response) {
    this.logger.log('[download] Descargando plantilla de receta');
    const template = await this.prescriptionService.downloadTemplate();
    const buffer = Buffer.from(template.content, 'utf-8');
    response.set({
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'attachment; filename="prescription-template.hbs"',
      'Content-Length': buffer.length,
    });
    response.end(buffer);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Subir plantilla de receta',
    description: 'Actualiza el contenido (Handlebars/HTML) y el formato de papel de la plantilla de receta.',
  })
  @ApiResponse({ status: 200, description: 'Plantilla actualizada correctamente' })
  @ApiResponse({ status: 404, description: 'No existe plantilla de receta configurada' })
  async upload(@Body() body: UploadPrescriptionTemplateDto): Promise<{ message: string }> {
    this.logger.log('[upload] Subiendo plantilla de receta');
    return this.prescriptionService.uploadTemplate(body);
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resetear plantilla de receta',
    description: 'Restaura la plantilla de receta a la versión por defecto.',
  })
  @ApiResponse({ status: 200, description: 'Plantilla restaurada correctamente' })
  async reset(): Promise<{ message: string }> {
    this.logger.log('[reset] Reseteando plantilla de receta');
    return this.prescriptionService.resetTemplate();
  }

    @Post('preview')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prescription (PDF)',
    description: 'Genera y descarga la receta en formato PDF.',
  })
  @ApiResponse({ status: 201, description: 'PDF generado exitosamente' })
  async preview(@Body() body: CreatePrescriptionDto, @Res() response: Response) {

    const pdf = await this.prescriptionService.createPrescription(body,true);
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="preview_receta.pdf"',
      'Content-Length': pdf.length,
    });

    response.end(pdf);
  }

  @Post('pdf')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prescription (PDF)',
    description: 'Genera y descarga la receta en formato PDF.',
  })
  @ApiResponse({ status: 201, description: 'PDF generado exitosamente' })
  async createPrescriptionPdf(@Body() body: CreatePrescriptionDto, @Res() response: Response) {
    const pdf = await this.prescriptionService.createPrescription(body);

    const name = body.nombrePaciente
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition':`attachment; filename="${name}.pdf"`,
      'Content-Length': pdf.length,
    });

    response.end(pdf);
  }

}
