--paso 1 crear nuevo esquema llamado CONFIG_MAIN
CREATE SCHEMA "CONFIG_MAIN"

-- =========================================
-- TABLE: company_type
-- =========================================
CREATE TABLE "CONFIG_MAIN".company_type (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    logo       TEXT
);

-- =========================================
-- TABLE: company
-- =========================================
CREATE TABLE "CONFIG_MAIN".company (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    rut           VARCHAR(10) NOT NULL,
    dv            CHAR(1) NOT NULL,
    type_id       INT NOT NULL,
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    plan          VARCHAR(100),
    billing_day   DATE,
    logo          TEXT,
    tenant_id     VARCHAR(250),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_company_type
        FOREIGN KEY (type_id)
        REFERENCES "CONFIG_MAIN".company_type(id)
);

-- =========================================
-- TABLE: users
-- =========================================
CREATE TABLE "CONFIG_MAIN".users (
    id                      SERIAL PRIMARY KEY,
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100),
    rut                     VARCHAR(10) NOT NULL,
    dv                      CHAR(1) NOT NULL,
    email                   VARCHAR(150) NOT NULL,
    phone                   VARCHAR(20),
    password                VARCHAR(255) NOT NULL,
    newUsers                BOOLEAN NOT NULL DEFAULT FALSE,
    verified                BOOLEAN NOT NULL DEFAULT FALSE,
    failed_login_attempts   INT NOT NULL DEFAULT 0,
    blocked                 BOOLEAN NOT NULL DEFAULT FALSE,

    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_users_rut UNIQUE (rut, dv)
);

-- =========================================
-- TABLE: user_company
-- =========================================
CREATE TABLE "CONFIG_MAIN".user_company (
    user_id      INT NOT NULL,
    company_id   INT NOT NULL,
    favorite     BOOLEAN NOT NULL DEFAULT FALSE,
    blocked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, company_id),

    CONSTRAINT fk_uc_user
        FOREIGN KEY (user_id)
        REFERENCES "CONFIG_MAIN".users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uc_company
        FOREIGN KEY (company_id)
        REFERENCES "CONFIG_MAIN".company(id)
        ON DELETE CASCADE
);

-- =========================================
-- TABLE: page_type
-- Tipos de página: module, label, link
-- =========================================
CREATE TABLE "CONFIG_MAIN".page_type (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(20) NOT null,
    CONSTRAINT uq_page_type_name UNIQUE (name)
);

-- =========================================
-- TABLE: access_rule
-- Define los permisos/accesos disponibles en el sistema
-- Ejemplo: "module.home", "home-boton-secundario", "module.settings"
-- =========================================
CREATE TABLE "CONFIG_MAIN".access_rule (
    id          SERIAL PRIMARY KEY,
    access_key  VARCHAR(150) NOT NULL,   -- ej: "module.home", "home-boton-secundario"
    description VARCHAR(255),
    parent_rule_id   INT,
    CONSTRAINT uq_access_rule_key UNIQUE (access_key)
);

-- =========================================
-- TABLE: page
-- Representa las páginas/módulos/labels del sistema
-- =========================================

CREATE TABLE "CONFIG_MAIN".page (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL, --home
    module        VARCHAR(150), --modulo del sitio
    url        VARCHAR(255),          --home-site
    slug       VARCHAR(100) NOT NULL,         -- key unica del menu
    type_id     INT NOT NULL,          -- tipo page , module(componente) , label no cliqueable , link (externo)
    parent_id   INT,                  --padre del menu 
    access_id   INT,                  -- se puede agregar un acces adi que sea padre si tiene , si no es accesible
    scope_type  VARCHAR(10) NOT NULL, -- 'branch' = permiso por sucursal | 'global' = permiso global por usuario (se asigna manualmente en cada INSERT)
    "order"     INT NOT NULL,
    active      BOOLEAN NOT NULL DEFAULT TRUE   ,    --se puede ocultar un modulo del menu por si tenemos uno nuevo 

 CONSTRAINT uq_slug_page_id UNIQUE (slug),
 
    CONSTRAINT fk_page_type
        FOREIGN KEY (type_id)
        REFERENCES "CONFIG_MAIN".page_type(id),

    CONSTRAINT fk_page_parent
        FOREIGN KEY (parent_id)
        REFERENCES "CONFIG_MAIN".page(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_page_access
        FOREIGN KEY (access_id)
        REFERENCES "CONFIG_MAIN".access_rule(id)
        ON DELETE SET NULL
);

-- =========================================
-- ÍNDICES
-- =========================================
CREATE INDEX idx_page_parent ON "CONFIG_MAIN".page(parent_id);
CREATE INDEX idx_page_access ON "CONFIG_MAIN".page(access_id);
CREATE INDEX idx_page_type ON "CONFIG_MAIN".page(type_id);

-- =========================================
-- TABLE: page_company_type (N:M page <-> company_type)
-- Define a qué tipos de empresa pertenece cada página.
--   - Página SIN filas aquí  -> transversal (visible para TODOS los tipos).
--   - Página CON filas        -> exclusiva de esos company_type.
-- El vínculo página <-> tipo de empresa vive SOLO aquí (la tabla page ya no
-- referencia a company_type).
-- =========================================
CREATE TABLE "CONFIG_MAIN".page_company_type (
    page_id         INT NOT NULL,
    company_type_id INT NOT NULL,

    PRIMARY KEY (page_id, company_type_id),

    CONSTRAINT fk_pct_page
        FOREIGN KEY (page_id)
        REFERENCES "CONFIG_MAIN".page(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pct_company_type
        FOREIGN KEY (company_type_id)
        REFERENCES "CONFIG_MAIN".company_type(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_pct_company_type ON "CONFIG_MAIN".page_company_type(company_type_id);

CREATE TABLE "CONFIG_MAIN".sales_sites (
    id          SERIAL PRIMARY KEY,
    tenant_id   VARCHAR(100) NOT NULL,
    name_site   VARCHAR(200) NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_sales_site_tenant UNIQUE (tenant_id)
    
);

-- =========================================
-- PROCEDURE
-- =========================================
CREATE OR REPLACE PROCEDURE "CONFIG_MAIN".sp_create_company(
     in p_company_name   VARCHAR(100),
     in p_company_rut    VARCHAR(20),
     in p_company_dv     CHAR(1),
     in p_company_type   INTEGER,
     in p_schema_name    VARCHAR(50),
     in p_user_rut       VARCHAR(20),
     OUT p_result     varchar(5)
)
LANGUAGE plpgsql
AS $$
BEGIN

INSERT INTO "CONFIG_MAIN".company
( "name",rut,dv ,type_id, active, plan, billing_day, logo, tenant_id, created_at, updated_at)
VALUES(p_company_name,p_company_rut,p_company_dv, p_company_type, true, null, null, 
  (SELECT ct.logo FROM "CONFIG_MAIN".company_type ct WHERE ct.id = p_company_type),
  p_schema_name, now(), now());

   INSERT INTO "CONFIG_MAIN".user_company (
    user_id,
    company_id,
    created_at
	)
	VALUES (
	   (
	          SELECT u.id
  
	        FROM "CONFIG_MAIN".users u where u.rut = p_user_rut
	    ),
	    (
	        SELECT c.id
	        FROM "CONFIG_MAIN".company c
	        WHERE c.tenant_id = p_schema_name
	    ),
	    NOW()
	);

  p_result := 'ok';

END;
$$;
