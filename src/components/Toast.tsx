import { CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-sm z-[9998] animate-slide-in">
      <div className="glass-card bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-green-500/20 flex items-center space-x-3 backdrop-blur-xl">
        <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-400" />
        <p className="flex-1 font-medium text-white text-sm">{message}</p>
        <button
          onClick={onClose}
          className="text-green-400 hover:text-green-300 transition-colors p-1 hover:bg-green-500/20 rounded-lg flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
