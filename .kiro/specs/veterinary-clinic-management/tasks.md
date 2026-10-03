# Plan de Implementación: Veterinary Clinic Management

## Visión General

Implementación incremental del sistema base: frontend React 19 + Vite + TypeScript (extendiendo `gestin-clinic/`), backend Node.js/Express con autenticación JWT, PostgreSQL y orquestación con Docker Compose.

## Tareas

- [x] 1. Configurar infraestructura base del proyecto
  - Crear `backend/` con `package.json`, `tsconfig.json` y dependencias: `express`, `jsonwebtoken`, `bcrypt`, `pg`, `dotenv`, `cors`; devDependencies: `typescript`, `ts-node`, `@types/*`, `vitest`, `fast-check`
  - Crear `backend/src/app.ts` con Express, middleware CORS y JSON parser
  - Crear `backend/src/index.ts` como entry point que inicia el servidor en `PORT`
  - Crear `backend/Dockerfile` para el servicio backend
  - Crear `gestin-clinic/Dockerfile` para el servicio frontend
  - Crear `docker-compose.yml` con los tres servicios (`db`, `backend`, `frontend`) según el diseño, incluyendo healthcheck en `db` y `depends_on` con `condition: service_healthy` en `backend`
  - Crear `.env.example` con todas las variables documentadas
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 2. Implementar capa de base de datos
  - [x] 2.1 Crear migración SQL inicial y pool de conexiones
    - Crear `backend/src/db/migrations/001_init.sql` con la tabla `users` (id, email, password_hash, created_at) y restricción UNIQUE en email
    - Crear `backend/src/db/client.ts` con pool de conexiones usando `pg` y `DATABASE_URL`
    - _Requisitos: 5.1, 5.2_

  - [ ]* 2.2 Escribir property test para unicidad de email (Propiedad 8)
    - **Propiedad 8: El email de usuario es único en la base de datos**
    - **Valida: Requisitos 5.2, 5.3**
    - `// Feature: veterinary-clinic-management, Property 8: email único en DB`

- [x] 3. Implementar módulo de autenticación en el backend
  - [x] 3.1 Crear `auth/service.ts` con lógica de negocio
    - Implementar `validateCredentials(email, password)`: consulta DB, compara hash con bcrypt, retorna payload del usuario o lanza error
    - Implementar `signToken(payload)`: firma JWT con `JWT_SECRET` y expiración `JWT_EXPIRES_IN` (8h)
    - Implementar `verifyToken(token)`: verifica y decodifica JWT, lanza error si inválido o expirado
    - _Requisitos: 2.2, 2.3, 2.7, 4.2, 4.3_

  - [ ]* 3.2 Escribir property test para expiración del JWT (Propiedad 1)
    - **Propiedad 1: El JWT generado expira exactamente en 8 horas**
    - **Valida: Requisito 2.2**
    - `// Feature: veterinary-clinic-management, Property 1: JWT expira en iat + 8*3600`

  - [ ]* 3.3 Escribir property test para hash bcrypt de contraseñas (Propiedad 3)
    - **Propiedad 3: Las contraseñas se almacenan como hash bcrypt válido**
    - **Valida: Requisito 2.7**
    - `// Feature: veterinary-clinic-management, Property 3: bcrypt.compare(password, hash) === true`

  - [x] 3.4 Crear `auth/middleware.ts` con `requireAuth`
    - Extraer token del header `Authorization: Bearer <token>`
    - Verificar token con `verifyToken`; retornar HTTP 401 si ausente, malformado o expirado
    - Adjuntar payload al objeto `req` si válido
    - _Requisitos: 3.2, 3.3_

  - [ ]* 3.5 Escribir property test para el middleware JWT (Propiedad 5)
    - **Propiedad 5: El middleware valida correctamente el JWT**
    - **Valida: Requisitos 3.2, 3.3**
    - `// Feature: veterinary-clinic-management, Property 5: tokens inválidos → 401, válidos → pasan`

  - [x] 3.6 Crear `auth/controller.ts` y `auth/router.ts`
    - Handler `POST /auth/login`: llama a `validateCredentials`, retorna `{ token }` o HTTP 401; retorna HTTP 409 si email duplicado
    - Handler `POST /auth/introspect`: llama a `verifyToken`, retorna payload o HTTP 401
    - Registrar router en `app.ts`
    - _Requisitos: 2.2, 2.3, 4.1, 4.2, 4.3, 5.3_

  - [ ]* 3.7 Escribir property test para credenciales inválidas → 401 (Propiedad 2)
    - **Propiedad 2: Credenciales inválidas siempre retornan 401**
    - **Valida: Requisito 2.3**
    - `// Feature: veterinary-clinic-management, Property 2: cualquier credencial inválida → HTTP 401`

  - [ ]* 3.8 Escribir property test para introspect con token válido (Propiedad 6)
    - **Propiedad 6: Introspect retorna los datos del usuario para tokens válidos**
    - **Valida: Requisito 4.2**
    - `// Feature: veterinary-clinic-management, Property 6: introspect(token) → mismo sub y email`

  - [ ]* 3.9 Escribir property test para introspect con token inválido (Propiedad 7)
    - **Propiedad 7: Introspect rechaza tokens inválidos o expirados**
    - **Valida: Requisito 4.3**
    - `// Feature: veterinary-clinic-management, Property 7: strings arbitrarios como token → HTTP 401`

