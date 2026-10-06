import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatDateIndo, getAdvanceStatusInfo, CATEGORY_LABELS } from '../../utils/formatters';
import { COMPANIES, MOCK_USERS } from '../../data/initialData';
import { ApprovalWorkflowStepper } from '../ApprovalWorkflowStepper';
import { UserRole } from '../../types/finance';
import {
  X,
  Printer,
  CheckCircle,
  XCircle,
  CreditCard,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Check,
  MessageSquare,
} from 'lucide-react';

interface AdvanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  advanceId: string | null;
  onOpenSettlement: (advanceId: string) => void;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const AdvanceDetailModal: React.FC<AdvanceDetailModalProps> = ({
  isOpen,
  onClose,
  advanceId,
  onOpenSettlement,
  onPrintVoucher,
}) => {
  const {
    advances,
    currentUser,
    setCurrentUser,
    users,
    approveCostAdvance,
    rejectCostAdvance,
    disburseCostAdvance,
  } = useFinance();

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Disbursement inputs
  const [showDisburseForm, setShowDisburseForm] = useState(false);
  const [sourceBank, setSourceBank] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const advance = advances.find(a => a.id === advanceId);

  if (!isOpen || !advance) return null;

  const statusInfo = getAdvanceStatusInfo(advance.status);
  const company = COMPANIES[advance.companyId];

  // Determine permissions based on current role
  const canApproveManager =
    advance.status === 'PENDING_MANAGER' &&
    (currentUser.role === 'MANAGER' || currentUser.role === 'DIRECTOR');

  const canApproveFinance =
    advance.status === 'PENDING_FINANCE' &&
    (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR');

  const canApproveDirector =
    advance.status === 'PENDING_DIRECTOR' && currentUser.role === 'DIRECTOR';

  const canDisburse =
    advance.status === 'APPROVED' &&
    (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR');

  const canTakeAction = canApproveManager || canApproveFinance || canApproveDirector;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveCostAdvance(advance.id, approvalNotes || 'Disetujui sesuai prosedur operasional.');
      setApprovalNotes('');
      setSuccessToast('Pengajuan kasbon berhasil disetujui!');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan.');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectCostAdvance(advance.id, rejectReason);
      setRejectReason('');
      setShowRejectInput(false);
      setSuccessToast('Pengajuan kasbon telah ditolak.');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await disburseCostAdvance(advance.id, {
        sourceBank: sourceBank || `${company.primaryBank} (${company.accountNumber})`,
        referenceNumber: referenceNumber || `TRF-${advance.companyId}-${Date.now().toString().slice(-6)}`,
        notes: approvalNotes || 'Pencairan dana kasbon selesai.',
      });
      setShowDisburseForm(false);
      setSuccessToast('Dana kasbon berhasil dicairkan!');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchRole = (targetRole: UserRole) => {
    const match = users.find(u => u.role === targetRole);
    if (match) {
      setCurrentUser(match);
      setSuccessToast(`Beralih peran ke: ${match.name} (${match.roleLabel})`);
      setTimeout(() => setSuccessToast(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-slate-900">
                  {advance.code}
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-xs ${
                    advance.companyId === 'AMS'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  PT {advance.companyId}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengajuan Cost Advance · Dibuat {formatDateIndo(advance.requestDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintVoucher('ADVANCE', advance.id)}
              className="p-1.5 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 shadow-2xs"
              title="Cetak Bukti Kas Keluar Resmi"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 py-2 px-6 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Multi-Level Approval Workflow Stepper Indicator */}
          <ApprovalWorkflowStepper
            type="ADVANCE"
            currentStatus={advance.status}
            totalAmount={advance.totalAmount}
            approvalHistory={advance.approvalHistory}
            rejectionReason={advance.rejectionReason}
            onSwitchRole={handleSwitchRole}
            currentUserRole={currentUser.role}
          />

          {/* Top Status & Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Status Dokumen</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                >
                  {statusInfo.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{statusInfo.description}</p>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Total Nilai Kasbon</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                {formatRupiah(advance.totalAmount)}
              </div>
              <span className="text-[11px] text-slate-500">
                Metode: {advance.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Kas Kecil'}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Batas Waktu Settlement</span>
              <div className="font-semibold text-slate-900 mt-1">
                {formatDateIndo(advance.settlementDeadlineDate)}
              </div>
              <span className="text-[11px] text-slate-400">
                (Maks. 7 hari setelah kegiatan: {formatDateIndo(advance.requiredDate)})
              </span>
            </div>
          </div>

          {/* Applicant & Target Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Data Pemohon
              </span>
              <div className="font-bold text-slate-900 text-sm">{advance.applicantName}</div>
              <div className="text-slate-600">Jabatan: {advance.jobTitle}</div>
              <div className="text-slate-600">Departemen: {advance.applicantDepartment}</div>
              <div className="text-slate-500 font-mono text-[11px]">Cost Center: {advance.costCenter}</div>
            </div>

            <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Rekening Penerima Kasbon
              </span>
              <div className="font-bold text-slate-900 font-mono text-sm">
                {advance.applicantBankAccount.bankName} · {advance.applicantBankAccount.accountNumber}
              </div>
              <div className="text-slate-600">a.n {advance.applicantBankAccount.accountHolder}</div>
              {advance.disbursementDetails && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-emerald-700">
                  <strong>Dicairkan:</strong> {formatDateIndo(advance.disbursementDetails.disbursedDate)} via{' '}
                  {advance.disbursementDetails.sourceBank} (Ref: {advance.disbursementDetails.referenceNumber})
                </div>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tujuan Penggunaan Dana
            </h4>
            <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs leading-relaxed font-medium">
              {advance.purpose}
            </p>
          </div>

          {/* Items breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Rincian Item Anggaran Kasbon
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Deskripsi Kebutuhan</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advance.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {CATEGORY_LABELS[it.category] || it.category}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">{it.description}</td>
                      <td className="py-2.5 px-3 text-center font-mono">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {formatRupiah(it.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(it.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-slate-900 border-t border-slate-200">
                    <td colSpan={4} className="py-2.5 px-3 text-right">
                      Total Anggaran Kasbon:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm tabular-nums">
                      {formatRupiah(advance.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval History / Audit Trail */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Jejak Audit &amp; Persetujuan (Workflow)
            </h4>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              {advance.approvalHistory.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {entry.actorName} ({entry.actorRoleLabel})
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{entry.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium uppercase mt-0.5">
                      Tindakan: {entry.action}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-600 mt-0.5 text-[11px] italic bg-white p-2 rounded border border-slate-100">
                        &quot;{entry.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Interactive Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {/* Action Bar for Manager, Finance, or Director */}
            {canTakeAction ? (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-blue-950 text-xs">
                      Persetujuan Dokumen: Anda Bertindak sebagai {currentUser.roleLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium">
                    Pengguna Aktif: {currentUser.name}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tulis catatan atau memo persetujuan (opsional)..."
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 rounded-lg transition-colors border border-rose-200 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Permohonan</span>
                  </button>

                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isProcessing ? 'Memproses...' : 'Setujui Permohonan (Approve)'}</span>
                  </button>
                </div>

                {showRejectInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 space-y-2">
                    <span className="text-xs font-bold text-rose-900 block">
                      Konfirmasi Penolakan Pengajuan:
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan alasan penolakan atau revisi yang wajib diperbaiki..."
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-rose-300 rounded-lg focus:outline-none text-rose-900"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                      >
                        {isProcessing ? 'Memproses...' : 'Kirim Penolakan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentUser.role === 'STAFF' ? (
              /* Dedicated Pemohon Tracking Card */
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-bold text-xs text-blue-950">
                    Pelacakan Status Berjenjang untuk Pemohon ({currentUser.name})
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Sesuai detail hak akses, sebagai <strong>Pemohon</strong> Anda berwenang mengajukan dan <strong>mengetahui secara transparan</strong> alur persetujuan dokumen Anda dari Atasan Langsung hingga verifikasi Finance. Dokumen ini saat ini berstatus: <strong className="text-blue-900">{statusInfo.label}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-blue-200/60">
                  <div className="text-[11px] text-blue-800 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>
                      {advance.status === 'PENDING_MANAGER'
                        ? 'Menunggu Review & Persetujuan Atasan Langsung (Manager Departemen)'
                        : advance.status === 'PENDING_FINANCE'
                        ? 'Menunggu Verifikasi & Validasi Dokumen oleh Tim Finance'
                        : advance.status === 'PENDING_DIRECTOR'
                        ? 'Menunggu Otorisasi Direktur Utama (> Rp 15 Jt)'
                        : advance.status === 'APPROVED'
                        ? 'Disetujui penuh, menunggu pencairan dana oleh kasir'
                        : advance.status === 'PENDING_SETTLEMENT' || advance.status === 'DISBURSED'
                        ? 'Dana telah dicairkan ke rekening Anda'
                        : advance.status === 'SETTLED'
                        ? 'Pertanggungjawaban (LPJ) telah diverifikasi & selesai'
                        : 'Permohonan ditolak/perlu revisi'}
                    </span>
                  </div>
                  <button
                    onClick={() => onPrintVoucher('ADVANCE', advance.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Slip / Voucher</span>
                  </button>
                </div>
              </div>
            ) : advance.status === 'PENDING_MANAGER' || advance.status === 'PENDING_FINANCE' || advance.status === 'PENDING_DIRECTOR' ? (
              /* If manager/finance/director looking at other stages, show simulation options */
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-600">
                  <span>Dokumen sedang menunggu persetujuan pada tingkat </span>
                  <strong className="text-slate-900">{statusInfo.label}</strong>.
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Peran Anda saat ini adalah <strong>{currentUser.roleLabel}</strong>.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {advance.status === 'PENDING_MANAGER' && (
                    <button
                      onClick={() => handleSwitchRole('MANAGER')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ganti ke Manager (Atasan)</span>
                    </button>
                  )}
                  {advance.status === 'PENDING_FINANCE' && (
                    <button
                      onClick={() => handleSwitchRole('FINANCE')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ganti ke Finance</span>
                    </button>
                  )}
                  {advance.status === 'PENDING_DIRECTOR' && (
                    <button
                      onClick={() => handleSwitchRole('DIRECTOR')}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-white border border-purple-300 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ganti ke Direktur</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* If approved and ready for Finance disbursement */}
            {canDisburse && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs">
                    Pencairan Dana Kasbon (Kasir / Finance)
                  </span>
                  <span className="text-[11px] text-emerald-800 font-mono font-bold">
                    Nominal: {formatRupiah(advance.totalAmount)}
                  </span>
                </div>

                {!showDisburseForm ? (
                  <button
                    onClick={() => setShowDisburseForm(true)}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Proses Pencairan Dana (Disburse)</span>
                  </button>
                ) : (
                  <form onSubmit={handleDisburse} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Rekening Sumber Perusahaan</span>
                        <input
                          type="text"
                          required
                          placeholder={`${company.primaryBank} (${company.accountNumber})`}
                          value={sourceBank}
                          onChange={e => setSourceBank(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">No. Referensi Bank / Voucher</span>
                        <input
                          type="text"
                          required
                          placeholder="TRF-AMS-202610-001"
                          value={referenceNumber}
                          onChange={e => setReferenceNumber(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDisburseForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-emerald-100 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                      >
                        {isProcessing ? 'Memproses...' : 'Konfirmasi Dana Telah Ditransfer'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* If disbursed / active and needs settlement */}
            {(advance.status === 'PENDING_SETTLEMENT' || advance.status === 'DISBURSED') && (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-800 text-xs block">
                    Kasbon Aktif Sedang Berjalan
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Batas waktu settlement: {formatDateIndo(advance.settlementDeadlineDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPrintVoucher('ADVANCE', advance.id)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Print Slip BKK</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSettlement(advance.id);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Buat Settlement Sekarang &rarr;
                  </button>
                </div>
              </div>
            )}

            {advance.status === 'SETTLED' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs block">Kasbon Selesai &amp; Lunas</span>
                  <span className="text-[11px] text-emerald-700">
                    Seluruh nota telah dipertanggungjawabkan dan ditutup oleh Finance.
                  </span>
                </div>
                <button
                  onClick={() => onPrintVoucher('ADVANCE', advance.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100/50 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Arsip BKK</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
