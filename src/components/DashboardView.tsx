import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateIndo, checkIsOverdue, getAdvanceStatusInfo, getReimbursementStatusInfo } from '../utils/formatters';
import { COMPANIES } from '../data/initialData';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { DepartmentBudgetChart } from './DepartmentBudgetChart';
import {
  Wallet,
  Clock,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  UserCheck,
  Building,
  ShieldCheck,
  Eye,
  Send,
  Plus,
  Check,
  CreditCard,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewAdvance: () => void;
  onOpenNewReimbursement: () => void;
  onSelectAdvance: (id: string) => void;
  onSelectReimbursement: (id: string) => void;
  onSelectSettlement: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewAdvance,
  onOpenNewReimbursement,
  onSelectAdvance,
  onSelectReimbursement,
  onSelectSettlement,
}) => {
  const {
    selectedCompany,
    setSelectedCompany,
    filteredAdvances,
    filteredReimbursements,
    filteredSettlements,
    advances,
    reimbursements,
    currentUser,
    setActiveTab,
  } = useFinance();

  // Metrics for General / Finance / Manager
  const activeAdvanceAmount = filteredAdvances
    .filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  const pendingAdvanceAmount = filteredAdvances
    .filter(a => a.status === 'PENDING_MANAGER' || a.status === 'PENDING_FINANCE' || a.status === 'PENDING_DIRECTOR')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  const unpaidReimbursementAmount = filteredReimbursements
    .filter(r => r.status !== 'PAID' && r.status !== 'REJECTED')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const totalSettledAmount = filteredAdvances
    .filter(a => a.status === 'SETTLED')
    .reduce((sum, a) => sum + a.totalAmount, 0);

  // Overdue advances requiring urgent settlement
  const overdueAdvances = filteredAdvances.filter(
    a => a.status === 'PENDING_SETTLEMENT' && checkIsOverdue(a.settlementDeadlineDate)
  );

  // Pending items needing current user's action
  const itemsNeedingAction = filteredAdvances.filter(a => {
    if (currentUser.role === 'MANAGER' && a.status === 'PENDING_MANAGER') return true;
    if (currentUser.role === 'FINANCE' && (a.status === 'PENDING_FINANCE' || a.status === 'APPROVED')) return true;
    if (currentUser.role === 'DIRECTOR' && a.status === 'PENDING_DIRECTOR') return true;
    return false;
  });

  const reimbsNeedingAction = filteredReimbursements.filter(r => {
    if (currentUser.role === 'MANAGER' && r.status === 'PENDING_MANAGER') return true;
    if (currentUser.role === 'FINANCE' && (r.status === 'PENDING_FINANCE' || r.status === 'APPROVED')) return true;
    if (currentUser.role === 'DIRECTOR' && r.status === 'PENDING_MANAGER') return true;
    return false;
  });

  // Entity comparison for AMS vs AMI
  const amsAdvances = advances.filter(a => a.companyId === 'AMS');
  const amiAdvances = advances.filter(a => a.companyId === 'AMI');
  const amsReimbs = reimbursements.filter(r => r.companyId === 'AMS');
  const amiReimbs = reimbursements.filter(r => r.companyId === 'AMI');

  const amsTotalActive = amsAdvances
    .filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT')
    .reduce((s, a) => s + a.totalAmount, 0);

  const amiTotalActive = amiAdvances
    .filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT')
    .reduce((s, a) => s + a.totalAmount, 0);

  // ============================================
  // SPECIFIC FOR PEMOHON (STAFF)
  // ============================================
  const isStaff = currentUser.role === 'STAFF';

  // My Submissions
  const myAdvances = advances.filter(a => a.applicantId === currentUser.id || a.applicantName.toLowerCase() === currentUser.name.toLowerCase());
  const myReimbursements = reimbursements.filter(r => r.applicantId === currentUser.id || r.applicantName.toLowerCase() === currentUser.name.toLowerCase());

  // My Metrics
  const myActiveAdvances = myAdvances.filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT');
  const myActiveAmount = myActiveAdvances.reduce((sum, a) => sum + a.totalAmount, 0);

  const myPendingManagerAdvances = myAdvances.filter(a => a.status === 'PENDING_MANAGER');
  const myPendingManagerReimbs = myReimbursements.filter(r => r.status === 'PENDING_MANAGER');
  const myPendingManagerCount = myPendingManagerAdvances.length + myPendingManagerReimbs.length;

  const myPendingFinanceAdvances = myAdvances.filter(a => a.status === 'PENDING_FINANCE' || a.status === 'PENDING_DIRECTOR' || a.status === 'APPROVED');
  const myPendingFinanceReimbs = myReimbursements.filter(r => r.status === 'PENDING_FINANCE' || r.status === 'APPROVED');
  const myPendingFinanceCount = myPendingFinanceAdvances.length + myPendingFinanceReimbs.length;

  const mySettledAdvances = myAdvances.filter(a => a.status === 'SETTLED');

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* KHUSUS PEMOHON: PORTAL & TRACKER STATUS BERJENJANG */}
      {/* ======================================================== */}
      {isStaff && (
        <div className="space-y-6">
          {/* Header Banner Pemohon */}
          <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-xs font-semibold mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                  <span>Portal Akses Pemohon · PT {currentUser.companyId}</span>
                </div>
                <h1 className="text-xl font-bold tracking-tight">
                  Halo, {currentUser.name} ({currentUser.roleLabel})
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Hak akses Anda dikhususkan untuk <strong>membuat pengajuan biaya</strong> dan{' '}
                  <strong>mengetahui alur persetujuan secara transparan</strong> — mulai dari penelaahan oleh Atasan Langsung hingga verifikasi keabsahan dokumen oleh tim Finance.
                </p>
              </div>

              {/* Fast Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                <button
                  onClick={onOpenNewAdvance}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ajukan Kasbon</span>
                </button>
                <button
                  onClick={onOpenNewReimbursement}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Klaim Reimbursement</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards for Pemohon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Kasbon Aktif Saya */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Kasbon Aktif Dipegang</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(myActiveAmount)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>{myActiveAdvances.length} berkas aktif</span>
                <span>·</span>
                <span className="text-emerald-700 font-medium">Siap dipertanggungjawabkan</span>
              </div>
            </div>

            {/* Card 2: Menunggu Atasan */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Menunggu Review Atasan</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {myPendingManagerCount} Pengajuan
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>Tahap 1: Manager Departemen</span>
              </div>
            </div>

            {/* Card 3: Dalam Verifikasi Finance */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Verifikasi &amp; Kasir Finance</span>
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {myPendingFinanceCount} Pengajuan
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>Tahap 2: Menuju pencairan bank</span>
              </div>
            </div>

            {/* Card 4: Selesai Lunas */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Kasbon Selesai &amp; LPJ Lunas</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {mySettledAdvances.length} Transaksi
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>Arsip tuntas</span>
              </div>
            </div>
          </div>

          {/* Dedicated Live Tracking Panel for Applicant */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Pelacakan Status Berjenjang Pengajuan Saya (Atasan &rarr; Finance)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau posisi berkas permohonan Anda secara real-time dan transparan
                </p>
              </div>
              <span className="text-xs font-medium text-slate-500">
                {myAdvances.length + myReimbursements.length} Total Pengajuan Anda
              </span>
            </div>

            {myAdvances.length === 0 && myReimbursements.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Belum ada pengajuan aktif. Klik tombol di atas untuk mengajukan kasbon atau reimbursement pertama Anda.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Advances Tracking Cards */}
                {myAdvances.map(adv => {
                  const statusInfo = getAdvanceStatusInfo(adv.status);
                  const isPendingManager = adv.status === 'PENDING_MANAGER';
                  const isPendingFinance = adv.status === 'PENDING_FINANCE' || adv.status === 'PENDING_DIRECTOR';
                  const isApprovedDisbursed = adv.status === 'APPROVED' || adv.status === 'DISBURSED' || adv.status === 'PENDING_SETTLEMENT' || adv.status === 'SETTLED';
                  const isSettled = adv.status === 'SETTLED';

                  return (
                    <div
                      key={adv.id}
                      className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors bg-slate-50/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-blue-900">
                              {adv.code}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                              Cost Advance PT {adv.companyId}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-800 font-medium mt-1">
                            {adv.purpose}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Nominal</span>
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {formatRupiah(adv.totalAmount)}
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectAdvance(adv.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lacak &amp; Cetak</span>
                          </button>
                        </div>
                      </div>

                      {/* Multi-Step Pipeline Indicator for Applicant */}
                      <div className="pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                          {/* Step 1: Pengajuan */}
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>1. Pengajuan</span>
                            </div>
                            <div className="text-emerald-700 text-[10px] mt-0.5">
                              Diajukan: {formatDateIndo(adv.requestDate)}
                            </div>
                          </div>

                          {/* Step 2: Mengetahui Atasan */}
                          <div
                            className={`p-2.5 rounded-lg border ${
                              isPendingManager
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                                : isPendingFinance || isApprovedDisbursed
                                ? 'bg-emerald-50 border-emerald-200'
                                : adv.status === 'REJECTED'
                                ? 'bg-rose-50 border-rose-200'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                2. Atasan Langsung
                              </span>
                              {isPendingManager ? (
                                <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-bold">
                                  Menunggu
                                </span>
                              ) : isPendingFinance || isApprovedDisbursed ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {isPendingManager
                                ? 'Sedang ditelaah Manager Dept'
                                : isPendingFinance || isApprovedDisbursed
                                ? 'Disetujui oleh Atasan'
                                : 'Menunggu antrean'}
                            </div>
                          </div>

                          {/* Step 3: Verifikasi Finance */}
                          <div
                            className={`p-2.5 rounded-lg border ${
                              isPendingFinance
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                                : isApprovedDisbursed
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                3. Verifikasi Finance
                              </span>
                              {isPendingFinance ? (
                                <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-bold">
                                  Diperiksa
                                </span>
                              ) : isApprovedDisbursed ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {isPendingFinance
                                ? 'Validasi bukti & persiapan kasir'
                                : isApprovedDisbursed
                                ? 'Finance terverifikasi OK'
                                : 'Menunggu tahap atasan'}
                            </div>
                          </div>

                          {/* Step 4: Pencairan / Settlement */}
                          <div
                            className={`p-2.5 rounded-lg border ${
                              isSettled
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : adv.status === 'PENDING_SETTLEMENT' || adv.status === 'DISBURSED'
                                ? 'bg-blue-50 border-blue-300 text-blue-900'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">
                                4. Pencairan Dana
                              </span>
                              {isSettled ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : adv.status === 'PENDING_SETTLEMENT' ? (
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                              ) : null}
                            </div>
                            <div className="text-[10px] mt-0.5">
                              {isSettled
                                ? 'Lunas dipertanggungjawabkan'
                                : adv.status === 'PENDING_SETTLEMENT'
                                ? 'Dana telah cair ke rekening Anda'
                                : 'Menunggu otorisasi finance'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Active Reimbursements Tracking Cards */}
                {myReimbursements.map(rb => {
                  const statusInfo = getReimbursementStatusInfo(rb.status);
                  const isPendingManager = rb.status === 'PENDING_MANAGER';
                  const isPendingFinance = rb.status === 'PENDING_FINANCE';
                  const isPaid = rb.status === 'PAID';

                  return (
                    <div
                      key={rb.id}
                      className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors bg-slate-50/40"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-900">
                              {rb.code}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                              Reimbursement PT {rb.companyId}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-800 font-medium mt-1">
                            {rb.purpose}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Klaim</span>
                            <span className="font-mono text-sm font-bold text-slate-900">
                              {formatRupiah(rb.totalAmount)}
                            </span>
                          </div>
                          <button
                            onClick={() => onSelectReimbursement(rb.id)}
                            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lacak Klaim</span>
                          </button>
                        </div>
                      </div>

                      {/* 3 Steps Pipeline for Reimbursement */}
                      <div className="pt-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                            <div className="flex items-center gap-1 font-bold text-emerald-800">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>1. Pengajuan Klaim</span>
                            </div>
                            <div className="text-[10px] text-emerald-700 mt-0.5">
                              {formatDateIndo(rb.requestDate)} · Struk terlampir
                            </div>
                          </div>

                          <div
                            className={`p-2.5 rounded-lg border ${
                              isPendingManager
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                                : isPendingFinance || isPaid
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">2. Review Atasan</span>
                              {isPendingManager ? (
                                <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-bold">
                                  Menunggu
                                </span>
                              ) : isPendingFinance || isPaid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {isPendingManager ? 'Menunggu persetujuan atasan' : 'Telah disetujui atasan'}
                            </div>
                          </div>

                          <div
                            className={`p-2.5 rounded-lg border ${
                              isPendingFinance
                                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-100'
                                : isPaid
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">3. Pembayaran Finance</span>
                              {isPendingFinance ? (
                                <span className="text-[9px] px-1 py-0.2 bg-amber-500 text-white rounded font-bold">
                                  Verifikasi
                                </span>
                              ) : isPaid ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                              {isPaid ? 'Transfer lunas ke rekening Anda' : 'Pemeriksaan nota asli oleh finance'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Realisasi Anggaran Departemen vs Batas Anggaran Periode Berjalan (Recharts) */}
          <DepartmentBudgetChart
            advances={advances}
            reimbursements={reimbursements}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />

          {/* Tren Pengeluaran Finansial Perusahaan (Tahun Berjalan) */}
          <MonthlyTrendChart
            advances={advances}
            reimbursements={reimbursements}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* KHUSUS ATASAN, FINANCE & DIREKTUR: EXECUTIVE & APPROVAL DASHBOARD */}
      {/* ======================================================== */}
      {!isStaff && (
        <>
          {/* Top 4 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Kasbon Aktif (Outstanding) */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Kasbon Aktif / Berjalan</span>
                <Wallet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(activeAdvanceAmount)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>
                  {filteredAdvances.filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT').length} transaksi
                </span>
                <span>·</span>
                <span>Perlu settlement</span>
              </div>
            </div>

            {/* Card 2: Pengajuan Kasbon Pending */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Kasbon Menunggu Approval</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(pendingAdvanceAmount)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>
                  {filteredAdvances.filter(a => a.status.startsWith('PENDING_')).length} berkas
                </span>
                <span>·</span>
                <span>Dalam antrean review</span>
              </div>
            </div>

            {/* Card 3: Reimbursement Pending */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Klaim Reimbursement Pending</span>
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(unpaidReimbursementAmount)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>
                  {filteredReimbursements.filter(r => r.status !== 'PAID' && r.status !== 'REJECTED').length} klaim
                </span>
                <span>·</span>
                <span>Belum dibayarkan</span>
              </div>
            </div>

            {/* Card 4: Total Kasbon Selesai */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-medium">Kasbon Selesai (Settled)</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {formatRupiah(totalSettledAmount)}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <span>
                  {filteredAdvances.filter(a => a.status === 'SETTLED').length} selesai
                </span>
                <span>·</span>
                <span>Lunas dipertanggungjawabkan</span>
              </div>
            </div>
          </div>

          {/* Action Required by Current User Role */}
          {(itemsNeedingAction.length > 0 || reimbsNeedingAction.length > 0) && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <h3 className="text-sm font-semibold text-blue-950">
                    Antrean Memerlukan Tindakan Anda ({currentUser.roleLabel})
                  </h3>
                </div>
                <span className="text-xs text-blue-700 font-medium">
                  {itemsNeedingAction.length + reimbsNeedingAction.length} Pengajuan Menunggu
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {itemsNeedingAction.map(adv => (
                  <div
                    key={adv.id}
                    onClick={() => onSelectAdvance(adv.id)}
                    className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900 font-mono">{adv.code}</span>
                        <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold">
                          {adv.companyId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{adv.purpose}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pemohon: {adv.applicantName} ({adv.applicantDepartment})
                      </p>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {formatRupiah(adv.totalAmount)}
                      </div>
                      <span className="text-[10px] text-blue-600 font-medium">Review &rarr;</span>
                    </div>
                  </div>
                ))}

                {reimbsNeedingAction.map(rb => (
                  <div
                    key={rb.id}
                    onClick={() => onSelectReimbursement(rb.id)}
                    className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900 font-mono">{rb.code}</span>
                        <span className="text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-semibold">
                          {rb.companyId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">{rb.purpose}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pemohon: {rb.applicantName} ({rb.applicantDepartment})
                      </p>
                    </div>
                    <div className="text-right shrink-0 pl-3">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {formatRupiah(rb.totalAmount)}
                      </div>
                      <span className="text-[10px] text-blue-600 font-medium">Review &rarr;</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Realisasi Anggaran Departemen vs Batas Anggaran Periode Berjalan (Recharts) */}
          <DepartmentBudgetChart
            advances={advances}
            reimbursements={reimbursements}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />

          {/* Monthly Financial Trend Bar Chart (Recharts) */}
          <MonthlyTrendChart
            advances={advances}
            reimbursements={reimbursements}
            selectedCompany={selectedCompany}
            onCompanyChange={setSelectedCompany}
          />

          {/* Two Column Layout: Company Comparison & Operations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Perbandingan Operasional: PT AMS vs PT AMI
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoring beban kasbon gantung dan klaim antar badan usaha
                  </p>
                </div>
                <Building className="w-4 h-4 text-slate-400" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AMS Column */}
                <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                    <div>
                      <span className="text-xs font-bold text-blue-900">PT AMS</span>
                      <div className="text-[11px] text-slate-500">Artha Mandiri Sejahtera</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">
                      {COMPANIES.AMS.primaryBank.split(' ')[1]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Kasbon Aktif:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatRupiah(amsTotalActive)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Pengajuan Kasbon:</span>
                      <span className="font-mono text-slate-700">{amsAdvances.length} Pengajuan</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Klaim Reimbursement:</span>
                      <span className="font-mono text-slate-700">{amsReimbs.length} Klaim</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('advances');
                    }}
                    className="mt-4 w-full py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center"
                  >
                    Lihat Transaksi AMS &rarr;
                  </button>
                </div>

                {/* AMI Column */}
                <div className="border border-emerald-100 bg-emerald-50/30 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                    <div>
                      <span className="text-xs font-bold text-emerald-900">PT AMI</span>
                      <div className="text-[11px] text-slate-500">Anugerah Mitra Industri</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                      {COMPANIES.AMI.primaryBank.split(' ')[0]}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Kasbon Aktif:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatRupiah(amiTotalActive)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Total Pengajuan Kasbon:</span>
                      <span className="font-mono text-slate-700">{amiAdvances.length} Pengajuan</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Klaim Reimbursement:</span>
                      <span className="font-mono text-slate-700">{amiReimbs.length} Klaim</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('advances');
                    }}
                    className="mt-4 w-full py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors text-center"
                  >
                    Lihat Transaksi AMI &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Action Shortcuts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  Aksi Cepat &amp; Dokumen
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                  Pintasan pembuatan voucher dan pencairan biaya
                </p>

                <div className="space-y-2.5">
                  <button
                    onClick={onOpenNewAdvance}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        + Pengajuan Cost Advance
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Permohonan uang muka belanja/site visit
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={onOpenNewReimbursement}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        + Klaim Reimbursement
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Klaim kuitansi BBM, makan, hotel, medis
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    onClick={() => setActiveTab('settlements')}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Pertanggungjawaban Kasbon
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Input realisasi nota &amp; hitung selisih
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="font-medium text-slate-700">Otorisasi Finansial:</span>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Plafon &gt; Rp 15.000.000 membutuhkan approval Direktur Utama. Seluruh bukti nota riil diverifikasi oleh tim Finance sebelum pembayaran ditransfer.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Alert Banner: Overdue Settlement (If Any) */}
      {overdueAdvances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900">
                Peringatan: {overdueAdvances.length} Kasbon Melewati Batas Waktu Settlement (Jatuh Tempo)
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Sesuai kebijakan perusahaan AMS &amp; AMI, kasbon wajib dipertanggungjawabkan maksimal 7 hari kerja setelah kegiatan terlaksana.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {overdueAdvances.map(adv => (
                  <button
                    key={adv.id}
                    onClick={() => onSelectAdvance(adv.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white border border-amber-300 rounded-md text-amber-900 hover:bg-amber-100/50 transition-colors font-medium"
                  >
                    <span>{adv.code}</span>
                    <span className="text-amber-600">({adv.applicantName})</span>
                    <span className="text-amber-500">·</span>
                    <span className="font-mono">{formatRupiah(adv.totalAmount)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Advances & Reimbursements Table Preview */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {isStaff ? 'Daftar Seluruh Pengajuan Perusahaan' : `Transaksi Terkini (${selectedCompany === 'ALL' ? 'AMS & AMI' : selectedCompany})`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStaff
                ? 'Daftar pengajuan aktif untuk referensi kegiatan'
                : 'Daftar pengajuan terbaru yang aktif dalam sistem'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('advances')}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Buka Halaman Cost Advance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                <th className="py-3 px-4">Kode &amp; Entitas</th>
                <th className="py-3 px-4">Tipe &amp; Tujuan</th>
                <th className="py-3 px-4">Pemohon</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4">Status &amp; Posisi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdvances.slice(0, 5).map(adv => {
                const statusInfo = getAdvanceStatusInfo(adv.status);
                const isMine = adv.applicantId === currentUser.id || adv.applicantName.toLowerCase() === currentUser.name.toLowerCase();

                return (
                  <tr
                    key={adv.id}
                    onClick={() => onSelectAdvance(adv.id)}
                    className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                      isMine ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-900">{adv.code}</span>
                        {isMine && (
                          <span className="text-[9px] px-1 bg-blue-600 text-white rounded font-bold">
                            SAYA
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-slate-700">{adv.companyId}</span> · {formatDateIndo(adv.requestDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">{adv.purpose}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {adv.costCenter} · Butuh tgl {formatDateIndo(adv.requiredDate)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-900 font-medium">{adv.applicantName}</div>
                      <div className="text-[11px] text-slate-500">{adv.applicantDepartment}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(adv.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectAdvance(adv.id);
                        }}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium transition-colors"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
