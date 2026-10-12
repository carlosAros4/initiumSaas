import { useEffect, useState } from 'react';
import styles from './DoctorSignature.module.css';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import { useSession } from '../../../../../../hooks/useSession';
import AlertInitium from '../../../../../transversal/ui/Alert/Alert';
import Spinner from '../../../../../transversal/ui/Spinner/Spinner';
import ButtonInitium from '../../../../../transversal/ui/Button/ButtonInitium';
import { formatRut, formatRutDv } from '../../../../../../utils/rut';

interface DoctorSignature {
  id: number;
  fullName: string;
  rut: string;
  professionalRegistry: string;
  specialty: string | null;
  signatureImage: string | null;
}

const ALLOWED_MIME = ['image/png', 'image/jpeg'];
const MAX_SIZE = 2 * 1024 * 1024;

export default function DoctorSignature() {
  const { useFetch, fetcher } = useCallApi();
  const {cliente} = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, isLoading } = useFetch<DoctorSignature | null>({
    clientType: 'InitiumSaaS-Private',
    path: `settings/doctor-signature?_r=${refreshKey}`,
    method: 'GET',
  });
  const [form, setForm] = useState({
    professionalRegistry: '',
    specialty: '',
  });
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);


  useEffect(() => {
    console.log(data)
    if (data) {
      setForm({
        professionalRegistry: data.professionalRegistry ?? '',
        specialty: data.specialty ?? '',
      });
      setSignatureImage(data.signatureImage ?? null);
    }
  }, [data]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleFile = (file: File) => {
    if (!ALLOWED_MIME.includes(file.type)) {
      setError('Formato no soportado. Solo PNG o JPG.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('La imagen supera el tamaño máximo (2 MB).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => setSignatureImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.professionalRegistry.trim()) {
      setError('El registro profesional es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/doctor-signature',
        method: 'POST',
        body: {
          professionalRegistry: form.professionalRegistry.trim(),
          specialty: form.specialty.trim() || null,
          signatureImage: signatureImage,
        },
      });
      setSuccess('Firma y datos guardados correctamente.');
      setRefreshKey((k) => k + 1);
    } catch {
      setError('No se pudo guardar la firma. Verifica los datos.');
    }
    setSaving(false);
  };

  if (isLoading) return <Spinner size="md" isVisibleModule />;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Mi Firma</h2>
      <p className={styles.subtitle}>
        Registra tu firma y datos profesionales para que tus recetas queden firmadas y trazables.
      </p>


      <div className={styles.card}>
        {error && <AlertInitium variant="error" message={error} />}
        {success && <AlertInitium variant="success" message={success} />}

        <div className={styles.grid}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nombre completo</label>
            <input className={styles.input} value={`${cliente.firstName} ${cliente.lastName}`} readOnly disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>RUT</label>
            <input className={styles.input} value={formatRutDv(cliente.rut,cliente.dv)} readOnly disabled />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Registro profesional *</label>
            <input className={styles.input} value={form.professionalRegistry} onChange={(e) => setField('professionalRegistry', e.target.value)} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Especialidad</label>
            <input className={styles.input} value={form.specialty} onChange={(e) => setField('specialty', e.target.value)} />
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Imagen de firma (PNG o JPG, máx. 2 MB)</label>
          <input
            type="file"
            className={styles.input}
            accept="image/png,image/jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>

        {signatureImage && (
          <div className={styles.preview}>
            <span className={styles.previewLabel}>Vista previa:</span>
            <img src={signatureImage} alt="Firma" className={styles.previewImg} />
          </div>
        )}

        <div className={styles.formActions}>
          <ButtonInitium onClick={save} loading={saving}>Guardar firma</ButtonInitium>
        </div>
      </div>

    </div>
  );
}
