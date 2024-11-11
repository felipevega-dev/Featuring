'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SupportTicket {
  id: string
  usuario_id: string
  titulo: string
  descripcion: string
  tipo: 'bug' | 'feature_request' | 'consulta' | 'otro'
  prioridad: 'baja' | 'media' | 'alta'
  estado: 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado'
  respuesta: string | null
  created_at: string
  updated_at: string
  usuario: {
    username: string
  }
}

export default function SoportePage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchTickets()
    // Suscribirse a cambios en tiempo real
    const channel = supabaseAdmin
      .channel('tickets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          fetchTickets()
        }
      )
      .subscribe()

    return () => {
      supabaseAdmin.removeChannel(channel)
    }
  }, [])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('support_tickets')
        .select(`
          *,
          usuario:perfil!support_tickets_usuario_id_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformar los datos para mantener la estructura esperada
      const transformedData = data?.map(ticket => ({
        ...ticket,
        usuario: {
          username: ticket.usuario.username
        }
      }))

      setTickets(transformedData || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update({ 
          estado: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (error) throw error
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket status:', error)
    }
  }

  const handleResponse = async (ticketId: string, response: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update({ 
          respuesta: response,
          estado: 'resuelto',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (error) throw error
      fetchTickets()
    } catch (error) {
      console.error('Error updating ticket response:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'bg-red-500'
      case 'media':
        return 'bg-yellow-500'
      case 'baja':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug':
        return 'bg-red-500'
      case 'feature_request':
        return 'bg-blue-500'
      case 'consulta':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
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

  const filteredTickets = tickets
    .filter(ticket => selectedStatus === 'all' || ticket.estado === selectedStatus)
    .filter(ticket => selectedType === 'all' || ticket.tipo === selectedType)

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Soporte Técnico</h1>
        <p className="text-gray-600">Gestión de tickets de soporte y consultas de usuarios</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Select
          value={selectedStatus}
          onValueChange={setSelectedStatus}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="resuelto">Resueltos</SelectItem>
            <SelectItem value="cerrado">Cerrados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedType}
          onValueChange={setSelectedType}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="bug">Bugs</SelectItem>
            <SelectItem value="feature_request">Sugerencias</SelectItem>
            <SelectItem value="consulta">Consultas</SelectItem>
            <SelectItem value="otro">Otros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <p>Cargando tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <p>No hay tickets disponibles</p>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{ticket.titulo}</CardTitle>
                    <CardDescription>
                      Por: {ticket.usuario.username}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getTypeColor(ticket.tipo)}>
                      {ticket.tipo}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.prioridad)}>
                      {ticket.prioridad}
                    </Badge>
                    <Badge className={getStatusColor(ticket.estado)}>
                      {ticket.estado}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Descripción</h4>
                  <p className="text-gray-700">{ticket.descripcion}</p>
                  
                  {ticket.respuesta && (
                    <>
                      <h4 className="font-semibold mt-4 mb-2">Respuesta</h4>
                      <p className="text-gray-700">{ticket.respuesta}</p>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {format(new Date(ticket.created_at), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                  </span>
                  <div className="flex gap-2">
                    <Select
                      value={ticket.estado}
                      onValueChange={(value) => handleStatusChange(ticket.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                        <SelectItem value="cerrado">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Aquí podríamos abrir un modal para responder
                        const response = prompt('Ingrese la respuesta:')
                        if (response) {
                          handleResponse(ticket.id, response)
                        }
                      }}
                    >
                      Responder
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
