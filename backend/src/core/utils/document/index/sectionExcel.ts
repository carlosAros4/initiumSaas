import * as Handlebars from 'handlebars';
import * as ExcelJS from 'exceljs';

  /**
   * Genera un documento Excel a partir de una plantilla
   */
  export async function generateExcel(data:Record<string, unknown>,plantilla): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(plantilla as unknown as ExcelJS.Buffer);

    workbook.eachSheet((worksheet) => {
      expandListRows(worksheet, data);

      worksheet.eachRow({ includeEmpty: false }, (row) => {
        row.eachCell({ includeEmpty: false }, (cell) => {
          if (typeof cell.value === 'string') {
            cell.value = replaceTokens(cell.value, data);
          }
        });
      });
    });
    const outBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(outBuffer);
  }

  function expandListRows(worksheet: ExcelJS.Worksheet, data: Record<string, unknown>): void {
    const listTokenRegex = /\{\{\s*#([\w]+)(?:\.[\w.]+)?\s*\}\}/;

    const templateRows: { rowNumber: number; listKey: string }[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      let listKey: string | null = null;
      row.eachCell({ includeEmpty: false }, (cell) => {
        if (typeof cell.value === 'string') {
          const match = cell.value.match(listTokenRegex);
          if (match) listKey = match[1];
        }
      });
      if (listKey) templateRows.push({ rowNumber, listKey });
    });

    // Procesa de abajo hacia arriba para que los índices no se desplacen.
    for (let i = templateRows.length - 1; i >= 0; i--) {
      const { rowNumber, listKey } = templateRows[i];
      const list = resolvePath(data, listKey);
      const items = Array.isArray(list) ? (list as Record<string, unknown>[]) : [];

      const templateRow = worksheet.getRow(rowNumber);
      const templateValues = (templateRow.values as unknown[]).slice();

      // Inserta una fila por cada item justo debajo de la plantilla.
      for (let j = 0; j < items.length; j++) {
        const newRow = worksheet.insertRow(rowNumber + 1 + j, []);
        // Clona estilo y alto de la fila plantilla.
        newRow.height = templateRow.height;
        for (let col = 1; col < templateValues.length; col++) {
          const srcCell = templateRow.getCell(col);
          const dstCell = newRow.getCell(col);
          dstCell.style = { ...srcCell.style };
          const srcVal = templateValues[col];
          if (typeof srcVal === 'string') {
            dstCell.value = replaceListTokens(srcVal, listKey, items[j]);
          } else {
            dstCell.value = srcVal as ExcelJS.CellValue;
          }
        }
      }

      // Elimina la fila plantilla original.
      worksheet.spliceRows(rowNumber, 1);
    }
  }

  /**
   * Reemplaza tokens de lista {{#lista.campo}} por item.campo.
   * {{#lista}} suelto se reemplaza por el valor del propio item.
   */
  function replaceListTokens(text: string, listKey: string, item: Record<string, unknown>): string {
    const regex = new RegExp(`\\{\\{\\s*#${listKey}(?:\\.([\\w.]+))?\\s*\\}\\}`, 'g');
    return text.replace(regex, (_match, field?: string) => {
      const value = field ? resolvePath(item, field) : item;
      return value === undefined || value === null ? '' : String(value);
    });
  }

  /** Reemplaza tokens {{clave}} en un string por los valores de `data`. */
  function replaceTokens(text: string, data: Record<string, unknown>): string {
    return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
      const value = resolvePath(data, key);
      return value === undefined || value === null ? '' : String(value);
    });
  }

  /** Resuelve una ruta tipo "cliente.nombre" dentro de un objeto. */
  function resolvePath(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, part) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }