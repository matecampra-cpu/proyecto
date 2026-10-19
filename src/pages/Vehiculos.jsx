/**
 * CATÁLOGO DEL PARQUE AUTOMOTOR (Vehiculos.jsx)
 * -----------------------------------------------
 * Registro central de unidades del taller:
 * 1. Tarjetas de vehículos agrupadas por patente/matrícula (formato chapa).
 * 2. Indicadores de kilometraje actual, año de fabricación y combustible.
 * 3. Búsqueda reactiva por patente, modelo, marca o nombre del titular.
 * 4. Enlace directo a la historia clínica de reparaciones del vehículo.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  Search, 
  PlusCircle, 
  Gauge, 
  ChevronRight, 
  User,
  X,
  AlertCircle
} from 'lucide-react';
import { dataManager } from '../firebase';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Modal Nuevo Vehículo
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [color, setColor] = useState('');
  const [combustible, setCombustible] = useState('Nafta');
  const [motor, setMotor] = useState('');
  const [notas, setNotas] = useState('');

  // Suscripción reactiva a la colección de vehículos y clientes
  useEffect(() => {
    const unsubV = dataManager.subscribe('vehiculos', setVehiculos);
    const unsubC = dataManager.subscribe('clientes', setClientes);
    return () => {
      unsubV();
      unsubC();
    };
  }, []);

  const handleCrearVehiculo = async (e) => {
    e.preventDefault();
    if (!patente.trim() || !marca.trim() || !modelo.trim() || !clienteId) {
      setErrorModal('Por favor complete la patente, marca, modelo y seleccione el cliente titular.');
      return;
    }
    setErrorModal('');

    const clienteSel = clientes.find(c => c.id === clienteId);

    await dataManager.add('vehiculos', {
      cliente_id: clienteId,
      cliente_nombre: clienteSel?.nombre || 'Cliente',
      patente: patente.trim().toUpperCase(),
      marca: marca.trim(),
      modelo: modelo.trim(),
      anio: Number(anio) || null,
      kilometraje: Number(kilometraje) || 0,
      color: color.trim(),
      combustible,
      motor: motor.trim(),
      notas: notas.trim()
    });

    // Reset y cerrar
    setPatente('');
    setMarca('');
    setModelo('');
    setAnio('');
    setKilometraje('');
    setColor('');
    setMotor('');
    setNotas('');
    setMostrarModal(false);
  };

  // Filtro por patente, marca, modelo o cliente
  const filtrados = vehiculos.filter(v => {
    const term = busqueda.toLowerCase().trim();
    return !term ||
      (v.patente && v.patente.toLowerCase().includes(term)) ||
      (v.marca && v.marca.toLowerCase().includes(term)) ||
      (v.modelo && v.modelo.toLowerCase().includes(term)) ||
      (v.cliente_nombre && v.cliente_nombre.toLowerCase().includes(term));
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Car className="w-5 h-5 text-rose-400" />
            <span>Parque de Vehículos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Control por número de patente o matrícula e historial clínico</p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Vehículo</span>
        </button>
      </div>

      {/* Modal Registrar Vehículo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-rose-400" />
                <span>Registrar Nuevo Vehículo</span>
              </h3>
              <button 
                onClick={() => { setMostrarModal(false); setErrorModal(''); }} 
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorModal && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorModal}</span>
              </div>
            )}

            <form onSubmit={handleCrearVehiculo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Titular *</label>
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="">Seleccionar Cliente Titular...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.documento ? `(DNI: ${c.documento})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Patente / Dominio *</label>
                  <input
                    type="text"
                    value={patente}
                    onChange={(e) => setPatente(e.target.value.toUpperCase())}
                    placeholder="Ej: AE123CD"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-rose-400 font-mono font-bold uppercase focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Combustible</label>
                  <select
                    value={combustible}
                    onChange={(e) => setCombustible(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
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
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
                  <input
                    type="text"
                    value={marca}
                    onChange={(e) => setMarca(e.target.value)}
                    placeholder="Ej: Toyota, Ford, VW"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo *</label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ej: Corolla 1.8 XEI"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
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
                    placeholder="2021"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Odómetro (km)</label>
                  <input
                    type="number"
                    value={kilometraje}
                    onChange={(e) => setKilometraje(e.target.value)}
                    placeholder="65000"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Gris plata"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Motor / Cilindrada</label>
                <input
                  type="text"
                  value={motor}
                  onChange={(e) => setMotor(e.target.value)}
                  placeholder="Ej: 2ZR-FE 1.8 16V"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas Técnicas Adicionales</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="2"
                  placeholder="Observaciones de chasis, neumáticos, accesorios..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
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

      {/* Buscador */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por patente, marca, modelo o titular..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Grid de Vehículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs italic">
            No se encontraron vehículos registrados.
          </div>
        ) : (
          filtrados.map(v => (
            <div
              key={v.id}
              className="bg-slate-900/60 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-black text-sm text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    {v.patente}
                  </span>
                  <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-semibold">
                    {v.combustible}
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-base">
                  <Link to={`/vehiculos/${v.id}`} className="hover:text-rose-400 transition-colors">
                    {v.marca} {v.modelo}
                  </Link>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Año: {v.anio || 'S/D'} &bull; {v.color || 'Color S/D'}
                </p>

                <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Titular:</span>
                    <span className="font-bold text-slate-300 truncate max-w-[150px]">{v.cliente_nombre}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Último Odómetro:</span>
                    <span className="font-bold text-white">{(v.kilometraje || 0).toLocaleString('es-AR')} km</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <Link
                  to={`/ordenes/nueva?cliente_id=${v.cliente_id}&vehiculo_id=${v.id}`}
                  className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ingresar OT</span>
                </Link>

                <Link
                  to={`/vehiculos/${v.id}`}
                  className="text-slate-400 hover:text-white font-semibold flex items-center gap-0.5"
                >
                  <span>Historial Clínico</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
