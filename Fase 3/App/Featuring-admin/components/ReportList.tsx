import { supabaseAdmin } from '../lib/supabase'

export default function ReportList({ reports, onReportSelect, onReportAction }: { reports: any[], onReportSelect: (report: any) => void, onReportAction: () => void }) {
  const handleReportAction = async (reportId: string, action: string) => {
    try {
      await supabaseAdmin
        .from('reporte')
        .update({ estado: action })
        .eq('id', reportId)
      onReportAction()
    } catch (error) {
      console.error('Error updating report:', error)
    }
  }

  return (
    <ul className="divide-y divide-gray-200">
      {reports.map((report) => (
        <li key={report.id} className="py-4">
          <div className="flex justify-between">
            <div>
              <p className="font-semibold">{report.razon}</p>
              <p className="text-sm text-gray-500">Estado: {report.estado}</p>
            </div>
            <div>
              <button onClick={() => onReportSelect(report)} className="text-primary-600 hover:text-primary-800 mr-2">
                Ver detalles
              </button>
              <button onClick={() => handleReportAction(report.id, 'resuelto')} className="text-green-600 hover:text-green-800 mr-2">
                Resolver
              </button>
              <button onClick={() => handleReportAction(report.id, 'desestimado')} className="text-red-600 hover:text-red-800">
                Desestimar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
