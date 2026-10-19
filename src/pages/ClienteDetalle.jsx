/**
 * FICHA INTEGRAL DE CLIENTE (ClienteDetalle.jsx)
 * -----------------------------------------------
 * Perfil 360º del cliente:
 * 1. Datos de contacto directos con enlace directo a WhatsApp.
 * 2. Parque de vehículos registrados a su nombre con botón para agregar nuevos autos.
 * 3. Historial cronológico de todas las órdenes de trabajo realizadas para este cliente.
 * 4. Botón rápido "Crear OT" que precarga automáticamente este cliente.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  PlusCircle, 
  Wrench, 
  ChevronRight,
  MessageCircle,
  Clock,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function ClienteDetalle() {
  const { isAdmin } = useAuth();
  const { id } = useParams();
  const [cliente, setCliente] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [ordenes, setOrdenes] = useState([]);

  // Estados del modal para empadronar un nuevo vehículo al cliente
  const [mostrarModalAuto, setMostrarModalAuto] = useState(false);
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [km, setKm] = useState('');
  const [color, setColor] = useState('');
  const [combustible, setCombustible] = useState('Nafta');

  // Estados del modal para editar datos del cliente
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDocumento, setEditDocumento] = useState('');
  const [editDireccion, setEditDireccion] = useState('');
  const [editNotas, setEditNotas] = useState('');

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción en tiempo real a los datos del cliente, sus autos y OTs
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubC = dataManager.subscribe('clientes', (data) => {
      const c = data.find(item => item.id === id);
      if (c) {
        setCliente(c);
        setEditNombre(c.nombre || '');
        setEditTelefono(c.telefono || '');
        setEditEmail(c.email || '');
        setEditDocumento(c.documento || '');
        setEditDireccion(c.direccion || '');
        setEditNotas(c.notas || '');
      }
    });

    const unsubV = dataManager.subscribe('vehiculos', (data) => {
      setVehiculos(data.filter(v => v.cliente_id === id));
    });

    const unsubO = dataManager.subscribe('ordenes', (data) => {
      setOrdenes(data.filter(o => o.cliente_id === id));
    });

    return () => {
      unsubC();
      unsubV();
      unsubO();
    };
  }, [id]);

  const guardarEdicionCliente = async (e) => {
    e.preventDefault();
    await dataManager.update('clientes', id, {
      nombre: editNombre.trim(),
      telefono: editTelefono.trim(),
      email: editEmail.trim(),
      documento: editDocumento.trim(),
      direccion: editDireccion.trim(),
      notas: editNotas.trim()
    });
    setMostrarModalEditar(false);
  };

  if (!cliente) return <div className="p-8 text-center text-slate-500 text-xs">Cargando cliente...</div>;

  const agregarVehiculo = async (e) => {
    e.preventDefault();
    if (!patente.trim() || !marca.trim() || !modelo.trim()) return;

    await dataManager.add('vehiculos', {
      cliente_id: id,
      cliente_nombre: cliente.nombre,
      patente: patente.trim().toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio: Number(anio) || null,
      kilometraje: Number(km) || 0,
      color: color.trim(),
      combustible
    });

    setPatente('');
    setMarca('');
    setModelo('');
    setAnio('');
    setKm('');
    setColor('');
    setMostrarModalAuto(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <Link to="/clientes" className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">{cliente.nombre}</h1>
            <p className="text-xs text-slate-400">Ficha del cliente, vehículos e intervenciones en el taller</p>
          </div>
        </div>

        <button
          onClick={() => setMostrarModalEditar(true)}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center space-x-1.5 transition-colors w-fit"
        >
          <Edit3 className="w-4 h-4" />
          <span>Editar Cliente</span>
        </button>
      </div>

      {/* Modal Editar Datos del Cliente */}
      {mostrarModalEditar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-400" />
                <span>Editar Datos de {cliente.nombre}</span>
              </h3>
              <button onClick={() => setMostrarModalEditar(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarEdicionCliente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={editDocumento}
                    onChange={(e) => setEditDocumento(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={editDireccion}
                  onChange={(e) => setEditDireccion(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas Internas</label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows="2"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
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

      {/* Datos del Cliente */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Teléfono:</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{cliente.telefono || 'Sin registrar'}</span>
              {cliente.telefono && (
                <a
                  href={`https://wa.me/${cliente.telefono.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">DNI / CUIT:</span>
            <span className="text-white font-bold font-mono">{cliente.documento || 'Sin registrar'}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Email:</span>
            <span className="text-slate-300 truncate block">{cliente.email || 'Sin registrar'}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Dirección:</span>
            <span className="text-slate-300 truncate block">{cliente.direccion || 'Sin registrar'}</span>
          </div>
        </div>

        {cliente.notas && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-xs text-rose-200">
            <b className="text-rose-400 mr-1">Notas:</b> {cliente.notas}
          </div>
        )}
      </div>

      {/* Vehículos del Cliente */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-rose-400" />
              <span>Vehículos del Cliente ({vehiculos.length})</span>
            </h2>
          </div>

          <button
            onClick={() => setMostrarModalAuto(true)}
            className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-rose-950/40 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Agregar Auto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehiculos.length === 0 ? (
            <p className="col-span-full py-6 text-center text-slate-500 text-xs italic">
              Este cliente no tiene ningún auto cargado aún.
            </p>
          ) : (
            vehiculos.map(v => (
              <div key={v.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-black text-sm text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {v.patente}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">{v.combustible}</span>
                  </div>

                  <h3 className="font-bold text-white text-sm">{v.marca} {v.modelo}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Año: {v.anio || 'S/A'} &bull; {v.color || 'Color S/D'}</p>
                  <p className="text-xs font-semibold text-slate-300 mt-2">
                    Odómetro: {(v.kilometraje || 0).toLocaleString('es-AR')} km
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <Link
                    to={`/ordenes/nueva?cliente_id=${cliente.id}&vehiculo_id=${v.id}`}
                    className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nueva OT</span>
                  </Link>

                  <Link to={`/vehiculos/${v.id}`} className="text-slate-400 hover:text-white font-semibold">
                    Historial &rarr;
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Historial de Órdenes */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Clock className="w-4 h-4 text-rose-400" />
          <span>Historial de Reparaciones del Cliente</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">N° OT</th>
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Vehículo</th>
                <th className="py-2.5 px-3">Trabajo</th>
                <th className="py-2.5 px-3">Estado</th>
                {isAdmin && <th className="py-2.5 px-3 text-right">Total</th>}
                <th className="py-2.5 px-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-6 text-center text-slate-500 italic">No hay órdenes para este cliente.</td>
                </tr>
              ) : (
                ordenes.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-400">
                      <Link to={`/ordenes/${o.id}`}>{o.numero_orden}</Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{o.fecha_ingreso}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{o.marca} {o.modelo} [{o.patente}]</td>
                    <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">{o.motivo_ingreso}</td>
                    <td className="py-2.5 px-3 font-bold">{o.estado}</td>
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-right font-black text-white">${(o.total || 0).toLocaleString('es-AR')}</td>
                    )}
                    <td className="py-2.5 px-3 text-center">
                      <Link to={`/ordenes/${o.id}`} className="text-rose-400 hover:text-rose-300 font-semibold">
                        Ver &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Auto */}
      {mostrarModalAuto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Registrar Auto para {cliente.nombre}</h3>

            <form onSubmit={agregarVehiculo} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Patente *</label>
                  <input
                    type="text"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value.toUpperCase())}
                    required
                    placeholder="AA123BB"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    required
                    placeholder="ej: Peugeot"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo *</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    required
                    placeholder="ej: 208 1.6"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    placeholder="2019"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kilometraje</label>
                  <input
                    type="number"
                    value={km}
                    onChange={(e) => setKm(e.target.value)}
                    placeholder="75000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
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
                    <option value="Diesel">Diesel</option>
                    <option value="Nafta/GNC">Nafta/GNC</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setMostrarModalAuto(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md shadow-rose-950/40"
                >
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
