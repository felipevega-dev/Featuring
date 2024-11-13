------------------------------------------
-- CREATE FUNCTIONS
------------------------------------------
-- Trigger para actualizar el promedio de valoraciones
CREATE OR REPLACE FUNCTION actualizar_promedio_valoraciones()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE perfil
  SET promedio_valoraciones = (
    SELECT COALESCE(AVG(valoracion), 0)
    FROM valoracion_colaboracion
    WHERE usuario_id = NEW.usuario_id
  )
  WHERE usuario_id = NEW.usuario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el estado de leido a false
CREATE OR REPLACE FUNCTION set_message_unread()
RETURNS TRIGGER AS $$
BEGIN
  NEW.leido = FALSE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el updated_at
CREATE OR REPLACE FUNCTION moddatetime () RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ LANGUAGE plpgsql;

-- Trigger para manejar nuevos seguidores
CREATE OR REPLACE FUNCTION handle_new_follower()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar notificación para el usuario que fue seguido
  INSERT INTO notificacion (
    usuario_id,
    usuario_origen_id,
    tipo_notificacion,
    mensaje,
    leido
  )
  VALUES (
    NEW.usuario_id, -- usuario que es seguido
    NEW.seguidor_id, -- usuario que está siguiendo
    'nuevo_seguidor',
    (SELECT username || ' te ha seguido' 
     FROM perfil 
     WHERE usuario_id = NEW.seguidor_id),
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para respuestas a comentarios
CREATE OR REPLACE FUNCTION handle_comment_reply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.padre_id IS NOT NULL THEN
    INSERT INTO notificacion (
      usuario_id,
      usuario_origen_id,
      tipo_notificacion,
      contenido_id,
      mensaje,
      leido
    )
    VALUES (
      (SELECT usuario_id FROM comentario_cancion WHERE id = NEW.padre_id),
      NEW.usuario_id,
      'respuesta_comentario',
      NEW.id,
      (SELECT username || ' respondió a tu comentario' 
       FROM perfil 
       WHERE usuario_id = NEW.usuario_id),
      false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Agregar al final de la sección de FUNCTIONS
CREATE OR REPLACE FUNCTION create_default_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO preferencias_usuario (usuario_id)
  VALUES (NEW.usuario_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener usuarios por país
CREATE OR REPLACE FUNCTION get_users_by_country()
RETURNS TABLE (country text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nacionalidad as country,
    count(*) as count
  FROM perfil
  WHERE nacionalidad IS NOT NULL
  GROUP BY nacionalidad
  ORDER BY count DESC;
END;
$$;

-- Función para obtener usuarios por rango de edad
CREATE OR REPLACE FUNCTION get_users_by_age_range()
RETURNS TABLE (age_range text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN edad < 18 THEN '<18'
      WHEN edad BETWEEN 18 AND 24 THEN '18-24'
      WHEN edad BETWEEN 25 AND 34 THEN '25-34'
      WHEN edad BETWEEN 35 AND 44 THEN '35-44'
      ELSE '45+'
    END as age_range,
    count(*) as count
  FROM perfil
  WHERE edad IS NOT NULL
  GROUP BY age_range
  ORDER BY age_range;
END;
$$;

-- Función para obtener usuarios por país
CREATE OR REPLACE FUNCTION get_users_by_country()
RETURNS TABLE (country text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    nacionalidad as country,
    count(*) as count
  FROM perfil
  WHERE nacionalidad IS NOT NULL
  GROUP BY nacionalidad
  ORDER BY count DESC;
END;
$$;

-- Función para obtener usuarios por rango de edad
CREATE OR REPLACE FUNCTION get_users_by_age_range()
RETURNS TABLE (age_range text, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN edad < 18 THEN '<18'
      WHEN edad BETWEEN 18 AND 24 THEN '18-24'
      WHEN edad BETWEEN 25 AND 34 THEN '25-34'
      WHEN edad BETWEEN 35 AND 44 THEN '35-44'
      ELSE '45+'
    END as age_range,
    count(*) as count
  FROM perfil
  WHERE edad IS NOT NULL
  GROUP BY age_range
  ORDER BY age_range;
END;
$$; 

-- Función para obtener métricas de almacenamiento
CREATE OR REPLACE FUNCTION get_storage_metrics()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    total_size BIGINT;
    videos_size BIGINT;
    songs_size BIGINT;
    covers_size BIGINT;
    profile_pics_size BIGINT;
    chat_videos_size BIGINT;
    chat_images_size BIGINT;
    audio_messages_size BIGINT;
    largest_files json;
BEGIN
    -- Obtener tamaño total
    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO total_size
    FROM storage.objects;

    -- Obtener tamaño por bucket
    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO videos_size
    FROM storage.objects
    WHERE bucket_id = 'videos';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO songs_size
    FROM storage.objects
    WHERE bucket_id = 'canciones';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO covers_size
    FROM storage.objects
    WHERE bucket_id = 'caratulas';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO profile_pics_size
    FROM storage.objects
    WHERE bucket_id = 'fotoperfil';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO chat_videos_size
    FROM storage.objects
    WHERE bucket_id = 'chat_videos';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO chat_images_size
    FROM storage.objects
    WHERE bucket_id = 'chat_images';

    SELECT COALESCE(SUM((metadata->>'size')::BIGINT), 0)
    INTO audio_messages_size
    FROM storage.objects
    WHERE bucket_id = 'audio_messages';

    -- Obtener los 10 archivos más grandes
    SELECT json_agg(files)
    INTO largest_files
    FROM (
        SELECT 
            bucket_id,
            name,
            (metadata->>'size')::BIGINT as size,
            created_at
        FROM storage.objects
        ORDER BY (metadata->>'size')::BIGINT DESC
        LIMIT 10
    ) files;

    RETURN json_build_object(
        'total_size_bytes', total_size,
        'total_size_gb', (total_size::float / 1024 / 1024 / 1024),
        'videos_size_gb', (videos_size::float / 1024 / 1024 / 1024),
        'songs_size_gb', (songs_size::float / 1024 / 1024 / 1024),
        'covers_size_gb', (covers_size::float / 1024 / 1024 / 1024),
        'profile_pics_size_gb', (profile_pics_size::float / 1024 / 1024 / 1024),
        'chat_videos_size_gb', (chat_videos_size::float / 1024 / 1024 / 1024),
        'chat_images_size_gb', (chat_images_size::float / 1024 / 1024 / 1024),
        'audio_messages_size_gb', (audio_messages_size::float / 1024 / 1024 / 1024),
        'storage_distribution', json_build_object(
            'videos', videos_size,
            'songs', songs_size,
            'covers', covers_size,
            'profile_pics', profile_pics_size,
            'chat_videos', chat_videos_size,
            'chat_images', chat_images_size,
            'audio_messages', audio_messages_size
        ),
        'largest_files', largest_files
    );
END;
$$;

-- Función para refrescar la caché de métricas
CREATE OR REPLACE FUNCTION refresh_storage_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW storage_metrics_cache;
END;
$$;

-- Función para incrementar puntos
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN x + 1;
END;
$$;

-- Función para incrementar puntos de reputación
CREATE OR REPLACE FUNCTION increment_reputation_points(user_id uuid, points integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE perfil
    SET puntos_reputacion = COALESCE(puntos_reputacion, 0) + points
    WHERE usuario_id = user_id;
END;
$$;

-- Función para manejar las recompensas automáticamente
CREATE OR REPLACE FUNCTION handle_reputation_rewards()
RETURNS TRIGGER AS $$
DECLARE
    dias_premium INT;
    nivel_actual TEXT;
    nueva_insignia_id BIGINT;
    nuevo_titulo_id BIGINT;
BEGIN
    -- Asignar todas las insignias y títulos que correspondan según los puntos
    IF NEW.puntos_reputacion >= 100 THEN
        -- Asignar insignia de bronce si no la tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_insignia pi
            INNER JOIN insignia i ON i.id = pi.insignia_id
            WHERE pi.perfil_id = NEW.usuario_id 
            AND i.nivel = 'bronce'
        ) THEN
            INSERT INTO perfil_insignia (perfil_id, insignia_id, activo)
            SELECT NEW.usuario_id, id, true FROM insignia WHERE nivel = 'bronce';

            -- Desactivar otras insignias
            UPDATE perfil_insignia 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND insignia_id != (SELECT id FROM insignia WHERE nivel = 'bronce' LIMIT 1);
        END IF;

        -- Asignar título de novato si no lo tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_titulo pt
            INNER JOIN titulo t ON t.id = pt.titulo_id
            WHERE pt.perfil_id = NEW.usuario_id 
            AND t.nivel = 'novato'
        ) THEN
            INSERT INTO perfil_titulo (perfil_id, titulo_id, activo)
            SELECT NEW.usuario_id, id, true FROM titulo WHERE nivel = 'novato';

            -- Desactivar otros títulos
            UPDATE perfil_titulo 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND titulo_id != (SELECT id FROM titulo WHERE nivel = 'novato' LIMIT 1);
        END IF;

        dias_premium := 5;
        nivel_actual := 'bronce';
    END IF;

    IF NEW.puntos_reputacion >= 300 THEN
        -- Asignar insignia de plata si no la tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_insignia pi
            INNER JOIN insignia i ON i.id = pi.insignia_id
            WHERE pi.perfil_id = NEW.usuario_id 
            AND i.nivel = 'plata'
        ) THEN
            INSERT INTO perfil_insignia (perfil_id, insignia_id, activo)
            SELECT NEW.usuario_id, id, true FROM insignia WHERE nivel = 'plata';

            -- Desactivar otras insignias
            UPDATE perfil_insignia 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND insignia_id != (SELECT id FROM insignia WHERE nivel = 'plata' LIMIT 1);
        END IF;

        -- Asignar título de recurrente si no lo tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_titulo pt
            INNER JOIN titulo t ON t.id = pt.titulo_id
            WHERE pt.perfil_id = NEW.usuario_id 
            AND t.nivel = 'recurrente'
        ) THEN
            INSERT INTO perfil_titulo (perfil_id, titulo_id, activo)
            SELECT NEW.usuario_id, id, true FROM titulo WHERE nivel = 'recurrente';

            -- Desactivar otros títulos
            UPDATE perfil_titulo 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND titulo_id != (SELECT id FROM titulo WHERE nivel = 'recurrente' LIMIT 1);
        END IF;

        dias_premium := 14;
        nivel_actual := 'plata';
    END IF;

    IF NEW.puntos_reputacion >= 600 THEN
        -- Asignar insignia de oro si no la tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_insignia pi
            INNER JOIN insignia i ON i.id = pi.insignia_id
            WHERE pi.perfil_id = NEW.usuario_id 
            AND i.nivel = 'oro'
        ) THEN
            INSERT INTO perfil_insignia (perfil_id, insignia_id, activo)
            SELECT NEW.usuario_id, id, true FROM insignia WHERE nivel = 'oro';

            -- Desactivar otras insignias
            UPDATE perfil_insignia 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND insignia_id != (SELECT id FROM insignia WHERE nivel = 'oro' LIMIT 1);
        END IF;

        -- Asignar título de honorario si no lo tiene
        IF NOT EXISTS (
            SELECT 1 FROM perfil_titulo pt
            INNER JOIN titulo t ON t.id = pt.titulo_id
            WHERE pt.perfil_id = NEW.usuario_id 
            AND t.nivel = 'honorario'
        ) THEN
            INSERT INTO perfil_titulo (perfil_id, titulo_id, activo)
            SELECT NEW.usuario_id, id, true FROM titulo WHERE nivel = 'honorario';

            -- Desactivar otros títulos
            UPDATE perfil_titulo 
            SET activo = false 
            WHERE perfil_id = NEW.usuario_id 
            AND titulo_id != (SELECT id FROM titulo WHERE nivel = 'honorario' LIMIT 1);
        END IF;

        dias_premium := 30;
        nivel_actual := 'oro';
    END IF;

    -- Actualizar beneficios premium si corresponde
    IF dias_premium IS NOT NULL THEN
        UPDATE perfil 
        SET is_premium = true,
            premium_until = COALESCE(
                GREATEST(premium_until, NOW()),
                NOW()
            ) + (dias_premium || ' days')::INTERVAL
        WHERE usuario_id = NEW.usuario_id;

        -- Registrar en historial
        INSERT INTO historial_premium (
            perfil_id,
            fecha_inicio,
            fecha_fin,
            motivo,
            nivel
        ) VALUES (
            NEW.usuario_id,
            NOW(),
            NOW() + (dias_premium || ' days')::INTERVAL,
            'Recompensa por puntos de reputación',
            nivel_actual
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para activar una insignia y desactivar las demás
CREATE OR REPLACE FUNCTION toggle_insignia_activa()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activo THEN
        -- Desactivar todas las otras insignias del usuario
        UPDATE perfil_insignia
        SET activo = false
        WHERE perfil_id = NEW.perfil_id
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función principal para manejar sanciones
CREATE OR REPLACE FUNCTION handle_sanctions()
RETURNS TRIGGER AS $$
DECLARE
    amonestaciones_count INTEGER;
BEGIN
    -- Si es una actualización y el estado cambió a 'revocada' o 'cumplida'
    IF (TG_OP = 'UPDATE' AND 
        (NEW.estado = 'revocada' OR NEW.estado = 'cumplida')) THEN
        
        -- Actualizar el estado suspended solo si no hay otras sanciones activas
        UPDATE perfil 
        SET suspended = EXISTS (
            SELECT 1 
            FROM sancion_administrativa 
            WHERE usuario_id = NEW.usuario_id 
            AND estado = 'activa'
            AND (tipo_sancion = 'suspension_temporal' OR tipo_sancion = 'suspension_permanente')
            AND id != NEW.id
        )
        WHERE usuario_id = NEW.usuario_id;
        
    -- Si es una inserción o actualización a estado 'activa'
    ELSIF (TG_OP = 'INSERT' OR 
           (TG_OP = 'UPDATE' AND NEW.estado = 'activa')) THEN
        
        -- Si es una suspensión, marcar como suspended
        IF (NEW.tipo_sancion IN ('suspension_temporal', 'suspension_permanente')) THEN
            UPDATE perfil 
            SET suspended = true 
            WHERE usuario_id = NEW.usuario_id;
        
        -- Si es una amonestación, verificar el número total de amonestaciones activas
        ELSIF (NEW.tipo_sancion = 'amonestacion') THEN
            SELECT COUNT(*)
            INTO amonestaciones_count
            FROM sancion_administrativa
            WHERE usuario_id = NEW.usuario_id
            AND tipo_sancion = 'amonestacion'
            AND estado = 'activa';

            -- Si con esta nueva amonestación llega a 3, crear una suspensión temporal automática
            IF amonestaciones_count >= 3 THEN
                INSERT INTO sancion_administrativa (
                    usuario_id,
                    admin_id,
                    tipo_sancion,
                    motivo,
                    duracion_dias,
                    estado,
                    fecha_inicio,
                    fecha_fin
                ) VALUES (
                    NEW.usuario_id,
                    NEW.admin_id,
                    'suspension_temporal',
                    'Suspensión automática por acumular 3 amonestaciones',
                    3, -- 3 días de suspensión
                    'activa',
                    NOW(),
                    NOW() + INTERVAL '3 days'
                );

                -- Marcar las amonestaciones como cumplidas
                UPDATE sancion_administrativa
                SET estado = 'cumplida'
                WHERE usuario_id = NEW.usuario_id
                AND tipo_sancion = 'amonestacion'
                AND estado = 'activa';

                -- Actualizar el estado suspended del usuario
                UPDATE perfil 
                SET suspended = true 
                WHERE usuario_id = NEW.usuario_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar al usuario cuando su ticket es respondido
CREATE OR REPLACE FUNCTION notify_support_ticket_response()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.respuesta IS NOT NULL AND (OLD.respuesta IS NULL OR NEW.respuesta != OLD.respuesta) THEN
        INSERT INTO notificacion (
            usuario_id,
            tipo_notificacion,
            contenido_id,
            mensaje,
            leido
        ) VALUES (
            NEW.usuario_id,
            'respuesta_soporte',
            NEW.id,
            'Tu ticket de soporte ha sido respondido',
            false
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar mensajes antiguos
CREATE OR REPLACE FUNCTION clean_old_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eliminar mensajes más antiguos de 6 meses
    DELETE FROM mensaje
    WHERE fecha_envio < NOW() - INTERVAL '6 months';
END;
$$;

-- 3. Función y trigger para manejar notificaciones de chat
CREATE OR REPLACE FUNCTION handle_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
    user_push_token TEXT;
BEGIN
    -- Solo insertar notificación si no existe una notificación no leída del mismo emisor
    INSERT INTO notificacion (
        usuario_id,
        usuario_origen_id,
        tipo_notificacion,
        mensaje,
        leido
    )
    SELECT 
        NEW.receptor_id,
        NEW.emisor_id,
        'mensaje_nuevo',
        'Tienes mensajes nuevos de ' || (SELECT username FROM perfil WHERE usuario_id = NEW.emisor_id),
        false
    FROM preferencias_usuario
    WHERE usuario_id = NEW.receptor_id
    AND notificaciones_mensajes = true
    AND NOT EXISTS (
        SELECT 1 
        FROM notificacion 
        WHERE usuario_id = NEW.receptor_id 
        AND usuario_origen_id = NEW.emisor_id
        AND tipo_notificacion = 'mensaje_nuevo'
        AND leido = false
    );

    -- Obtener el push token del receptor si existe
    SELECT push_token INTO user_push_token
    FROM perfil
    WHERE usuario_id = NEW.receptor_id
    AND push_token IS NOT NULL;

    -- Si hay push token, enviar notificación
    IF user_push_token IS NOT NULL THEN
        PERFORM pg_notify('push_notification', json_build_object(
            'token', user_push_token,
            'title', (SELECT username FROM perfil WHERE usuario_id = NEW.emisor_id),
            'body', CASE 
                WHEN NEW.tipo_contenido = 'texto' THEN LEFT(NEW.contenido, 50) || '...'
                ELSE 'Te ha enviado un ' || NEW.tipo_contenido
            END
        )::text);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para obtener estadísticas del chat
CREATE OR REPLACE FUNCTION get_chat_statistics(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_messages', (
            SELECT COUNT(*) 
            FROM mensaje 
            WHERE emisor_id = user_id OR receptor_id = user_id
        ),
        'messages_sent', (
            SELECT COUNT(*) 
            FROM mensaje 
            WHERE emisor_id = user_id
        ),
        'messages_received', (
            SELECT COUNT(*) 
            FROM mensaje 
            WHERE receptor_id = user_id
        ),
        'media_messages', (
            SELECT json_build_object(
                'images', COUNT(*) FILTER (WHERE tipo_contenido = 'imagen'),
                'videos', COUNT(*) FILTER (WHERE tipo_contenido = 'video_chat'),
                'audio', COUNT(*) FILTER (WHERE tipo_contenido = 'audio')
            )
            FROM mensaje 
            WHERE emisor_id = user_id OR receptor_id = user_id
        ),
        'active_chats', (
            SELECT COUNT(DISTINCT 
                CASE 
                    WHEN emisor_id = user_id THEN receptor_id 
                    ELSE emisor_id 
                END)
            FROM mensaje 
            WHERE (emisor_id = user_id OR receptor_id = user_id)
            AND fecha_envio > NOW() - INTERVAL '30 days'
        )
    ) INTO result;

    RETURN result;
END;
$$;


-- Función para refrescar la vista de mensajes no leídos
CREATE OR REPLACE FUNCTION refresh_unread_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW unread_messages_count;
END;
$$;

-- 6. Función para marcar mensajes como leídos eficientemente
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_receptor_id UUID,
    p_emisor_id UUID
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE mensaje
    SET leido = true
    WHERE receptor_id = p_receptor_id
    AND emisor_id = p_emisor_id
    AND leido = false;
    
    -- Refrescar la vista de mensajes no leídos
    PERFORM refresh_unread_messages();
END;
$$;

-- 7. Trigger para limpiar archivos huérfanos
CREATE OR REPLACE FUNCTION clean_orphaned_chat_files()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el mensaje tenía un archivo adjunto, eliminar el archivo
    IF OLD.url_contenido IS NOT NULL THEN
        -- Determinar el bucket basado en el tipo de contenido
        CASE OLD.tipo_contenido
            WHEN 'imagen' THEN
                PERFORM storage.delete('chat_images', OLD.url_contenido);
            WHEN 'video_chat' THEN
                PERFORM storage.delete('chat_videos', OLD.url_contenido);
            WHEN 'audio' THEN
                PERFORM storage.delete('audio_messages', OLD.url_contenido);
        END CASE;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar notificaciones antiguas
CREATE OR REPLACE FUNCTION clean_old_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Eliminar notificaciones leídas más antiguas de 1 mes
    DELETE FROM notificacion
    WHERE leido = true 
    AND created_at < NOW() - INTERVAL '1 month';
    
    -- Eliminar notificaciones no leídas más antiguas de 3 meses
    DELETE FROM notificacion
    WHERE leido = false 
    AND created_at < NOW() - INTERVAL '3 months';
END;
$$;

-- Función y trigger para limpiar tokens de push expirados
CREATE OR REPLACE FUNCTION clean_expired_push_tokens()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar tokens que no se han actualizado en más de 30 días
    UPDATE perfil
    SET push_token = NULL
    WHERE push_token IS NOT NULL
    AND updated_at < NOW() - INTERVAL '30 days';
END;
$$;

-- 2. Función y trigger para actualizar el estado de las conexiones inactivas
CREATE OR REPLACE FUNCTION update_inactive_connections()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Marcar como inactivas las conexiones sin mensajes en 3 meses
    UPDATE conexion
    SET estado = 'inactiva'
    WHERE id IN (
        SELECT c.id
        FROM conexion c
        LEFT JOIN mensaje m ON 
            (m.emisor_id = c.usuario1_id AND m.receptor_id = c.usuario2_id)
            OR (m.emisor_id = c.usuario2_id AND m.receptor_id = c.usuario1_id)
        WHERE c.estado = 'activa'
        GROUP BY c.id
        HAVING MAX(m.fecha_envio) < NOW() - INTERVAL '3 months'
        OR MAX(m.fecha_envio) IS NULL
    );
END;
$$;

-- Función para optimizar el almacenamiento de medios
CREATE OR REPLACE FUNCTION clean_unused_media()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Limpiar archivos de chat antiguos
    DELETE FROM storage.objects
    WHERE bucket_id IN ('chat_images', 'chat_videos', 'audio_messages')
    AND created_at < NOW() - INTERVAL '6 months';
    
    -- Limpiar fotos de perfil no utilizadas
    DELETE FROM storage.objects
    WHERE bucket_id = 'fotoperfil'
    AND name NOT IN (
        SELECT foto_perfil FROM perfil WHERE foto_perfil IS NOT NULL
    );
END;
    $$;

-- Función para refrescar estadísticas
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_statistics;
END;
$$;

-- Trigger para mantener consistencia en colaboraciones
CREATE OR REPLACE FUNCTION validate_collaboration()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar que los usuarios no sean el mismo
    IF NEW.usuario_id = NEW.usuario_id2 THEN
        RAISE EXCEPTION 'No puedes colaborar contigo mismo';
    END IF;
    
    -- Verificar que no exista una colaboración pendiente entre los mismos usuarios
    IF EXISTS (
        SELECT 1 FROM colaboracion
        WHERE ((usuario_id = NEW.usuario_id AND usuario_id2 = NEW.usuario_id2)
        OR (usuario_id = NEW.usuario_id2 AND usuario_id2 = NEW.usuario_id))
        AND estado = 'pendiente'
        AND id != COALESCE(NEW.id, 0)
    ) THEN
        RAISE EXCEPTION 'Ya existe una colaboración pendiente entre estos usuarios';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular compatibilidad entre usuarios
CREATE OR REPLACE FUNCTION calculate_user_compatibility(user1_id UUID, user2_id UUID)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
    compatibility FLOAT;
BEGIN
    SELECT 
        (
            -- Géneros en común
            (ARRAY_LENGTH(ARRAY(
                SELECT UNNEST(p1.preferencias_genero)
                INTERSECT
                SELECT UNNEST(p2.preferencias_genero)
            ), 1)::FLOAT / 
            GREATEST(
                ARRAY_LENGTH(p1.preferencias_genero, 1),
                ARRAY_LENGTH(p2.preferencias_genero, 1)
            )) * 0.4 +
            -- Habilidades en común
            (ARRAY_LENGTH(ARRAY(
                SELECT UNNEST(p1.preferencias_habilidad)
                INTERSECT
                SELECT UNNEST(p2.preferencias_habilidad)
            ), 1)::FLOAT /
            GREATEST(
                ARRAY_LENGTH(p1.preferencias_habilidad, 1),
                ARRAY_LENGTH(p2.preferencias_habilidad, 1)
            )) * 0.4 +
            -- Proximidad geográfica
            CASE 
                WHEN p1.ubicacion = p2.ubicacion THEN 0.2
                ELSE 0.1
            END
        ) * 100 INTO compatibility
    FROM perfil p1, perfil p2
    WHERE p1.usuario_id = user1_id
    AND p2.usuario_id = user2_id;

    RETURN COALESCE(compatibility, 0);
END;
$$;

-- Función para obtener canciones con likes optimizada
CREATE OR REPLACE FUNCTION get_songs_with_likes(p_user_id UUID)
RETURNS TABLE (
    cancion_id BIGINT,
    titulo TEXT,
    likes_count BIGINT,
    user_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.titulo,
        COALESCE(sls.likes_count, 0),
        p_user_id = ANY(sls.users_who_liked) as user_liked
    FROM cancion c
    LEFT JOIN song_likes_stats sls ON c.id = sls.cancion_id
    WHERE c.estado = 'aprobado'
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;