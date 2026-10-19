/**
 * RECEPCIÓN DE VEHÍCULO / NUEVA ORDEN DE TRABAJO (OrdenNueva.jsx)
 * -----------------------------------------------------------------
 * Formulario técnico de ingreso del auto al taller mecánico:
 * 1. Selección reactiva de Cliente y Filtrado de sus vehículos asociados.
 * 2. Control de odómetro (Kilometraje de ingreso con actualización del vehículo).
 * 3. Selector visual de combustible (Vacío, 1/4, 1/2, 3/4, Lleno).
 * 4. Checklist de recepción (Rueda de auxilio, Gato hidráulico, Cédula/Papeles, Stereo).
 * 5. Registro de daños previos (raspones, bollos) para evitar reclamos indebidos.
 * 6. Asignación de mecánico, fecha prometida y motivo o falla manifestada por el cliente.
 * 7. Cobro optativo de seña/adelanto con registro contable automático en Caja.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Car, 
  User, 
  Gauge, 
  Fuel, 
  CheckSquare, 
  AlertCircle, 
  Check, 
  Plus, 
  Calendar 
} from 'lucide-react';
import { dataManager } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function OrdenNueva() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const turnoOrigen = location.state || null;

  const [searchParams] = useSearchParams();
  // Permite precargar cliente o vehículo si se viene desde el detalle de los mismos
  const preClienteId = searchParams.get('cliente_id');
  const preVehiculoId = searchParams.get('vehiculo_id');

  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // ---------------------------------------------------------------------------
  // ESTADOS DEL FORMULARIO DE INGRESO
  // ---------------------------------------------------------------------------
  const [clienteId, setClienteId] = useState(preClienteId || '');
  const [vehiculoId, setVehiculoId] = useState(preVehiculoId || '');
  const [kilometraje, setKilometraje] = useState('');
  const [fechaPrometida, setFechaPrometida] = useState('');
  const [nivelCombustible, setNivelCombustible] = useState('1/2');
  const [checklist, setChecklist] = useState({
    auxilio: true,
    gato: true,
    papeles: true,
    stereo: true
  });
  const [danosPrevios, setDanosPrevios] = useState('');
  const [motivoIngreso, setMotivoIngreso] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [mecanico, setMecanico] = useState('');
  const [adelanto, setAdelanto] = useState('');
  const [metodoAdelanto, setMetodoAdelanto] = useState('Efectivo');
  const [errorMsg, setErrorMsg] = useState('');

  // ---------------------------------------------------------------------------
  // ESTADOS PARA MODALES DE ALTA RÁPIDA (CLIENTE Y VEHÍCULO INLINE)
  // ---------------------------------------------------------------------------
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    documento: '',
    direccion: ''
  });

  const [showModalVehiculo, setShowModalVehiculo] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    kilometraje: '',
    combustible: 'Nafta',
    motor: '',
    color: '',
    notas: ''
  });

  // Guardado rápido de cliente en recepción
  const handleGuardarClienteRapido = async (e) => {
    e.preventDefault();
    if (!nuevoCliente.nombre.trim()) return;
    const creado = await dataManager.add('clientes', {
      ...nuevoCliente,
      nombre: nuevoCliente.nombre.trim(),
      telefono: nuevoCliente.telefono.trim(),
      email: nuevoCliente.email.trim(),
      documento: nuevoCliente.documento.trim(),
      direccion: nuevoCliente.direccion.trim()
    });
    setClienteId(creado.id);
    setVehiculoId('');
    setShowModalCliente(false);
    setNuevoCliente({ nombre: '', telefono: '', email: '', documento: '', direccion: '' });
  };

  // Guardado rápido de vehículo en recepción
  const handleGuardarVehiculoRapido = async (e) => {
    e.preventDefault();
    if (!clienteId || !nuevoVehiculo.patente.trim()) return;
    const clienteSel = clientes.find(c => c.id === clienteId);
    const creado = await dataManager.add('vehiculos', {
      ...nuevoVehiculo,
      cliente_id: clienteId,
      cliente_nombre: clienteSel?.nombre || 'Cliente',
      patente: nuevoVehiculo.patente.trim().toUpperCase(),
      marca: nuevoVehiculo.marca.trim(),
      modelo: nuevoVehiculo.modelo.trim(),
      anio: Number(nuevoVehiculo.anio) || new Date().getFullYear(),
      kilometraje: Number(nuevoVehiculo.kilometraje) || 0
    });
    setVehiculoId(creado.id);
    setKilometraje(creado.kilometraje || '');
    setShowModalVehiculo(false);
    setNuevoVehiculo({
      patente: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      kilometraje: '',
      combustible: 'Nafta',
      motor: '',
      color: '',
      notas: ''
    });
  };

  // Carga reactiva de clientes y vehículos
  useEffect(() => {
    const unsubCli = dataManager.subscribe('clientes', setClientes);
    const unsubVeh = dataManager.subscribe('vehiculos', setVehiculos);
    return () => {
      unsubCli();
      unsubVeh();
    };
  }, []);

  /**
   * Precarga automática si la orden proviene de un turno convertido
   */
  useEffect(() => {
    if (!turnoOrigen) return;

    // 1. Precargar motivo del trabajo y síntomas informados por el cliente
    if (turnoOrigen.motivo_ingreso && !motivoIngreso) {
      setMotivoIngreso(turnoOrigen.motivo_ingreso);
    }

    // 2. Buscar si el vehículo ya está registrado por su patente
    if (turnoOrigen.patente && vehiculos.length > 0) {
      const patenteLimpia = turnoOrigen.patente.toUpperCase().replace(/\s+/g, '');
      const autoEncontrado = vehiculos.find(
        v => v.patente && v.patente.toUpperCase().replace(/\s+/g, '') === patenteLimpia
      );

      if (autoEncontrado) {
        setClienteId(autoEncontrado.cliente_id);
        setVehiculoId(autoEncontrado.id);
        if (autoEncontrado.kilometraje) setKilometraje(autoEncontrado.kilometraje);
        return;
      }
    }

    // 3. Buscar si el cliente ya está registrado por su teléfono o nombre
    if (clientes.length > 0 && !clienteId) {
      const clienteEncontrado = clientes.find(
        c => (turnoOrigen.cliente_telefono && c.telefono === turnoOrigen.cliente_telefono) ||
             (turnoOrigen.cliente_nombre && c.nombre.toLowerCase() === turnoOrigen.cliente_nombre.toLowerCase())
      );

      if (clienteEncontrado) {
        setClienteId(clienteEncontrado.id);
      } else if (turnoOrigen.cliente_nombre) {
        // Precarga de formulario rápido para darlo de alta en un clic
        setNuevoCliente(prev => ({
          ...prev,
          nombre: turnoOrigen.cliente_nombre,
          telefono: turnoOrigen.cliente_telefono || '',
          email: turnoOrigen.cliente_email || ''
        }));
      }
    }

    // 4. Precarga de formulario rápido del vehículo si no existía
    if (turnoOrigen.patente) {
      setNuevoVehiculo(prev => ({
        ...prev,
        patente: turnoOrigen.patente,
        modelo: turnoOrigen.vehiculo_modelo || ''
      }));
    }
  }, [turnoOrigen, clientes, vehiculos]);

  // Filtra los vehículos que pertenecen al cliente seleccionado
  const vehiculosFiltrados = vehiculos.filter(v => v.cliente_id === clienteId);

  // Sincroniza vehículo y kilometraje cuando se cambia de cliente
  const handleClienteChange = (cId) => {
    setClienteId(cId);
    const autos = vehiculos.filter(v => v.cliente_id === cId);
    if (autos.length > 0) {
      setVehiculoId(autos[0].id);
      setKilometraje(autos[0].kilometraje || '');
    } else {
      setVehiculoId('');
    }
  };

  // Al elegir vehículo, actualiza el kilometraje automáticamente con el último registrado
  const handleVehiculoChange = (vId) => {
    setVehiculoId(vId);
    const auto = vehiculos.find(v => v.id === vId);
    if (auto && auto.kilometraje) {
      setKilometraje(auto.kilometraje);
    }
  };

  /**
   * PROCESO DE GUARDADO:
   * 1. Crea la Orden con número correlativo (ej: OT-0003).
   * 2. Actualiza el kilometraje del vehículo en su ficha clínica si aumentó.
   * 3. Si se ingresó seña, impacta automáticamente en el libro de Caja.
   * 4. Redirige a la pantalla de detalle de la orden recién creada.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clienteId || !vehiculoId || !motivoIngreso.trim()) {
      setErrorMsg('Por favor seleccione cliente, vehículo e ingrese el motivo del trabajo.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrorMsg('');

    const clienteSel = clientes.find(c => c.id === clienteId);
    const vehiculoSel = vehiculos.find(v => v.id === vehiculoId);

    // Correlativo OT
    const todasLasOrdenes = dataManager.getLocal('ordenes');
    const proximoNum = `OT-${(todasLasOrdenes.length + 1).toString().padStart(4, '0')}`;

    const adelantoNum = isAdmin ? (Number(adelanto) || 0) : 0;

    const nuevaOrden = {
      numero_orden: proximoNum,
      cliente_id: clienteId,
      cliente_nombre: clienteSel?.nombre || 'Cliente',
      cliente_telefono: clienteSel?.telefono || '',
      vehiculo_id: vehiculoId,
      patente: vehiculoSel?.patente || '',
      marca: vehiculoSel?.marca || '',
      modelo: vehiculoSel?.modelo || '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      fecha_prometida: fechaPrometida,
      kilometraje_ingreso: Number(kilometraje) || 0,
      nivel_combustible: nivelCombustible,
      checklist,
      danos_previos: danosPrevios,
      motivo_ingreso: motivoIngreso,
      diagnostico: diagnostico,
      estado: 'Ingresado',
      mecanico_asignado: mecanico,
      total_mano_obra: 0,
      total_repuestos: 0,
      descuento: 0,
      total: 0,
      total_pagado: adelantoNum,
      saldo_pendiente: 0,
      items: [],
      pagos: adelantoNum > 0 ? [{
        id: 'p_' + Date.now(),
        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16),
        metodo: metodoAdelanto,
        monto: adelantoNum,
        concepto: `Seña ingreso ${proximoNum}`
      }] : []
    };

    // Actualizar kilometraje del vehículo si aumentó
    if (Number(kilometraje) > (vehiculoSel?.kilometraje || 0)) {
      await dataManager.update('vehiculos', vehiculoId, { kilometraje: Number(kilometraje) });
    }

    // Registrar pago en caja si hubo seña
    if (adelantoNum > 0) {
      await dataManager.add('movimientos_caja', {
        tipo: 'INGRESO',
        categoria: 'Seña OT',
        concepto: `Seña de ingreso ${proximoNum} (${clienteSel?.nombre})`,
        metodo_pago: metodoAdelanto,
        monto: adelantoNum,
        fecha: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });
    }

    const creada = await dataManager.add('ordenes', nuevaOrden);
    navigate(`/ordenes/${creada.id}`);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      
      {/* Encabezado */}
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <span>Recepción y Ficha de Ingreso de Unidad</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Registra el estado de la unidad al ingresar al taller y genera la Orden de Trabajo
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Paso 1: Cliente y Auto */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 md:p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-950/60 text-rose-300 flex items-center justify-center text-[11px] font-black border border-rose-800/40">1</span>
            <span>Identificación del Cliente y Vehículo</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setShowModalCliente(true)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nuevo Cliente</span>
                </button>
              </div>
              <select
                value={clienteId}
                onChange={(e) => handleClienteChange(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.documento || c.telefono || 'Sin datos'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Vehículo *</label>
                <button
                  type="button"
                  onClick={() => {
                    if (!clienteId) {
                       setErrorMsg('Seleccione primero un cliente para registrarle un vehículo.');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      return;
                    }
                    setShowModalVehiculo(true);
                  }}
                  className={`text-[11px] flex items-center gap-1 font-semibold transition-colors ${
                    clienteId ? 'text-rose-400 hover:text-rose-300 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Nuevo Vehículo</span>
                </button>
              </div>
              <select
                value={vehiculoId}
                onChange={(e) => handleVehiculoChange(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="">{clienteId ? '-- Seleccionar Vehículo --' : '-- Primero seleccione un cliente --'}</option>
                {vehiculosFiltrados.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.marca} {v.modelo} &bull; [{v.patente}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Kilometraje al Ingresar (km)</label>
              <div className="relative">
                <Gauge className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="number"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(e.target.value)}
                  placeholder="ej: 65000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Fecha Estimada de Entrega</label>
              <input
                type="date"
                value={fechaPrometida}
                onChange={(e) => setFechaPrometida(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Paso 2: Checklist y Nivel de Combustible */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 md:p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-950/60 text-rose-300 flex items-center justify-center text-[11px] font-black border border-rose-800/40">2</span>
            <span>Checklist y Estado de Recepción</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Nivel de Combustible</label>
              <div className="grid grid-cols-5 gap-2">
                {['Reserva', '1/4', '1/2', '3/4', 'Lleno'].map((niv) => (
                  <button
                    key={niv}
                    type="button"
                    onClick={() => setNivelCombustible(niv)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                      nivelCombustible === niv
                        ? 'bg-gradient-to-r from-rose-700 to-rose-600 text-white border-rose-600 shadow-md shadow-rose-950/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Fuel className="w-3.5 h-3.5" />
                    <span>{niv}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Elementos en el Vehículo</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'auxilio', label: 'Rueda de auxilio' },
                  { key: 'gato', label: 'Gato y herramientas' },
                  { key: 'papeles', label: 'Cédula / Documentos' },
                  { key: 'stereo', label: 'Estéreo / Pantalla' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setChecklist({ ...checklist, [key]: !checklist[key] })}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                      checklist[key]
                        ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-500 border-slate-800 line-through'
                    }`}
                  >
                    <span>{label}</span>
                    <Check className={`w-3.5 h-3.5 ${checklist[key] ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Detalles de Carrocería / Rayones y Golpes Previos
              </label>
              <textarea
                value={danosPrevios}
                onChange={(e) => setDanosPrevios(e.target.value)}
                rows="2"
                placeholder="ej: Raspón en paragolpe delantero derecho, llanta delantera izquierda cordoneada..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        </div>

        {/* Paso 3: Motivo y Datos Técnicos */}
        <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 md:p-6 backdrop-blur-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-950/60 text-rose-300 flex items-center justify-center text-[11px] font-black border border-rose-800/40">3</span>
            <span>Motivo de Ingreso y Diagnóstico</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo del Ingreso / Síntomas declarados por el cliente *
              </label>
              <textarea
                value={motivoIngreso}
                onChange={(e) => setMotivoIngreso(e.target.value)}
                required
                rows="2"
                placeholder="ej: Ruido metálico al doblar a la derecha y control de frenos..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Diagnóstico Preliminar / Notas del Taller
                </label>
                <textarea
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows="2"
                  placeholder="ej: Revisar semieje y pastillas de freno..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mecánico Asignado</label>
                  <input
                    type="text"
                    value={mecanico}
                    onChange={(e) => setMecanico(e.target.value)}
                    placeholder="ej: Martín, Alejandro..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {isAdmin && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Seña / Adelanto ($)</label>
                      <input
                        type="number"
                        value={adelanto}
                        onChange={(e) => setAdelanto(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Seña</label>
                      <select
                        value={metodoAdelanto}
                        onChange={(e) => setMetodoAdelanto(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Tarjeta Débito">Tarjeta Débito</option>
                        <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                        <option value="MercadoPago/QR">MercadoPago/QR</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/ordenes')}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-black px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Generar Orden de Trabajo</span>
          </button>
        </div>

      </form>

      {/* Modal Rápido: Nuevo Cliente */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-rose-400" />
                <span>Registrar Nuevo Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModalCliente(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleGuardarClienteRapido} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre y Apellido / Razón Social *</label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                  required
                  placeholder="ej: Juan Pérez"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                    placeholder="ej: 1122334455"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">DNI / CUIT</label>
                  <input
                    type="text"
                    value={nuevoCliente.documento}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, documento: e.target.value })}
                    placeholder="ej: 30123456"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={nuevoCliente.email}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value })}
                  placeholder="ej: cliente@email.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección</label>
                <input
                  type="text"
                  value={nuevoCliente.direccion}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
                  placeholder="ej: Av. San Martín 1234"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalCliente(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-rose-950/40"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Nuevo Vehículo */}
      {showModalVehiculo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-rose-400" />
                <span>Registrar Vehículo al Cliente</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModalVehiculo(false)}
                className="text-slate-500 hover:text-white text-xs"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleGuardarVehiculoRapido} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Patente / Dominio *</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.patente}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, patente: e.target.value.toUpperCase() })}
                    required
                    placeholder="ej: AE123CD"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={nuevoVehiculo.anio}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, anio: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Marca *</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.marca}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })}
                    required
                    placeholder="ej: Toyota"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo *</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.modelo}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })}
                    required
                    placeholder="ej: Corolla 1.8"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kilometraje Actual</label>
                  <input
                    type="number"
                    value={nuevoVehiculo.kilometraje}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, kilometraje: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Combustible</label>
                  <select
                    value={nuevoVehiculo.combustible}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, combustible: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Nafta">Nafta</option>
                    <option value="Diésel">Diésel</option>
                    <option value="GNC">GNC</option>
                    <option value="Híbrido">Híbrido</option>
                    <option value="Eléctrico">Eléctrico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Color</label>
                  <input
                    type="text"
                    value={nuevoVehiculo.color}
                    onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value })}
                    placeholder="ej: Gris Plata"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código de Motor / Notas Técnicas</label>
                <input
                  type="text"
                  value={nuevoVehiculo.motor}
                  onChange={(e) => setNuevoVehiculo({ ...nuevoVehiculo, motor: e.target.value })}
                  placeholder="ej: 1ZZ-FE / Correa distribución cambiada"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalVehiculo(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-rose-950/40"
                >
                  Asignar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
