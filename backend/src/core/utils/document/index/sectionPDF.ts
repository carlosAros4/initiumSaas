import puppeteer from "puppeteer";
import * as Handlebars from 'handlebars';



export  type paperFormart = 'letter'|'legal'|'tabloid'|'ledger'|'a0'|'a1'|'a2'|'a3'|'a4'|'a5'|'a6';
/**
 * Genera un documento PDF a partir de una plantilla Handlebars.
 * @param input.code código de la plantilla en la tabla document_template
 * @param input.data arreglo de objetos para pasar a la plantilla
 * @returns Buffer con el contenido del PDF
 */
export async function generatePDF(data: Record<string, unknown>, plantilla, format: paperFormart, preview?: boolean): Promise<Buffer> {

    // 1) Extrae el footer ANTES de Handlebars, para preservar {{number-page}}
    //    y {{total-page}} (que no están en `data` y Handlebars vaciaría).
    const { html: bodyTemplate, footerTemplate } = extractFooter(plantilla);
    const hasFooter = footerTemplate !== null;

    // 2) Handlebars solo sobre el body (sin el footer).
    const templateGenerate = Handlebars.compile(bodyTemplate);
    let html = templateGenerate(data);

    // 3) En modo preview se inyecta una marca de agua que identifica el
    //    documento como una prueba no válida para presentar.
    if (preview) {
        html = injectWatermark(html);
    }

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'load' });

        const pdfBuffer = await page.pdf({
            format,
         
        });

        return Buffer.from(pdfBuffer);
    } catch (error) {
        this.logger.error(`[generatePDF] Error generando PDF: ${error}`);
        throw error;
    } finally {
        await browser.close();
    }
}

function injectWatermark(html: string): string {

    const prewiewStyle = `
    <style>
      @media print {
        .__preview-watermark { position: fixed; }
      }
      .__preview-watermark {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        pointer-events: none;
        overflow: hidden;
      }
      .__preview-watermark span {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-35deg);
        white-space: nowrap;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 42px;
        font-weight: 700;
        letter-spacing: 2px;
        color: rgba(220, 38, 38, 0.09);
        text-transform: uppercase;
      }
    </style>`;

    const previewText = `<div class="__preview-watermark"><span>DOCUMENTO NO VÁLIDO</span></div>`;

    // Si existe <body>, insertamos justo después de su apertura; de lo
    // contrario anteponemos el overlay al inicio del documento.
    if (/<body[^>]*>/i.test(html)) {
        return html
            .replace(/<\/head>/i, `${prewiewStyle}</head>`)
            .replace(/(<body[^>]*>)/i, `$1${previewText}`);
    }

    return `${prewiewStyle}${previewText}${html}`;
}

  /**
   * Extrae de la plantilla el elemento marcado con el atributo `data-pdf-footer`
   * y lo convierte en el footerTemplate de Puppeteer.
   *
   * En la plantilla el usuario escribe, por ejemplo:
   *   <div data-pdf-footer style="...">pagina {{number-page}} de {{total-page}}</div>
   *
   * Los tokens {{number-page}} y {{total-page}} se traducen a los spans que
   * Puppeteer rellena por página (pageNumber / totalPages).
   *
   * @returns html del body sin el footer, y el footerTemplate (o null si no hay).
   */
  function extractFooter(html: string): { html: string; footerTemplate: string | null } {
    const footerRegex = /<([a-z]+)[^>]*\sdata-pdf-footer[^>]*>[\s\S]*?<\/\1>/i;
    const match = html.match(footerRegex);

    if (!match) return { html, footerTemplate: null };

    const footerHtml = match[0]
        .replace(/\{\{\s*number-page\s*\}\}/g, '<span class="pageNumber"></span>')
        .replace(/\{\{\s*total-page\s*\}\}/g, '<span class="totalPages"></span>');

    // Puppeteer no hereda el CSS del documento en el footer, por eso se envía
    // el bloque tal cual (con sus estilos inline) envuelto para ocupar el ancho.
    const footerTemplate = `<div style="width:100%;">${footerHtml}</div>`;

    // Quita el footer del body para que no aparezca también dentro del contenido.
    const htmlWithoutFooter = html.replace(match[0], '');

    return { html: htmlWithoutFooter, footerTemplate };
}