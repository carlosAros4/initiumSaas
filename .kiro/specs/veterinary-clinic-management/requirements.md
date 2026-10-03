# Documento de Requisitos

## Introducción

Sistema base de gestión de clínicas veterinarias construido con React 19 + Vite + TypeScript en el frontend, una API REST en el backend con autenticación JWT, PostgreSQL como base de datos, y Docker para orquestar todos los servicios. El alcance inicial cubre la página de inicio, el flujo de autenticación completo y un dashboard protegido.

## Glosario

- **Sistema**: La aplicación completa (frontend + backend + base de datos).
- **Frontend**: La aplicación React que corre en el navegador del usuario.
- **API**: El servidor backend que expone endpoints REST.
- **Auth_Service**: El módulo del backend responsable de autenticación y autorización JWT.
- **DB**: La base de datos PostgreSQL.
- **JWT**: JSON Web Token usado para autenticar sesiones de usuario.
- **Usuario**: Persona registrada en el sistema con credenciales de acceso.
- **Docker**: Plataforma de contenedores usada para orquestar los servicios del sistema.

---

## Requisitos

### Requisito 1: Página de inicio (Home)

**User Story:** Como visitante, quiero ver una página de inicio que describa el sistema, para entender qué ofrece la plataforma antes de iniciar sesión.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar una página de inicio con el nombre del sistema, una descripción breve y un botón de acceso al login.
2. WHEN el usuario hace clic en el botón de acceso al login, THE Frontend SHALL navegar a la página de login sin recargar la página completa.

---

### Requisito 2: Autenticación de usuarios con JWT

**User Story:** Como usuario registrado, quiero iniciar sesión con mis credenciales, para acceder de forma segura al sistema.

#### Criterios de Aceptación

1. THE Frontend SHALL mostrar un formulario de login con campos para correo electrónico y contraseña.
2. WHEN el usuario envía el formulario de login con credenciales válidas, THE Auth_Service SHALL retornar un JWT con tiempo de expiración de 8 horas.
3. WHEN el usuario envía el formulario de login con credenciales inválidas, THE Auth_Service SHALL retornar un error HTTP 401 con un mensaje descriptivo.
4. WHEN el Auth_Service retorna un JWT válido, THE Frontend SHALL almacenar el token en memoria de la aplicación y redirigir al usuario al dashboard.
5. IF el JWT almacenado ha expirado, THEN THE Frontend SHALL redirigir al usuario a la página de login y limpiar el token almacenado.
6. WHEN el usuario hace clic en "Cerrar sesión", THE Frontend SHALL eliminar el JWT almacenado y redirigir a la página de inicio.
7. THE Auth_Service SHALL hashear las contraseñas de los usuarios usando bcrypt antes de almacenarlas en la DB.

---

### Requisito 3: Protección de rutas y dashboard

**User Story:** Como usuario autenticado, quiero acceder a un dashboard protegido, para que solo usuarios con sesión válida puedan ver el contenido interno.

#### Criterios de Aceptación

1. WHEN un usuario no autenticado intenta acceder a una ruta protegida, THE Frontend SHALL redirigirlo a la página de login.
2. WHEN una petición a la API llega sin un JWT válido en el header `Authorization`, THE Auth_Service SHALL retornar un error HTTP 401.
3. WHEN una petición a la API llega con un JWT válido, THE Auth_Service SHALL permitir el acceso al recurso solicitado.
4. THE Frontend SHALL mostrar una página de dashboard accesible únicamente tras autenticación exitosa.

---

### Requisito 4: Endpoint de introspección de token

**User Story:** Como desarrollador, quiero un endpoint para verificar la validez de un JWT, para que el frontend pueda validar la sesión activa sin necesidad de re-autenticar.

#### Criterios de Aceptación

1. THE Auth_Service SHALL exponer un endpoint `POST /auth/introspect` que reciba un JWT en el cuerpo de la petición.
2. WHEN el endpoint recibe un JWT válido y no expirado, THE Auth_Service SHALL retornar HTTP 200 con los datos del usuario codificados en el token.
3. WHEN el endpoint recibe un JWT inválido o expirado, THE Auth_Service SHALL retornar HTTP 401 con un mensaje descriptivo.

---

### Requisito 5: Base de datos inicial

**User Story:** Como desarrollador, quiero una tabla de usuarios en PostgreSQL, para persistir las credenciales de acceso al sistema.

#### Criterios de Aceptación

1. THE DB SHALL contener una tabla `users` con los campos: `id`, `email`, `password_hash`, `created_at`.
2. THE DB SHALL aplicar una restricción de unicidad sobre el campo `email` de la tabla `users`.
3. IF se intenta insertar un usuario con un correo electrónico ya existente, THEN THE Auth_Service SHALL retornar un error HTTP 409 indicando el conflicto.

---

### Requisito 6: Infraestructura con Docker

**User Story:** Como desarrollador, quiero que todos los servicios estén orquestados con Docker Compose, para poder levantar el entorno completo con un solo comando.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir un archivo `docker-compose.yml` que defina los servicios: `frontend`, `backend` y `db`.
2. THE Sistema SHALL configurar el servicio `db` con la imagen oficial de PostgreSQL y variables de entorno para credenciales y nombre de base de datos.
3. THE Sistema SHALL configurar el servicio `backend` para que dependa del servicio `db` y espere a que la base de datos esté disponible antes de iniciar.
4. THE Sistema SHALL configurar el servicio `frontend` para que se comunique con el `backend` a través de la red interna de Docker.
5. WHEN se ejecuta `docker-compose up`, THE Sistema SHALL levantar los tres servicios y dejar el frontend accesible en el puerto 3000 y el backend en el puerto 4000.
6. THE Sistema SHALL incluir un archivo `.env.example` con todas las variables de entorno requeridas documentadas.
