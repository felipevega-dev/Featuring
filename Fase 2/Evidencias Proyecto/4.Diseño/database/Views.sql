-- Vistas materializadas    

-- Vista materializada para cachear las métricas de almacenamiento
CREATE MATERIALIZED VIEW storage_metrics_cache AS
SELECT get_storage_metrics()::jsonb as metrics;

-- Vista materializada para estadísticas de usuario
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    p.usuario_id,
    p.username,
    COUNT(DISTINCT s.seguidor_id) as seguidores,
    COUNT(DISTINCT s2.usuario_id) as siguiendo,
    COUNT(DISTINCT c.id) as canciones,
    COUNT(DISTINCT v.id) as videos,
    COUNT(DISTINCT col.id) as colaboraciones,
    COALESCE(AVG(vc.valoracion), 0) as promedio_valoraciones
FROM perfil p
LEFT JOIN seguidor s ON s.usuario_id = p.usuario_id
LEFT JOIN seguidor s2 ON s2.seguidor_id = p.usuario_id
LEFT JOIN cancion c ON c.usuario_id = p.usuario_id
LEFT JOIN video v ON v.usuario_id = p.usuario_id
LEFT JOIN colaboracion col ON col.usuario_id = p.usuario_id OR col.usuario_id2 = p.usuario_id
LEFT JOIN valoracion_colaboracion vc ON vc.usuario_id = p.usuario_id
GROUP BY p.usuario_id, p.username;

-- Vista materializada para mensajes no leídos
CREATE MATERIALIZED VIEW IF NOT EXISTS unread_messages_count AS
SELECT 
    receptor_id,
    COUNT(*) as unread_count
FROM mensaje
WHERE leido = false
GROUP BY receptor_id
WITH DATA;

-- Vista para estadísticas de contenido
CREATE MATERIALIZED VIEW content_statistics AS
SELECT 
    COUNT(DISTINCT c.id) as total_canciones,
    COUNT(DISTINCT v.id) as total_videos,
    COUNT(DISTINCT col.id) as total_colaboraciones,
    COUNT(DISTINCT CASE WHEN c.estado = 'aprobado' THEN c.id END) as canciones_aprobadas,
    COUNT(DISTINCT CASE WHEN v.estado = 'aprobado' THEN v.id END) as videos_aprobados
FROM cancion c
CROSS JOIN video v
CROSS JOIN colaboracion col;

-- Vista para métricas de interacción
CREATE MATERIALIZED VIEW interaction_metrics AS
SELECT 
    COUNT(DISTINCT lc.id) as total_likes_canciones,
    COUNT(DISTINCT lv.id) as total_likes_videos,
    COUNT(DISTINCT cc.id) as total_comentarios_canciones,
    COUNT(DISTINCT cv.id) as total_comentarios_videos,
    COUNT(DISTINCT s.id) as total_seguidores
FROM likes_cancion lc
CROSS JOIN likes_video lv
CROSS JOIN comentario_cancion cc
CROSS JOIN comentario_video cv
CROSS JOIN seguidor s;

-- Vista materializada para likes de canciones con conteo
CREATE MATERIALIZED VIEW song_likes_stats AS
SELECT 
    c.id as cancion_id,
    COUNT(lc.id) as likes_count,
    array_agg(lc.usuario_id) as users_who_liked
FROM cancion c
LEFT JOIN likes_cancion lc ON c.id = lc.cancion_id
GROUP BY c.id;

-- Función para refrescar la vista
CREATE OR REPLACE FUNCTION refresh_song_likes_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY song_likes_stats;
END;
$$;

-- Programación de tareas cron

-- Programar actualización de métricas de almacenamiento
SELECT cron.schedule('0 0 * * *', $$
    SELECT refresh_storage_metrics();
$$);

-- Programar actualización de estadísticas de usuario cada 6 horas
SELECT cron.schedule('0 */6 * * *', $$
    SELECT refresh_user_statistics();
$$);

-- Programar limpieza de medios no utilizados
SELECT cron.schedule('0 0 1 * *', $$
    SELECT clean_unused_media();
$$);

-- Programar actualización de conexiones inactivas
SELECT cron.schedule('0 0 * * 0', $$
    SELECT update_inactive_connections();
$$);

-- Programar limpieza de tokens expirados
SELECT cron.schedule('0 0 * * *', $$
    SELECT clean_expired_push_tokens();
$$);

-- Programar limpieza semanal de notificaciones antiguas
SELECT cron.schedule('0 0 * * 0', $$
    SELECT clean_old_notifications();
$$);

-- Programar actualización cada 5 minutos
SELECT cron.schedule('*/5 * * * *', $$
    SELECT refresh_unread_messages();
$$);

-- Programar limpieza mensual de mensajes antiguos
SELECT cron.schedule('0 0 1 * *', $$
    SELECT clean_old_messages();
$$);

-- Actualizar cada 5 minutos
SELECT cron.schedule('*/5 * * * *', $$
    SELECT refresh_song_likes_stats();
$$);