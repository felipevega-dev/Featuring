'use client'

import Link from 'next/link'
import { 
  FiUsers, 
  FiActivity, 
  FiHardDrive,
  FiBarChart2,
  FiVideo,
  FiMusic,
  FiCamera,
  FiUser,
  FiMessageSquare
} from 'react-icons/fi'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts'
import { useSystemMetrics } from '@/hooks/useSystemMetrics'
import { useAdminStats } from '@/hooks/useAdminStats'

// Función de utilidad para formatear bytes a MB
const formatSizeToMB = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2);
};

export default function Dashboard() {
  const metrics = useSystemMetrics()
  const { 
    isLoading: statsLoading, 
    error: statsError 
  } = useAdminStats()

  // Preparar datos para el gráfico de distribución de almacenamiento
  const storageDistributionData = metrics.storageMetrics ? [
    { name: 'Videos', value: metrics.storageMetrics.videos_size_gb * 1024 },
    { name: 'Canciones', value: metrics.storageMetrics.songs_size_gb * 1024 },
    { name: 'Carátulas', value: metrics.storageMetrics.covers_size_gb * 1024 },
    { name: 'Fotos de Perfil', value: metrics.storageMetrics.profile_pics_size_gb * 1024 },
    { name: 'Chat Videos', value: metrics.storageMetrics.chat_videos_size_gb * 1024 },
    { name: 'Chat Imágenes', value: metrics.storageMetrics.chat_images_size_gb * 1024 },
    { name: 'Mensajes de Audio', value: metrics.storageMetrics.audio_messages_size_gb * 1024 }
  ].filter(item => item.value > 0) : [];

  if (metrics.isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando métricas...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas del Sistema</h1>
        <Link 
          href="/" 
          className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition-colors"
        >
          Volver al Menú Principal
        </Link>
      </div>

      {/* Métricas de Almacenamiento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Almacenamiento Total</p>
              <h3 className="text-2xl font-bold text-primary-500">
                {(metrics.storageMetrics?.total_size_gb * 1024).toFixed(2)} MB
              </h3>
            </div>
            <FiHardDrive className="text-primary-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Espacio en Videos</p>
              <h3 className="text-2xl font-bold">
                {(metrics.storageMetrics?.videos_size_gb * 1024).toFixed(2)} MB
              </h3>
            </div>
            <FiVideo className="text-secondary-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Espacio en Canciones</p>
              <h3 className="text-2xl font-bold">
                {(metrics.storageMetrics?.songs_size_gb * 1024).toFixed(2)} MB
              </h3>
            </div>
            <FiMusic className="text-warning-500 w-8 h-8" />
          </div>
        </div>
      

      <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Espacio en Carátulas</p>
              <h3 className="text-2xl font-bold">
                {(metrics.storageMetrics?.covers_size_gb * 1024).toFixed(2)} MB
              </h3>
            </div>
            <FiCamera className="text-black-500 w-8 h-8" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Espacio en Fotos de Perfil</p>
              <h3 className="text-2xl font-bold">
                {(metrics.storageMetrics?.profile_pics_size_gb * 1024).toFixed(2)} MB
              </h3>
            </div>
            <FiUser className="text-red-500 w-8 h-8" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Chat Videos</p>
            <h3 className="text-2xl font-bold">
              {(metrics.storageMetrics?.chat_videos_size_gb * 1024).toFixed(2)} MB
            </h3>
          </div>
          <FiVideo className="text-blue-500 w-8 h-8" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Chat Imágenes</p>
            <h3 className="text-2xl font-bold">
              {(metrics.storageMetrics?.chat_images_size_gb * 1024).toFixed(2)} MB
            </h3>
          </div>
          <FiCamera className="text-green-500 w-8 h-8" />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Mensajes de Audio</p>
            <h3 className="text-2xl font-bold">
              {(metrics.storageMetrics?.audio_messages_size_gb * 1024).toFixed(2)} MB
            </h3>
          </div>
          <FiMusic className="text-purple-500 w-8 h-8" />
        </div>
      </div>
    </div>

      {/* Gráficos en grid de 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribución de Almacenamiento */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Distribución de Almacenamiento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storageDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value.toFixed(2)} MB`}
                  labelLine={true}
                >
                  {storageDistributionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.name === 'Videos' ? '#00CED1' :
                        entry.name === 'Canciones' ? '#FFB74B':
                        entry.name === 'Carátulas' ? '#000000' :
                        entry.name === 'Fotos de Perfil' ? '#FF4B4B' :
                        entry.name === 'Chat Videos' ? '#4B9FFF' :
                        entry.name === 'Chat Imágenes' ? '#4BFF4B' :
                        '#9F4BFF'
                      } 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)} MB`} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${value}: ${entry?.payload?.value.toFixed(2)} MB`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Usuarios por País */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Usuarios por País</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(metrics.usersByCountry || {}).map(([country, value]) => ({
                    name: country,
                    value
                  }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {Object.entries(metrics.usersByCountry || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Archivos más Grandes */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Archivos más Grandes</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.storageMetrics?.largest_files.map((file, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.bucket_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSizeToMB(file.size)} MB
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usuarios por Edad */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Distribución por Edad</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(metrics.usersByAge || {}).map(([range, count]) => ({
                  range,
                  count
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}