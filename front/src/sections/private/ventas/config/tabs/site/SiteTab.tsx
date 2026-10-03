import { useEffect, useState } from 'react';
import s from './SiteTab.module.css';
import { useSession } from '../../../../../../context/session/SessionContext';
import { useCallApi } from '../../../../../../hooks/useCallApi';
import Spinner from '../../../../../transversal/ui/Spinner/Spinner';

const PUBLIC_DOMAIN = 'initium.cl/Public/';

export interface siteData {
    id: number;
    nameSite: string;
    enabled: boolean;
}
function generateSlug(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

export default function SiteTab() {
    const { companySelect } = useSession()
    const { useFetch, fetcher } = useCallApi()
    const [businessName, setBusinessName] = useState<string>('');
    const [customSlug, setCustomSlug] = useState('');
    const [editingSlug, setEditingSlug] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [enabled, setEnabled] = useState(false);
    const [error, setError] = useState('');

    const { data, isLoading } = useFetch<siteData>({
        clientType: 'InitiumSaaS-Private',
        path: 'sales-company',
        method: 'GET',
    })

    const slug = editingSlug ? customSlug : generateSlug(businessName);


    function handleSlugChange(value: string) {
        setCustomSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
    }

    function handleToggleEditSlug() {
        if (!editingSlug) {
            setCustomSlug(slug);
        }
        setEditingSlug(!editingSlug);
    }

    async function handleSave() {
        if (!businessName.trim() || slug.length < 3) return;
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            await fetcher({
                clientType: 'InitiumSaaS-Private',
                path: 'sales-company/register',
                method: 'POST',
                body: {
                    nameSite: slug,
                    enabled: enabled
                }
            });

            setSaving(false);
            setSaved(true);
        } catch {
            setSaving(false);
            setError('Error de servicio, intente más tarde');
        }
    }

    const slugValid = slug.length >= 3;

    useEffect(() => {
        if (!isLoading) {
            if (data?.nameSite) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setBusinessName(data.nameSite)
                setEnabled(data.enabled)
            } else {
                setBusinessName(companySelect.name)
            }

        }
    }, [isLoading,isLoading ])
    if (isLoading && !data) return <Spinner size="lg" isVisibleModule />

    return (
        <div className={s.page}>
            {/* Card principal */}
            <div className={s.card}>
                <h2 className={s.cardTitle}>Tu sitio público</h2>
                <p className={s.cardDesc}>
                    Configura cómo aparece tu negocio para tus ventas. El nombre y la URL se mostrarán en tu página de reservas y comunicaciones.
                </p>

                {saved && (
                    <div className={s.toast}>
                        <span className={s.toastIcon}>✓</span>
                        Cambios guardados correctamente
                    </div>
                )}

                {error && (
                    <div className={s.toastError}>
                        <span className={s.toastIcon}>✗</span>
                        {error}
                    </div>
                )}

                {/* URL pública */}
                <div className={s.field}>
                    <div className={s.fieldHeader}>
                        <label className={s.fieldLabel}>URL pública</label>
                        <button
                            type="button"
                            className={s.editSlugBtn}
                            onClick={handleToggleEditSlug}
                        >
                            {editingSlug ? 'Auto-generar' : 'Editar'}
                        </button>
                    </div>
                    <div className={`${s.urlBox} ${slugValid ? s.urlBoxValid : ''}`}>
                        <span className={s.urlDomain}>{PUBLIC_DOMAIN}</span>
                        <input
                            type="text"
                            className={s.urlSlug}
                            value={slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            readOnly={!editingSlug}
                            placeholder="mi-negocio"
                        />
                        {slugValid && <span className={s.urlOk}>✓</span>}
                    </div>
                    {slug.length > 0 && !slugValid && (
                        <p className={s.urlError}>Mínimo 3 caracteres</p>
                    )}
                </div>

                {/* Toggle habilitar */}
                <div className={s.toggleRow}>
                    <div>
                        <span className={s.toggleLabel}>Sitio habilitado</span>
                        <span className={s.toggleDesc}>Tu página será visible al público</span>
                    </div>
                    <button
                        type="button"
                        className={`${s.toggle} ${enabled ? s.toggleOn : ''}`}
                        onClick={() => setEnabled(!enabled)}
                        aria-label="Habilitar sitio"
                    >
                        <span className={s.toggleThumb} />
                    </button>
                </div>

                {/* Preview — solo visible tras guardar con enabled=true */}
                {saved && enabled && slugValid && (
                    <div className={s.preview}>
                        <span className={s.previewLabel}>Revisa tu sitio configurado</span>
                        <div className={s.previewCard}>
                            <span className={s.previewName}>{slug.trim()}</span>
                            <a
                                className={s.previewUrl}
                                href={`https://${PUBLIC_DOMAIN}${slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {PUBLIC_DOMAIN}{slug}
                            </a>
                        </div>
                    </div>
                )}

                {/* Guardar */}
                <button
                    type="button"
                    className={s.saveBtn}
                    onClick={handleSave}
                    disabled={saving || !businessName.trim() || !slugValid}
                >
                    {saving ? 'Guardando...' : 'Guardar configuración'}
                </button>
            </div>
        </div>
    );
}
