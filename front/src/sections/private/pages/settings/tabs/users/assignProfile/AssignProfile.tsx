import { useState } from 'react'
import s from './AssignProfile.module.css'
import { useCallApi } from '../../../../../../../hooks/useCallApi'
import Spinner from '../../../../../../transversal/ui/Spinner/Spinner'
import ServiceError from '../../../../../../transversal/ui/ServiceError/ServiceError'
import AlertInitium from '../../../../../../transversal/ui/Alert/Alert'

interface ProfileInfo {
  id: number
  name: string
  descripcion: string
  accessKeys: string[]
  assigned: boolean
}

interface AssignProfileProps {
  userId: number
  userName: string
  onSuccess?: () => void
}

export default function AssignProfile({ userId, userName, onSuccess }: AssignProfileProps) {
  const { fetcher, useFetch } = useCallApi()

  const { data, isLoading, error } = useFetch<{ profiles: ProfileInfo[] }>({
    clientType: 'InitiumSaaS-Private',
    path: `settings/users/${userId}/profiles`,
  })

  const [selected, setSelected] = useState<Set<number> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Inicializar selección con los perfiles ya asignados
  if (data && selected === null) {
    const assigned = new Set(data.profiles.filter((p) => p.assigned).map((p) => p.id))
    setSelected(assigned)
  }

  function toggleProfile(profileId: number) {
    if (!selected) return
    const next = new Set(selected)
    if (next.has(profileId)) {
      next.delete(profileId)
    } else {
      next.add(profileId)
    }
    setSelected(next)
  }

  async function handleSave() {
    if (!selected) return
    setSubmitting(true)
    setErrorMsg('')

    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: `settings/users/${userId}/profiles`,
        method: 'PUT',
        body: { profileIds: Array.from(selected) },
      })
      onSuccess?.()
    } catch (err: unknown) {
      const errorData = err as { data?: { message?: string }; status?: number }
      if (errorData?.status && errorData.status >= 400 && errorData.status < 500 && errorData?.data?.message) {
        setErrorMsg(errorData.data.message)
      } else {
        setErrorMsg('Ocurrió un error al asignar los perfiles. Intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) return <Spinner size="sm" />
  if (error) return <ServiceError />

  return (
    <div className={s.container}>
      {errorMsg && <AlertInitium variant="error" title="Error" message={errorMsg} />}

      <p className={s.subtitle}>
        Selecciona los perfiles para <strong>{userName}</strong>:
      </p>

      <div className={s.profileList}>
        {data?.profiles.map((profile) => (
          <label key={profile.id} className={`${s.profileCard} ${selected?.has(profile.id) ? s.profileCardSelected : ''}`}>
            <input
              type="checkbox"
              checked={selected?.has(profile.id) ?? false}
              onChange={() => toggleProfile(profile.id)}
              className={s.checkbox}
            />
            <div className={s.profileInfo}>
              <span className={s.profileName}>{profile.name}</span>
              {profile.descripcion && (
                <span className={s.profileDesc}>{profile.descripcion}</span>
              )}
              {profile.accessKeys.length > 0 && (
                <div className={s.permTags}>
                  {profile.accessKeys.map((key) => (
                    <span key={key} className={s.permTag}>{key}</span>
                  ))}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.btnPrimary}
          onClick={handleSave}
          disabled={submitting}
        >
          {submitting ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
