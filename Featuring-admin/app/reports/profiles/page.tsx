'use client'

import { useState, useEffect } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'
import Link from 'next/link'
import ReportList from '../../../components/ReportList'
import ReportModal from '../../../components/ReportModal'

export default function WatchReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    try {
      const { data, error } = await supabaseAdmin
        .from('reporte')
        .select('*')
        .eq('tipo_contenido', 'watch')
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Reportes Watch</h1>
        <Link href="/reports" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver a Reportes
        </Link>
      </div>

      {loading && <div className="text-center text-xl">Cargando reportes...</div>}
      {error && <div className="text-center text-xl text-danger-600">Error: {error}</div>}

      {!loading && !error && (
        <ReportList 
          reports={reports} 
          onReportSelect={setSelectedReport}
          onReportAction={fetchReports}
        />
      )}

      {selectedReport && (
        <ReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onAction={fetchReports}
        />
      )}
    </div>
  )
}
