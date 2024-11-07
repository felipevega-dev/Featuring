import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useSuspensionCheck } from '@/hooks/useSuspensionCheck'
import { useRouter } from 'expo-router'

export const SuspendedScreen = () => {
  const { suspensionDetails } = useSuspensionCheck()
  const router = useRouter()

  console.log('Suspension details:', suspensionDetails) // Para debug

  const handleLogout = async () => {
    try {
      // Primero cerrar sesión
      await supabase.auth.signOut()
      
      // En lugar de usar router.replace, simplemente limpiar la sesión
      // La app debería redirigir automáticamente al detectar que no hay sesión
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  if (!suspensionDetails) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Cargando...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Cuenta Suspendida</Text>
        
        <View style={styles.content}>
          <Text style={styles.message}>
            Tu cuenta ha sido {suspensionDetails.tipo_sancion === 'suspension_permanente' ? 
              'suspendida permanentemente' : 
              'suspendida temporalmente'}
          </Text>
          
          <Text style={styles.details}>
            Motivo: {suspensionDetails.motivo}
          </Text>

          {suspensionDetails.tipo_sancion === 'suspension_temporal' && suspensionDetails.fecha_fin && (
            <Text style={styles.details}>
              La suspensión terminará el: {new Date(suspensionDetails.fecha_fin).toLocaleDateString()}
            </Text>
          )}

          <View style={styles.divider}>
            <Text style={styles.support}>
              Si crees que esto es un error, por favor contacta al soporte.
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Detalles adicionales */}
      <View style={styles.additionalInfo}>
        <Text style={styles.infoTitle}>Detalles de la Suspensión:</Text>
        <Text style={styles.infoText}>
          • Tipo: {suspensionDetails.tipo_sancion.replace('_', ' ')}
        </Text>
        <Text style={styles.infoText}>
          • Fecha de inicio: {new Date(suspensionDetails.fecha_inicio).toLocaleDateString()}
        </Text>
        {suspensionDetails.duracion_dias && (
          <Text style={styles.infoText}>
            • Duración: {suspensionDetails.duracion_dias} días
          </Text>
        )}
        <Text style={styles.infoText}>
          • Estado: {suspensionDetails.estado}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  content: {
    marginVertical: 16,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginTop: 16,
  },
  support: {
    fontSize: 12,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  additionalInfo: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    paddingLeft: 8,
  },
})