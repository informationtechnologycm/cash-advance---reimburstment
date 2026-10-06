import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatDateIndo, getReimbursementStatusInfo, CATEGORY_LABELS } from '../../utils/formatters';
import { COMPANIES, MOCK_USERS } from '../../data/initialData';
import { ApprovalWorkflowStepper } from '../ApprovalWorkflowStepper';
import { UserRole } from '../../types/finance';
import {
  X,
  Printer,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  UserCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface ReimbursementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  reimbursementId: string | null;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const ReimbursementDetailModal: React.FC<ReimbursementDetailModalProps> = ({
  isOpen,
  onClose,
  reimbursementId,
  onPrintVoucher,
}) => {
  const {
    reimbursements,
    currentUser,
    setCurrentUser,
    users,
    approveReimbursement,
    rejectReimbursement,
    payReimbursement,
  } = useFinance();

  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Payment form
  const [showPayForm, setShowPayForm] = useState(false);
  const [sourceBank, setSourceBank] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  const reimb = reimbursements.find(r => r.id === reimbursementId);

  if (!isOpen || !reimb) return null;

  const statusInfo = getReimbursementStatusInfo(reimb.status);
  const company = COMPANIES[reimb.companyId];

  const canApprove =
    (reimb.status === 'PENDING_MANAGER' &&
      (currentUser.role === 'MANAGER' || currentUser.role === 'DIRECTOR')) ||
    (reimb.status === 'PENDING_FINANCE' &&
      (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR'));

  const canPay =
    reimb.status === 'APPROVED' &&
    (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR');

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await approveReimbursement(reimb.id, approvalNotes || 'Disetujui sesuai nota.');
      setApprovalNotes('');
      setSuccessToast('Klaim reimbursement berhasil disetujui!');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Mohon cantumkan alasan penolakan klaim.');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectReimbursement(reimb.id, rejectReason);
      setRejectReason('');
      setShowRejectInput(false);
      setSuccessToast('Klaim reimbursement telah ditolak.');
      setTimeout(() => setSuccessToast(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await payReimbursement(reimb.id, {
        sourceBank: sourceBank || `${company.primaryBank} (${company.accountNumber})`,
        referenceNumber: referenceNumber || `TRF-${reimb.companyId}-${Date.now().toString().slice(-6)}`,
        notes: approvalNotes || 'Pembayaran klaim reimbursement selesai.',
      });
      setShowPayForm(false);
      setSuccessToast('Pembayaran klaim reimbursement telah tercatat lunas!');
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
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-slate-900">
                {reimb.code}
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  reimb.companyId === 'AMS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                PT {reimb.companyId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klaim Reimbursement · Tanggal {formatDateIndo(reimb.requestDate)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintVoucher('REIMBURSEMENT', reimb.id)}
              className="p-1.5 text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold px-3 shadow-2xs"
              title="Cetak Bukti Pengeluaran Kas Resmi"
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Multi-Level Workflow Stepper */}
          <ApprovalWorkflowStepper
            type="REIMBURSEMENT"
            currentStatus={reimb.status}
            totalAmount={reimb.totalAmount}
            approvalHistory={reimb.approvalHistory}
            rejectionReason={reimb.rejectionReason}
            onSwitchRole={handleSwitchRole}
            currentUserRole={currentUser.role}
          />

          {/* Status & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Status</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                >
                  {statusInfo.label}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Total Nominal Klaim</span>
              <div className="text-lg font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                {formatRupiah(reimb.totalAmount)}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Rekening Tujuan</span>
              <div className="font-mono font-medium text-slate-900 mt-1">
                {reimb.applicantBankAccount.bankName} - {reimb.applicantBankAccount.accountNumber}
              </div>
              <span className="text-[11px] text-slate-400">
                a.n {reimb.applicantBankAccount.accountHolder}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Keperluan Klaim
            </h4>
            <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed font-medium">
              {reimb.purpose}
            </p>
          </div>

          {/* Items / Receipts breakdown */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Daftar Bukti Kuitansi &amp; Nota Terlampir
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Tanggal &amp; Kategori</th>
                    <th className="py-2.5 px-3">Deskripsi Nota</th>
                    <th className="py-2.5 px-3">No. Kuitansi</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reimb.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">
                          {CATEGORY_LABELS[it.category] || it.category}
                        </div>
                        <div className="text-[11px] text-slate-400">{formatDateIndo(it.date)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">{it.description}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {it.receiptNumber || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(it.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-slate-900 border-t border-slate-200">
                    <td colSpan={3} className="py-2.5 px-3 text-right">
                      Total Reimbursement:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm tabular-nums">
                      {formatRupiah(reimb.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment receipt details if already paid */}
          {reimb.paymentDetails && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
              <span className="font-bold block text-xs">Konfirmasi Pembayaran Lunas</span>
              <div className="mt-1 text-[11px] space-y-0.5">
                <div>Tanggal Pembayaran: {formatDateIndo(reimb.paymentDetails.paidDate)}</div>
                <div>Sumber Rekening: {reimb.paymentDetails.sourceBank}</div>
                <div>No. Referensi: {reimb.paymentDetails.referenceNumber}</div>
                <div>Diproses Oleh: {reimb.paymentDetails.paidBy}</div>
              </div>
            </div>
          )}

          {/* Approval History */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Riwayat Persetujuan
            </h4>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              {reimb.approvalHistory.map((entry, idx) => (
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
                      {entry.action}
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

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            {canApprove ? (
              <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-blue-950 text-xs">
                      Persetujuan Klaim sebagai {currentUser.roleLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-blue-700 font-medium">
                    Pengguna Aktif: {currentUser.name}
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Catatan approval klaim (opsional)..."
                  value={approvalNotes}
                  onChange={e => setApprovalNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={isProcessing}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-100/60 rounded-lg transition-colors border border-rose-200 flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Klaim</span>
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isProcessing ? 'Memproses...' : 'Setujui Klaim (Approve)'}</span>
                  </button>
                </div>

                {showRejectInput && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-rose-200 space-y-2">
                    <span className="text-xs font-bold text-rose-900 block">
                      Alasan Penolakan Klaim:
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan alasan penolakan..."
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
                        {isProcessing ? 'Memproses...' : 'Konfirmasi Tolak'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : currentUser.role === 'STAFF' ? (
              /* Dedicated Pemohon Tracking Card */
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-bold text-xs text-emerald-950">
                    Pelacakan Status Berjenjang untuk Pemohon ({currentUser.name})
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Sebagai <strong>Pemohon</strong>, Anda berwenang mengajukan klaim dan <strong>mengetahui alur pemeriksaan</strong> dari Atasan Langsung hingga verifikasi keabsahan kuitansi oleh tim Finance. Status klaim saat ini: <strong className="text-emerald-900">{statusInfo.label}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-emerald-200/60">
                  <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>
                      {reimb.status === 'PENDING_MANAGER'
                        ? 'Menunggu Review & Persetujuan Atasan Langsung (Manager Departemen)'
                        : reimb.status === 'PENDING_FINANCE'
                        ? 'Menunggu Verifikasi Bukti Riil & Kuitansi oleh Tim Finance'
                        : reimb.status === 'APPROVED'
                        ? 'Disetujui, dalam antrean transfer pembayaran ke rekening Anda'
                        : reimb.status === 'PAID'
                        ? 'Klaim telah dibayarkan / transfer lunas ke rekening Anda'
                        : 'Klaim ditolak atau memerlukan revisi'}
                    </span>
                  </div>
                  <button
                    onClick={() => onPrintVoucher('REIMBURSEMENT', reimb.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 shadow-2xs shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Bukti Klaim</span>
                  </button>
                </div>
              </div>
            ) : reimb.status === 'PENDING_MANAGER' || reimb.status === 'PENDING_FINANCE' ? (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-slate-600">
                  <span>Dokumen sedang menunggu pada tingkat </span>
                  <strong className="text-slate-900">{statusInfo.label}</strong>.
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Peran Anda saat ini adalah <strong>{currentUser.roleLabel}</strong>.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {reimb.status === 'PENDING_MANAGER' && (
                    <button
                      onClick={() => handleSwitchRole('MANAGER')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ganti ke Manager (Atasan)</span>
                    </button>
                  )}
                  {reimb.status === 'PENDING_FINANCE' && (
                    <button
                      onClick={() => handleSwitchRole('FINANCE')}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Ganti ke Finance</span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {canPay && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-emerald-950 text-xs block">
                  Pembayaran Reimbursement ke Karyawan
                </span>

                {!showPayForm ? (
                  <button
                    onClick={() => setShowPayForm(true)}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Catat Pembayaran / Transfer Lunas</span>
                  </button>
                ) : (
                  <form onSubmit={handlePay} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-slate-600 block mb-1">Rekening Kas/Bank Pembayar</span>
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
                        <span className="text-[11px] text-slate-600 block mb-1">No. Referensi Transfer</span>
                        <input
                          type="text"
                          required
                          placeholder="TRF-PAY-202610-881"
                          value={referenceNumber}
                          onChange={e => setReferenceNumber(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPayForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-emerald-100 rounded-lg"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
                      >
                        {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran Lunas'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