- [ ] 4. Checkpoint — Backend funcional
  - Asegurarse de que todos los tests del backend pasan. Preguntar al usuario si hay dudas antes de continuar.

- [x] 5. Implementar frontend: dependencias y estructura
  - Instalar en `gestin-clinic/`: `react-router-dom`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `jsdom`
  - Configurar Vitest en `vite.config.ts` (environment `jsdom`, setupFiles)
  - Crear estructura de carpetas: `src/pages/`, `src/context/`, `src/services/`, `src/components/`
  - _Requisitos: 1.1, 2.1, 3.4_

- [x] 6. Implementar AuthContext y authService
  - [x] 6.1 Crear `src/services/authService.ts`
    - Implementar `login(email, password)`: `POST /auth/login`, retorna token o lanza error
    - Implementar `introspect(token)`: `POST /auth/introspect`, retorna payload o lanza error
    - Usar `VITE_API_URL` como base URL
    - _Requisitos: 2.2, 2.3, 4.1_

  - [x] 6.2 Crear `src/context/AuthContext.tsx`
    - Exponer `token`, `user`, `login()`, `logout()` mediante React Context
    - Al montar, si hay token en memoria llamar a `introspect`; si retorna 401 limpiar estado
    - `logout()` limpia token y redirige a `/`
    - _Requisitos: 2.4, 2.5, 2.6_

  - [x] 6.3 Crear `src/components/ProtectedRoute.tsx`
    - Si no hay token en `AuthContext`, redirigir a `/login`
    - Si hay token, renderizar el componente hijo
    - _Requisitos: 3.1, 3.4_

  - [ ]* 6.4 Escribir property test para rutas protegidas (Propiedad 4)
    - **Propiedad 4: Las rutas protegidas redirigen al login sin token válido**
    - **Valida: Requisitos 2.5, 3.1**
    - `// Feature: veterinary-clinic-management, Property 4: sin token → redirect /login`

- [x] 7. Implementar páginas del frontend
  - [x] 7.1 Crear `src/pages/HomePage.tsx`
    - Mostrar nombre del sistema, descripción breve y botón que navega a `/login`
    - _Requisitos: 1.1, 1.2_

  - [ ]* 7.2 Escribir tests unitarios para HomePage
    - Verificar presencia del nombre del sistema, descripción y botón de acceso
    - Verificar que el botón navega a `/login`
    - _Requisitos: 1.1, 1.2_

  - [x] 7.3 Crear `src/pages/LoginPage.tsx`
    - Formulario con campos email y password, botón de submit
    - Al submit: llamar a `AuthContext.login()`, redirigir a `/dashboard` si éxito, mostrar error si falla
    - Si ya hay token, redirigir a `/dashboard`
    - _Requisitos: 2.1, 2.4, 2.3_

  - [ ]* 7.4 Escribir tests unitarios para LoginPage
    - Verificar presencia de campos email, password y botón submit
    - Verificar redirección a `/dashboard` con credenciales válidas (mock)
    - Verificar mensaje de error con credenciales inválidas (mock)
    - _Requisitos: 2.1, 2.3, 2.4_

  - [x] 7.5 Crear `src/pages/DashboardPage.tsx`
    - Mostrar contenido del dashboard y botón de "Cerrar sesión"
    - Al hacer clic en logout: llamar a `AuthContext.logout()`
    - _Requisitos: 2.6, 3.4_

  - [ ]* 7.6 Escribir tests unitarios para DashboardPage
    - Verificar que el dashboard se renderiza con token válido
    - Verificar que logout limpia el contexto y redirige
    - _Requisitos: 2.6, 3.4_

- [x] 8. Configurar enrutamiento en App.tsx
  - Actualizar `src/App.tsx` para usar `react-router-dom` con las rutas `/`, `/login` y `/dashboard`
  - Envolver la app con `AuthContext.Provider`
  - Proteger `/dashboard` con `ProtectedRoute`
  - _Requisitos: 1.2, 3.1, 3.4_

- [ ] 9. Checkpoint final — Todos los tests pasan
  - Ejecutar todos los tests de frontend y backend. Asegurarse de que pasan. Preguntar al usuario si hay dudas antes de cerrar.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requisitos específicos para trazabilidad.
- Los property tests usan fast-check con mínimo 100 iteraciones y comentario de trazabilidad.
- El token JWT se almacena exclusivamente en memoria (AuthContext), nunca en localStorage.
