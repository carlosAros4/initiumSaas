import { useState } from 'react';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import styles from './TestDocumentTemplates.module.css';

type TemplateType = 'pdf' | 'excel';

interface CreateResponse {
  message: string;
  id?: number;
}

/**
 * Página de TEST para probar el ingreso de plantillas de documentos
 * (PDF con Handlebars y Excel con archivo .xlsx en base64).
 *
 * Endpoint: POST settings/document-templates (clientType privado).
 */
export const TestDocumentTemplates = () => {
  const { fetcher } = useCallApi();

  const [type, setType] = useState<TemplateType>('pdf');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  // PDF: contenido del archivo .hbs/.html leído como texto
  const [content, setContent] = useState<string | null>(null);
  // Excel: archivo .xlsx leído como base64
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  // Resetea el archivo seleccionado al cambiar de tipo
  const changeType = (next: TemplateType) => {
    setType(next);
    setContent(null);
    setFileBase64(null);
    setFileName('');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setContent(null);
      setFileBase64(null);
      setFileName('');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();

    if (type === 'pdf') {
      // PDF: la plantilla Handlebars es texto plano (.hbs/.html)
      reader.onload = () => setContent(String(reader.result));
      reader.readAsText(file);
    } else {
      // Excel: el .xlsx es binario → base64
      reader.onload = () => {
        const res = String(reader.result);
        const base64 = res.includes(',') ? res.split(',').pop()! : res;
        setFileBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!code.trim()) {
      setResult({ ok: false, text: 'El código es obligatorio' });
      return;
    }
    if (type === 'pdf' && !content) {
      setResult({ ok: false, text: 'Debes seleccionar un archivo .hbs o .html' });
      return;
    }
    if (type === 'excel' && !fileBase64) {
      setResult({ ok: false, text: 'Debes seleccionar un archivo .xlsx' });
      return;
    }

    const body =
      type === 'pdf'
        ? { code: code.trim(), description: description.trim() || undefined, type, content }
        : { code: code.trim(), description: description.trim() || undefined, type, fileBase64 };

    try {
      setLoading(true);
      const resp = await fetcher<CreateResponse>({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/document-templates',
        method: 'POST',
        body,
      });
      setResult({ ok: true, text: `${resp.message}${resp.id ? ` (id: ${resp.id})` : ''}` });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setResult({ ok: false, text: `Error: ${message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Test — Ingreso de plantillas</h2>
      <p className={styles.subtitle}>
        Prueba el POST a <code>settings/document-templates</code>
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.typeToggle}>
          <label className={type === 'pdf' ? styles.typeActive : styles.typeOption}>
            <input
              type="radio"
              name="type"
              value="pdf"
              checked={type === 'pdf'}
              onChange={() => changeType('pdf')}
            />
            PDF (Handlebars)
          </label>
          <label className={type === 'excel' ? styles.typeActive : styles.typeOption}>
            <input
              type="radio"
              name="type"
              value="excel"
              checked={type === 'excel'}
              onChange={() => changeType('excel')}
            />
            Excel (.xlsx)
          </label>
        </div>

        <label className={styles.field}>
          <span>Código *</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="recibo-venta"
          />
        </label>

        <label className={styles.field}>
          <span>Descripción</span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Recibo de venta"
          />
        </label>

        {type === 'pdf' ? (
          <label className={styles.field}>
            <span>Archivo plantilla (.hbs / .html) *</span>
            <input
              type="file"
              accept=".hbs,.handlebars,.html,.htm,text/html"
              onChange={onFileChange}
            />
            {fileName && <small className={styles.fileName}>Seleccionado: {fileName}</small>}
            {content && (
              <pre className={styles.preview}>
                {content.length > 500 ? `${content.slice(0, 500)}…` : content}
              </pre>
            )}
          </label>
        ) : (
          <label className={styles.field}>
            <span>Archivo .xlsx *</span>
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={onFileChange}
            />
            {fileName && <small className={styles.fileName}>Seleccionado: {fileName}</small>}
          </label>
        )}

        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar plantilla'}
        </button>
      </form>

      {result && (
        <div className={result.ok ? styles.alertOk : styles.alertError}>{result.text}</div>
      )}
    </div>
  );
};

export default TestDocumentTemplates;
