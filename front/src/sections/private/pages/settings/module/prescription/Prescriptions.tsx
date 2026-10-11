import { useState } from 'react';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import ButtonInitium from '../../../../../transversal/ui/Button/ButtonInitium';
import AlertInitium, { type AlertVariant } from '../../../../../transversal/ui/Alert/Alert';
import type { BlobResponse } from '../../../../../../utils/configCallApi/types/fetcher.types';
import s from './Prescriptions.module.css';

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
  const { fetcher } = useCallApi();
  const [alertData,setAlertData]= useState<AlertI>(null)
  const [loadingTest, setLoadingTest] = useState(false);
  const [activeTest, setActiveTest] = useState(false);
 
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

    await fetcher({
      clientType:'InitiumSaaS-Private',
      path:'settings/prescription/preview',
      method:'POST',
      document:true,
      body:receta
    }).then(()=>{
setAlertData({
    text:'Documento descargado de forma exitosa',variant:'success'
  })
    })
    .catch((error)=>{
      setAlertData({
    text:'No Pudimos descargar el documento, Intente mas tarde',variant:'error'
  })
    });


     
  }
  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1>Plantilla de receta</h1>
      </div>

      <section className={s.card}>
        <h2 className={s.cardTitle}>Gestión de plantilla</h2>

        <label className={s.field}>
          <span>Nombre de plantilla</span>
          {/* <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Receta veterinaria"
          /> */}
        </label>

        <label className={s.field}>
          <span>Archivo plantilla (.hbs / .html)</span>
          {/* <input
            type="file"
            accept={
                '.hbs,.handlebars,.html,.htm,text/html'
            }
            onChange={onFileChange}
          /> */}
          {/* {fileName && <small className={s.fileName}>Seleccionado: {fileName}</small>} */}
        </label>

        <div className={s.actions}>
          {/* <ButtonInitium variant="contained" loading={uploading} onClick={uploadTemplate}>
            Subir plantilla
          </ButtonInitium>
          <ButtonInitium variant="outlined" onClick={downloadTemplate}>
            Descargar plantilla
          </ButtonInitium>
          <ButtonInitium variant="text" onClick={resetTemplate}>
            Resetear plantilla
          </ButtonInitium> */}
        </div>

        {/* {templateAlert && (
          <div className={s.alertWrap}>
            <AlertInitium variant={templateAlert.variant} message={templateAlert.text} />
          </div>
        )} */}
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
            disabled={activeTest}
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
