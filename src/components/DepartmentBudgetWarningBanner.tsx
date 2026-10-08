import React from 'react';
import {
  AlertTriangle,
  Info,
  Building2,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { DepartmentBudgetCheckResult } from '../data/departmentBudgets';
import { formatRupiah } from '../utils/formatters';

interface DepartmentBudgetWarningBannerProps {
  budgetResult: DepartmentBudgetCheckResult;
  justification?: string;
  onJustificationChange?: (text: string) => void;
  acknowledged?: boolean;
  onToggleAcknowledge?: (val: boolean) => void;
}

export const DepartmentBudgetWarningBanner: React.FC<DepartmentBudgetWarningBannerProps> = ({
  budgetResult,
  justification = '',
  onJustificationChange,
  acknowledged = false,
  onToggleAcknowledge,
}) => {
  const {
    department,
    companyId,
    monthLabel,
    monthlyBudget,
    actualSpent,
    remainingBudget,
    requestedAmount,
    isOverBudget,
    overBudgetAmount,
    currentUtilizationRate,
    projectedUtilizationRate,
  } = budgetResult;

  if (!isOverBudget) {
    // Subtle info indicator when within budget
    return (
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs text-emerald-900 transition-all">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Pagu Anggaran <strong>{department}</strong> ({companyId}) untuk <strong>{monthLabel}</strong>: Sisa tersedia{' '}
            <strong className="font-mono">{formatRupiah(remainingBudget)}</strong>.
          </span>
        </div>
        {requestedAmount > 0 && (
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
            Tersisa {formatRupiah(Math.max(0, remainingBudget - requestedAmount))}
          </span>
        )}
      </div>
    );
  }

  // Warning Banner when requested amount exceeds remaining departmental budget
  const maxBar = Math.max(120, projectedUtilizationRate);
  const spentPct = Math.min(100, (actualSpent / monthlyBudget) * 100);
  const requestPct = Math.min(100 - spentPct, (requestedAmount / monthlyBudget) * 100);
  const excessPct = Math.max(0, projectedUtilizationRate - 100);

  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-amber-400 bg-amber-50/95 p-4 shadow-sm text-slate-900 space-y-3.5 transition-all animate-in fade-in duration-200"
    >
      {/* Header with Title and Deficit Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-amber-600 text-white font-bold text-[10px] rounded tracking-wide uppercase">
                Peringatan Anggaran
              </span>
              <h3 className="text-xs font-bold text-amber-950 sm:text-sm">
                Nomor Pengajuan Melebihi Sisa Pagu Anggaran Departemen
              </h3>
            </div>
            <p className="text-[11px] text-amber-900 mt-1 leading-relaxed">
              Pengajuan kasbon sebesar{' '}
              <strong className="font-mono text-slate-900">{formatRupiah(requestedAmount)}</strong> melampaui sisa pagu
              anggaran berjalan untuk departemen <strong>{department}</strong> ({companyId}) periode{' '}
              <strong>{monthLabel}</strong>.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 self-start sm:self-center">
          <div className="px-2.5 py-1 bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-right">
            <span className="block text-[9px] uppercase tracking-wider font-bold text-rose-600">
              Kelebihan (Defisit)
            </span>
            <span className="text-xs font-bold font-mono">+{formatRupiah(overBudgetAmount)}</span>
          </div>
        </div>
      </div>

      {/* 4 Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5">
          <span className="text-[10px] font-medium text-slate-500 block">Pagu Bulanan</span>
          <span className="font-mono font-bold text-slate-900 block mt-0.5">
            {formatRupiah(monthlyBudget)}
          </span>
          <span className="text-[10px] text-slate-400">Limit Pagu {companyId}</span>
        </div>

        <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5">
          <span className="text-[10px] font-medium text-slate-500 block">Realisasi Berjalan</span>
          <span className="font-mono font-bold text-amber-800 block mt-0.5">
            {formatRupiah(actualSpent)}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">
            Terpakai {currentUtilizationRate}%
          </span>
        </div>

        <div className="bg-white/90 border border-amber-200 rounded-lg p-2.5">
          <span className="text-[10px] font-medium text-slate-500 block">Sisa Anggaran Tersedia</span>
          <span className={`font-mono font-bold block mt-0.5 ${remainingBudget <= 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatRupiah(remainingBudget)}
          </span>
          <span className="text-[10px] text-slate-500">
            {remainingBudget <= 0 ? 'Pagu Habis' : 'Sebelum Pengajuan'}
          </span>
        </div>

        <div className="bg-rose-50/90 border border-rose-200 rounded-lg p-2.5">
          <span className="text-[10px] font-semibold text-rose-700 block">Proyeksi Utilisasi</span>
          <span className="font-mono font-bold text-rose-900 block mt-0.5">
            {projectedUtilizationRate}%
          </span>
          <span className="text-[10px] font-medium text-rose-700">
            Melampaui 100% Pagu
          </span>
        </div>
      </div>

      {/* Progress / Utilization Bar */}
      <div className="bg-white/80 border border-amber-200/90 rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-600 font-medium flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            Visualisasi Alokasi Anggaran {monthLabel}
          </span>
          <span className="font-mono font-bold text-rose-700">
            Proyeksi Total: {formatRupiah(actualSpent + requestedAmount)} ({projectedUtilizationRate}%)
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
          {/* Realisasi Berjalan */}
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (actualSpent / (actualSpent + requestedAmount || 1)) * 100)}%` }}
            title={`Realisasi Berjalan: ${formatRupiah(actualSpent)}`}
          />
          {/* Pengajuan Saat Ini */}
          <div
            className="bg-rose-500 h-full transition-all duration-300 relative"
            style={{ width: `${Math.max(0, 100 - (actualSpent / (actualSpent + requestedAmount || 1)) * 100)}%` }}
            title={`Pengajuan Baru: ${formatRupiah(requestedAmount)}`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Realisasi: {formatRupiah(actualSpent)} ({currentUtilizationRate}%)
          </span>
          <span className="flex items-center gap-1 font-semibold text-rose-700">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Pengajuan Ini: {formatRupiah(requestedAmount)} (Defisit: +{formatRupiah(overBudgetAmount)})
          </span>
        </div>
      </div>

      {/* Policy and Escalation Note */}
      <div className="flex items-start gap-2 bg-amber-100/70 border border-amber-300/80 rounded-lg p-2.5 text-[11px] text-amber-950">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Kebijakan Finansial PT {companyId}:</strong> Pengajuan kasbon yang melampaui sisa pagu bulanan
          departemen tetap dapat diproses, namun sistem akan menandainya dengan status{' '}
          <span className="font-bold underline text-amber-900">Over-Budget Warning</span>. Pengajuan ini mewajibkan
          justifikasi tertulis dan otorisasi persetujuan eskalasi ke Tim Finance serta Direksi.
        </div>
      </div>

      {/* Optional Justification Field */}
      {onJustificationChange && (
        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-800">
            Justifikasi Alasan Pengajuan di Luar Pagu (Opsional / Dianjurkan)
          </label>
          <input
            type="text"
            value={justification}
            onChange={e => onJustificationChange(e.target.value)}
            placeholder="Contoh: Kebutuhan darurat perbaikan turbin site / penugasan mendesak proyek tender"
            className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
      )}

      {/* User Confirmation Checkbox */}
      {onToggleAcknowledge && (
        <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={e => onToggleAcknowledge(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
          />
          <span className="text-[11px] text-slate-700">
            Saya mengonfirmasi bahwa pengajuan kasbon ini melampaui sisa pagu anggaran departemen berjalan (
            <strong>{formatRupiah(remainingBudget)}</strong>) dan siap melampirkan justifikasi saat proses persetujuan.
          </span>
        </label>
      )}
    </div>
  );
};
