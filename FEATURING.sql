CREATE TABLE
  "usuario" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "username" TEXT,
    "correo_electronico" TEXT UNIQUE,
    "contrasena" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

CREATE TABLE
  "perfil" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "usuario_id" BIGINT UNIQUE,
    "nombreCompleto" TEXT,
    "fechaNac" TIMESTAMP WITH TIME ZONE,
    "biografia" TEXT,
    "foto_perfil" TEXT,
    "edad" INT,
    "sexo" TEXT,
    "mensaje_perfil" TEXT,
    "redes_sociales" jsonb,
    "ubicacion" TEXT,
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "cancion" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "usuario_id" BIGINT,
    "titulo" TEXT,
    "archivo_url" TEXT,
    "fecha_subida" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "habilidad" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "nombre" TEXT
  );

CREATE TABLE
  "genero" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "nombre" TEXT
  );

CREATE TABLE
  "conexion" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "usuario1_id" BIGINT,
    "usuario2_id" BIGINT,
    "estado" TEXT,
    FOREIGN KEY ("usuario1_id") REFERENCES "usuario" ("id"),
    FOREIGN KEY ("usuario2_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "mensaje" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "emisor_id" BIGINT,
    "receptor_id" BIGINT,
    "contenido" TEXT,
    "fecha_envio" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("emisor_id") REFERENCES "usuario" ("id"),
    FOREIGN KEY ("receptor_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "seguidor" (
    "usuario_id" BIGINT,
    "seguidor_id" BIGINT,
    UNIQUE ("usuario_id", "seguidor_id"),
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id"),
    FOREIGN KEY ("seguidor_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "video" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "usuario_id" BIGINT,
    "titulo" TEXT,
    "descripcion" TEXT,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "video_url" TEXT,
    "likes" INT DEFAULT 0,
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "publicacion" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "usuario_id" BIGINT,
    "contenido" TEXT,
    "audio_url" TEXT,
    "likes" INT DEFAULT 0,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "cancion_id" BIGINT,
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id"),
    FOREIGN KEY ("cancion_id") REFERENCES "cancion" ("id")
  );

CREATE TABLE
  "perfil_habilidad" (
    "perfil_id" BIGINT,
    "habilidad_id" BIGINT,
    UNIQUE ("perfil_id", "habilidad_id"),
    FOREIGN KEY ("perfil_id") REFERENCES "perfil" ("id"),
    FOREIGN KEY ("habilidad_id") REFERENCES "habilidad" ("id")
  );

CREATE TABLE
  "perfil_genero" (
    "perfil_id" BIGINT,
    "genero_id" BIGINT,
    UNIQUE ("perfil_id", "genero_id"),
    FOREIGN KEY ("perfil_id") REFERENCES "perfil" ("id"),
    FOREIGN KEY ("genero_id") REFERENCES "genero" ("id")
  );

CREATE TABLE
  "comentario_video" (
    "video_id" BIGINT,
    "usuario_id" BIGINT,
    "contenido" TEXT,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("video_id") REFERENCES "video" ("id"),
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id")
  );

CREATE TABLE
  "comentario_publicacion" (
    "publicacion_id" BIGINT,
    "usuario_id" BIGINT,
    "contenido" TEXT,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY ("publicacion_id") REFERENCES "publicacion" ("id"),
    FOREIGN KEY ("usuario_id") REFERENCES "usuario" ("id")
  );