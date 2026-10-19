/**
 * HISTORIA CLÍNICA DEL VEHÍCULO (VehiculoDetalle.jsx)
 * -----------------------------------------------------
 * Registro técnico vitalicio del automóvil:
 * 1. Ficha técnica con patente destacada, motor, color, combustible y kilometraje.
 * 2. Línea de tiempo con todas las órdenes de trabajo ejecutadas en el auto.
 * 3. Trazabilidad de Repuestos: Agrupa y lista cada repuesto o pieza instalada
 *    en este auto con la fecha y el número de orden de colocación.
 * 4. Botón directo "Nueva Recepción" para ingresar el auto a service con 1 clic.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Car, 
  Gauge, 
  Clock, 
  Package, 
  PlusCircle, 
  ChevronRight, 
  Wrench,
  Edit3,
  X,
  Save
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function VehiculoDetalle() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const [vehiculo, setVehiculo] = useState(null);
  const [ordenes, setOrdenes] = useState([]);

  // Modal Editar
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [color, setColor] = useState('');
  const [combustible, setCombustible] = useState('Nafta');
  const [motor, setMotor] = useState('');
  const [notas, setNotas] = useState('');

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción en tiempo real a los datos del auto y sus órdenes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubV = dataManager.subscribe('vehiculos', (data) => {
      const v = data.find(item => item.id === id);
      if (v) {
        setVehiculo(v);
        setMarca(v.marca || '');
        setModelo(v.modelo || '');
        setAnio(v.anio || '');
        setKilometraje(v.kilometraje || '');
        setColor(v.color || '');
        setCombustible(v.combustible || 'Nafta');
        setMotor(v.motor || '');
        setNotas(v.notas || '');
      }
    });

    const unsubO = dataManager.subscribe('ordenes', (data) => {
      setOrdenes(data.filter(o => o.vehiculo_id === id));
    });

    return () => {
      unsubV();
      unsubO();
    };
  }, [id]);

  const guardarEdicion = async (e) => {
    e.preventDefault();
    await dataManager.update('vehiculos', id, {
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio: Number(anio) || null,
      kilometraje: Number(kilometraje) || 0,
      color: color.trim(),
      combustible,
      motor: motor.trim(),
      notas: notas.trim()
    });
    setMostrarModalEditar(false);
  };

  if (!vehiculo) return <div className="p-8 text-center text-slate-500 text-xs">Cargando vehículo...</div>;

  // ---------------------------------------------------------------------------
  // TRAZABILIDAD DE REPUESTOS:
  // Extrae y recopila todas las piezas colocadas en este vehículo a lo largo del tiempo
  // ---------------------------------------------------------------------------
  const repuestosInstalados = [];
  ordenes.forEach(o => {
    if (o.items) {
      o.items.filter(it => it.tipo === 'REPUESTO').forEach(it => {
        repuestosInstalados.push({
          ...it,
          fecha: o.fecha_ingreso,
          numero_orden: o.numero_orden,
          orden_id: o.id
        });
      });
    }
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <Link to="/vehiculos" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-sm">
                {vehiculo.patente}
              </span>
              <h1 className="text-xl font-black text-white">{vehiculo.marca} {vehiculo.modelo}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Titular: <Link to={`/clientes/${vehiculo.cliente_id}`} className="text-rose-400 font-bold hover:underline">{vehiculo.cliente_nombre}</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMostrarModalEditar(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Datos</span>
          </button>

          <Link
            to={`/ordenes/nueva?cliente_id=${vehiculo.cliente_id}&vehiculo_id=${vehiculo.id}`}
            className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ingresar a Reparación</span>
          </Link>
        </div>
      </div>

      {/* Modal Editar Ficha del Vehículo */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-400" />
                <span>Editar Vehículo ({vehiculo.patente})</span>
              </h3>
              <button onClick={() => setMostrarModalEditar(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicion} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Odómetro (km)</label>
                  <input
                    type="number"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Combustible</label>
                  <select
                    value={combustible}
                    onChange={(e) => setCombustible(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="GNC">GNC</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Motor</label>
                  <input
                    type="text"
                    value={motor}
                    onChange={(e) => setMotor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas del Vehículo</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalEditar(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-rose-950/40"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ficha Técnica */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-slate-500 block mb-1">Último Odómetro:</span>
            <span className="font-black text-white text-base">{(vehiculo.kilometraje || 0).toLocaleString('es-AR')} km</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-slate-500 block mb-1">Combustible:</span>
            <span className="font-bold text-rose-400 text-sm">{vehiculo.combustible}</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-slate-500 block mb-1">Año / Color:</span>
            <span className="font-bold text-white text-sm">{vehiculo.anio || 'S/D'} &bull; {vehiculo.color || 'Color S/D'}</span>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <span className="text-slate-500 block mb-1">Código Motor / Chasis:</span>
            <span className="font-mono text-slate-300 truncate block">{vehiculo.motor || 'No especificado'}</span>
          </div>
        </div>
      </div>

      {/* Historial de Intervenciones */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Clock className="w-4 h-4 text-rose-400" />
          <span>Historial Clínico de Reparaciones ({ordenes.length})</span>
        </h2>

        <div className="space-y-3">
          {ordenes.length === 0 ? (
            <p className="py-6 text-center text-slate-500 text-xs italic">
              Este vehículo no tiene intervenciones registradas todavía.
            </p>
          ) : (
            ordenes.map(o => (
              <div key={o.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/70 gap-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold text-rose-400 text-xs">{o.numero_orden}</span>
                    <span className="text-xs text-slate-400">{o.fecha_ingreso}</span>
                    <span className="text-xs text-white font-bold">{(o.kilometraje_ingreso || 0).toLocaleString('es-AR')} km</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-white border border-slate-700">
                      {o.estado}
                    </span>
                    <Link to={`/ordenes/${o.id}`} className="text-xs text-rose-400 hover:text-rose-300 font-semibold">
                      Ver Orden &rarr;
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-slate-300"><span className="text-slate-500 font-semibold">Motivo:</span> {o.motivo_ingreso}</p>
                {o.diagnostico && (
                  <p className="text-xs text-slate-400"><span className="text-slate-500 font-semibold">Diagnóstico:</span> {o.diagnostico}</p>
                )}

                <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800/60">
                  <span>Mecánico: <b className="text-slate-300">{o.mecanico_asignado || 'Sin asignar'}</b></span>
                  {isAdmin && (
                    <span className="font-black text-white">Total: ${(o.total || 0).toLocaleString('es-AR')}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trazabilidad de Repuestos Instalados */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Package className="w-4 h-4 text-rose-400" />
          <span>Trazabilidad de Repuestos Instalados en este Vehículo</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">N° OT</th>
                <th className="py-2.5 px-3">Pieza / Repuesto</th>
                <th className="py-2.5 px-3 text-center">Cant.</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Precio Unit.</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {repuestosInstalados.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-6 text-center text-slate-500 italic">No hay repuestos registrados en el historial de este auto.</td>
                </tr>
              ) : (
                repuestosInstalados.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 text-slate-500">{it.fecha}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                      <Link to={`/ordenes/${it.orden_id}`}>{it.numero_orden}</Link>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{it.descripcion}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">{it.cantidad}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right text-slate-300">${(it.precio_unitario || 0).toLocaleString('es-AR')}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
