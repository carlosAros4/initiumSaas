import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrescriptionService } from '../service/prescription.service';
import { CreatePrescriptionDto } from '../types/dto/prescription.dto';
import { Response } from 'express';
import { DocumentGenerator } from 'src/core/utils/document/DocumentGenerator';

@ApiTags('settings')
@Controller({ path: 'settings/prescription' })
export class PrescriptionController {
  private readonly logger = new Logger(PrescriptionController.name);

  constructor(private readonly prescriptionService: PrescriptionService,
    private readonly documentGenerator: DocumentGenerator
  ) {}


    @Post('preview')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prescription (PDF)',
    description: 'Genera y descarga la receta en formato PDF.',
  })
  @ApiResponse({ status: 201, description: 'PDF generado exitosamente' })
  async preview(@Body() body: CreatePrescriptionDto, @Res() response: Response) {

      const data = {
        medico_nombre:'',
        medico_especialidad:'',
        medico_rut:'',
        medico_firma:'',
        medico_email:'',

        paciente_nombre:body.nombrePaciente,
        paciente_especie:body.especie,
        paciente_raza:body.raza,
        paciente_sexo:body.sexo,
        paciente_edad:body.edad,
        paciente_peso:body.peso,
        paciente_tutor:body.tutor,
        paciente_telefono:body.telefono,
        medicamentos:body.medicamentos?.map((map)=>{return {
            medicamento_nombre:map.nombre,
            medicamento_dosis:map.dosis,
            medicamento_frecuencia:map.frecuencia
        }})

        
      } 
    const pdf = await this.documentGenerator.createDocument({
        type:'PDF',
        code: 'receta-digital',
        data,
      });
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="prescription.pdf"',
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

    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="prescription.pdf"',
      'Content-Length': pdf.length,
    });

    response.end(pdf);
  }


  @Post('excel')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear prescription (Excel)',
    description: 'Genera y descarga la receta en formato Excel.',
  })
  @ApiResponse({ status: 201, description: 'Excel generado exitosamente' })
  async createPrescriptionExcel(@Body() body: CreatePrescriptionDto, @Res() response: Response) {
    const excel = await this.prescriptionService.createPrescriptionExcel(body);

    response.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="prescription.xlsx"',
      'Content-Length': excel.length,
    });

    response.end(excel);
  }
}
