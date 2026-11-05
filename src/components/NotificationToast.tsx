import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { NotificationState } from '../types/index';

interface NotificationToastProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-pink-200/50 border text-xs sm:text-sm backdrop-blur-md transition-all max-w-md ${
            notification.type === 'warning'
              ? 'bg-amber-50/95 border-amber-300 text-amber-900'
              : notification.type === 'success'
              ? 'bg-white/95 border-emerald-300 text-emerald-950 shadow-emerald-100/50'
              : 'bg-white/95 border-pink-300 text-pink-950 shadow-pink-100/50'
          }`}
        >
          {notification.type === 'warning' ? (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
          ) : notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <Info className="w-5 h-5 flex-shrink-0 text-pink-600" />
          )}
          <span className="flex-1 font-semibold">{notification.text}</span>
          <button
            onClick={onClose}
            aria-label="Dismiss notification"
            className="ml-2 hover:opacity-75 p-1 rounded-lg hover:bg-pink-100/60 transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
