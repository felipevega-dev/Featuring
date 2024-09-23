CREATE TABLE usuario (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL,
    correo_electronico TEXT NOT NULL UNIQUE,
    contrasena TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE perfil (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL UNIQUE,
    nombre_completo TEXT NOT NULL,
    fecha_nac TIMESTAMPTZ,
    biografia TEXT,
    foto_perfil TEXT,
    edad INT,
    sexo TEXT,
    mensaje_perfil TEXT,
    redes_sociales JSONB,
    ubicacion TEXT,
    CONSTRAINT fk_usuario_perfil FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE cancion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    titulo TEXT NOT NULL,
    archivo_url TEXT NOT NULL,
    fecha_subida TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_cancion FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE habilidad (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE genero (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre TEXT NOT NULL
);

CREATE TABLE conexion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario1_id BIGINT NOT NULL,
    usuario2_id BIGINT NOT NULL,
    estado TEXT,
    CONSTRAINT fk_usuario1_conexion FOREIGN KEY (usuario1_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario2_conexion FOREIGN KEY (usuario2_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE mensaje (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    emisor_id BIGINT NOT NULL,
    receptor_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_emisor_mensaje FOREIGN KEY (emisor_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_receptor_mensaje FOREIGN KEY (receptor_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE seguidor (
    usuario_id BIGINT NOT NULL,
    seguidor_id BIGINT NOT NULL,
    UNIQUE (usuario_id, seguidor_id),
    CONSTRAINT fk_usuario_seguidor FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_seguidor_usuario FOREIGN KEY (seguidor_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE video (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    video_url TEXT NOT NULL,
    likes INT DEFAULT 0,
    CONSTRAINT fk_usuario_video FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE publicacion (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    contenido TEXT,
    audio_url TEXT,
    likes INT DEFAULT 0,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    cancion_id BIGINT,
    CONSTRAINT fk_usuario_publicacion FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_publicacion FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE SET NULL
);

CREATE TABLE perfil_habilidad (
    perfil_id BIGINT NOT NULL,
    habilidad_id BIGINT NOT NULL,
    UNIQUE (perfil_id, habilidad_id),
    CONSTRAINT fk_perfil_habilidad FOREIGN KEY (perfil_id) REFERENCES perfil (id) ON DELETE CASCADE,
    CONSTRAINT fk_habilidad_perfil FOREIGN KEY (habilidad_id) REFERENCES habilidad (id) ON DELETE CASCADE
);

CREATE TABLE perfil_genero (
    perfil_id BIGINT NOT NULL,
    genero_id BIGINT NOT NULL,
    UNIQUE (perfil_id, genero_id),
    CONSTRAINT fk_perfil_genero FOREIGN KEY (perfil_id) REFERENCES perfil (id) ON DELETE CASCADE,
    CONSTRAINT fk_genero_perfil FOREIGN KEY (genero_id) REFERENCES genero (id) ON DELETE CASCADE
);

CREATE TABLE comentario_video (
    video_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_video_comentario FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_comentario_video FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE TABLE comentario_publicacion (
    publicacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_publicacion_comentario FOREIGN KEY (publicacion_id) REFERENCES publicacion (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_comentario_publicacion FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);
