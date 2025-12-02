'use client';

const areas = ['all', 'Guión', 'Técnico', 'Casting', 'Reporting', 'Pipeline', 'Post-producción', 'Investigación', 'Pre-visualización', 'Producción', 'Planificación', 'Crew'];
const statuses = ['all', 'Pendiente', 'En Progreso', 'Completado', 'Bloqueado'];
const months = ['all', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago'];

interface Props {
  filters: { area: string; status: string; month: string };
  setFilters: (filters: { area: string; status: string; month: string }) => void;
}

export default function TaskFilters({ filters, setFilters }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
          <select
            value={filters.area}
            onChange={(e) => setFilters({ ...filters, area: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {areas.map(a => <option key={a} value={a}>{a === 'all' ? 'Todas' : a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {statuses.map(s => <option key={s} value={s}>{s === 'all' ? 'Todos' : s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
          <select
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {months.map(m => <option key={m} value={m}>{m === 'all' ? 'Todos' : m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
