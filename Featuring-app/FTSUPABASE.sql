-- Drops de las tablas para recrear y borrar sin problemas
DROP TABLE IF EXISTS configuracion_privacidad CASCADE;
DROP TABLE IF EXISTS estadistica CASCADE;
DROP TABLE IF EXISTS reporte CASCADE;
DROP TABLE IF EXISTS colaboracion CASCADE;
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS comentario_publicacion CASCADE;
DROP TABLE IF EXISTS comentario_video CASCADE;
DROP TABLE IF EXISTS publicacion CASCADE;
DROP TABLE IF EXISTS video CASCADE;
DROP TABLE IF EXISTS seguidor CASCADE;
DROP TABLE IF EXISTS mensaje CASCADE;
DROP TABLE IF EXISTS conexion CASCADE;
DROP TABLE IF EXISTS cancion CASCADE
DROP TABLE IF EXISTS perfil CASCADE;
DROP TABLE IF EXISTS likes_publicacion CASCADE;
DROP TABLE IF EXISTS likes_video CASCADE;
DROP TABLE IF EXISTS etiqueta CASCADE;
DROP TABLE IF EXISTS publicacion_etiqueta CASCADE;
DROP TABLE IF EXISTS valoracion_cancion CASCADE;
DROP TABLE IF EXISTS valoracion_colaboracion CASCADE;
DROP TABLE IF EXISTS red_social CASCADE;
DROP TABLE IF EXISTS perfil_genero CASCADE;
DROP TABLE IF EXISTS perfil_habilidad CASCADE;
DROP TABLE IF EXISTS likes_comentario_publicacion CASCADE:
-- Tabla perfil
CREATE TABLE
  perfil (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    fecha_nacimiento TIMESTAMPTZ,
    biografia TEXT,
    foto_perfil TEXT,
    numTelefono TEXT UNIQUE,
    edad INT CHECK (edad > 0),
    sexo TEXT,
    ubicacion TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

-- Tabla perfil_habilidad
CREATE TABLE
  perfil_habilidad (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    habilidad TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_habilidad FOREIGN KEY (perfil_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla perfil_genero
CREATE TABLE
  perfil_genero (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    genero TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_genero FOREIGN KEY (perfil_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla red_social
CREATE TABLE
  red_social (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    nombre TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_red_social FOREIGN KEY (perfil_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla cancion (modificada)
CREATE TABLE
  cancion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    archivo_audio TEXT,
    caratula TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_cancion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla conexion
CREATE TABLE
  conexion (
    id BIGSERIAL PRIMARY KEY,
    usuario1_id UUID NOT NULL,
    usuario2_id UUID NOT NULL,
    estado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario1_conexion FOREIGN KEY (usuario1_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario2_conexion FOREIGN KEY (usuario2_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla mensaje
CREATE TABLE
  mensaje (
    id BIGSERIAL PRIMARY KEY,
    emisor_id UUID NOT NULL,
    receptor_id UUID NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ DEFAULT NOW(),
    tipo_contenido TEXT,
    url_contenido TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_emisor_mensaje FOREIGN KEY (emisor_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_receptor_mensaje FOREIGN KEY (receptor_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla seguidor
CREATE TABLE
  seguidor (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    seguidor_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_seguidor FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_seguidor_usuario FOREIGN KEY (seguidor_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla video
CREATE TABLE
  video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    duracion TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_video FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla publicacion
CREATE TABLE
  publicacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    cancion_id BIGINT,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_publicacion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_publicacion FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE SET NULL
  );

-- Tabla comentario_video
CREATE TABLE
  comentario_video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    video_id BIGINT NOT NULL,
    comentario TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_comentario_video FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_video_comentario FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE CASCADE
  );

-- Tabla comentario_publicacion
CREATE TABLE
  comentario_publicacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    publicacion_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_comentario_publicacion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_publicacion_comentario FOREIGN KEY (publicacion_id) REFERENCES publicacion (id) ON DELETE CASCADE
  );

-- Tabla likes_publicacion
CREATE TABLE
  likes_publicacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    publicacion_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_publicacion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_publicacion_likes FOREIGN KEY (publicacion_id) REFERENCES publicacion (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, publicacion_id)
  );

-- Nueva tabla para likes de comentarios
CREATE TABLE
  likes_comentario_publicacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    comentario_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_comentario_publicacion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_publicacion_likes FOREIGN KEY (comentario_id) REFERENCES comentario_publicacion (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, comentario_id)
  );

-- Tabla likes_video
CREATE TABLE
  likes_video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    video_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_video FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_video_likes FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE SET NULL
  );

-- Tabla colaboracion
CREATE TABLE
  colaboracion (
    id BIGSERIAL PRIMARY KEY,
    cancion_id BIGINT,
    video_id BIGINT,
    usuario_id UUID NOT NULL,
    tipo_colaboracion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_colaboracion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_colaboracion FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE SET NULL,
    CONSTRAINT fk_video_colaboracion FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE SET NULL
  );

-- Tabla reporte
CREATE TABLE
  reporte (
    id BIGSERIAL PRIMARY KEY,
    usuario_reportante_id UUID NOT NULL,
    usuario_reportado_id UUID NOT NULL,
    contenido_id BIGINT,
    tipo_contenido TEXT,
    razon TEXT,
    estado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_reportante FOREIGN KEY (usuario_reportante_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_reportado FOREIGN KEY (usuario_reportado_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla configuracion_privacidad
CREATE TABLE
  configuracion_privacidad (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    perfil_visible BOOLEAN,
    mensajes_directos TEXT,
    notificaciones BOOLEAN,
    datos_compartidos JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_privacidad FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla notificacion
CREATE TABLE
  notificacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    tipo_notificacion TEXT,
    contenido_id BIGINT,
    mensaje TEXT,
    leido BOOLEAN,
    fecha_evento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_notificacion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla etiqueta
CREATE TABLE
  etiqueta (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
  );

-- Tabla publicacion_etiqueta
CREATE TABLE
  publicacion_etiqueta (
    publicacion_id BIGINT NOT NULL,
    etiqueta_id BIGINT NOT NULL,
    PRIMARY KEY (publicacion_id, etiqueta_id),
    CONSTRAINT fk_publicacion_etiqueta FOREIGN KEY (publicacion_id) REFERENCES publicacion (id) ON DELETE CASCADE,
    CONSTRAINT fk_etiqueta_publicacion FOREIGN KEY (etiqueta_id) REFERENCES etiqueta (id) ON DELETE CASCADE
  );

-- Tabla valoracion_cancion
CREATE TABLE
  valoracion_cancion (
    id BIGSERIAL PRIMARY KEY,
    cancion_id BIGINT NOT NULL,
    usuario_id UUID NOT NULL,
    valoracion INT CHECK (valoracion BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_cancion_valoracion FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_valoracion_cancion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Tabla valoracion_colaboracion
CREATE TABLE
  valoracion_colaboracion (
    id BIGSERIAL PRIMARY KEY,
    colaboracion_id BIGINT NOT NULL,
    usuario_id UUID NOT NULL,
    valoracion INT CHECK (valoracion BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_colaboracion_valoracion FOREIGN KEY (colaboracion_id) REFERENCES colaboracion (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_valoracion_colaboracion FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Índices para mejora de rendimiento
CREATE INDEX idx_video_titulo ON video (titulo);

CREATE INDEX idx_cancion_titulo ON cancion (titulo);

-- Índices adicionales
CREATE INDEX idx_publicacion_created_at ON publicacion (created_at);

CREATE INDEX idx_comentario_publicacion_created_at ON comentario_publicacion (created_at);

CREATE INDEX idx_video_created_at ON video (created_at);
