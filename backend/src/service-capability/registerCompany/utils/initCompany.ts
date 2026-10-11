export const INIT_COMPANY_SQL = `

-- =========================================
-- TABLE: branch (sucursales de la empresa)
-- =========================================
CREATE TABLE "__SCHEMA__".branch (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(255),
    phone       VARCHAR(20),
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    is_main     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =========================================
-- TABLE: profile (perfiles del cliente)
-- branch_id indica a qué sucursal pertenece el perfil
-- branch_id NULL = perfil global (aplica a toda la empresa)
-- =========================================
CREATE TABLE "__SCHEMA__".profile (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    descripcion VARCHAR(100),
    branch_id   INT,

    CONSTRAINT fk_profile_branch
        FOREIGN KEY (branch_id)
        REFERENCES "__SCHEMA__".branch(id)
        ON DELETE SET NULL
);

-- =========================================
-- TABLE: users
-- =========================================
CREATE TABLE "__SCHEMA__".users (
    id   SERIAL PRIMARY KEY,
    rut  VARCHAR(10) NOT NULL,
    dv   CHAR(1) NOT NULL
);

-- =========================================
-- TABLE: user_branch (acceso de usuarios a sucursales)
-- active = FALSE → usuario sin acceso a esa sucursal
-- blocked = TRUE → usuario     ado en esa sucursal
-- favorite = TRUE → sucursal favorita del usuario
-- =========================================
CREATE TABLE "__SCHEMA__".user_branch (
    user_id     INT NOT NULL,
    branch_id   INT NOT NULL,
    favorite    BOOLEAN NOT NULL DEFAULT FALSE,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    blocked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, branch_id),

    CONSTRAINT fk_ub_user
        FOREIGN KEY (user_id)
        REFERENCES "__SCHEMA__".users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ub_branch
        FOREIGN KEY (branch_id)
        REFERENCES "__SCHEMA__".branch(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLE: user_profile (usuario-perfil-sucursal)
-- branch_id indica en qué sucursal aplica el perfil
-- branch_id NULL = perfil global para todas las sucursales
-- =========================================
CREATE TABLE "__SCHEMA__".user_profile (
    id        SERIAL PRIMARY KEY,
    user_id   INT NOT NULL,
    type_id   INT NOT NULL,
    branch_id INT,

    CONSTRAINT fk_uut_user
        FOREIGN KEY (user_id)
        REFERENCES "__SCHEMA__".users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uut_profile
        FOREIGN KEY (type_id)
        REFERENCES "__SCHEMA__".profile(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_up_branch
        FOREIGN KEY (branch_id)
        REFERENCES "__SCHEMA__".branch(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_user_profile_branch UNIQUE (user_id, type_id, branch_id)
);

-- =========================================
-- TABLE: profile_user_access (permisos por perfil)
-- =========================================
CREATE TABLE "__SCHEMA__".profile_user_access (
    id          SERIAL PRIMARY KEY,
    profile_id  INT NOT NULL,
    access_key  VARCHAR(150) NOT NULL,

    CONSTRAINT fk_ta_type
        FOREIGN KEY (profile_id)
        REFERENCES "__SCHEMA__".profile(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_type_access UNIQUE (profile_id, access_key)
);

-- =========================================
-- TABLE: user_global_access (accesos globales por usuario)
-- Canal directo usuario → access_key para PÁGINAS GLOBALES
-- (independiente de sucursal). No pasa por profile ni branch.
-- =========================================
CREATE TABLE "__SCHEMA__".user_global_access (
    user_id     INT NOT NULL,
    access_key  VARCHAR(150) NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, access_key),

    CONSTRAINT fk_uga_user
        FOREIGN KEY (user_id)
        REFERENCES "__SCHEMA__".users(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLE: document_template (plantillas de documentos)
-- type    = 'pdf' | 'excel'
-- content = plantilla Handlebars (.hbs) para PDF  (NULL si es excel)
-- file    = archivo .xlsx base para Excel          (NULL si es pdf)
-- code    = identificador lógico único para buscar la plantilla
-- =========================================
CREATE TABLE "__SCHEMA__".document_template (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    type        VARCHAR(10) NOT NULL,
    paperformat varchar(100) NOT NULL,
    content     TEXT,
    file        BYTEA,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_document_template_code UNIQUE (code)
);

-- =========================================
-- INSERTS INICIALES
-- =========================================

-- Perfil Creador global (sin branch — acceso total)
INSERT INTO "__SCHEMA__".profile (name, descripcion, branch_id)
VALUES 
    ('Creador', 'Creador de la empresa', NULL),
    ('Default', 'Perfil por defecto', NULL);
`;
