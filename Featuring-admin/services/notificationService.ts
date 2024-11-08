import { supabaseAdmin } from '../lib/supabase'

export type SanctionType = 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';

interface NotificationParams {
  userId: string;
  sanctionType: SanctionType;
  contentId?: string | number;
  adminId: string;
  motivo: string;
}

interface ReportValidationParams {
  reporterId: string;
  reportedUserId: string;
  contentId?: string | number;
  adminId: string;
  motivo: string;
  sanctionType: SanctionType;
}

export const notificationService = {
  async createSanctionNotification({
    userId,
    sanctionType,
    contentId,
    adminId,
    motivo
  }: NotificationParams) {
    try {
      // Crear mensaje según el tipo de sanción
      let mensaje = '';
      switch (sanctionType) {
        case 'amonestacion':
          mensaje = `Has recibido una amonestación. Motivo: ${motivo}`;
          break;
        case 'suspension_temporal':
          mensaje = `Tu cuenta ha sido suspendida temporalmente. Motivo: ${motivo}`;
          break;
        case 'suspension_permanente':
          mensaje = `Tu cuenta ha sido suspendida permanentemente. Motivo: ${motivo}`;
          break;
      }

      // Insertar la notificación
      const { error: notificationError } = await supabaseAdmin
        .from('notificacion')
        .insert({
          usuario_id: userId,
          usuario_origen_id: adminId,
          tipo_notificacion: 'sancion_administrativa',
          contenido_id: contentId || null,
          mensaje,
          leido: false
        });

      if (notificationError) throw notificationError;

      // Si es la tercera amonestación, verificar y aplicar suspensión automática
      if (sanctionType === 'amonestacion') {
        await this.checkAndApplyAutoSuspension(userId, adminId);
      }

    } catch (error) {
      console.error('Error creating sanction notification:', error);
      throw error;
    }
  },

  async checkAndApplyAutoSuspension(userId: string, adminId: string) {
    try {
      // Obtener amonestaciones activas
      const { data: activeSanctions, error: sanctionsError } = await supabaseAdmin
        .from('sancion_administrativa')
        .select('*')
        .eq('usuario_id', userId)
        .eq('tipo_sancion', 'amonestacion')
        .eq('estado', 'activa');

      if (sanctionsError) throw sanctionsError;

      // Si hay 3 o más amonestaciones activas
      if (activeSanctions && activeSanctions.length >= 3) {
        // 1. Marcar las amonestaciones como cumplidas
        await supabaseAdmin
          .from('sancion_administrativa')
          .update({ estado: 'cumplida' })
          .eq('usuario_id', userId)
          .eq('tipo_sancion', 'amonestacion')
          .eq('estado', 'activa');

        // 2. Crear suspensión temporal
        await supabaseAdmin
          .from('sancion_administrativa')
          .insert({
            usuario_id: userId,
            admin_id: adminId,
            tipo_sancion: 'suspension_temporal',
            motivo: 'Suspensión automática por acumular 3 amonestaciones',
            duracion_dias: 2,
            estado: 'activa'
          });

        // 3. Actualizar el estado suspended en el perfil
        await supabaseAdmin
          .from('perfil')
          .update({ suspended: true })
          .eq('usuario_id', userId);

        // 4. Crear notificación de suspensión
        await this.createSanctionNotification({
          userId,
          sanctionType: 'suspension_temporal',
          adminId,
          motivo: 'Suspensión automática por acumular 3 amonestaciones'
        });
      }
    } catch (error) {
      console.error('Error checking and applying auto suspension:', error);
      throw error;
    }
  },

  async handleReportValidation({
    reporterId,
    reportedUserId,
    contentId,
    adminId,
    motivo,
    sanctionType
  }: ReportValidationParams) {
    try {
      // 1. Notificar al usuario reportado (sanción)
      await this.createSanctionNotification({
        userId: reportedUserId,
        sanctionType,
        contentId,
        adminId,
        motivo
      });

      // 2. Notificar al usuario que reportó
      const { error: reporterNotificationError } = await supabaseAdmin
        .from('notificacion')
        .insert({
          usuario_id: reporterId,
          usuario_origen_id: adminId,
          tipo_notificacion: 'reporte_validado',
          contenido_id: contentId || null,
          mensaje: `Tu reporte ha sido validado y se han tomado medidas. Has ganado 25 puntos de reputación.`,
          leido: false
        });

      if (reporterNotificationError) throw reporterNotificationError;

      // 3. Actualizar los puntos del usuario que reportó
      const { error: pointsError } = await supabaseAdmin
        .rpc('increment_reputation_points', {
          user_id: reporterId,
          points: 25
        });

      if (pointsError) throw pointsError;

    } catch (error) {
      console.error('Error handling report validation:', error);
      throw error;
    }
  }
}; 