/**
 * CONTEXTO DE CONFIRMACIÓN MODAL PROFESIONAL (ConfirmContext.jsx)
 * -----------------------------------------------------------------
 * Reemplaza los diálogos nativos del navegador ('window.confirm') por
 * una ventana modal corporativa con diseño oscuro boutique y animaciones
 * fluidas con Framer Motion.
 */
import React, { createContext, useContext, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Trash2, HelpCircle, X } from 'lucide-react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'amber', // 'amber' | 'emerald' | 'rose'
    iconType: 'help'
  });

  const resolverRef = useRef(null);

  const confirm = ({
    title = '¿Confirmar operación?',
    message = '¿Está seguro de que desea continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'amber',
    iconType = 'help'
  }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        variant,
        iconType
      });
    });
  };

  const handleConfirm = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (resolverRef.current) resolverRef.current(true);
  };

  const handleCancel = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    if (resolverRef.current) resolverRef.current(false);
  };

  const getVariantStyles = () => {
    switch (modalState.variant) {
      case 'emerald':
        return {
          iconBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          btnConfirm: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
        };
      case 'rose':
        return {
          iconBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          btnConfirm: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          btnConfirm: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
        };
      case 'bordo':
      default:
        return {
          iconBg: 'bg-rose-950/50 border-rose-800/40 text-rose-400',
          btnConfirm: 'bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white shadow-rose-950/40'
        };
    }
  };

  const renderIcon = () => {
    switch (modalState.iconType) {
      case 'check':
        return <CheckCircle2 className="w-6 h-6" />;
      case 'trash':
        return <Trash2 className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      case 'help':
      default:
        return <HelpCircle className="w-6 h-6" />;
    }
  };

  const styles = getVariantStyles();

  return (
    <ConfirmContext.Provider value={{ confirm, confirmar: confirm }}>
      {children}
      <AnimatePresence>
        {modalState.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Fondo oscuro con desenfoque */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Tarjeta Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              {/* Botón cerrar esquina */}
              <button
                type="button"
                onClick={handleCancel}
                className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Encabezado con Icono */}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${styles.iconBg}`}>
                  {renderIcon()}
                </div>
                <div className="space-y-1 pr-4">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {modalState.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {modalState.message}
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-900">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
                >
                  {modalState.cancelText}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all ${styles.btnConfirm}`}
                >
                  {modalState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe ser utilizado dentro de un ConfirmProvider');
  }
  return context;
}
