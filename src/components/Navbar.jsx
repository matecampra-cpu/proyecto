/**
 * BARRA DE NAVEGACIÓN Y MENÚ LATERAL (Navbar.jsx)
 * -----------------------------------------------
 * Componente de interfaz que ofrece:
 * 1. Menú lateral en modo escritorio (Sidebar oscuro boutique).
 * 2. Barra superior con Drawer deslizable en dispositivos móviles.
 * 3. Contadores en tiempo real (badges):
 *    - Órdenes de trabajo activas en el taller.
 *    - Alertas de repuestos con stock por debajo del mínimo.
 * 4. Acceso directo con botón destacado "Recepción de Auto" (+OT).
 * 5. Información del usuario conectado y botón de cierre de sesión.
 */
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  LayoutDashboard, 
  ClipboardList, 
  FileText, 
  Users, 
  Car, 
  Package, 
  Wallet, 
  Settings, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dataManager } from '../firebase';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Estados para los contadores reactivos de la barra
  const [ordenesActivas, setOrdenesActivas] = useState(0);
  const [alertasStock, setAlertasStock] = useState(0);
  const [turnosPendientes, setTurnosPendientes] = useState(0);
  const config = dataManager.getConfig();

  // ---------------------------------------------------------------------------
  // EFECTO DE SUSCRIPCIÓN EN TIEMPO REAL:
  // Escucha órdenes abiertas, repuestos en bajo stock y turnos pendientes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Escucha órdenes y filtra las que no estén entregadas ni canceladas
    const unsubOrdenes = dataManager.subscribe('ordenes', (data) => {
      const activas = data.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado').length;
      setOrdenesActivas(activas);
    });

    // Escucha inventario y cuenta los productos con faltante de stock
    const unsubRepuestos = dataManager.subscribe('repuestos', (data) => {
      const alertas = data.filter(r => r.stock_actual <= r.stock_minimo).length;
      setAlertasStock(alertas);
    });

    // Escucha turnos solicitados online y cuenta los pendientes de confirmación
    const unsubTurnos = dataManager.subscribe('turnos', (data) => {
      const pendientes = (data || []).filter(t => t.estado === 'Pendiente').length;
      setTurnosPendientes(pendientes);
    });

    // Limpieza de suscripciones al desmontar
    return () => {
      unsubOrdenes();
      unsubRepuestos();
      unsubTurnos();
    };
  }, []);

  // Definición de enlaces del menú (restringiendo áreas financieras para mecánicos)
  const navLinks = [
    { to: '/', label: 'Tablero General', icon: LayoutDashboard },
    { to: '/ordenes', label: 'Órdenes de Trabajo', icon: ClipboardList, badge: ordenesActivas },
    { to: '/turnos', label: 'Turnos Online', icon: Calendar, badge: turnosPendientes },
    ...(isAdmin ? [{ to: '/presupuestos', label: 'Presupuestos', icon: FileText }] : []),
    { to: '/clientes', label: 'Clientes', icon: Users },
    { to: '/vehiculos', label: 'Vehículos', icon: Car },
    { to: '/repuestos', label: 'Inventario / Stock', icon: Package, alertBadge: alertasStock },
    ...(isAdmin ? [{ to: '/caja', label: 'Caja y Finanzas', icon: Wallet }] : []),
    { to: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <>
      {/* Header Móvil */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0509] border-b border-rose-950/60 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-800 via-rose-700 to-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-950/50">
            <Wrench className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-wide text-white">
            {config.nombre_taller || 'TallerPro'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Link 
            to="/ordenes/nueva" 
            className="p-1.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white rounded-lg font-bold text-xs flex items-center space-x-1 shadow-md shadow-rose-950/40 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva OT</span>
          </Link>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Menú Drawer Móvil */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div 
            className="bg-[#0d0509] border-t border-rose-950/80 p-5 rounded-t-3xl max-h-[85vh] overflow-y-auto space-y-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 mb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navegación del Taller</span>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40 shadow-sm shadow-rose-950/40' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {/* Contador de órdenes activas */}
                  {item.badge > 0 && (
                    <span className="bg-sky-500/20 text-sky-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {item.badge}
                    </span>
                  )}
                  {/* Alerta de faltante de repuestos */}
                  {item.alertBadge > 0 && (
                    <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {item.alertBadge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-800">
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); navigate('/login'); }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Escritorio */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0d0509] border-r border-rose-950/60 text-slate-300 flex-shrink-0 min-h-screen">
        
        {/* Logo & Marca */}
        <div className="p-5 border-b border-rose-950/60 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-800 via-rose-700 to-rose-600 flex items-center justify-center text-white font-black shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-white text-base tracking-wide leading-tight">
                {config.nombre_taller || 'TallerPro'}
              </h1>
              <span className="text-[10px] text-rose-400/90 font-bold tracking-widest uppercase">
                Gestión Automotriz
              </span>
            </div>
          </Link>
        </div>

        {/* Botón Acción Rápida: Nueva Orden */}
        <div className="px-4 pt-4 pb-2">
          <Link 
            to="/ordenes/nueva" 
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-rose-950/40 transition-all transform hover:-translate-y-0.5 text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Recepción de Auto</span>
          </Link>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'bg-rose-950/50 text-rose-300 font-bold border border-rose-800/40 shadow-sm shadow-rose-950/30' 
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-sky-500/20 text-sky-400 text-[11px] px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                    {item.badge}
                  </span>
                )}
                {item.alertBadge > 0 && (
                  <span className="bg-rose-500/20 text-rose-400 text-[11px] px-2 py-0.5 rounded-full font-bold border border-rose-500/30 flex items-center space-x-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    {item.alertBadge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Perfil & Logout */}
        <div className="p-4 border-t border-rose-950/60 bg-[#0a0407]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-950/50 border border-rose-800/40 flex items-center justify-center font-bold text-rose-300 text-xs shadow-inner">
                {user?.nombre?.charAt(0) || 'T'}
              </div>
              <div className="truncate max-w-[120px]">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.nombre || 'Administrador'}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.rol || 'Dueño'}</p>
              </div>
            </div>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Cerrar sesión"
              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
}
