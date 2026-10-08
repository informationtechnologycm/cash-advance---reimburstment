import React, { useState } from 'react';
import {
  AdvanceStatus,
  ReimbursementStatus,
  UserRole,
  ApprovalHistoryEntry,
} from '../../types/finance';
import {
  CheckCircle2,
  Clock,
  XCircle,
  MinusCircle,
  UserCheck,
  ShieldCheck,
  Building,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  History,
  Calendar,
  User,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface StageApprovalInfo {
  stageId: string;
  stageNumber: number;
  stageName: string;
  stageDescription: string;
  requiredRole: UserRole;
  requiredRoleLabel: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'UPCOMING' | 'SKIPPED';
  statusLabel: string;
  approverName?: string;
  approverRoleLabel?: string;
  timestamp?: string;
  notes?: string;
  action?: string;
}

export interface ApprovalHistoryProps {
  type: 'ADVANCE' | 'REIMBURSEMENT';
  currentStatus: AdvanceStatus | ReimbursementStatus;
  totalAmount: number;
  approvalHistory: ApprovalHistoryEntry[];
  applicantName?: string;
  rejectionReason?: string;
  disbursementDetails?: {
    disbursedDate?: string;
    disbursedBy?: string;
    sourceBank?: string;
    referenceNumber?: string;
  };
  paymentDetails?: {
    paidDate?: string;
    paidBy?: string;
    sourceBank?: string;
    referenceNumber?: string;
  };
}

export const ApprovalHistory: React.FC<ApprovalHistoryProps> = ({
  type,
  currentStatus,
  totalAmount,
  approvalHistory = [],
  applicantName,
  rejectionReason,
  disbursementDetails,
  paymentDetails,
}) => {
  const [activeView, setActiveView] = useState<'stages' | 'log'>('stages');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  const isHighValue = totalAmount > 15000000;

  // Derive stage-by-stage progression
  const buildStages = (): StageApprovalInfo[] => {
    const stages: StageApprovalInfo[] = [];

    // Stage 1: Submission / Pengajuan
    const submitEntry = approvalHistory.find(h => h.action === 'SUBMITTED');
    stages.push({
      stageId: 'stage-submission',
      stageNumber: 1,
      stageName: type === 'ADVANCE' ? 'Pengajuan Kasbon' : 'Pengajuan Klaim Reimbursement',
      stageDescription: 'Pemohon membuat dan mengajukan permohonan ke sistem',
      requiredRole: 'STAFF',
      requiredRoleLabel: 'Staff Pemohon',
      status: 'APPROVED',
      statusLabel: 'Diajukan',
      approverName: submitEntry?.actorName || applicantName || 'Staff Pemohon',
      approverRoleLabel: submitEntry?.actorRoleLabel || 'Pemohon',
      timestamp: submitEntry?.timestamp || '-',
      notes: submitEntry?.notes || 'Permohonan berhasil diajukan dan masuk antrean persetujuan.',
      action: 'SUBMITTED',
    });

    // Stage 2: Manager Approval
    const managerApproved = approvalHistory.find(
      h => h.action === 'APPROVED' && (h.actorRole === 'MANAGER' || h.actorRole === 'DIRECTOR')
    );
    const managerRejected = approvalHistory.find(
      h => h.action === 'REJECTED' && h.actorRole === 'MANAGER'
    );
    const isPendingManager = currentStatus === 'PENDING_MANAGER';

    let managerStatus: StageApprovalInfo['status'] = 'UPCOMING';
    let managerStatusLabel = 'Belum Dimulai';

    if (managerRejected || (currentStatus === 'REJECTED' && managerRejected)) {
      managerStatus = 'REJECTED';
      managerStatusLabel = 'Ditolak Manager';
    } else if (managerApproved) {
      managerStatus = 'APPROVED';
      managerStatusLabel = 'Disetujui';
    } else if (isPendingManager) {
      managerStatus = 'PENDING';
      managerStatusLabel = 'Menunggu Persetujuan';
    }

    stages.push({
      stageId: 'stage-manager',
      stageNumber: 2,
      stageName: 'Persetujuan Manager Departemen',
      stageDescription: 'Evaluasi kesesuaian operasional dan anggaran departemen',
      requiredRole: 'MANAGER',
      requiredRoleLabel: 'Manager Departemen',
      status: managerStatus,
      statusLabel: managerStatusLabel,
      approverName: managerApproved?.actorName || managerRejected?.actorName || (isPendingManager ? 'Menunggu Review Manager' : '-'),
      approverRoleLabel: managerApproved?.actorRoleLabel || managerRejected?.actorRoleLabel || 'Manager',
      timestamp: managerApproved?.timestamp || managerRejected?.timestamp || (isPendingManager ? 'Dalam Proses' : '-'),
      notes: managerRejected?.notes || managerApproved?.notes || (isPendingManager ? 'Dokumen sedang ditinjau oleh Manager Departemen.' : undefined),
      action: managerRejected ? 'REJECTED' : managerApproved ? 'APPROVED' : undefined,
    });

    // Stage 3: Finance Verification
    const financeApproved = approvalHistory.find(
      h => h.action === 'APPROVED' && h.actorRole === 'FINANCE'
    );
    const financeRejected = approvalHistory.find(
      h => h.action === 'REJECTED' && h.actorRole === 'FINANCE'
    );
    const isPendingFinance = currentStatus === 'PENDING_FINANCE';

    let financeStatus: StageApprovalInfo['status'] = 'UPCOMING';
    let financeStatusLabel = 'Belum Dimulai';

    if (financeRejected) {
      financeStatus = 'REJECTED';
      financeStatusLabel = 'Ditolak Finance';
    } else if (financeApproved) {
      financeStatus = 'APPROVED';
      financeStatusLabel = 'Diverifikasi & Disetujui';
    } else if (isPendingFinance) {
      financeStatus = 'PENDING';
      financeStatusLabel = 'Menunggu Verifikasi Finance';
    }

    stages.push({
      stageId: 'stage-finance',
      stageNumber: 3,
      stageName: 'Verifikasi & Audit Finance',
      stageDescription: 'Pemeriksaan keabsahan dokumen, nomor akun COA, perpajakan, dan kelayakan biaya',
      requiredRole: 'FINANCE',
      requiredRoleLabel: 'Finance & Tax Officer',
      status: financeStatus,
      statusLabel: financeStatusLabel,
      approverName: financeApproved?.actorName || financeRejected?.actorName || (isPendingFinance ? 'Menunggu Tim Finance' : '-'),
      approverRoleLabel: financeApproved?.actorRoleLabel || financeRejected?.actorRoleLabel || 'Finance & Accounting',
      timestamp: financeApproved?.timestamp || financeRejected?.timestamp || (isPendingFinance ? 'Dalam Proses' : '-'),
      notes: financeRejected?.notes || financeApproved?.notes || (isPendingFinance ? 'Dokumen dalam proses audit kelayakan oleh Finance.' : undefined),
      action: financeRejected ? 'REJECTED' : financeApproved ? 'APPROVED' : undefined,
    });

    // Stage 4: Director Approval (Required if > 15,000,000 IDR)
    const directorApproved = approvalHistory.find(
      h => h.action === 'APPROVED' && h.actorRole === 'DIRECTOR'
    );
    const directorRejected = approvalHistory.find(
      h => h.action === 'REJECTED' && h.actorRole === 'DIRECTOR'
    );
    const isPendingDirector = (currentStatus as string) === 'PENDING_DIRECTOR';

    let directorStatus: StageApprovalInfo['status'] = 'UPCOMING';
    let directorStatusLabel = 'Belum Dimulai';

    if (!isHighValue) {
      directorStatus = 'SKIPPED';
      directorStatusLabel = 'Tidak Diperlukan (≤ Rp 15 Juta)';
    } else if (directorRejected) {
      directorStatus = 'REJECTED';
      directorStatusLabel = 'Ditolak Direktur Utama';
    } else if (directorApproved) {
      directorStatus = 'APPROVED';
      directorStatusLabel = 'Disetujui Direktur Utama';
    } else if (isPendingDirector) {
      directorStatus = 'PENDING';
      directorStatusLabel = 'Menunggu Persetujuan Direktur Utama';
    }

    stages.push({
      stageId: 'stage-director',
      stageNumber: 4,
      stageName: 'Persetujuan Direktur Utama',
      stageDescription: isHighValue
        ? 'Wajib untuk transaksi nominal tinggi (> Rp 15.000.000)'
        : 'Otomatis dilewati karena transaksi berada di bawah ambang batas Rp 15.000.000',
      requiredRole: 'DIRECTOR',
      requiredRoleLabel: 'Direktur Utama',
      status: directorStatus,
      statusLabel: directorStatusLabel,
      approverName: !isHighValue
        ? 'Tidak Diperlukan (Auto Bypass)'
        : directorApproved?.actorName || directorRejected?.actorName || (isPendingDirector ? 'Menunggu Direktur Utama' : '-'),
      approverRoleLabel: !isHighValue ? 'Sistem' : 'Direktur Utama',
      timestamp: directorApproved?.timestamp || directorRejected?.timestamp || (!isHighValue ? 'Otomatis Dilewati' : isPendingDirector ? 'Dalam Proses' : '-'),
      notes: !isHighValue
        ? 'Transaksi <= Rp 15 Jt tidak memerlukan eskalasi persetujuan Direktur Utama.'
        : directorRejected?.notes || directorApproved?.notes || (isPendingDirector ? 'Menunggu review otorisasi Direktur Utama.' : undefined),
      action: directorRejected ? 'REJECTED' : directorApproved ? 'APPROVED' : undefined,
    });

    // Stage 5: Disbursement / Payment
    if (type === 'ADVANCE') {
      const advStatus = currentStatus as AdvanceStatus;
      const isDisbursed = ['DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(advStatus);
      const isApprovedForDisbursement = advStatus === 'APPROVED';

      const disbHistory = approvalHistory.find(h => h.action === 'DISBURSED');

      let disbStatus: StageApprovalInfo['status'] = 'UPCOMING';
      let disbLabel = 'Belum Dimulai';

      if (isDisbursed) {
        disbStatus = 'APPROVED';
        disbLabel = 'Dana Kasbon Dicairkan';
      } else if (isApprovedForDisbursement) {
        disbStatus = 'PENDING';
        disbLabel = 'Siap Dicairkan Kasir';
      }

      stages.push({
        stageId: 'stage-disbursement',
        stageNumber: 5,
        stageName: 'Pencairan Kasbon (Disbursement)',
        stageDescription: 'Penyaluran dana transfer/tunai dari rekening operasional perusahaan ke pemohon',
        requiredRole: 'FINANCE',
        requiredRoleLabel: 'Finance Kasir / Treasury',
        status: disbStatus,
        statusLabel: disbLabel,
        approverName: disbursementDetails?.disbursedBy || disbHistory?.actorName || (isApprovedForDisbursement ? 'Siap Diproses Kasir' : '-'),
        approverRoleLabel: 'Finance Treasury',
        timestamp: disbursementDetails?.disbursedDate || disbHistory?.timestamp || (isApprovedForDisbursement ? 'Menunggu Penjadwalan Transfer' : '-'),
        notes: disbursementDetails
          ? `Transfer via ${disbursementDetails.sourceBank || 'Kas Operasional'} (Ref: ${disbursementDetails.referenceNumber || 'TRF-OK'})`
          : disbHistory?.notes || (isApprovedForDisbursement ? 'Seluruh persetujuan lengkap. Menunggu pencairan kasir.' : undefined),
        action: isDisbursed ? 'DISBURSED' : undefined,
      });

      // Stage 6: Settlement LPJ
      const isSettled = advStatus === 'SETTLED';
      const isPendingSettlement = advStatus === 'PENDING_SETTLEMENT';
      const settleHistory = approvalHistory.find(h => h.action === 'SETTLED');

      let settleStatus: StageApprovalInfo['status'] = 'UPCOMING';
      let settleLabel = 'Belum Dimulai';

      if (isSettled) {
        settleStatus = 'APPROVED';
        settleLabel = 'Pertanggungjawaban Selesai (Settled)';
      } else if (isPendingSettlement) {
        settleStatus = 'PENDING';
        settleLabel = 'Menunggu LPJ / Settlement';
      }

      stages.push({
        stageId: 'stage-settlement',
        stageNumber: 6,
        stageName: 'Pertanggungjawaban Kasbon (Settlement LPJ)',
        stageDescription: 'Rekonsiliasi nota riil pengeluaran vs penerimaan kasbon maks 7 hari kerja',
        requiredRole: 'STAFF',
        requiredRoleLabel: 'Pemohon & Finance',
        status: settleStatus,
        statusLabel: settleLabel,
        approverName: settleHistory?.actorName || (isPendingSettlement ? 'Menunggu Pengajuan LPJ Pemohon' : '-'),
        approverRoleLabel: 'Pemohon / Finance',
        timestamp: settleHistory?.timestamp || (isPendingSettlement ? 'Batas Waktu Settlement Aktif' : '-'),
        notes: settleHistory?.notes || (isPendingSettlement ? 'Kasbon telah cair. Harap unggah LPJ dan bukti kuitansi riil.' : undefined),
        action: isSettled ? 'SETTLED' : undefined,
      });
    } else {
      // Reimbursement payment stage
      const reimbStatus = currentStatus as ReimbursementStatus;
      const isPaid = reimbStatus === 'PAID';
      const isApprovedForPayment = reimbStatus === 'APPROVED';
      const payHistory = approvalHistory.find(h => h.action === 'PAID');

      let payStatus: StageApprovalInfo['status'] = 'UPCOMING';
      let payLabel = 'Belum Dimulai';

      if (isPaid) {
        payStatus = 'APPROVED';
        payLabel = 'Lunas Ditransfer';
      } else if (isApprovedForPayment) {
        payStatus = 'PENDING';
        payLabel = 'Siap Ditransfer Kasir';
      }

      stages.push({
        stageId: 'stage-payment',
        stageNumber: 5,
        stageName: 'Pembayaran Penggantian (Transfer)',
        stageDescription: 'Transfer dana penggantian ke nomor rekening pemohon',
        requiredRole: 'FINANCE',
        requiredRoleLabel: 'Finance Kasir / Treasury',
        status: payStatus,
        statusLabel: payLabel,
        approverName: paymentDetails?.paidBy || payHistory?.actorName || (isApprovedForPayment ? 'Siap Ditransfer Finance' : '-'),
        approverRoleLabel: 'Finance Treasury',
        timestamp: paymentDetails?.paidDate || payHistory?.timestamp || (isApprovedForPayment ? 'Menunggu Eksekusi Transfer' : '-'),
        notes: paymentDetails
          ? `Lunas ditransfer via ${paymentDetails.sourceBank || 'Bank Utama'} (Ref: ${paymentDetails.referenceNumber || 'TRF-REIMB'})`
          : payHistory?.notes || (isApprovedForPayment ? 'Semua verifikasi rampung. Menunggu transfer kasir.' : undefined),
        action: isPaid ? 'PAID' : undefined,
      });
    }

    return stages;
  };

  const stages = buildStages();

  // Calculate metrics
  const activeStages = stages.filter(s => s.status !== 'SKIPPED');
  const completedStagesCount = activeStages.filter(s => s.status === 'APPROVED').length;
  const totalRelevantStages = activeStages.length;
  const isRejected = stages.some(s => s.status === 'REJECTED') || currentStatus === 'REJECTED';

  const getStatusBadge = (status: StageApprovalInfo['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Disetujui
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Proses
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Ditolak
          </span>
        );
      case 'SKIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
            Dilewati (≤ 15 Jt)
          </span>
        );
      case 'UPCOMING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Belum Dimulai
          </span>
        );
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'DIRECTOR':
        return <Building className="w-4 h-4 text-purple-600" />;
      case 'FINANCE':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'MANAGER':
        return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'STAFF':
      default:
        return <UserCheck className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Riwayat Persetujuan Berjenjang (Approval History)
              {isRejected ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200">
                  Ditolak
                </span>
              ) : completedStagesCount === totalRelevantStages ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Lengkap ({completedStagesCount}/{totalRelevantStages})
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Tahap {completedStagesCount + 1} dari {totalRelevantStages}
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Jejak otorisasi lengkap setiap tahap persetujuan dan verifikasi dokumen keuangan
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('stages')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'stages'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tahapan Approval ({stages.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveView('log')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeView === 'log'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Log Audit</span>
            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold">
              {approvalHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* Rejection Alert if present */}
      {isRejected && (
        <div className="p-3.5 bg-rose-50 border-b border-rose-200 text-rose-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold">Pengajuan Tidak Disetujui / Ditolak</span>
            <p className="mt-0.5 text-rose-700">
              {rejectionReason || 'Alasan penolakan telah tercatat pada riwayat audit di bawah.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Body */}
      <div className="p-4">
        {activeView === 'stages' ? (
          /* Stage by stage detailed breakdown */
          <div className="space-y-3">
            {stages.map(st => {
              const isExpanded = expandedStage === st.stageId;
              const hasNotes = Boolean(st.notes);

              let cardBg = 'bg-slate-50/70 border-slate-200';
              if (st.status === 'APPROVED') cardBg = 'bg-emerald-50/30 border-emerald-200/80';
              if (st.status === 'PENDING') cardBg = 'bg-amber-50/40 border-amber-300';
              if (st.status === 'REJECTED') cardBg = 'bg-rose-50/40 border-rose-200';
              if (st.status === 'SKIPPED') cardBg = 'bg-slate-50/40 border-slate-200 opacity-75';

              return (
                <div
                  key={st.stageId}
                  className={`border rounded-xl transition-all overflow-hidden ${cardBg}`}
                >
                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Step Number Circle */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          st.status === 'APPROVED'
                            ? 'bg-emerald-600 text-white'
                            : st.status === 'PENDING'
                            ? 'bg-amber-500 text-white'
                            : st.status === 'REJECTED'
                            ? 'bg-rose-600 text-white'
                            : st.status === 'SKIPPED'
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {st.stageNumber}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{st.stageName}</span>
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                            {getRoleIcon(st.requiredRole)}
                            {st.requiredRoleLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {st.stageDescription}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {getStatusBadge(st.status)}

                      {hasNotes && (
                        <button
                          type="button"
                          onClick={() => setExpandedStage(isExpanded ? null : st.stageId)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                          title="Lihat detail catatan"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stage Approver & Timestamp Info Bar */}
                  <div className="px-3.5 py-2 bg-white/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-1.5 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">Nama Approver / Aktor:</span>
                      <span
                        className={
                          st.approverName && st.approverName !== '-'
                            ? 'font-medium text-slate-900'
                            : 'text-slate-400 italic'
                        }
                      >
                        {st.approverName || '-'}
                      </span>
                      {st.approverRoleLabel && st.approverName && st.approverName !== '-' && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {st.approverRoleLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">Waktu Eksekusi:</span>
                      <span className="font-mono text-slate-800">{st.timestamp || '-'}</span>
                    </div>
                  </div>

                  {/* Notes / Comments Section */}
                  {(isExpanded || (st.status === 'REJECTED' && st.notes)) && st.notes && (
                    <div className="px-3.5 py-2.5 bg-slate-100/60 border-t border-slate-100 text-[11px] text-slate-700">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900">Catatan Otorisasi:</span>
                          <p className="mt-0.5 italic text-slate-700 font-sans">&quot;{st.notes}&quot;</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Chronological Audit Log */
          <div className="space-y-3">
            {approvalHistory.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Belum ada log riwayat tersimpan.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {approvalHistory.map((item, idx) => {
                  let badgeColor = 'bg-blue-100 text-blue-800 border-blue-200';
                  let dotColor = 'bg-blue-600';

                  if (item.action === 'APPROVED') {
                    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    dotColor = 'bg-emerald-600';
                  } else if (item.action === 'REJECTED') {
                    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
                    dotColor = 'bg-rose-600';
                  } else if (item.action === 'DISBURSED' || item.action === 'PAID') {
                    badgeColor = 'bg-purple-100 text-purple-800 border-purple-200';
                    dotColor = 'bg-purple-600';
                  } else if (item.action === 'SETTLED') {
                    badgeColor = 'bg-teal-100 text-teal-800 border-teal-200';
                    dotColor = 'bg-teal-600';
                  }

                  return (
                    <div key={item.id || idx} className="relative">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white ${dotColor} shadow-xs`}
                      />

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.actorName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-medium">
                              {item.actorRoleLabel || item.actorRole}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}
                            >
                              {item.action}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {item.timestamp}
                            </span>
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-700 italic">
                            &quot;{item.notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Integritas Log: Tervalidasi Sistem ERP Keuangan</span>
        </div>
        <div className="font-mono">
          Total Entri Tercatat: {approvalHistory.length} aksi
        </div>
      </div>
    </div>
  );
};
