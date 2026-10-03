# Contexto del Proyecto — SaaS Gestión Empresas

## Descripción general
Plataforma SaaS para gestión empresarial. Stack: NestJS (backend), React + Vite (frontend), PostgreSQL (base de datos), Docker.

---

## Estructura del proyecto

```
saas_gestion_empresas/
├── backend/api/          # NestJS API (BFF)
├── front/gestin-clinic/  # React + Vite frontend
├── database/             # Scripts SQL
├── docker-compose.yml    # Levanta PostgreSQL en Docker
└── .env                  # Variables de entorno raíz
```

---

## Backend — NestJS

### Arranque
- Entry: `backend/api/src/main.ts` → `BffServer`
- Server: `backend/api/src/core/server.ts`
  - `cookie-parser` configurado
  - CORS habilitado para `http://localhost:5173`
  - Global prefix: `api/` (excepto `/health`)
  - Swagger en `api/docs`
  - `bodyParser: false` — usa `express.json` y `express.raw` manualmente

### Base de datos
- PostgreSQL vía `pg` (Pool)
- Token de inyección: `PG_POOL` (módulo global `DatabaseModule`)
- Schema: `"CONFIG_MAIN"`
- Tabla principal: `"CONFIG_MAIN".users` con columnas: `id, rut, dv, first_name, last_name, email, password`

### Middleware de seguridad (`SecurityMiddleware`)
- Ruta: `core/middlewares/Security/Security.middleware.ts`
- Cifra/descifra body con AES-256-CTR + HMAC-SHA256
- Algoritmo: `encryptToBuffer` / `decryptFromBuffer` en `crypto.utils.ts`
- Las claves se derivan de los headers: `channel-name`, `span-id`, `transaction-id`, `channel-id`
- **Excluido de**: rutas `auth/*`
- **Fix aplicado**: al enviar respuesta se hace `Buffer.allocUnsafe + buf.copy` para evitar el error `Cannot delete property '0' of [object Uint8Array]` en Node 18+

### Utilidades
- `splitRut(rutCompleto)` → `{ cuerpo, dv }` — limpia puntos y separa por guión

---

## Módulos del backend

### Register (`/api/client/register`)
- **Método**: POST
- **Body**: `{ rut, password, email, firstName, lastName }`
- **Flujo**: valida existencia por RUT → hashea password con bcrypt (salt 10) → inserta en `"CONFIG_MAIN".users`
- **Respuestas**: 201 `{ message }` | 409 RUT duplicado | 500 error interno
- **Middleware de seguridad**: activo (body cifrado)

### Login (`/api/auth/session`)
- **Método**: POST
- **Body**: `{ rut, password, type: 1 | 2 }`
- **type 1** → `accessToken` en response body (flujo onboarding/creación de cuenta)
- **type 2** → `accessToken` + `refreshToken` en cookies HttpOnly seguras (flujo sesión completa)
- **Cookies** (type 2):
  - `access_token`: 15 min, httpOnly, secure (prod), sameSite: strict
  - `refresh_token`: 7 días, httpOnly, secure (prod), sameSite: strict
