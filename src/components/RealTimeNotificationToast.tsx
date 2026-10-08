import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AppNotification } from '../types/finance';
import { CheckCircle2, XCircle, Bell, X, ExternalLink } from 'lucide-react';

interface RealTimeNotificationToastProps {
  onSelectAdvance?: (id: string) => void;
  onSelectReimbursement?: (id: string) => void;
  onSelectSettlement?: (id: string) => void;
}

export const RealTimeNotificationToast: React.FC<RealTimeNotificationToastProps> = ({
  onSelectAdvance,
  onSelectReimbursement,
  onSelectSettlement,
}) => {
  const { notifications, markNotificationAsRead } = useFinance();
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (notifications.length === 0) return;

    const latest = notifications[0];

    // On initial mount, just store the latest ID so we don't spam existing initial notifications
    if (lastSeenIdRef.current === null) {
      lastSeenIdRef.current = latest.id;
      return;
    }

    // If a brand new notification arrived
    if (latest.id !== lastSeenIdRef.current) {
      lastSeenIdRef.current = latest.id;
      setActiveToast(latest);

      // Auto dismiss after 5 seconds
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActiveToast(null);
      }, 5000);
    }
  }, [notifications]);

  if (!activeToast) return null;

  const isApproved = activeToast.status === 'APPROVED';
  const isRejected = activeToast.status === 'REJECTED';

  const handleClick = () => {
    markNotificationAsRead(activeToast.id);
    setActiveToast(null);

    if (activeToast.targetType === 'ADVANCE' && onSelectAdvance) {
      onSelectAdvance(activeToast.targetId);
    } else if (activeToast.targetType === 'REIMBURSEMENT' && onSelectReimbursement) {
      onSelectReimbursement(activeToast.targetId);
    } else if (activeToast.targetType === 'SETTLEMENT' && onSelectSettlement) {
      onSelectSettlement(activeToast.targetId);
    }
  };

  return (
    <div
      role="alert"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-5 duration-300 flex items-start gap-3 cursor-pointer group hover:border-slate-500 transition-all"
      onClick={handleClick}
    >
      <div className="shrink-0 mt-0.5">
        {isApproved ? (
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        ) : isRejected ? (
          <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
            <XCircle className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-blue-300">
            Real-Time Alert
          </span>
          <span className="text-slate-500">·</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
              isApproved
                ? 'bg-emerald-500/20 text-emerald-300'
                : isRejected
                ? 'bg-rose-500/20 text-rose-300'
                : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {activeToast.status}
          </span>
        </div>

        <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">
          {activeToast.title}
        </h4>

        <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
          {activeToast.message}
        </p>

        <div className="mt-2 text-[10px] text-blue-400 flex items-center gap-1 group-hover:underline">
          <span>Klik untuk membuka dokumen</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          setActiveToast(null);
        }}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
        title="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
