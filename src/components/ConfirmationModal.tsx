import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: { label: string; value: string | number }[];
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-full shrink-0 ${
                isDestructive
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isDestructive ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{message}</p>
            </div>
          </div>

          {details && details.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 text-xs">
              {details.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-slate-700">
                  <span className="text-slate-500">{item.label}:</span>
                  <span className="font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
