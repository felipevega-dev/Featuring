------------------------------------------
-- 1. DROPS
------------------------------------------
DROP TABLE IF EXISTS estadistica CASCADE;
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
DROP TABLE IF EXISTS admin_roles CASCADE;

-- Extensiones
create extension if not exists pg_cron;

------------------------------------------
-- 2. CREATE TABLES
------------------------------------------
-- Tabla perfil
CREATE TABLE perfil (
    usuario_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    fecha_nacimiento TIMESTAMPTZ,
    biografia TEXT,
    foto_perfil TEXT,
    nacionalidad TEXT,
    numTelefono TEXT UNIQUE,
    edad INT CHECK (edad > 0),
    sexo TEXT,
    ubicacion TEXT,
    mensaje TEXT,
    latitud DOUBLE PRECISION,
    longitud DOUBLE PRECISION,
    promedio_valoraciones DECIMAL(3,2) DEFAULT 0.0,
    preferencias_genero TEXT array,
    preferencias_habilidad TEXT array,
    preferencias_distancia INT,
    push_token TEXT,
    suspended BOOLEAN DEFAULT false,
    puntos_reputacion INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tutorial_completado BOOLEAN DEFAULT FALSE
  );

-- Tabla perfil_habilidad
CREATE TABLE perfil_habilidad (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    habilidad TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_habilidad FOREIGN KEY (perfil_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla perfil_genero
CREATE TABLE perfil_genero (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID NOT NULL,
    genero TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_perfil_genero FOREIGN KEY (perfil_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla red_social
CREATE TABLE red_social (
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
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
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

-- Tabla etiqueta
CREATE TABLE etiqueta (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE
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

-- Actualizar la tabla likes_comentario_cancion
CREATE TABLE likes_comentario_video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    comentario_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_comentario_video FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_video_likes FOREIGN KEY (comentario_id) REFERENCES comentario_cancion (id) ON DELETE CASCADE,
    UNIQUE (usuario_id, comentario_id)
);

-- Tabla conexion
CREATE TABLE conexion (
    id BIGSERIAL PRIMARY KEY,
    usuario1_id UUID NOT NULL,
    usuario2_id UUID NOT NULL,
    estado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario1_conexion FOREIGN KEY (usuario1_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario2_conexion FOREIGN KEY (usuario2_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla mensaje
CREATE TABLE mensaje (
    id BIGSERIAL PRIMARY KEY,
    emisor_id UUID NOT NULL,
    receptor_id UUID NOT NULL,
    contenido TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ DEFAULT NOW(),
    tipo_contenido TEXT,
    url_contenido TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_emisor_mensaje FOREIGN KEY (emisor_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_receptor_mensaje FOREIGN KEY (receptor_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla seguidor
CREATE TABLE seguidor (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    seguidor_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_seguidor FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_seguidor_usuario FOREIGN KEY (seguidor_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla video
CREATE TABLE video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    descripcion TEXT,
    url TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_video FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

-- Tabla comentario_video
CREATE TABLE comentario_video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    video_id BIGINT NOT NULL,
    comentario TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_comentario_video FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_video_comentario FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE CASCADE
  );

-- Tabla likes_video
CREATE TABLE likes_video (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    video_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_likes_video FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_video_likes FOREIGN KEY (video_id) REFERENCES video (id) ON DELETE CASCADE
  );

-- Tabla colaboracion
CREATE TABLE colaboracion (
    id BIGSERIAL PRIMARY KEY,
    cancion_id BIGINT NOT NULL,
    usuario_id UUID NOT NULL,
    usuario_id2 UUID NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_estado CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
    CONSTRAINT fk_usuario_colaboracion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario2_colaboracion FOREIGN KEY (usuario_id2) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_cancion_colaboracion FOREIGN KEY (cancion_id) REFERENCES cancion (id) ON DELETE CASCADE
  );

-- Tabla reporte
CREATE TABLE reporte (
    id BIGSERIAL PRIMARY KEY,
    usuario_reportante_id UUID NOT NULL,
    usuario_reportado_id UUID NOT NULL,
    contenido_id BIGINT,
    tipo_contenido TEXT,
    razon TEXT,
    estado TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_reportante FOREIGN KEY (usuario_reportante_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_reportado FOREIGN KEY (usuario_reportado_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE
  );

CREATE TABLE reporte_usuario (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  usuario_id UUID REFERENCES perfil (usuario_id),
  contenido_id BIGINT,
  tipo_contenido TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(usuario_id, contenido_id, tipo_contenido)
);

-- Tabla notificacion
CREATE TABLE notificacion (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    usuario_origen_id UUID REFERENCES perfil(usuario_id),
    tipo_notificacion TEXT,
    contenido_id BIGINT,
    mensaje TEXT,
    leido BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_notificacion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
  );

-- Tabla valoracion_colaboracion
CREATE TABLE valoracion_colaboracion (
    id BIGSERIAL PRIMARY KEY,
    colaboracion_id BIGINT NOT NULL,
    usuario_id UUID NOT NULL,
    valoracion INT CHECK (valoracion BETWEEN 1 AND 5),
    comentario TEXT CHECK (length(comentario) <= 200),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_colaboracion_valoracion FOREIGN KEY (colaboracion_id) REFERENCES colaboracion (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_valoracion_colaboracion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT valoracion_colaboracion_valoracion_check CHECK (valoracion >= 1 AND valoracion <= 5);
);

CREATE TABLE bloqueo (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    bloqueado_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_bloqueo FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_bloqueado FOREIGN KEY (bloqueado_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    UNIQUE (usuario_id, bloqueado_id)
);

CREATE TABLE preferencias_usuario (
    id uuid primary key default uuid_generate_v4(),
    usuario_id uuid references perfil (usuario_id) not null unique,
    -- Privacidad del perfil
    mostrar_edad boolean default true,
    mostrar_ubicacion boolean default true,
    mostrar_redes_sociales boolean default true,
    mostrar_valoraciones boolean default true,
    -- Notificaciones
    notificaciones_mensajes boolean default true,
    notificaciones_match boolean default true,
    notificaciones_valoraciones boolean default true,
    notificaciones_comentarios boolean default true,
    notificaciones_seguidores boolean default true,
    -- Preferencias de Match
    match_filtrar_nacionalidad boolean default false,
    match_filtrar_edad boolean default false,
    match_filtrar_sexo boolean default false,
    match_rango_edad int[] default '{18,99}',
    match_nacionalidades text[] default '{}',
    match_sexo_preferido text default 'todos',
    -- Preferencias de Match adicionales (las que estaban en perfil)
    preferencias_genero text[] default '{}',
    preferencias_habilidad text[] default '{}',
    preferencias_distancia integer default 10,
    sin_limite_distancia boolean default false,
    -- Timestamps
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    constraint fk_usuario_preferencias foreign key (usuario_id) references perfil (usuario_id) on delete cascade
);

-- Tabla admin_roles
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla sancion_administrativa
CREATE TABLE sancion_administrativa (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    admin_id UUID NOT NULL,
    tipo_sancion TEXT NOT NULL CHECK (tipo_sancion IN ('amonestacion', 'suspension_temporal', 'suspension_permanente')),
    motivo TEXT NOT NULL,
    duracion_dias INT,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'cumplida', 'revocada')),
    reporte_id BIGINT REFERENCES reporte(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_usuario_sancion FOREIGN KEY (usuario_id) REFERENCES perfil (usuario_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_sancion FOREIGN KEY (admin_id) REFERENCES admin_roles (id)
);

-- Tabla para las insignias
CREATE TABLE insignia (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    imagen TEXT,
    nivel TEXT CHECK (nivel IN ('bronce', 'plata', 'oro')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para asignar insignias a usuarios
CREATE TABLE perfil_insignia (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID REFERENCES perfil(usuario_id) ON DELETE CASCADE,
    insignia_id BIGINT REFERENCES insignia(id) ON DELETE CASCADE,
    fecha_obtencion TIMESTAMPTZ DEFAULT NOW(),
    activo BOOLEAN DEFAULT false,
    UNIQUE(perfil_id, insignia_id)
);

-- Tabla para los títulos
CREATE TABLE titulo (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    nivel TEXT CHECK (nivel IN ('novato', 'recurrente', 'honorario')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para asignar títulos a usuarios
CREATE TABLE perfil_titulo (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID REFERENCES perfil(usuario_id) ON DELETE CASCADE,
    titulo_id BIGINT REFERENCES titulo(id) ON DELETE CASCADE,
    activo BOOLEAN DEFAULT true,
    fecha_obtencion TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(perfil_id, titulo_id)
);

-- Tabla para el historial de premium
CREATE TABLE historial_premium (
    id BIGSERIAL PRIMARY KEY,
    perfil_id UUID REFERENCES perfil(usuario_id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ DEFAULT NOW(),
    fecha_fin TIMESTAMPTZ,
    motivo TEXT NOT NULL,
    nivel TEXT CHECK (nivel IN ('bronce', 'plata', 'oro')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar después de la tabla reporte_usuario y antes de la tabla notificacion

CREATE TABLE support_tickets (
    id BIGSERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES perfil(usuario_id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('bug', 'feature_request', 'consulta', 'otro')),
    prioridad TEXT NOT NULL DEFAULT 'baja' CHECK (prioridad IN ('baja', 'media', 'alta')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'resuelto', 'cerrado')),
    admin_id UUID REFERENCES admin_roles(id),
    respuesta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------
-- 3. CREATE POLICIES
------------------------------------------
-- Crear políticas para chat_images
CREATE POLICY "permitirtodo_chat_images_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat_images');
CREATE POLICY "permitirtodo_chat_images_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat_images');
CREATE POLICY "permitirtodo_chat_images_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'chat_images');
CREATE POLICY "permitirtodo_chat_images_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'chat_images');

-- Crear políticas para chat_videos
CREATE POLICY "permitirtodo_chat_videos_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'chat_videos');
CREATE POLICY "permitirtodo_chat_videos_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'chat_videos');
CREATE POLICY "permitirtodo_chat_videos_2" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'chat_videos');
CREATE POLICY "permitirtodo_chat_videos_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'chat_videos');

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

-- fotoperfil
CREATE POLICY "permitirtodo ftpnhqo_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'fotoperfil');
CREATE POLICY "permitirtodo ftpnhqo_1" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'fotoperfil');
CREATE POLICY "permitirtodo ftpnhqo_2" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'fotoperfil');
CREATE POLICY "permitirtodo ftpnhqo_3" ON storage.objects FOR DELETE TO public USING (bucket_id = 'fotoperfil');

-- Políticas para admin_roles
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Política para lectura (SELECT)
CREATE POLICY "permitir_lectura_autenticados"
ON admin_roles
FOR SELECT
TO authenticated
USING (true);

-- Política para inserción (INSERT)
CREATE POLICY "permitir_insert_super_admin"
ON admin_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_roles ar 
    WHERE ar.id = auth.uid() 
    AND ar.role = 'super_admin'
  )
);

-- Política para actualización (UPDATE)
CREATE POLICY "permitir_update_super_admin"
ON admin_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles ar 
    WHERE ar.id = auth.uid() 
    AND ar.role = 'super_admin'
  )
);

-- Política para eliminación (DELETE)
CREATE POLICY "permitir_delete_super_admin"
ON admin_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_roles ar 
    WHERE ar.id = auth.uid() 
    AND ar.role = 'super_admin'
  )
);

-- Solo los super_admin pueden ver roles
CREATE POLICY "Solo super_admin pueden ver roles"
  ON admin_roles
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM admin_roles WHERE role = 'super_admin'
  ));

-- Solo super_admin pueden modificar roles
CREATE POLICY "Solo super_admin pueden modificar roles"
  ON admin_roles
  FOR ALL
  USING (auth.uid() IN (
    SELECT id FROM admin_roles WHERE role = 'super_admin'
  ));

-- Políticas para support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios tickets
CREATE POLICY "Users can view own tickets" 
ON support_tickets FOR SELECT 
TO authenticated 
USING (auth.uid() = usuario_id);

-- Los admins pueden ver todos los tickets
CREATE POLICY "Admins can view all tickets" 
ON support_tickets FOR SELECT 
TO authenticated 
USING (auth.uid() IN (
    SELECT id FROM admin_roles
));

-- Los admins pueden actualizar tickets
CREATE POLICY "Admins can update tickets" 
ON support_tickets FOR UPDATE 
TO authenticated 
USING (auth.uid() IN (
    SELECT id FROM admin_roles
));

-- Los usuarios pueden crear tickets
CREATE POLICY "Users can create tickets"
ON support_tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

------------------------------------------
-- 4. CREATE INDEXES------------------------------------------
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

CREATE INDEX idx_colaboracion_estado ON colaboracion(estado);
CREATE INDEX idx_colaboracion_usuarios ON colaboracion(usuario_id, cancion_id);
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo_notificacion);
CREATE INDEX idx_preferencias_usuario ON preferencias_usuario (usuario_id);
CREATE INDEX idx_mensaje_leido ON mensaje (receptor_id, emisor_id, leido);

CREATE INDEX idx_admin_roles_id ON admin_roles (id);
CREATE INDEX idx_admin_roles_role ON admin_roles (role);

CREATE INDEX idx_cancion_estado ON cancion(estado);
CREATE INDEX idx_video_estado ON video(estado);

-- Índice para mejorar búsquedas
CREATE INDEX idx_sancion_administrativa_usuario ON sancion_administrativa(usuario_id);
CREATE INDEX idx_sancion_administrativa_estado ON sancion_administrativa(estado);

CREATE INDEX idx_perfil_puntos_reputacion ON perfil(puntos_reputacion);

CREATE INDEX idx_support_tickets_usuario ON support_tickets(usuario_id);
CREATE INDEX idx_support_tickets_estado ON support_tickets(estado);
CREATE INDEX idx_support_tickets_tipo ON support_tickets(tipo);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);

-- Índices adicionales para optimizar consultas del chat
CREATE INDEX IF NOT EXISTS idx_mensaje_fecha_envio ON mensaje(fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_mensaje_tipo_contenido ON mensaje(tipo_contenido);
CREATE INDEX IF NOT EXISTS idx_mensaje_emisor_receptor_fecha ON mensaje(emisor_id, receptor_id, fecha_envio DESC);
CREATE INDEX IF NOT EXISTS idx_mensaje_url_contenido ON mensaje(url_contenido) WHERE url_contenido IS NOT NULL;

-- Índice para mejorar el rendimiento de las consultas de almacenamiento
CREATE INDEX IF NOT EXISTS idx_storage_objects_metadata_size 
ON storage.objects(((metadata->>'size')::BIGINT) DESC);

CREATE INDEX IF NOT EXISTS idx_perfil_username_trgm 
ON perfil USING gin (username gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_mensaje_contenido_trgm 
ON mensaje USING gin (contenido gin_trgm_ops);

-- Índice compuesto para optimizar consultas de likes
CREATE INDEX idx_likes_cancion_compound 
ON likes_cancion (cancion_id, usuario_id, created_at DESC);

-- Índice para ordenar por fecha
CREATE INDEX idx_likes_cancion_fecha 
ON likes_cancion (created_at DESC);