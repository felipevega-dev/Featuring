-- Drops de las tablas para recrear y borrar sin problemasDROP TABLE IF EXISTS estadistica CASCADE;

DROP TABLE IF EXISTS reporte CASCADE;

DROP TABLE IF EXISTS colaboracion CASCADE;

DROP TABLE IF EXISTS notificacion CASCADE;

DROP TABLE IF EXISTS comentario_video CASCADE;

DROP TABLE IF EXISTS video CASCADE;

DROP TABLE IF EXISTS seguidor CASCADE;

DROP TABLE IF EXISTS mensaje CASCADE;

DROP TABLE IF EXISTS conexion CASCADE;

DROP TABLE IF EXISTS cancion CASCADE;

DROP TABLE IF EXISTS perfil CASCADE;

DROP TABLE IF EXISTS reporte_usuario CASCADE;

DROP TABLE IF EXISTS likes_video CASCADE;

DROP TABLE IF EXISTS etiqueta CASCADE;

DROP TABLE IF EXISTS valoracion_cancion CASCADE;

DROP TABLE IF EXISTS valoracion_colaboracion CASCADE;

DROP TABLE IF EXISTS red_social CASCADE;

DROP TABLE IF EXISTS perfil_genero CASCADE;

DROP TABLE IF EXISTS perfil_habilidad CASCADE;
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
    mensaje TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    preferencias_genero TEXT array,
    preferencias_habilidad TEXT array,
    preferencias_distancia INT,
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
CREATE TABLE cancion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    titulo TEXT NOT NULL,
    genero TEXT NOT NULL,
    archivo_audio TEXT NOT NULL,
    caratula TEXT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_cancion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

  
-- Renombrar likes_publicacion a likes_cancion
CREATE TABLE likes_cancion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    cancion_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_cancion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_likes FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, cancion_id)
);

-- Renombrar comentario_publicacion a comentario_cancion
CREATE TABLE comentario_cancion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    cancion_id BIGINT NOT NULL,
    contenido TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_comentario_cancion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_comentario FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE CASCADE
);

-- Renombrar publicacion_etiqueta a cancion_etiqueta
CREATE TABLE cancion_etiqueta (
    cancion_id BIGINT NOT NULL,
    etiqueta_id BIGINT NOT NULL,
    PRIMARY KEY (cancion_id, etiqueta_id),
    CONSTRAINT fk_cancion_etiqueta FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE CASCADE,
    CONSTRAINT fk_etiqueta_cancion FOREIGN KEY (etiqueta_id) REFERENCES etiqueta (id) ON DELETE CASCADE
);

-- Actualizar la tabla likes_comentario_cancion
CREATE TABLE likes_comentario_cancion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    comentario_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_comentario_cancion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_cancion_likes FOREIGN KEY (comentario_id) REFERENCES comentario_cancion (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, comentario_id)
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
    descripcion TEXT,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_video FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE
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


CREATE TABLE reporte_usuario (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id),
  contenido_id BIGINT,
  tipo_contenido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(usuario_id, contenido_id, tipo_contenido)
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


-- storage.buckets
-- chat multimedia
CREATE POLICY "permitirtodo 1d5ffb1_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat_media');
CREATE POLICY "permitirtodo 1d5ffb1_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat_media');
CREATE POLICY "permitirtodo 1d5ffb1_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'chat_media');
CREATE POLICY "permitirtodo 1d5ffb1_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'chat_media');

-- chat audios
CREATE POLICY "permitirtodo zgnxxx_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'audio_messages');
CREATE POLICY "permitirtodo zgnxxx_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'audio_messages');
CREATE POLICY "permitirtodo zgnxxx_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'audio_messages');
CREATE POLICY "permitirtodo zgnxxx_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'audio_messages');

-- videos

CREATE POLICY "permitirtodo 1livt5k_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');
CREATE POLICY "permitirtodo 1livt5k_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'videos');
CREATE POLICY "permitirtodo 1livt5k_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'videos');
CREATE POLICY "permitirtodo 1livt5k_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'videos');

-- canciones

CREATE POLICY "permitirtodo 7y02rn_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'canciones');
CREATE POLICY "permitirtodo 7y02rn_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'canciones');
CREATE POLICY "permitirtodo 7y02rn_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'canciones');
CREATE POLICY "permitirtodo 7y02rn_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'canciones');

-- caratulas

CREATE POLICY "permitirtodo 1tvnhqo_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'caratulas');
CREATE POLICY "permitirtodo 1tvnhqo_1" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'caratulas');
CREATE POLICY "permitirtodo 1tvnhqo_2" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'caratulas');
CREATE POLICY "permitirtodo 1tvnhqo_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'caratulas');

-- Índices para mejora de rendimiento
CREATE INDEX idx_video_titulo ON video (titulo);
CREATE INDEX idx_video_created_at ON video (created_at);

CREATE INDEX idx_cancion_titulo ON cancion (titulo);
CREATE INDEX idx_cancion_usuario ON cancion (usuario_id);

CREATE INDEX idx_notificacion_usuario_leido ON notificacion (usuario_id, leido);
CREATE INDEX idx_mensaje_emisor_receptor ON mensaje (emisor_id, receptor_id);
CREATE INDEX idx_seguidor_usuario_seguidor ON seguidor (usuario_id, seguidor_id);


CREATE INDEX idx_perfil_username ON perfil (username);
CREATE INDEX idx_perfil_habilidad_perfil ON perfil_habilidad (perfil_id, habilidad);
CREATE INDEX idx_perfil_genero_perfil ON perfil_genero (perfil_id, genero);

CREATE INDEX idx_cancion_created_at ON cancion (created_at);
CREATE INDEX idx_cancion_usuario ON cancion (usuario_id);
CREATE INDEX idx_likes_cancion_usuario ON likes_cancion (usuario_id, cancion_id);
CREATE INDEX idx_comentario_cancion_usuario ON comentario_cancion (usuario_id, cancion_id);
CREATE INDEX idx_comentario_cancion_created_at ON comentario_cancion (created_at);
CREATE INDEX idx_perfil_nacionalidad ON perfil (nacionalidad);

CREATE TABLE bloqueo (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    bloqueado_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_bloqueo FOREIGN KEY (usuario_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bloqueado FOREIGN KEY (bloqueado_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, bloqueado_id)
);

--ejecutar en sus supabase
ALTER TABLE comentario_cancion
ADD COLUMN menciones JSONB DEFAULT '[]'::JSONB;
--ejecutar en sus supabase
ALTER TABLE comentario_cancion
ADD COLUMN padre_id INTEGER REFERENCES comentario_cancion(id);
-- ejecutar en supabase
ALTER TABLE mensaje
ADD COLUMN leido BOOLEAN DEFAULT FALSE;
-- ejecutar en supabase
CREATE INDEX idx_mensaje_leido ON mensaje (receptor_id, emisor_id, leido);
-- lo mismo 
CREATE OR REPLACE FUNCTION set_message_unread()
RETURNS TRIGGER AS $$
BEGIN
  NEW.leido = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_message_unread_trigger
BEFORE INSERT ON mensaje
FOR EACH ROW
EXECUTE FUNCTION set_message_unread();

UPDATE mensaje SET leido = FALSE WHERE leido IS NULL;
