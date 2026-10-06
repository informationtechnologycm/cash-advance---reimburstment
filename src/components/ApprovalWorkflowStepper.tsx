import React from 'react';
import { AdvanceStatus, ReimbursementStatus, UserRole } from '../types/finance';
import { formatDateIndo } from '../utils/formatters';
import { Check, Clock, X, AlertTriangle, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  subtitle: string;
  requiredRole: UserRole;
  status: 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'REJECTED' | 'SKIPPED';
  completedBy?: string;
  completedAt?: string;
  notes?: string;
}

interface ApprovalWorkflowStepperProps {
  type: 'ADVANCE' | 'REIMBURSEMENT';
  currentStatus: AdvanceStatus | ReimbursementStatus;
  totalAmount: number;
  approvalHistory: Array<{
    actorName: string;
    actorRole: UserRole;
    actorRoleLabel: string;
    action: string;
    timestamp: string;
    notes?: string;
  }>;
  rejectionReason?: string;
  onSwitchRole?: (role: UserRole) => void;
  currentUserRole: UserRole;
}

export const ApprovalWorkflowStepper: React.FC<ApprovalWorkflowStepperProps> = ({
  type,
  currentStatus,
  totalAmount,
  approvalHistory,
  rejectionReason,
  onSwitchRole,
  currentUserRole,
}) => {
  const isHighValue = totalAmount > 15000000;

  // Build steps according to workflow
  const steps: WorkflowStep[] = [];

  if (type === 'ADVANCE') {
    const advStatus = currentStatus as AdvanceStatus;

    // 1. Submission
    const submitHistory = approvalHistory.find(h => h.action === 'SUBMITTED');
    steps.push({
      id: 'submission',
      title: '1. Pengajuan Kasbon',
      subtitle: 'Staff / Pemohon',
      requiredRole: 'STAFF',
      status: 'COMPLETED',
      completedBy: submitHistory?.actorName,
      completedAt: submitHistory?.timestamp,
      notes: submitHistory?.notes,
    });

    // 2. Manager Department Approval
    const managerHistory = approvalHistory.find(h => h.action === 'APPROVED' && (h.actorRole === 'MANAGER' || h.actorRole === 'DIRECTOR'));
    const isManagerRejected = advStatus === 'REJECTED' && approvalHistory.some(h => h.action === 'REJECTED' && h.actorRole === 'MANAGER');
    let managerStatus: WorkflowStep['status'] = 'UPCOMING';
    if (advStatus === 'PENDING_MANAGER') {
      managerStatus = 'CURRENT';
    } else if (managerHistory || ['PENDING_FINANCE', 'PENDING_DIRECTOR', 'APPROVED', 'DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(advStatus)) {
      managerStatus = 'COMPLETED';
    } else if (isManagerRejected) {
      managerStatus = 'REJECTED';
    }

    steps.push({
      id: 'manager',
      title: '2. Review Manager',
      subtitle: 'Manager Departemen',
      requiredRole: 'MANAGER',
      status: managerStatus,
      completedBy: managerHistory?.actorName,
      completedAt: managerHistory?.timestamp,
      notes: managerHistory?.notes,
    });

    // 3. Finance Review
    const financeHistory = approvalHistory.find(h => h.action === 'APPROVED' && h.actorRole === 'FINANCE');
    const isFinanceRejected = advStatus === 'REJECTED' && approvalHistory.some(h => h.action === 'REJECTED' && h.actorRole === 'FINANCE');
    let financeStatus: WorkflowStep['status'] = 'UPCOMING';
    if (advStatus === 'PENDING_FINANCE') {
      financeStatus = 'CURRENT';
    } else if (financeHistory || ['PENDING_DIRECTOR', 'APPROVED', 'DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(advStatus)) {
      financeStatus = 'COMPLETED';
    } else if (isFinanceRejected) {
      financeStatus = 'REJECTED';
    }

    steps.push({
      id: 'finance',
      title: '3. Verifikasi Finance',
      subtitle: 'Finance & Akunting',
      requiredRole: 'FINANCE',
      status: financeStatus,
      completedBy: financeHistory?.actorName,
      completedAt: financeHistory?.timestamp,
      notes: financeHistory?.notes,
    });

    // 4. Director (if > 15 million)
    if (isHighValue) {
      const directorHistory = approvalHistory.find(h => h.action === 'APPROVED' && h.actorRole === 'DIRECTOR' && h.actorRoleLabel.includes('Direktur'));
      const isDirectorRejected = advStatus === 'REJECTED' && approvalHistory.some(h => h.action === 'REJECTED' && h.actorRole === 'DIRECTOR');
      let directorStatus: WorkflowStep['status'] = 'UPCOMING';
      if (advStatus === 'PENDING_DIRECTOR') {
        directorStatus = 'CURRENT';
      } else if (directorHistory || ['APPROVED', 'DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(advStatus)) {
        directorStatus = 'COMPLETED';
      } else if (isDirectorRejected) {
        directorStatus = 'REJECTED';
      }

      steps.push({
        id: 'director',
        title: '4. Approval Direktur',
        subtitle: 'Direktur Utama (>15jt)',
        requiredRole: 'DIRECTOR',
        status: directorStatus,
        completedBy: directorHistory?.actorName,
        completedAt: directorHistory?.timestamp,
        notes: directorHistory?.notes,
      });
    }

    // 5. Disbursement
    const disburseHistory = approvalHistory.find(h => h.action === 'DISBURSED');
    let disburseStatus: WorkflowStep['status'] = 'UPCOMING';
    if (advStatus === 'APPROVED') {
      disburseStatus = 'CURRENT';
    } else if (disburseHistory || ['DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(advStatus)) {
      disburseStatus = 'COMPLETED';
    }

    steps.push({
      id: 'disburse',
      title: `${isHighValue ? '5' : '4'}. Pencairan Kasbon`,
      subtitle: 'Kasir / Bank Transfer',
      requiredRole: 'FINANCE',
      status: disburseStatus,
      completedBy: disburseHistory?.actorName,
      completedAt: disburseHistory?.timestamp,
      notes: disburseHistory?.notes,
    });

    // 6. Settlement
    let settlementStatus: WorkflowStep['status'] = 'UPCOMING';
    const settleHistory = approvalHistory.find(h => h.action === 'SETTLED');
    if (advStatus === 'PENDING_SETTLEMENT' || advStatus === 'DISBURSED') {
      settlementStatus = 'CURRENT';
    } else if (advStatus === 'SETTLED') {
      settlementStatus = 'COMPLETED';
    }

    steps.push({
      id: 'settlement',
      title: `${isHighValue ? '6' : '5'}. Settlement (LPJ)`,
      subtitle: 'Pertanggungjawaban',
      requiredRole: 'STAFF',
      status: settlementStatus,
      completedBy: settleHistory?.actorName,
      completedAt: settleHistory?.timestamp,
      notes: settleHistory?.notes,
    });
  } else {
    // REIMBURSEMENT
    const reimbStatus = currentStatus as ReimbursementStatus;

    // 1. Submission
    const submitHistory = approvalHistory.find(h => h.action === 'SUBMITTED');
    steps.push({
      id: 'submission',
      title: '1. Pengajuan Klaim',
      subtitle: 'Staff / Pemohon',
      requiredRole: 'STAFF',
      status: 'COMPLETED',
      completedBy: submitHistory?.actorName,
      completedAt: submitHistory?.timestamp,
    });

    // 2. Manager Approval
    const managerHistory = approvalHistory.find(h => h.action === 'APPROVED' && (h.actorRole === 'MANAGER' || h.actorRole === 'DIRECTOR'));
    let managerStatus: WorkflowStep['status'] = 'UPCOMING';
    if (reimbStatus === 'PENDING_MANAGER') {
      managerStatus = 'CURRENT';
    } else if (managerHistory || ['PENDING_FINANCE', 'APPROVED', 'PAID'].includes(reimbStatus)) {
      managerStatus = 'COMPLETED';
    } else if (reimbStatus === 'REJECTED') {
      managerStatus = 'REJECTED';
    }

    steps.push({
      id: 'manager',
      title: '2. Review Manager',
      subtitle: 'Manager Departemen',
      requiredRole: 'MANAGER',
      status: managerStatus,
      completedBy: managerHistory?.actorName,
      completedAt: managerHistory?.timestamp,
      notes: managerHistory?.notes,
    });

    // 3. Finance Review
    const financeHistory = approvalHistory.find(h => h.action === 'APPROVED' && h.actorRole === 'FINANCE');
    let financeStatus: WorkflowStep['status'] = 'UPCOMING';
    if (reimbStatus === 'PENDING_FINANCE') {
      financeStatus = 'CURRENT';
    } else if (financeHistory || ['APPROVED', 'PAID'].includes(reimbStatus)) {
      financeStatus = 'COMPLETED';
    }

    steps.push({
      id: 'finance',
      title: '3. Verifikasi Finance',
      subtitle: 'Finance & Pajak',
      requiredRole: 'FINANCE',
      status: financeStatus,
      completedBy: financeHistory?.actorName,
      completedAt: financeHistory?.timestamp,
      notes: financeHistory?.notes,
    });

    // 4. Payment
    const payHistory = approvalHistory.find(h => h.action === 'PAID');
    let payStatus: WorkflowStep['status'] = 'UPCOMING';
    if (reimbStatus === 'APPROVED') {
      payStatus = 'CURRENT';
    } else if (reimbStatus === 'PAID') {
      payStatus = 'COMPLETED';
    }

    steps.push({
      id: 'payment',
      title: '4. Pembayaran Lunas',
      subtitle: 'Transfer Bank ke Rekening',
      requiredRole: 'FINANCE',
      status: payStatus,
      completedBy: payHistory?.actorName,
      completedAt: payHistory?.timestamp,
      notes: payHistory?.notes,
    });
  }

  // Find the active step
  const activeStep = steps.find(s => s.status === 'CURRENT');

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Indikator Alur Persetujuan Berjenjang (Multi-Level Approval)
          </span>
        </div>
        {isHighValue && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
            Plafon Khusus &gt; Rp 15 Juta
          </span>
        )}
      </div>

      {/* Horizontal Multi-Stage Step Indicator */}
      <div className="relative pt-2 pb-1 overflow-x-auto">
        <div className="flex items-start justify-between min-w-[550px]">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center text-center w-28 shrink-0">
                  {/* Step Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all shadow-xs ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : step.status === 'CURRENT'
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                        : step.status === 'REJECTED'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {step.status === 'COMPLETED' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : step.status === 'REJECTED' ? (
                      <X className="w-4 h-4 stroke-[3]" />
                    ) : step.status === 'CURRENT' ? (
                      <Clock className="w-4 h-4 animate-spin-slow" />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Title & Subtitle */}
                  <div className="mt-1.5 font-semibold text-[11px] text-slate-900 leading-tight">
                    {step.title}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                    {step.subtitle}
                  </div>

                  {/* Dynamic Status / Completed Tag */}
                  {step.status === 'COMPLETED' && (
                    <div className="mt-1 text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Disetujui {step.completedBy ? `(${step.completedBy.split(' ')[0]})` : ''}
                    </div>
                  )}

                  {step.status === 'CURRENT' && (
                    <div className="mt-1 text-[9px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">
                      Menunggu Approval
                    </div>
                  )}

                  {step.status === 'REJECTED' && (
                    <div className="mt-1 text-[9px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Ditolak
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="flex-1 h-0.5 bg-slate-200 mt-3.5 mx-1 relative">
                    <div
                      className={`h-full ${
                        step.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Active Stage Callout / Action Helper */}
      {activeStep && (
        <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tahap saat ini: <strong>{activeStep.title}</strong> — Menunggu persetujuan oleh{' '}
              <strong>{activeStep.subtitle}</strong>.
            </span>
          </div>

          {/* Quick Switch Button if current user is not the required role */}
          {currentUserRole !== activeStep.requiredRole && onSwitchRole && (
            <button
              onClick={() => onSwitchRole(activeStep.requiredRole)}
              className="text-[11px] font-semibold px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-md hover:bg-amber-100 transition-colors shrink-0 self-start sm:self-auto flex items-center gap-1"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Simulasi: Masuk Sebagai {activeStep.requiredRole} &rarr;</span>
            </button>
          )}
        </div>
      )}

      {rejectionReason && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Alasan Penolakan / Revisi:</strong>
            <p className="mt-0.5 text-[11px] italic">&quot;{rejectionReason}&quot;</p>
          </div>
        </div>
      )}
    </div>
  );
};
