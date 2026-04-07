import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const toneClasses = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-50',
  info: 'border-slate-600 bg-slate-800 text-slate-100',
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
};

export function ToastHost() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = toneIcons[toast.type] || Info;
        return (
          <div key={toast.id} className={`rounded-lg border p-4 shadow-soft ${toneClasses[toast.type] || toneClasses.info}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white">{toast.title}</div>
                {toast.message ? <div className="mt-1 text-sm text-slate-200">{toast.message}</div> : null}
              </div>
              <button type="button" onClick={() => removeToast(toast.id)} className="rounded p-1 text-current/80 transition hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
