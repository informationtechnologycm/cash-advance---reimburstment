import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AppNotification } from '../types/finance';
import {
  Bell,
  CheckCircle2,
  XCircle,
  CreditCard,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  Clock,
  ShieldCheck,
  AlertOctagon,
  FileText,
} from 'lucide-react';

interface NotificationDropdownProps {
  onSelectAdvance?: (id: string) => void;
  onSelectReimbursement?: (id: string) => void;
  onSelectSettlement?: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  onSelectAdvance,
  onSelectReimbursement,
  onSelectSettlement,
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    clearNotifications,
  } = useFinance();

  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'APPROVED' | 'REJECTED'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'UNREAD') return !notif.isRead;
    if (filter === 'APPROVED') return notif.status === 'APPROVED';
    if (filter === 'REJECTED') return notif.status === 'REJECTED';
    return true;
  });

  const handleNotificationClick = (notif: AppNotification) => {
    // 1. Mark as read
    markNotificationAsRead(notif.id);

    // 2. Close dropdown
    setIsOpen(false);

    // 3. Open relevant modal based on targetType
    if (notif.targetType === 'ADVANCE' && onSelectAdvance) {
      onSelectAdvance(notif.targetId);
    } else if (notif.targetType === 'REIMBURSEMENT' && onSelectReimbursement) {
      onSelectReimbursement(notif.targetId);
    } else if (notif.targetType === 'SETTLEMENT' && onSelectSettlement) {
      onSelectSettlement(notif.targetId);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all border ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
        }`}
        title={`Notifikasi Sistem & Approval (${unreadNotificationsCount} belum dibaca)`}
        aria-label="Pemberitahuan Sistem"
      >
        <Bell className="w-4 h-4" />

        {/* Real-Time Unread Badge Counter */}
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full shadow-xs border border-white">
            <span className="relative z-10 font-mono">
              {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
            </span>
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />
          </span>
        )}
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 text-blue-700 rounded-md">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">
                    Pemberitahuan Alur Approval
                  </h3>
                  <div className="text-[10px] text-slate-500">
                    Real-time status persetujuan &amp; penolakan berkas
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                {unreadNotificationsCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="p-1.5 text-[11px] font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    title="Tandai semua telah dibaca"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tandai Baca</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Bersihkan semua notifikasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs (Interactive Segmented Control) */}
            <div className="mt-3 flex items-center p-0.5 bg-slate-200/70 rounded-lg text-xs font-medium">
              <button
                onClick={() => setFilter('ALL')}
                className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                  filter === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                  filter === 'UNREAD'
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum Dibaca ({unreadNotificationsCount})
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                  filter === 'APPROVED'
                    ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disetujui
              </button>
              <button
                onClick={() => setFilter('REJECTED')}
                className={`flex-1 py-1 rounded-md text-[11px] transition-all ${
                  filter === 'REJECTED'
                    ? 'bg-white text-rose-800 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ditolak
              </button>
            </div>
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-5 h-5 opacity-60" />
                </div>
                <div className="text-xs font-semibold text-slate-700">
                  Tidak ada pemberitahuan
                </div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Setiap pengajuan kasbon atau reimbursement yang disetujui atau ditolak akan langsung diberitahukan di sini.
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => {
                const isApproved = notif.status === 'APPROVED';
                const isRejected = notif.status === 'REJECTED';
                const isDisbursed = notif.status === 'DISBURSED' || notif.status === 'PAID';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 transition-colors cursor-pointer relative group flex gap-3 ${
                      !notif.isRead
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isApproved && (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      {isRejected && (
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                          <XCircle className="w-4 h-4" />
                        </div>
                      )}
                      {isDisbursed && (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 pr-4">
                      {/* Top Row: Code, Status Badge, Timestamp */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {notif.targetCode}
                        </span>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {isApproved
                            ? 'DISETUJUI'
                            : isRejected
                            ? 'DITOLAK'
                            : 'TERBAYAR'}
                        </span>

                        {notif.companyId && (
                          <span className="text-[9px] font-mono font-medium px-1 bg-slate-100 text-slate-600 rounded">
                            PT {notif.companyId}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">
                          {notif.timestamp}
                        </span>
                      </div>

                      {/* Main Message */}
                      <p className="text-xs text-slate-700 mt-1 leading-snug line-clamp-2">
                        {notif.message}
                      </p>

                      {/* Rejection Reason Callout Box (if rejected) */}
                      {isRejected && notif.reason && (
                        <div className="mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200/80 text-[11px] text-rose-900 space-y-0.5">
                          <div className="font-bold flex items-center gap-1 text-[10px] text-rose-700 uppercase tracking-wider">
                            <AlertOctagon className="w-3 h-3" />
                            <span>Alasan Penolakan:</span>
                          </div>
                          <p className="italic text-rose-800">&ldquo;{notif.reason}&rdquo;</p>
                        </div>
                      )}

                      {/* Bottom Micro Actions */}
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="text-blue-700 font-medium group-hover:underline flex items-center gap-1">
                          <span>Buka rincian berkas</span>
                          <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </span>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Belum dibaca" />
                        )}
                      </div>
                    </div>

                    {/* Single Item Delete Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="absolute top-3 right-3 text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
                      title="Hapus pemberitahuan ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Klik kartu notifikasi untuk membuka dokumen</span>
            <span className="font-mono text-[10px]">
              {filteredNotifications.length} dari {notifications.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
