export type CompanyId = 'AMS' | 'AMI';

export interface CompanyInfo {
  id: CompanyId;
  name: string;
  fullName: string;
  tagline: string;
  codePrefix: string;
  logoAccent: string; // Tailwind color classes
  badgeBg: string;
  badgeText: string;
  primaryBank: string;
  accountNumber: string;
  accountName: string;
  directorName: string;
  financeHeadName: string;
  address: string;
  npwp: string;
  phone: string;
}

export type UserRole = 'STAFF' | 'MANAGER' | 'FINANCE' | 'DIRECTOR';

export interface RolePermissions {
  canSubmit: boolean;
  canApproveManager: boolean;
  canApproveFinance: boolean;
  canApproveDirector: boolean;
  canDisburse: boolean;
  canPayReimbursement: boolean;
  canVerifySettlement: boolean;
  canViewReports: boolean;
  isApplicantOnly: boolean;
}

export function getRolePermissions(role: UserRole): RolePermissions {
  switch (role) {
    case 'STAFF':
      return {
        canSubmit: true,
        canApproveManager: false,
        canApproveFinance: false,
        canApproveDirector: false,
        canDisburse: false,
        canPayReimbursement: false,
        canVerifySettlement: false,
        canViewReports: false,
        isApplicantOnly: true,
      };
    case 'MANAGER':
      return {
        canSubmit: true,
        canApproveManager: true,
        canApproveFinance: false,
        canApproveDirector: false,
        canDisburse: false,
        canPayReimbursement: false,
        canVerifySettlement: false,
        canViewReports: true,
        isApplicantOnly: false,
      };
    case 'FINANCE':
      return {
        canSubmit: true,
        canApproveManager: false,
        canApproveFinance: true,
        canApproveDirector: false,
        canDisburse: true,
        canPayReimbursement: true,
        canVerifySettlement: true,
        canViewReports: true,
        isApplicantOnly: false,
      };
    case 'DIRECTOR':
      return {
        canSubmit: true,
        canApproveManager: true,
        canApproveFinance: true,
        canApproveDirector: true,
        canDisburse: true,
        canPayReimbursement: true,
        canVerifySettlement: true,
        canViewReports: true,
        isApplicantOnly: false,
      };
  }
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  companyId: CompanyId;
  avatarUrl?: string;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

export type ExpenseCategory =
  | 'TRANSPORT'
  | 'MEALS'
  | 'ACCOMMODATION'
  | 'OFFICE_SUPPLIES'
  | 'FIELD_OPERATIONS'
  | 'CLIENT_ENTERTAINMENT'
  | 'MEDICAL'
  | 'TOOLS_EQUIPMENT'
  | 'OTHER';

export interface ExpenseItem {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  receiptNumber?: string;
  receiptUrl?: string; // or base64 / mock receipt
  notes?: string;
}

export type AdvanceStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER'
  | 'PENDING_FINANCE'
  | 'PENDING_DIRECTOR'
  | 'APPROVED'
  | 'DISBURSED'
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'REJECTED';

export type ReimbursementStatus =
  | 'DRAFT'
  | 'PENDING_MANAGER'
  | 'PENDING_FINANCE'
  | 'APPROVED'
  | 'PAID'
  | 'REJECTED';

export type SettlementStatus =
  | 'DRAFT'
  | 'PENDING_FINANCE'
  | 'VERIFIED'
  | 'REJECTED';

export interface ApprovalHistoryEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  actorRoleLabel: string;
  action: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'PAID' | 'SETTLED' | 'REVISED';
  notes?: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'pdf' | 'document' | string;
  previewUrl?: string;
  uploadedAt: string;
  category?: string;
  simulatedPreviewType?: 'struk_bbm' | 'kuitansi' | 'surat_tugas' | 'invoice' | 'tiket' | 'generic';
}

