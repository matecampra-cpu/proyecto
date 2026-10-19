/**
 * DIRECTORIO Y AGENDA DE CLIENTES (Clientes.jsx)
 * ------------------------------------------------
 * Gestión de propietarios y empresas titulares de vehículos:
 * 1. Tarjetas de clientes con teléfono, email, DNI/CUIT y dirección.
 * 2. Visualización de los vehículos asociados a cada cliente.
 * 3. Botón directo de chat por WhatsApp con un solo clic.
 * 4. Alta modal de nuevo cliente con persistencia reactiva en Firestore.
 * 5. Acceso al perfil individual e historial histórico de reparaciones.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  UserPlus, 
  Phone, 
  Mail, 
  MapPin, 
  Car, 
  ChevronRight,
  MessageCircle,
  Edit3,
  Trash2,
  X,
  Save,
  PlusCircle
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useConfirm } from '../context/ConfirmContext';

export default function Clientes() {
  const { confirm } = useConfirm();

  // Lista de clientes y vehículos asociados para conteo
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Modal Nuevo / Editar
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');

  // ---------------------------------------------------------------------------
  // EFECTO: Suscripción en tiempo real a clientes y parque automotor
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const unsubC = dataManager.subscribe('clientes', setClientes);
    const unsubV = dataManager.subscribe('vehiculos', setVehiculos);
    return () => {
      unsubC();
      unsubV();
    };
  }, []);

  const abrirCrear = () => {
    setEditId(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setDocumento('');
    setDireccion('');
    setNotas('');
    setMostrarModal(true);
  };

  const abrirEditar = (c) => {
    setEditId(c.id);
    setNombre(c.nombre || '');
    setTelefono(c.telefono || '');
    setEmail(c.email || '');
    setDocumento(c.documento || '');
    setDireccion(c.direccion || '');
    setNotas(c.notas || '');
    setMostrarModal(true);
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const data = {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      documento: documento.trim(),
      direccion: direccion.trim(),
      notas: notas.trim()
    };

    if (editId) {
      await dataManager.update('clientes', editId, data);
    } else {
      await dataManager.add('clientes', data);
    }

    setMostrarModal(false);
  };

  const eliminarCliente = async () => {
    if (!editId) return;
    const ok = await confirm({
      title: '¿Eliminar Cliente?',
      message: '¿Está seguro de que desea eliminar este cliente? No se borrarán las órdenes históricas archivadas.',
      confirmText: 'Eliminar Cliente',
      cancelText: 'Cancelar',
      variant: 'rose',
      iconType: 'trash'
    });
    if (!ok) return;

    await dataManager.delete('clientes', editId);
    setMostrarModal(false);
  };

  const clientesFiltrados = clientes.filter(c => {
    const term = busqueda.toLowerCase().trim();
    return !term || 
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.telefono && c.telefono.includes(term)) ||
      (c.documento && c.documento.includes(term));
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800/80 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-400" />
            <span>Directorio de Clientes</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Gestión de clientes y parque de vehículos asociados</p>
        </div>

        <button
          onClick={abrirCrear}
          className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-rose-950/40 transition-all w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-4 backdrop-blur-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono o DNI..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs italic">
            No se encontraron clientes registrados.
          </div>
        ) : (
          clientesFiltrados.map((c) => {
            const autosDelCliente = vehiculos.filter(v => v.cliente_id === c.id);
            return (
              <div
                key={c.id}
                className="bg-slate-900/60 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-5 backdrop-blur-sm flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        <Link to={`/clientes/${c.id}`} className="hover:text-rose-400 transition-colors">
                          {c.nombre}
                        </Link>
                      </h3>
                      {c.documento && (
                        <p className="text-[11px] text-slate-500 font-mono">DNI/CUIT: {c.documento}</p>
                      )}
                    </div>

                    <span className="bg-rose-950/50 text-rose-300 text-xs font-bold px-2 py-0.5 rounded-full border border-rose-800/40 flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      <span>{autosDelCliente.length}</span>
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-400">
                    {c.telefono && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          <span>Tel:</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{c.telefono}</span>
                          <a
                            href={`https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Abrir WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}

                    {c.email && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email:</span>
                        </span>
                        <span className="text-slate-300 truncate max-w-[180px]">{c.email}</span>
                      </div>
                    )}

                    {c.direccion && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Dirección:</span>
                        </span>
                        <span className="text-slate-300 truncate max-w-[180px]">{c.direccion}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <Link
                    to={`/ordenes/nueva?cliente_id=${c.id}`}
                    className="font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Nueva OT</span>
                  </Link>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => abrirEditar(c)}
                      className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Editar cliente"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      to={`/clientes/${c.id}`}
                      className="text-slate-400 hover:text-white font-semibold flex items-center gap-0.5"
                    >
                      <span>Ficha</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nuevo / Editar Cliente */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-rose-400" />
                <span>{editId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</span>
              </h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarCliente} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="ej: Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="1155443322"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder="32145678"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. San Martín 842"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notas Internas</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows="2"
                  placeholder="Preferencias, condiciones especiales..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                {editId ? (
                  <button
                    type="button"
                    onClick={eliminarCliente}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                ) : <div />}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setMostrarModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center space-x-1 shadow-md shadow-rose-950/40"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cliente</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