- **JWT**: `accessToken` 15min, `refreshToken` 7d, firmados con `JWT_SECRET`
- **Middleware de seguridad**: excluido (auth/* sin cifrado)
- **Respuestas**: 200 | 401 credenciales inválidas | 500 error interno

---

## Frontend — React + Vite

### Estructura relevante
```
front/gestin-clinic/src/
├── pages/home/HomePage.tsx
├── components/
│   ├── ui/
│   │   ├── Button/          # Componente Button con variantes
│   │   └── Alert/           # Componente Alert (info/warning/error/success)
│   └── RegisterCompany/
│       ├── RegisterCompany.tsx        # Orquestador de stages
│       ├── stage_one/                 # Pantalla de elección (login/register)
│       ├── stage_one_register/        # Formulario de registro
│       └── stage_one_login/           # Formulario de login
├── hooks/useCallApi.tsx               # Hook para acceder al contexto de API
├── context/callApi/CallApiContextProvider.tsx
└── utils/
    ├── rut.ts                         # formatRut, validateRut
    └── configCallApi/                 # Sistema de clientes HTTP
```

### Sistema de llamadas API (`fetcher`)
- Contexto: `CallApiContext` / `CallApiContextProvider`
- Hook: `useCallApi()` → expone `{ fetcher, useFetch }`
- `fetcher<T>({ method, clientType, path, body, headers?, skipEncrypt? })` → `Promise<T>`
- Retorna directamente `T` (sin envoltura)
- `clientType: 'InitiumSaaS'` → usa cifrado AES con headers dinámicos (uuid por request)
- `clientType: 'other'` → sin cifrado

### Componente Alert
- Ruta: `components/ui/Alert/Alert.tsx`
- Props: `variant: 'info' | 'warning' | 'error' | 'success'`, `message: string`, `title?: string`
- Usa CSS Modules (`Alert.module.css`)

### Formulario de Registro (`StageOneRegister`)
- Campos: nombre, apellido, RUT (con formato automático), email, password, confirmar password
- Validación local antes de llamar al API
- Llama a `POST api/client/register` con `clientType: 'InitiumSaaS'` (cifrado activo)
- Muestra `Alert variant="error"` en catch (409 → mensaje específico, otros → genérico)

### Formulario de Login (`StageOneLogin`)
- Campos: RUT (con formato automático), password
- Llama a `POST api/auth/session` con `{ rut, password, type }` y `clientType: 'InitiumSaaS'`
- **Nota**: auth/* está excluido del middleware de cifrado en el backend, pero el frontend igual cifra. Revisar si se debe usar `skipEncrypt: true` para login.
- Estado `loading` → botón deshabilitado con texto "Iniciando sesión…"
- Muestra `Alert variant="error"` en catch (401 → credenciales incorrectas, otros → error de servicio)

---

## Variables de entorno (`.env` raíz y `backend/api/.env`)

```env
POSTGRES_USER=clinic_user
POSTGRES_PASSWORD=clinic_pass
POSTGRES_DB=clinic_db
DATABASE_URL=postgresql://clinic_user:clinic_pass@db:5432/clinic_db
JWT_SECRET=change_me_in_production
JWT_EXPIRES_IN=8h
PORT=4000
VITE_API_URL=http://localhost:4000
```

---

## Docker
- `docker-compose.yml` en raíz
- Servicio `db`: postgres:16-alpine, puerto 5432, volumen `postgres_data`
- Servicio `backend`: build `./backend`, puerto 4000
- Servicio `frontend`: build `./gestin-clinic`, puerto 3000→80
- El backend depende de `db` con healthcheck

---

## Convenciones y patrones

### Backend
- Arquitectura por capas: controller → service → repository (interface + impl)
- Inyección del repositorio con token string: `@Inject('LOGIN')`, `@Inject('REGISTER')`
- Logger de NestJS en cada service
- Errores HTTP lanzados como excepciones NestJS (`UnauthorizedException`, `ConflictException`)
- DTOs con `class-validator` + `class-transformer`
- RUT siempre separado en `rut` (cuerpo) y `dv` en la DB

### Frontend
- CSS Modules para todos los componentes
- Variables CSS globales: `--color-primary`, `--radius-md`, `--font-sans`, etc.
- Color primario: `#6d28d9` (purple)
- Formularios con validación local + estado `errors` por campo
- Patrón de stages para flujos multi-paso (`RegisterCompany`)

---

## Pendientes / TODOs conocidos
- `onSuccess` en `StageOneRegister` y `StageOneLogin` no está implementado (warning ESLint)
- Ruta `/login` en `App.tsx` está comentada — falta crear `LoginPage` y descomentar
- `LoginService` original tenía lógica incompleta (retornaba `null`) — ya reemplazado
- Revisar si el login debe usar `skipEncrypt: true` dado que `auth/*` está excluido del middleware
- Refresh token endpoint (`/auth/refresh`) pendiente de implementar
- Introspect de sesión pendiente