export interface CostAdvanceRequest {
  id: string;
  code: string; // e.g. CA-AMS-2026-001
  companyId: CompanyId;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  jobTitle: string;
  requestDate: string;
  requiredDate: string;
  purpose: string;
  costCenter: string;
  status: AdvanceStatus;
  items: ExpenseItem[];
  totalAmount: number;
  paymentMethod: 'TRANSFER' | 'PETTY_CASH';
  applicantBankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  disbursementDetails?: {
    disbursedDate: string;
    disbursedBy: string;
    sourceBank: string;
    referenceNumber: string;
    proofUrl?: string;
  };
  settlementDeadlineDate: string; // Max 7 days after requiredDate / event
  approvalHistory: ApprovalHistoryEntry[];
  settlementId?: string; // Linked settlement when settled
  rejectionReason?: string;
  attachments?: AttachmentFile[];
}

export interface ReimbursementRequest {
  id: string;
  code: string; // e.g. RB-AMI-2026-004
  companyId: CompanyId;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  jobTitle: string;
  requestDate: string;
  purpose: string;
  costCenter: string;
  status: ReimbursementStatus;
  items: ExpenseItem[];
  totalAmount: number;
  applicantBankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  paymentDetails?: {
    paidDate: string;
    paidBy: string;
    sourceBank: string;
    referenceNumber: string;
  };
  approvalHistory: ApprovalHistoryEntry[];
  rejectionReason?: string;
  attachments?: AttachmentFile[];
}

export interface AdvanceSettlement {
  id: string;
  code: string; // e.g. ST-AMS-2026-001
  advanceId: string;
  advanceCode: string;
  companyId: CompanyId;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  settlementDate: string;
  advanceAmount: number;
  actualItems: ExpenseItem[];
  totalActualAmount: number;
  difference: number; // actualAmount - advanceAmount:
  // > 0: Employee spent more, Company needs to reimburse excess (Kurang bayar kasbon)
  // < 0: Employee spent less, Employee must return unused cash (Lebih bayar kasbon, pengembalian ke rekening perusahaan)
  // === 0: Exact match (Nol selisih)
  varianceType: 'REFUND_TO_COMPANY' | 'REIMBURSE_TO_EMPLOYEE' | 'EXACT_MATCH';
  refundProofUrl?: string; // proof when employee refunds leftover money to company
  reimburseReferenceNumber?: string; // proof when company pays employee the shortage
  status: SettlementStatus;
  notes?: string;
  approvalHistory: ApprovalHistoryEntry[];
}

export type NotificationType =
  | 'ADVANCE_APPROVED'
  | 'ADVANCE_REJECTED'
  | 'REIMBURSEMENT_APPROVED'
  | 'REIMBURSEMENT_REJECTED'
  | 'ADVANCE_DISBURSED'
  | 'REIMBURSEMENT_PAID'
  | 'SETTLEMENT_VERIFIED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId: string;
  targetCode: string;
  targetType: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT';
  amount?: number;
  actorName: string;
  actorRole: UserRole;
  actorRoleLabel: string;
  status: 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'PAID' | 'VERIFIED';
  reason?: string;
  timestamp: string; // ISO string or readable format
  isRead: boolean;
  applicantId?: string;
  applicantName?: string;
  companyId?: CompanyId;
}

export type FormDraftType = 'ADVANCE' | 'REIMBURSEMENT';

export interface AdvanceDraftData {
  companyId: CompanyId;
  purpose: string;
  requiredDate: string;
  costCenter: string;
  paymentMethod: 'TRANSFER' | 'PETTY_CASH';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  applicantDepartment?: string;
  overBudgetJustification?: string;
  attachments?: AttachmentFile[];
  items: Array<{
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    date: string;
  }>;
}

export interface ReimbursementDraftData {
  companyId: CompanyId;
  purpose: string;
  costCenter: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  attachments?: AttachmentFile[];
  items: Array<{
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    date: string;
    receiptNumber: string;
  }>;
}

export interface FormDraft {
  id: string;
  type: FormDraftType;
  title: string;
  companyId: CompanyId;
  applicantId: string;
  applicantName: string;
  applicantDepartment: string;
  createdAt: string;
  updatedAt: string;
  totalEstimatedAmount: number;
  itemsCount: number;
  data: AdvanceDraftData | ReimbursementDraftData;
}
