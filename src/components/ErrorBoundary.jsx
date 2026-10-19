/**
 * CAPTURADOR DE ERRORES VISUAL (ErrorBoundary.jsx)
 * -------------------------------------------------
 * Evita que cualquier fallo imprevisto desmonte la aplicación y deje
 * la pantalla en negro. Si ocurre un error, muestra una tarjeta elegante
 * con opción de recargar de inmediato.
 */
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturo un error de ejecucion:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Reanudacion de Pantalla</h2>
              <p className="text-xs text-slate-400">
                El sistema detecto una interrupcion de renderizado. Haga clic a continuacion para recargar la interfaz al instante.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-950/40 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Recargar Sistema</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
