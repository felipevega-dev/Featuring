import React, { useState, useEffect } from 'react'
import { View, ScrollView, Alert, TextInput, TouchableOpacity, RefreshControl } from 'react-native'
import { Text } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Picker } from '@react-native-picker/picker'

interface TicketForm {
  titulo: string
  descripcion: string
  tipo: 'bug' | 'feature_request' | 'consulta' | 'otro'
  prioridad: 'baja' | 'media' | 'alta'
}

interface Ticket {
  id: number
  titulo: string
  descripcion: string
  tipo: string
  prioridad: string
  estado: string
  respuesta: string | null
  created_at: string
}

const initialForm: TicketForm = {
  titulo: '',
  descripcion: '',
  tipo: 'consulta',
  prioridad: 'baja'
}

function NuevoTicket() {
  const { user } = useAuth()
  const [form, setForm] = useState<TicketForm>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para enviar un ticket')
      return
    }

    if (!form.titulo.trim() || !form.descripcion.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          usuario_id: user.id,
          titulo: form.titulo,
          descripcion: form.descripcion,
          tipo: form.tipo,
          prioridad: form.prioridad,
        })

      if (error) throw error

      Alert.alert(
        'Éxito',
        'Tu ticket ha sido enviado. Te notificaremos cuando recibas una respuesta.',
        [
          {
            text: 'OK',
            onPress: () => setForm(initialForm)
          }
        ]
      )
    } catch (error) {
      console.error('Error al enviar ticket:', error)
      Alert.alert('Error', 'No se pudo enviar el ticket. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white mb-14">
      <View className="p-4">
        <View className="space-y-4">
          <View>
            <Text className="text-sm font-JakartaMedium mb-1">Título</Text>
            <TextInput
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="Describe brevemente tu problema"
              value={form.titulo}
              onChangeText={(text) => setForm(prev => ({ ...prev, titulo: text }))}
            />
          </View>

          <View>
            <Text className="text-sm font-JakartaMedium mb-1">Descripción</Text>
            <TextInput
              className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              placeholder="Explica con detalle tu problema o sugerencia"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={form.descripcion}
              onChangeText={(text) => setForm(prev => ({ ...prev, descripcion: text }))}
            />
          </View>

          <View>
            <Text className="text-sm font-JakartaMedium mb-1">Tipo</Text>
            <View className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <Picker
                selectedValue={form.tipo}
                onValueChange={(value: 'bug' | 'feature_request' | 'consulta' | 'otro') => 
                  setForm(prev => ({ ...prev, tipo: value }))}
                style={{ height: 50 }}
              >
                <Picker.Item label="Bug/Error" value="bug" />
                <Picker.Item label="Sugerencia" value="feature_request" />
                <Picker.Item label="Consulta" value="consulta" />
                <Picker.Item label="Otro" value="otro" />
              </Picker>
            </View>
          </View>

          <View>
            <Text className="text-sm font-JakartaMedium mb-1">Prioridad</Text>
            <View className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <Picker
                selectedValue={form.prioridad}
                onValueChange={(value: 'baja' | 'media' | 'alta') => 
                  setForm(prev => ({ ...prev, prioridad: value }))}
                style={{ height: 50 }}
              >
                <Picker.Item label="Baja" value="baja" />
                <Picker.Item label="Media" value="media" />
                <Picker.Item label="Alta" value="alta" />
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-lg mt-4 ${
              isSubmitting ? 'bg-primary-300' : 'bg-primary-500'
            }`}
          >
            <Text className="text-white text-center font-JakartaMedium">
              {isSubmitting ? 'Enviando...' : 'Enviar Ticket'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

function MisTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTickets = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data)
    } catch (error) {
      console.error('Error fetching tickets:', error)
      Alert.alert('Error', 'No se pudieron cargar los tickets')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [user])

  const onRefresh = () => {
    setRefreshing(true)
    fetchTickets()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-500'
      case 'en_proceso':
        return 'bg-blue-500'
      case 'resuelto':
        return 'bg-green-500'
      case 'cerrado':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Cargando tickets...</Text>
      </View>
    )
  }

  return (
    <ScrollView 
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {tickets.length === 0 ? (
          <Text className="text-center text-gray-500">No tienes tickets creados</Text>
        ) : (
          tickets.map((ticket) => (
            <View key={ticket.id} className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="font-JakartaBold text-lg">{ticket.titulo}</Text>
                <View className={`px-2 py-1 rounded-full ${getStatusColor(ticket.estado)}`}>
                  <Text className="text-white text-xs">{ticket.estado}</Text>
                </View>
              </View>
              
              <Text className="text-gray-600 mb-2">{ticket.descripcion}</Text>
              
              {ticket.respuesta && (
                <View className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <Text className="font-JakartaMedium mb-1">Respuesta:</Text>
                  <Text className="text-gray-600">{ticket.respuesta}</Text>
                </View>
              )}
              
              <View className="flex-row justify-between items-center mt-4">
                <Text className="text-xs text-gray-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </Text>
                <View className="flex-row">
                  <View className={`px-2 py-1 rounded-full mr-2 bg-gray-200`}>
                    <Text className="text-xs">{ticket.tipo}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full bg-gray-200`}>
                    <Text className="text-xs">{ticket.prioridad}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

export default function Soporte() {
  const [activeTab, setActiveTab] = useState<'nuevo' | 'lista'>('nuevo')

  return (
    <View className="flex-1 bg-white">
      <View className="p-4">
        <Text className="text-2xl font-JakartaBold mb-2">Soporte Técnico</Text>
        <Text className="text-gray-600">
          ¿Tienes algún problema o sugerencia? Envíanos un ticket y te ayudaremos lo antes posible.
        </Text>
      </View>
      
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => setActiveTab('nuevo')}
          className={`flex-1 py-3 ${activeTab === 'nuevo' ? 'border-b-2 border-primary-500' : ''}`}
        >
          <Text className={`text-center font-JakartaMedium ${
            activeTab === 'nuevo' ? 'text-primary-500' : 'text-gray-500'
          }`}>
            Nuevo Ticket
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('lista')}
          className={`flex-1 py-3 ${activeTab === 'lista' ? 'border-b-2 border-primary-500' : ''}`}
        >
          <Text className={`text-center font-JakartaMedium ${
            activeTab === 'lista' ? 'text-primary-500' : 'text-gray-500'
          }`}>
            Mis Tickets
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'nuevo' ? <NuevoTicket /> : <MisTickets />}
    </View>
  )
}
    