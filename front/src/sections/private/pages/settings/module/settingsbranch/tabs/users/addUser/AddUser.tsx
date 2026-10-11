import { useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import s from './AddUser.module.css'
import { useCallApi } from '../../../../../../../../../hooks/useCallApi'
import Spinner from '../../../../../../../../transversal/ui/Spinner/Spinner'
import ServiceError from '../../../../../../../../transversal/ui/ServiceError/ServiceError'
import AlertInitium from '../../../../../../../../transversal/ui/Alert/Alert'

interface UserResult {
  id: number
  firstName: string
  lastName: string
  rut: string
  email: string
}

interface NewUserForm {
  firstName: string
  lastName: string
  rut: string
  email: string
  gender: string
}

export const AddUser = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { fetcher } = useCallApi()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<UserResult | null>(null)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  // Formulario de creación
  const [form, setForm] = useState<NewUserForm>({ firstName: '', lastName: '', rut: '', email: '', gender: '' })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [serviceError, setServiceError] = useState(false)
  const [createdMsg, setCreatedMsg] = useState('')

  async function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed) return

    setSearching(true)
    setSearched(false)
    setResults(null)
    setSelected(null)
    setErrorMsg('')
    setServiceError(false)
    setCreatedMsg('')

    try {
      const data = await fetcher<UserResult[]>({
        clientType: 'InitiumSaaS-Private',
        path: `settings/users/search?q=${encodeURIComponent(trimmed)}`,
        method: 'GET',
      })
      setResults(data ?? [])
    } catch {
      setResults([])
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  function handleSelect(user: UserResult) {
    setSelected(user)
    setAdded(false)
  }

  async function handleAddSelected() {
    if (!selected) return
    setAdding(true)
    setErrorMsg('')
    setServiceError(false)
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/users',
        method: 'POST',
        body: { userId: selected.id },
      })
      setAdded(true)
      onSuccess?.()
    } catch (err: unknown) {
      const errorData = (err as { data?: { message?: string }; status?: number })
      if (errorData?.status && errorData.status >= 400 && errorData.status < 500 && errorData?.data?.message) {
        setErrorMsg(errorData.data.message)
      } else {
        setServiceError(true)
      }
    } finally {
      setAdding(false)
    }
  }

  function handleFormChange(field: keyof NewUserForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setServiceError(false)
    setCreatedMsg('')
    try {
      await fetcher({
        clientType: 'InitiumSaaS-Private',
        path: 'settings/users/create',
        method: 'POST',
        body: form,
      })
      // La contraseña inicial del usuario es su RUT sin puntos, guión ni dígito verificador
      const rutBody = form.rut.replace(/[^0-9kK]/gi, '').slice(0, -1)
      setCreatedMsg(
        `Usuario creado exitosamente. La contraseña inicial es su RUT sin guión ni dígito verificador: ${rutBody}`,
      )
      onSuccess?.()
    } catch (err: unknown) {
      const errorData = (err as { data?: { existingUser?: UserResult; message?: string }; status?: number })
      // Error de negocio (4xx con data)
      if (errorData?.status && errorData.status >= 400 && errorData.status < 500 && errorData?.data) {
        if (errorData.data.existingUser) {
          setResults([errorData.data.existingUser])
          setSearched(true)
          setErrorMsg(errorData.data.message || 'El usuario ya está registrado. Puedes agregarlo directamente.')
        } else {
          setErrorMsg(errorData.data.message || 'Error en los datos enviados.')
        }
      } else {
        // Error de servicio (5xx, network, etc.)
        setServiceError(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const hasResults = results && results.length > 0
  const noResults = searched && results && results.length === 0

  return (
    <div className={s.container}>
      {/* Barra de búsqueda */}
      <div className={s.searchBar}>
        <input
          className={s.searchInput}
          type="text"
          placeholder="Buscar por nombre, apellido, RUT o correo..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={s.searchBtn}
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          aria-label="Buscar usuario"
        >
          <SearchIcon fontSize="small" />
        </button>
      </div>

      {/* Formulario de creación — visible por defecto, se oculta cuando hay resultados */}
      {!hasResults && !searching && (
        <form className={s.form} onSubmit={handleSubmit}>
          <p className={s.formTitle}>Crear nuevo usuario</p>

          <div className={s.field}>
            <label htmlFor="adduser-firstname">Nombre</label>
            <input
              id="adduser-firstname"
              type="text"
              value={form.firstName}
              onChange={e => handleFormChange('firstName', e.target.value)}
              required
            />
          </div>

          <div className={s.field}>
            <label htmlFor="adduser-lastname">Apellido</label>
            <input
              id="adduser-lastname"
              type="text"
              value={form.lastName}
              onChange={e => handleFormChange('lastName', e.target.value)}
              required
            />
          </div>

          <div className={s.field}>
            <label htmlFor="adduser-rut">RUT</label>
            <input
              id="adduser-rut"
              type="text"
              placeholder="12.345.678-9"
              value={form.rut}
              onChange={e => handleFormChange('rut', e.target.value)}
              required
            />
          </div>

          <div className={s.field}>
            <label htmlFor="adduser-email">Correo electrónico</label>
            <input
              id="adduser-email"
              type="email"
              placeholder="usuario@correo.com"
              value={form.email}
              onChange={e => handleFormChange('email', e.target.value)}
              required
            />
          </div>

          <div className={s.field}>
            <label htmlFor="adduser-gender">Género</label>
            <select
              id="adduser-gender"
              value={form.gender}
              onChange={e => handleFormChange('gender', e.target.value)}
              required
            >
              <option value="" disabled>Selecciona una opción</option>
              <option value="M">Hombre</option>
              <option value="F">Mujer</option>
            </select>
          </div>

          <button type="submit" className={s.submitBtn} disabled={submitting}>
            {submitting ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      )}

      {/* Loading */}
      {searching && <Spinner size="sm" />}

      {/* Error de servicio */}
      {serviceError && (
        <ServiceError
          title="Error de servicio"
          message="Ocurrió un problema al procesar la solicitud. Intenta nuevamente."
        />
      )}

      {/* Error de negocio */}
      {errorMsg && !serviceError && (
        <AlertInitium variant="error" title="Atención" message={errorMsg} />
      )}

      {/* Usuario creado exitosamente */}
      {createdMsg && (
        <AlertInitium variant="success" title="Usuario creado" message={createdMsg} />
      )}

      {/* Resultados encontrados */}
      {hasResults && (
        <div className={s.results}>
          {results.map(user => (
            <button
              key={user.id}
              type="button"
              className={`${s.resultBtn}${selected?.id === user.id ? ` ${s.selected}` : ''}`}
              onClick={() => handleSelect(user)}
            >
              <span className={s.resultName}>{user.firstName} {user.lastName}</span>
              <span className={s.resultDetail}>{user.rut} · {user.email}</span>
            </button>
          ))}

          {selected && !added && (
            <button
              type="button"
              className={s.submitBtn}
              onClick={handleAddSelected}
              disabled={adding}
            >
              {adding ? 'Agregando...' : `Agregar a ${selected.firstName} ${selected.lastName}`}
            </button>
          )}

          {added && (
            <p className={s.successMsg}>Usuario agregado exitosamente.</p>
          )}
        </div>
      )}

      {/* Sin resultados (después de buscar) */}
      {noResults && (
        <div className={s.noResults}>
          <p className={s.noResultsText}>No se encontraron usuarios con ese criterio.</p>
        </div>
      )}
    </div>
  )
}

export default AddUser
