-- Triggers relacionados con valoraciones
CREATE TRIGGER trigger_actualizar_valoraciones
AFTER INSERT OR UPDATE ON valoracion_colaboracion
FOR EACH ROW
EXECUTE FUNCTION actualizar_promedio_valoraciones();

-- Triggers relacionados con mensajes
CREATE TRIGGER set_message_unread_trigger
BEFORE INSERT ON mensaje
FOR EACH ROW
EXECUTE FUNCTION set_message_unread();

CREATE TRIGGER trigger_chat_notification
AFTER INSERT ON mensaje
FOR EACH ROW
EXECUTE FUNCTION handle_chat_notification();

-- Triggers relacionados con preferencias
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON preferencias_usuario
FOR EACH ROW
EXECUTE PROCEDURE moddatetime();

-- Triggers relacionados con seguidores
CREATE TRIGGER on_new_follower
AFTER INSERT ON seguidor
FOR EACH ROW
EXECUTE FUNCTION handle_new_follower();

-- Triggers relacionados con likes y comentarios
CREATE TRIGGER on_song_like
AFTER INSERT ON likes_cancion
FOR EACH ROW
EXECUTE FUNCTION handle_song_like();

-- Triggers relacionados con comentarios
CREATE TRIGGER on_song_comment
AFTER INSERT ON comentario_cancion
FOR EACH ROW
EXECUTE FUNCTION handle_song_comment();

-- Triggers relacionados con likes y comentarios
CREATE TRIGGER on_video_like
AFTER INSERT ON likes_video
FOR EACH ROW
EXECUTE FUNCTION handle_video_like();

-- Triggers relacionados con comentarios de videos
CREATE TRIGGER on_video_comment
AFTER INSERT ON comentario_video
FOR EACH ROW
EXECUTE FUNCTION handle_video_comment();

-- Triggers relacionados con comentarios
CREATE TRIGGER on_comment_reply
AFTER INSERT ON comentario_cancion
FOR EACH ROW
EXECUTE FUNCTION handle_comment_reply();

-- Triggers relacionados con perfiles
CREATE TRIGGER create_preferences_on_profile
AFTER INSERT ON perfil
FOR EACH ROW
EXECUTE FUNCTION create_default_preferences();

-- Triggers relacionados con reputación
CREATE TRIGGER trigger_handle_reputation_rewards
AFTER UPDATE OF puntos_reputacion ON perfil
FOR EACH ROW
WHEN (NEW.puntos_reputacion > OLD.puntos_reputacion)
EXECUTE FUNCTION handle_reputation_rewards();

-- Triggers relacionados con insignias
CREATE TRIGGER trigger_toggle_insignia_activa
BEFORE UPDATE OF activo ON perfil_insignia
FOR EACH ROW
WHEN (NEW.activo IS DISTINCT FROM OLD.activo)
EXECUTE FUNCTION toggle_insignia_activa();

-- Triggers relacionados con soporte
CREATE TRIGGER trigger_update_support_ticket_timestamp
BEFORE UPDATE ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION update_support_ticket_timestamp();

CREATE TRIGGER trigger_notify_support_ticket_response
AFTER UPDATE OF respuesta ON support_tickets
FOR EACH ROW
EXECUTE FUNCTION notify_support_ticket_response();

-- Triggers relacionados con chat
CREATE TRIGGER trigger_clean_chat_files
BEFORE DELETE ON mensaje
FOR EACH ROW
EXECUTE FUNCTION clean_orphaned_chat_files();

-- Triggers relacionados con colaboraciones
CREATE TRIGGER trigger_validate_collaboration
BEFORE INSERT OR UPDATE ON colaboracion
FOR EACH ROW
EXECUTE FUNCTION validate_collaboration();