import { Inject, Injectable, Logger, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import * as Handlebars from 'handlebars';
import * as ExcelJS from 'exceljs';
import puppeteer from 'puppeteer';
import { PG_POOL } from '../database/database.module';
import { USER_SESSION, UserSession } from '../providers/user-session';

export type TypeDocument = 'PDF' | 'EXCEL';


export interface DocumentTemplate {
  id: number;
  code: string;
  description: string | null;
  type: TypeDocument;
  content: string | null;
  file: Buffer | null;
  created_at: Date;
  updated_at: Date;
}

export interface RequestDocument {
  code: string;
  data: Record<string, unknown>;
}

@Injectable()
export class DocumentGenerator {
  private readonly logger = new Logger(DocumentGenerator.name);

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  /** obtener tennant */
  private getTenant(): string {
    if (!this.userSession || !this.userSession.tenant_id) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return this.userSession.tenant_id;
  }

  /**
   * Obtiene una plantilla de documento desde la base de datos por su código.
   * El tenant se toma de la sesión.
   *
   * @throws NotFoundException si no existe
   */
  async getTemplate(code: string,type:TypeDocument): Promise<string |Buffer> {
    const tenant = this.getTenant();
    this.logger.log(`[getTemplate] Obteniendo plantilla "${code}" — tenant: ${tenant}`);

    const result = await this.pool.query<DocumentTemplate>(
      `SELECT type, content, file
       FROM "${tenant}".document_template
       WHERE code = $1`,
      [code],
    );

    if (result.rows.length === 0) {
      this.logger.warn(`[getTemplate] Plantilla "${code}" no encontrada — tenant: ${tenant}`);
      throw new NotFoundException(`No existe la plantilla con código "${code}"`);
    }

    if((type ==='PDF' && result.rows[0].content === null )||(type ==='EXCEL' && result.rows[0].file === null ) ){
      
      throw new NotFoundException(`No existe la plantilla con código "${code}" para el tipo ${type}`);

    }
    return result.rows[0] && type === 'PDF'?result.rows[0].content:result.rows[0].file ;
  }

  renderHtml(content: string, data: Record<string, unknown> = {}): string {
    const template = Handlebars.compile(content);
    return template(data);
  }

  /**
   * Genera un documento PDF a partir de una plantilla Handlebars.
   * @param input.code código de la plantilla en la tabla document_template
   * @param input.data arreglo de objetos para pasar a la plantilla
   * @returns Buffer con el contenido del PDF
   */
  async generatePDF(input: RequestDocument): Promise<Buffer> {
    const { code, data } = input;

    if (!code || !data) throw new BadRequestException('parametros de entrada sin ');

    // Obtener la plantilla Handlebars (content string) desde la BD
    let template: string;
    try {
      template = (await this.getTemplate(code, 'PDF')) as string;
    } catch (error) {
      this.logger.error(`[generatePDF] documento template no encontrado para [${code}]`);
      throw error;
    }

    this.logger.log(`[generatePDF] Generando PDF — code: ${code}`);

    const html = this.renderHtml(template, data);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      this.logger.log(`[generatePDF] PDF generado (${pdfBuffer.length} bytes)`);
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`[generatePDF] Error generando PDF: ${error}`);
      throw error;
    } finally {
      await browser.close();
    }
  }

//   // =========================================================================
//   // Excel (plantilla .xlsx + tokens {{x}})
//   // =========================================================================

//   /**
//    * Genera un documento Excel a partir de una plantilla .xlsx base.
//    * Abre la plantilla con exceljs, recorre todas las celdas de texto y
//    * reemplaza los tokens {{clave}} por el valor correspondiente en `data`,
//    * conservando el formato original.
//    *
//    * Si se entrega `code`, busca la plantilla en la BD; si se entrega `file`,
//    * usa ese buffer directamente.
//    *
//    * @returns Buffer con el .xlsx resultante
//    */
//   async generateExcel(options: GenerateExcelOptions): Promise<Buffer> {
//     const { code, file, data = {} } = options;

//     let baseBuffer = file;
//     if (!baseBuffer) {
//       if (!code) throw new BadRequestException('Debe entregar "code" o "file"');
//       const tpl = await this.getTemplate(code);
//       if (tpl.type !== 'excel' || !tpl.file) {
//         throw new BadRequestException(`La plantilla "${code}" no es de tipo excel`);
//       }
//       baseBuffer = tpl.file;
//     }

//     this.logger.log(`[generateExcel] Generando Excel — code: ${code ?? '(inline)'}`);

//     const workbook = new ExcelJS.Workbook();
//     await workbook.xlsx.load(baseBuffer as unknown as ExcelJS.Buffer);

//     // Recorre cada hoja y cada celda, reemplazando tokens {{x}} en strings
//     workbook.eachSheet((worksheet) => {
//       worksheet.eachRow({ includeEmpty: false }, (row) => {
//         row.eachCell({ includeEmpty: false }, (cell) => {
//           if (typeof cell.value === 'string') {
//             cell.value = this.replaceTokens(cell.value, data);
//           }
//         });
//       });
//     });

//     const outBuffer = await workbook.xlsx.writeBuffer();
//     this.logger.log(`[generateExcel] Excel generado (${outBuffer.byteLength} bytes)`);
//     return Buffer.from(outBuffer);
//   }

//   /** Reemplaza tokens {{clave}} en un string por los valores de `data`. */
//   private replaceTokens(text: string, data: Record<string, unknown>): string {
//     return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
//       const value = this.resolvePath(data, key);
//       return value === undefined || value === null ? '' : String(value);
//     });
//   }

//   /** Resuelve una ruta tipo "cliente.nombre" dentro de un objeto. */
//   private resolvePath(obj: Record<string, unknown>, path: string): unknown {
//     return path.split('.').reduce<unknown>((acc, part) => {
//       if (acc && typeof acc === 'object') {
//         return (acc as Record<string, unknown>)[part];
//       }
//       return undefined;
//     }, obj);
//   }
}
