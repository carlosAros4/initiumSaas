import { useState } from 'react';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import ButtonInitium from '../../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium, { type AlertVariant } from '../../../../../transversal/ui/Alert/Alert';
import s from './Prescriptions.module.css';
import { PAPER_FORMATS, type PaperFormat } from '../../../../../../utils/paperFormat';



interface PrescriptionInit {
  paperformat: PaperFormat;
}

interface Medication {
  nombre: string;
  dosis: string;
  frecuencia: string;
}

interface RecetaForm {
  nombrePaciente: string;
  raza: string;
  especie: string;
  sexo: string;
  edad: string;
  peso: string;
  tutor: string;
  telefono: string;
  medicamentos:Medication[]
}

interface AlertI {
  variant:AlertVariant;
  text: string;
}
export default function Prescriptions() {
  const { fetcher, useFetch } = useCallApi();
  const [alertData,setAlertData]= useState<AlertI>(null)
  // Alert propio de la sección "Gestión de plantilla" (descargar / resetear).
  const [templateAlert, setTemplateAlert] = useState<AlertI>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Plantilla seleccionada para subir: nombre del archivo + su contenido leído.
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  // null => el usuario aún no tocó el select; se muestra el valor que venga del init.
  const [paperFormatOverride, setPaperFormatOverride] = useState<PaperFormat | null>(null);

  const { data: init, mutate: refreshInit } = useFetch<PrescriptionInit>({
    clientType: 'InitiumSaaS-Private',
    path: 'settings/prescription/init',
    method: 'GET',
  });

  // Valor seleccionado: override del usuario → valor del servicio → 'a4' por defecto.
  const paperFormat: PaperFormat = paperFormatOverride ?? init?.paperformat ?? 'a4';

  const readFile = async (file: File | undefined) => {
    if (!file) {
      setFileName(null);
      setFileContent(null);
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setFileContent(text);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    readFile(e.target.files?.[0]);
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    readFile(e.dataTransfer.files?.[0]);
  };

  const uploadTemplate = async () => {
    // Se puede subir plantilla nueva, cambiar solo el formato de papel, o ambos.
    const body: { content?: string; paperformat: PaperFormat } = { paperformat: paperFormat };
    if (fileContent) {
      body.content = fileContent;
    }

    setUploading(true);
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/prescription',
        method: 'PUT',
        body,
      });
      setFileName(null);
      setFileContent(null);
      refreshInit();
      setTemplateAlert({
        text: fileContent
          ? 'Plantilla actualizada correctamente'
          : 'Formato de papel actualizado correctamente',
        variant: 'success',
      });
    } catch {
      setTemplateAlert({ text: 'No pudimos guardar los cambios, intente más tarde', variant: 'error' });
    }
    setUploading(false);
  };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/prescription/download',
        method: 'GET',
        document: true,
      });
      setTemplateAlert({ text: 'Plantilla descargada de forma exitosa', variant: 'success' });
    } catch {
      setTemplateAlert({ text: 'No pudimos descargar la plantilla, intente más tarde', variant: 'error' });
    }
    setDownloading(false);
  };

  const resetTemplate = async () => {
    setResetting(true);
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/prescription/reset',
        method: 'POST',
      });
      setPaperFormatOverride(null);
      refreshInit();
      setTemplateAlert({ text: 'Plantilla restaurada a la versión por defecto', variant: 'success' });
    } catch {
      setTemplateAlert({ text: 'No pudimos resetear la plantilla, intente más tarde', variant: 'error' });
    }
    setResetting(false);
  };
 
  const [receta,setReceta] = useState<RecetaForm>({
    nombrePaciente:'firulais',
    edad:'2 años',
    especie:'Perro',
    raza:'mestizo',
    peso:'2.5 kilos',
    sexo:'Macho',
    tutor: 'Juan Perez',
    telefono:'+56 9 1234 5678',
    medicamentos:[
      {nombre:'Naxpet 30 mg',
        dosis:'1 comprimido',
        frecuencia:'Una vez al dia'
      },
      {nombre:'Amoxicilina 250 mg',
        dosis:'1 cucharada',
        frecuencia:'Dos veces al dia'
      }
    ]
  })

  const modificarReceta = (key:string,value:string)=>{
    const newReceta = {...receta}
    newReceta[key] = value
    setReceta(newReceta)
  }
  const addMed = () => {
    setReceta((prev) => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { nombre: '', dosis: '', frecuencia: '' }],
    }));
  };
  const setMedField = (index: number, field: keyof Medication, value: string) => {
    setReceta((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.map((med, i) =>
        i === index ? { ...med, [field]: value } : med,
      ),
    }));
  };

  const removeMed = (index: number) => {
    setReceta((prev) =>({...prev, medicamentos: prev.medicamentos.filter((_, i) => i !== index) })
    );
  };

  const testingReceta = async ()=>{
    setLoadingTest(true);
    try {
      await fetcher({
        clientType:'InitiumSaaS-Private',
        path:'settings/prescription/preview',
        method:'POST',
        document:true,
        body:receta
      });
      setAlertData({ text:'Documento descargado de forma exitosa', variant:'success' });
    } catch {
      setAlertData({ text:'No Pudimos descargar el documento, Intente mas tarde', variant:'error' });
    }
    setLoadingTest(false);
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Plantilla de receta</h1>
      </div>

      <section className={s.card}>
        <h2 className={s.cardTitle}>Gestión de plantilla</h2>

        <label className={s.field}>
          <span>Formato de papel</span>
          <select
            className={s.select}
            value={paperFormat}
            onChange={(e) => setPaperFormatOverride(e.target.value as PaperFormat)}
          >
            {PAPER_FORMATS.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <div className={s.field}>
          <span>Archivo plantilla (.hbs / .html)</span>
          <label
            className={`${s.dropzone} ${fileName ? s.dropzoneActive : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
          >
            <input
              type="file"
              className={s.fileInput}
              accept=".hbs,.handlebars,.html,.htm,text/html"
              onChange={onFileChange}
            />
            <svg
              className={s.dropIcon}
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {fileName ? (
              <span className={s.dropFileName}>{fileName}</span>
            ) : (
              <span className={s.dropText}>
                <strong>Haz clic para subir</strong> o arrastra el archivo aquí
                <small>.hbs, .handlebars o .html</small>
              </span>
            )}
          </label>
        </div>

        <div className={s.actions}>
          <ButtonInitium variant="contained" loading={uploading} onClick={uploadTemplate}>
            {fileContent ? 'Subir plantilla' : 'Guardar formato'}
          </ButtonInitium>
          <ButtonInitium variant="outlined" loading={downloading} onClick={downloadTemplate}>
            Descargar plantilla
          </ButtonInitium>
          <ButtonInitium variant="text" loading={resetting} onClick={resetTemplate}>
            Resetear plantilla
          </ButtonInitium>
        </div>

        {templateAlert && (
          <div className={s.alertWrap}>
            <AlertInitium variant={templateAlert.variant} message={templateAlert.text} />
          </div>
        )}
      </section>

      {/* ─── Formulario de prueba ─── */}
      <section className={s.card}>
        <h2 className={s.cardTitle}>Probar plantilla</h2>
        <p className={s.cardSubtitle}>Completa los datos y genera una receta de prueba.</p>

        <h3 className={s.groupTitle}>Paciente</h3>
        <div className={s.grid}>
          <label className={s.field}>
            <span>Nombre del paciente *</span>
            <input
              type="text"
              value={receta.nombrePaciente}
              onChange={(e) => modificarReceta('nombrePaciente', e.target.value)}
              placeholder="Firulais"
            />
          </label>
          <label className={s.field}>
            <span>Especie</span>
            <input
              type="text"
              value={receta.especie}
              onChange={(e) => modificarReceta('especie', e.target.value)}
              placeholder="Canino"
            />
          </label>
          <label className={s.field}>
            <span>Raza</span>
            <input
              type="text"
              value={receta.raza}
              onChange={(e) => modificarReceta('raza', e.target.value)}
              placeholder="Labrador"
            />
          </label>
          <label className={s.field}>
            <span>Sexo</span>
            <input
              type="text"
              value={receta.sexo}
              onChange={(e) => modificarReceta('sexo', e.target.value)}
              placeholder="Macho"
            />
          </label>
          <label className={s.field}>
            <span>Edad</span>
            <input
              type="text"
              value={receta.edad}
              onChange={(e) => modificarReceta('edad', e.target.value)}
              placeholder="3 años"
            />
          </label>
          <label className={s.field}>
            <span>Peso</span>
            <input
              type="text"
              value={receta.peso}
              onChange={(e) => modificarReceta('peso', e.target.value)}
              placeholder="12 kg"
            />
          </label>
        </div>

        <h3 className={s.groupTitle}>Tutor</h3>
        <div className={s.grid}>
          <label className={s.field}>
            <span>Nombre del tutor</span>
            <input
              type="text"
              value={receta.tutor}
              onChange={(e) => modificarReceta('tutor', e.target.value)}
              placeholder="Carlos Pérez"
            />
          </label>
          <label className={s.field}>
            <span>Teléfono</span>
            <input
              type="text"
              value={receta.telefono}
              onChange={(e) => modificarReceta('telefono', e.target.value)}
              placeholder="+56 9 1234 5678"
            />
          </label>
        </div>

        <div className={s.medsHeader}>
          <h3 className={s.groupTitle}>Medicamentos</h3>
          <ButtonInitium variant="outlined" size="sm" onClick={addMed}>
            + Agregar medicamento
          </ButtonInitium>
        </div>

        <div className={s.medsList}>
          {receta.medicamentos.map((med, i) => (
            <div className={s.medRow} key={i}>
              <input
                type="text"
                className={s.medInput}
                value={med.nombre}
                onChange={(e) => setMedField(i, 'nombre', e.target.value)}
                placeholder="Nombre"
              />
              <input
                type="text"
                className={s.medInput}
                value={med.dosis}
                onChange={(e) => setMedField(i, 'dosis', e.target.value)}
                placeholder="Dosis"
              />
              <input
                type="text"
                className={s.medInput}
                value={med.frecuencia}
                onChange={(e) => setMedField(i, 'frecuencia', e.target.value)}
                placeholder="Frecuencia"
              />
              <button
                type="button"
                className={s.removeBtn}
                onClick={() => removeMed(i)}
              
                aria-label="Eliminar medicamento"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className={s.actions}>
          <ButtonInitium
            variant="contained"
            loading={loadingTest}
            disabled={loadingTest}
            onClick={testingReceta}
          >
            Probar
          </ButtonInitium>
        </div>

        {alertData && (
          <div className={s.alertWrap}>
            <AlertInitium variant={alertData.variant} message={alertData.text} />
          </div>
        )}
      </section>
    </div>
  );
}
