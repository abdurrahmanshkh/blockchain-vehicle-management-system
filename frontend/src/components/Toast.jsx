import React, { useState, useEffect, useCallback } from 'react';

/**
 * Toast notification system.
 * 
 * Usage in parent:
 *   const [toasts, setToasts] = useState([]);
 *   const addToast = (message, type = 'success') => {
 *     const id = Date.now();
 *     setToasts(prev => [...prev, { id, message, type }]);
 *   };
 * 
 *   <ToastContainer toasts={toasts} setToasts={setToasts} />
 */

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss after 4 seconds
    const duration = 4000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 300);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.id, onDismiss]);

  const config = {
    success: {
      bg: 'bg-white',
      border: 'border-emerald-200',
      icon: 'text-emerald-500',
      bar: 'bg-emerald-500',
      iconPath: 'M5 13l4 4L19 7',
    },
    error: {
      bg: 'bg-white',
      border: 'border-red-200',
      icon: 'text-red-500',
      bar: 'bg-red-500',
      iconPath: 'M6 18L18 6M6 6l12 12',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      bar: 'bg-amber-500',
      iconPath: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  }[toast.type] || {
    bg: 'bg-white',
    border: 'border-gray-200',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div
      className={`max-w-sm w-full ${config.bg} border ${config.border} rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${config.icon} shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} />
        </svg>
        <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 300);
          }}
          className="shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full ${config.bar} transition-all duration-50 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ToastContainer({ toasts, setToasts }) {
  const handleDismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, [setToasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
}

export default ToastContainer;
