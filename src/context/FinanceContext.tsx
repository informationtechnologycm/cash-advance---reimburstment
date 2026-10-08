import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  CompanyId,
  CostAdvanceRequest,
  ReimbursementRequest,
  AdvanceSettlement,
  UserProfile,
  UserRole,
  ExpenseItem,
  RolePermissions,
  getRolePermissions,
  AttachmentFile,
  AppNotification,
  FormDraft,
  FormDraftType,
  AdvanceDraftData,
  ReimbursementDraftData,
} from '../types/finance';
import {
  COMPANIES,
  MOCK_USERS,
  INITIAL_ADVANCES,
  INITIAL_REIMBURSEMENTS,
  INITIAL_SETTLEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DRAFTS,
} from '../data/initialData';
import { formatRupiah } from '../utils/formatters';
import {
  apiLogin,
  apiGetMe,
  apiGetAdvances,
  apiCreateAdvance,
  apiApproveAdvance,
  apiRejectAdvance,
  apiDisburseAdvance,
  apiGetReimbursements,
  apiCreateReimbursement,
  apiApproveReimbursement,
  apiRejectReimbursement,
  apiPayReimbursement,
  apiGetSettlements,
  apiCreateSettlement,
  apiVerifySettlement,
} from '../utils/api';

interface FinanceContextType {
  // Authentication & Permissions
  isAuthenticated: boolean;
  authToken: string | null;
  currentUser: UserProfile;
  permissions: RolePermissions;
  onlyMyRequests: boolean;
  setOnlyMyRequests: (val: boolean) => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  setCurrentUser: (user: UserProfile) => void;
  users: UserProfile[];

  // Entity selection & Navigation
  selectedCompany: 'ALL' | CompanyId;
  setSelectedCompany: (company: 'ALL' | CompanyId) => void;
  activeTab: 'dashboard' | 'advances' | 'reimbursements' | 'settlements' | 'reports' | 'drafts';
  setActiveTab: (tab: 'dashboard' | 'advances' | 'reimbursements' | 'settlements' | 'reports' | 'drafts') => void;

  // Data lists
  advances: CostAdvanceRequest[];
  reimbursements: ReimbursementRequest[];
  settlements: AdvanceSettlement[];
  drafts: FormDraft[];

  // Filtered views
  filteredAdvances: CostAdvanceRequest[];
  filteredReimbursements: ReimbursementRequest[];
  filteredSettlements: AdvanceSettlement[];
  filteredDrafts: FormDraft[];

  // Draft Operations
  saveDraft: (
    type: FormDraftType,
    data: AdvanceDraftData | ReimbursementDraftData,
    existingDraftId?: string
  ) => string;
  deleteDraft: (id: string) => void;

  // Operations
  createCostAdvance: (data: {
    companyId: CompanyId;
    purpose: string;
    requiredDate: string;
    costCenter: string;
    paymentMethod: 'TRANSFER' | 'PETTY_CASH';
    items: Omit<ExpenseItem, 'id' | 'total'>[];
    bankAccount: { bankName: string; accountNumber: string; accountHolder: string };
    attachments?: AttachmentFile[];
    applicantDepartment?: string;
  }) => Promise<CostAdvanceRequest>;

  approveCostAdvance: (id: string, notes?: string) => Promise<void>;
  rejectCostAdvance: (id: string, reason: string) => Promise<void>;
  disburseCostAdvance: (
    id: string,
    details: { sourceBank: string; referenceNumber: string; notes?: string }
  ) => Promise<void>;

  createReimbursement: (data: {
    companyId: CompanyId;
    purpose: string;
    costCenter: string;
    items: Omit<ExpenseItem, 'id' | 'total'>[];
    bankAccount: { bankName: string; accountNumber: string; accountHolder: string };
    attachments?: AttachmentFile[];
  }) => Promise<ReimbursementRequest>;

  approveReimbursement: (id: string, notes?: string) => Promise<void>;
  rejectReimbursement: (id: string, reason: string) => Promise<void>;
  payReimbursement: (
    id: string,
    details: { sourceBank: string; referenceNumber: string; notes?: string }
  ) => Promise<void>;

  createSettlement: (data: {
    advanceId: string;
    actualItems: Omit<ExpenseItem, 'id' | 'total'>[];
    notes?: string;
    refundProofUrl?: string;
  }) => Promise<AdvanceSettlement>;

  verifySettlement: (id: string, notes?: string) => Promise<void>;

  // Real-time Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void;

  resetToDefaultData: () => void;
  getCompany: (id: CompanyId) => (typeof COMPANIES)[CompanyId];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_AUTH_TOKEN = 'ams_ami_auth_token_v1';
const STORAGE_KEY_USER = 'ams_ami_current_user_v1';
const STORAGE_KEY_COMPANY = 'ams_ami_selected_company_v1';
const STORAGE_KEY_ADVANCES = 'ams_ami_advances_v1';
const STORAGE_KEY_REIMBURSEMENTS = 'ams_ami_reimbursements_v1';
const STORAGE_KEY_SETTLEMENTS = 'ams_ami_settlements_v1';
const STORAGE_KEY_NOTIFICATIONS = 'ams_ami_notifications_v1';
const STORAGE_KEY_DRAFTS = 'ams_ami_form_drafts_v1';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return MOCK_USERS[0];
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  });

  const [selectedCompany, setSelectedCompany] = useState<'ALL' | CompanyId>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COMPANY);
    return saved === 'AMS' || saved === 'AMI' || saved === 'ALL' ? saved : 'ALL';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'advances' | 'reimbursements' | 'settlements' | 'reports' | 'drafts'>('dashboard');

  const [advances, setAdvances] = useState<CostAdvanceRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADVANCES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ADVANCES;
  });

  const [reimbursements, setReimbursements] = useState<ReimbursementRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REIMBURSEMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_REIMBURSEMENTS;
  });

  const [settlements, setSettlements] = useState<AdvanceSettlement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SETTLEMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_SETTLEMENTS;
  });

  const [drafts, setDrafts] = useState<FormDraft[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DRAFTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_DRAFTS;
  });

  const permissions = getRolePermissions(currentUser.role);
  const [onlyMyRequests, setOnlyMyRequests] = useState<boolean>(() => currentUser.role === 'STAFF');

  useEffect(() => {
    if (currentUser.role === 'STAFF') {
      setOnlyMyRequests(true);
    } else {
      setOnlyMyRequests(false);
    }
  }, [currentUser.id]);

  // Sync with Backend API on load
  useEffect(() => {
    const syncBackendData = async () => {
      try {
        const [backendAdv, backendReimb, backendSet] = await Promise.all([
          apiGetAdvances().catch(() => null),
          apiGetReimbursements().catch(() => null),
          apiGetSettlements().catch(() => null),
        ]);

        if (backendAdv && backendAdv.length > 0) setAdvances(backendAdv);
        if (backendReimb && backendReimb.length > 0) setReimbursements(backendReimb);
        if (backendSet && backendSet.length > 0) setSettlements(backendSet);
      } catch (err) {
        console.warn('Backend sync warning, using local state:', err);
      }
    };

    syncBackendData();
  }, []);

  // Save changes locally
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPANY, selectedCompany);
  }, [selectedCompany]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (authToken) {
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, authToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    }
  }, [authToken]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADVANCES, JSON.stringify(advances));
  }, [advances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REIMBURSEMENTS, JSON.stringify(reimbursements));
  }, [reimbursements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTLEMENTS, JSON.stringify(settlements));
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
  }, [drafts]);

  // Notifications State & Persistence
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const nowTimestamp = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: nowTimestamp(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // Login handler
  const login = async (email: string, password?: string) => {
    try {
      const result = await apiLogin(email, password);
      setAuthToken(result.token);
      setCurrentUser(result.user);
      setIsAuthenticated(true);
    } catch (err) {
      // Offline fallback: match user from mock
      const match = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (match) {
        const token = `bearer-mock-${match.id}`;
        setAuthToken(token);
        setCurrentUser(match);
        setIsAuthenticated(true);
      } else {
        throw err;
      }
    }
  };

  const logout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  };

  const filteredAdvances = advances.filter(a => selectedCompany === 'ALL' || a.companyId === selectedCompany);
  const filteredReimbursements = reimbursements.filter(r => selectedCompany === 'ALL' || r.companyId === selectedCompany);
  const filteredSettlements = settlements.filter(s => selectedCompany === 'ALL' || s.companyId === selectedCompany);
  const filteredDrafts = drafts.filter(d => {
    if (selectedCompany !== 'ALL' && d.companyId !== selectedCompany) return false;
    if (onlyMyRequests && d.applicantId !== currentUser.id) return false;
    return true;
  });

  const saveDraft = (
    type: FormDraftType,
    data: AdvanceDraftData | ReimbursementDraftData,
    existingDraftId?: string
  ): string => {
    const id = existingDraftId || `draft-${type === 'ADVANCE' ? 'ca' : 'rb'}-${Date.now()}`;
    const now = new Date().toISOString();

    const items = (data.items as any[]) || [];
    const totalEstimatedAmount = items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
    const itemsCount = items.length;
    const title = data.purpose && data.purpose.trim()
      ? data.purpose.trim()
      : `Draft ${type === 'ADVANCE' ? 'Cost Advance' : 'Reimbursement'} (Tanpa Judul)`;

    const newDraft: FormDraft = {
      id,
      type,
      title,
      companyId: data.companyId,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantDepartment: currentUser.department,
      createdAt: now,
      updatedAt: now,
      totalEstimatedAmount,
      itemsCount,
      data,
    };

    setDrafts(prev => {
      const idx = prev.findIndex(d => d.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = {
          ...newDraft,
          createdAt: prev[idx].createdAt,
          updatedAt: now,
        };
        return copy;
      }
      return [newDraft, ...prev];
    });

    return id;
  };

  const deleteDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const getCompany = (id: CompanyId) => COMPANIES[id];

  // Cost Advance Operations
  const createCostAdvance = async (data: {
    companyId: CompanyId;
    purpose: string;
    requiredDate: string;
    costCenter: string;
    paymentMethod: 'TRANSFER' | 'PETTY_CASH';
    items: Omit<ExpenseItem, 'id' | 'total'>[];
    bankAccount: { bankName: string; accountNumber: string; accountHolder: string };
    attachments?: AttachmentFile[];
    applicantDepartment?: string;
  }): Promise<CostAdvanceRequest> => {
    try {
      const created = await apiCreateAdvance({
        ...data,
        applicant: currentUser,
        applicantDepartment: data.applicantDepartment || currentUser.department,
      });
      setAdvances(prev => [created, ...prev]);
      return created;
    } catch (err) {
      // Local fallback
      const count = advances.filter(a => a.companyId === data.companyId).length + 1;
      const code = `CA-${data.companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      const today = new Date().toISOString().split('T')[0];
      const reqD = new Date(data.requiredDate);
      reqD.setDate(reqD.getDate() + 7);

      const processedItems: ExpenseItem[] = data.items.map((it, idx) => ({
        ...it,
        id: `it-${Date.now()}-${idx}`,
        total: it.quantity * it.unitPrice,
      }));

      const newAdvance: CostAdvanceRequest = {
        id: `ca-${Date.now()}`,
        code,
        companyId: data.companyId,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantDepartment: data.applicantDepartment || currentUser.department,
        jobTitle: currentUser.roleLabel,
        requestDate: today,
        requiredDate: data.requiredDate,
        purpose: data.purpose,
        costCenter: data.costCenter,
        status: 'PENDING_MANAGER',
        items: processedItems,
        totalAmount: processedItems.reduce((acc, it) => acc + it.total, 0),
        paymentMethod: data.paymentMethod,
        applicantBankAccount: data.bankAccount,
        settlementDeadlineDate: reqD.toISOString().split('T')[0],
        attachments: data.attachments || [],
        approvalHistory: [
          {
            id: `ah-${Date.now()}`,
            timestamp: nowTimestamp(),
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorRoleLabel: currentUser.roleLabel,
            action: 'SUBMITTED',
            notes: 'Pengajuan dibuat.',
          },
        ],
      };
      setAdvances(prev => [newAdvance, ...prev]);
      return newAdvance;
    }
  };

  const approveCostAdvance = async (id: string, notes?: string) => {
    const targetAdv = advances.find(a => a.id === id);
    try {
      const updated = await apiApproveAdvance(id, currentUser, notes);
      setAdvances(prev => prev.map(a => (a.id === id ? updated : a)));
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_APPROVED',
          title: `Kasbon Disetujui: ${targetAdv.code}`,
          message: `Pengajuan Kasbon ${targetAdv.code} (${formatRupiah(targetAdv.totalAmount)}) untuk "${targetAdv.purpose}" telah disetujui oleh ${currentUser.name} (${currentUser.roleLabel}).`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'APPROVED',
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    } catch (err) {
      // Local fallback
      setAdvances(prev =>
        prev.map(adv => {
          if (adv.id !== id) return adv;
          let nextStatus = adv.status;
          if (currentUser.role === 'MANAGER' || (currentUser.role === 'DIRECTOR' && adv.status === 'PENDING_MANAGER')) {
            nextStatus = 'PENDING_FINANCE';
          } else if (currentUser.role === 'FINANCE') {
            nextStatus = adv.totalAmount > 15000000 ? 'PENDING_DIRECTOR' : 'APPROVED';
          } else if (currentUser.role === 'DIRECTOR') {
            nextStatus = 'APPROVED';
          }

          return {
            ...adv,
            status: nextStatus,
            approvalHistory: [
              ...adv.approvalHistory,
              {
                id: `ah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'APPROVED',
                notes: notes || 'Disetujui.',
              },
            ],
          };
        })
      );
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_APPROVED',
          title: `Kasbon Disetujui: ${targetAdv.code}`,
          message: `Pengajuan Kasbon ${targetAdv.code} (${formatRupiah(targetAdv.totalAmount)}) untuk "${targetAdv.purpose}" telah disetujui oleh ${currentUser.name} (${currentUser.roleLabel}).`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'APPROVED',
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    }
  };

  const rejectCostAdvance = async (id: string, reason: string) => {
    const targetAdv = advances.find(a => a.id === id);
    try {
      const updated = await apiRejectAdvance(id, currentUser, reason);
      setAdvances(prev => prev.map(a => (a.id === id ? updated : a)));
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_REJECTED',
          title: `Kasbon Ditolak: ${targetAdv.code}`,
          message: `Pengajuan Kasbon ${targetAdv.code} (${formatRupiah(targetAdv.totalAmount)}) untuk "${targetAdv.purpose}" ditolak oleh ${currentUser.name} (${currentUser.roleLabel}). Alasan: "${reason}"`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'REJECTED',
          reason,
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    } catch (err) {
      setAdvances(prev =>
        prev.map(adv => {
          if (adv.id !== id) return adv;
          return {
            ...adv,
            status: 'REJECTED',
            rejectionReason: reason,
            approvalHistory: [
              ...adv.approvalHistory,
              {
                id: `ah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'REJECTED',
                notes: reason,
              },
            ],
          };
        })
      );
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_REJECTED',
          title: `Kasbon Ditolak: ${targetAdv.code}`,
          message: `Pengajuan Kasbon ${targetAdv.code} (${formatRupiah(targetAdv.totalAmount)}) untuk "${targetAdv.purpose}" ditolak oleh ${currentUser.name} (${currentUser.roleLabel}). Alasan: "${reason}"`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'REJECTED',
          reason,
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    }
  };

  const disburseCostAdvance = async (
    id: string,
    details: { sourceBank: string; referenceNumber: string; notes?: string }
  ) => {
    const targetAdv = advances.find(a => a.id === id);
    try {
      const updated = await apiDisburseAdvance(id, {
        actor: currentUser,
        ...details,
      });
      setAdvances(prev => prev.map(a => (a.id === id ? updated : a)));
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_DISBURSED',
          title: `Dana Kasbon Dicairkan: ${targetAdv.code}`,
          message: `Dana kasbon ${targetAdv.code} sebesar ${formatRupiah(targetAdv.totalAmount)} telah ditransfer ke rekening ${targetAdv.applicantBankAccount.accountHolder} via ${details.sourceBank}.`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'DISBURSED',
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    } catch (err) {
      const today = new Date().toISOString().split('T')[0];
      setAdvances(prev =>
        prev.map(adv => {
          if (adv.id !== id) return adv;
          return {
            ...adv,
            status: 'PENDING_SETTLEMENT',
            disbursementDetails: {
              disbursedDate: today,
              disbursedBy: `${currentUser.name} (${currentUser.roleLabel})`,
              sourceBank: details.sourceBank,
              referenceNumber: details.referenceNumber,
            },
            approvalHistory: [
              ...adv.approvalHistory,
              {
                id: `ah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'DISBURSED',
                notes: details.notes || `Dana dicairkan via ${details.sourceBank}`,
              },
            ],
          };
        })
      );
      if (targetAdv) {
        addNotification({
          type: 'ADVANCE_DISBURSED',
          title: `Dana Kasbon Dicairkan: ${targetAdv.code}`,
          message: `Dana kasbon ${targetAdv.code} sebesar ${formatRupiah(targetAdv.totalAmount)} telah ditransfer ke rekening ${targetAdv.applicantBankAccount.accountHolder} via ${details.sourceBank}.`,
          targetId: targetAdv.id,
          targetCode: targetAdv.code,
          targetType: 'ADVANCE',
          amount: targetAdv.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'DISBURSED',
          applicantId: targetAdv.applicantId,
          applicantName: targetAdv.applicantName,
          companyId: targetAdv.companyId,
        });
      }
    }
  };

  // Reimbursement Operations
  const createReimbursement = async (data: {
    companyId: CompanyId;
    purpose: string;
    costCenter: string;
    items: Omit<ExpenseItem, 'id' | 'total'>[];
    bankAccount: { bankName: string; accountNumber: string; accountHolder: string };
    attachments?: AttachmentFile[];
  }): Promise<ReimbursementRequest> => {
    try {
      const created = await apiCreateReimbursement({
        ...data,
        applicant: currentUser,
      });
      setReimbursements(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const count = reimbursements.filter(r => r.companyId === data.companyId).length + 1;
      const code = `RB-${data.companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      const today = new Date().toISOString().split('T')[0];

      const processedItems: ExpenseItem[] = data.items.map((it, idx) => ({
        ...it,
        id: `rit-${Date.now()}-${idx}`,
        total: it.quantity * it.unitPrice,
      }));

      const newReimb: ReimbursementRequest = {
        id: `rb-${Date.now()}`,
        code,
        companyId: data.companyId,
        applicantId: currentUser.id,
        applicantName: currentUser.name,
        applicantDepartment: currentUser.department,
        jobTitle: currentUser.roleLabel,
        requestDate: today,
        purpose: data.purpose,
        costCenter: data.costCenter,
        status: 'PENDING_MANAGER',
        items: processedItems,
        totalAmount: processedItems.reduce((acc, it) => acc + it.total, 0),
        applicantBankAccount: data.bankAccount,
        attachments: data.attachments || [],
        approvalHistory: [
          {
            id: `rah-${Date.now()}`,
            timestamp: nowTimestamp(),
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorRoleLabel: currentUser.roleLabel,
            action: 'SUBMITTED',
            notes: 'Klaim diajukan.',
          },
        ],
      };
      setReimbursements(prev => [newReimb, ...prev]);
      return newReimb;
    }
  };

  const approveReimbursement = async (id: string, notes?: string) => {
    const targetReimb = reimbursements.find(r => r.id === id);
    try {
      const updated = await apiApproveReimbursement(id, currentUser, notes);
      setReimbursements(prev => prev.map(r => (r.id === id ? updated : r)));
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_APPROVED',
          title: `Reimbursement Disetujui: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} (${formatRupiah(targetReimb.totalAmount)}) untuk "${targetReimb.purpose}" telah disetujui oleh ${currentUser.name} (${currentUser.roleLabel}).`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'APPROVED',
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    } catch (err) {
      setReimbursements(prev =>
        prev.map(rb => {
          if (rb.id !== id) return rb;
          let nextStatus = rb.status;
          if (currentUser.role === 'MANAGER' || (currentUser.role === 'DIRECTOR' && rb.status === 'PENDING_MANAGER')) {
            nextStatus = 'PENDING_FINANCE';
          } else if (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR') {
            nextStatus = 'APPROVED';
          }
          return {
            ...rb,
            status: nextStatus,
            approvalHistory: [
              ...rb.approvalHistory,
              {
                id: `rah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'APPROVED',
                notes: notes || 'Disetujui.',
              },
            ],
          };
        })
      );
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_APPROVED',
          title: `Reimbursement Disetujui: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} (${formatRupiah(targetReimb.totalAmount)}) untuk "${targetReimb.purpose}" telah disetujui oleh ${currentUser.name} (${currentUser.roleLabel}).`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'APPROVED',
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    }
  };

  const rejectReimbursement = async (id: string, reason: string) => {
    const targetReimb = reimbursements.find(r => r.id === id);
    try {
      const updated = await apiRejectReimbursement(id, currentUser, reason);
      setReimbursements(prev => prev.map(r => (r.id === id ? updated : r)));
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_REJECTED',
          title: `Reimbursement Ditolak: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} (${formatRupiah(targetReimb.totalAmount)}) untuk "${targetReimb.purpose}" ditolak oleh ${currentUser.name} (${currentUser.roleLabel}). Alasan: "${reason}"`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'REJECTED',
          reason,
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    } catch (err) {
      setReimbursements(prev =>
        prev.map(rb => {
          if (rb.id !== id) return rb;
          return {
            ...rb,
            status: 'REJECTED',
            rejectionReason: reason,
            approvalHistory: [
              ...rb.approvalHistory,
              {
                id: `rah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'REJECTED',
                notes: reason,
              },
            ],
          };
        })
      );
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_REJECTED',
          title: `Reimbursement Ditolak: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} (${formatRupiah(targetReimb.totalAmount)}) untuk "${targetReimb.purpose}" ditolak oleh ${currentUser.name} (${currentUser.roleLabel}). Alasan: "${reason}"`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'REJECTED',
          reason,
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    }
  };

  const payReimbursement = async (
    id: string,
    details: { sourceBank: string; referenceNumber: string; notes?: string }
  ) => {
    const targetReimb = reimbursements.find(r => r.id === id);
    try {
      const updated = await apiPayReimbursement(id, {
        actor: currentUser,
        ...details,
      });
      setReimbursements(prev => prev.map(r => (r.id === id ? updated : r)));
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_PAID',
          title: `Pembayaran Klaim Selesai: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} sebesar ${formatRupiah(targetReimb.totalAmount)} telah dibayarkan oleh ${currentUser.name} via ${details.sourceBank}.`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'PAID',
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    } catch (err) {
      const today = new Date().toISOString().split('T')[0];
      setReimbursements(prev =>
        prev.map(rb => {
          if (rb.id !== id) return rb;
          return {
            ...rb,
            status: 'PAID',
            paymentDetails: {
              paidDate: today,
              paidBy: `${currentUser.name} (${currentUser.roleLabel})`,
              sourceBank: details.sourceBank,
              referenceNumber: details.referenceNumber,
            },
            approvalHistory: [
              ...rb.approvalHistory,
              {
                id: `rah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'PAID',
                notes: details.notes || `Dibayarkan via ${details.sourceBank}`,
              },
            ],
          };
        })
      );
      if (targetReimb) {
        addNotification({
          type: 'REIMBURSEMENT_PAID',
          title: `Pembayaran Klaim Selesai: ${targetReimb.code}`,
          message: `Klaim Reimbursement ${targetReimb.code} sebesar ${formatRupiah(targetReimb.totalAmount)} telah dibayarkan oleh ${currentUser.name} via ${details.sourceBank}.`,
          targetId: targetReimb.id,
          targetCode: targetReimb.code,
          targetType: 'REIMBURSEMENT',
          amount: targetReimb.totalAmount,
          actorName: currentUser.name,
          actorRole: currentUser.role,
          actorRoleLabel: currentUser.roleLabel,
          status: 'PAID',
          applicantId: targetReimb.applicantId,
          applicantName: targetReimb.applicantName,
          companyId: targetReimb.companyId,
        });
      }
    }
  };

  // Settlement Operations
  const createSettlement = async (data: {
    advanceId: string;
    actualItems: Omit<ExpenseItem, 'id' | 'total'>[];
    notes?: string;
    refundProofUrl?: string;
  }): Promise<AdvanceSettlement> => {
    try {
      const created = await apiCreateSettlement({
        ...data,
        actor: currentUser,
      });
      setSettlements(prev => [created, ...prev]);
      setAdvances(prev =>
        prev.map(a => (a.id === data.advanceId ? { ...a, settlementId: created.id } : a))
      );
      return created;
    } catch (err) {
      const targetAdv = advances.find(a => a.id === data.advanceId);
      if (!targetAdv) throw new Error('Kasbon tidak ditemukan');

      const count = settlements.filter(s => s.companyId === targetAdv.companyId).length + 1;
      const code = `ST-${targetAdv.companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
      const today = new Date().toISOString().split('T')[0];

      const processedItems: ExpenseItem[] = data.actualItems.map((it, idx) => ({
        ...it,
        id: `stit-${Date.now()}-${idx}`,
        total: it.quantity * it.unitPrice,
      }));

      const totalActual = processedItems.reduce((acc, it) => acc + it.total, 0);
      const diff = totalActual - targetAdv.totalAmount;

      let varianceType: AdvanceSettlement['varianceType'] = 'EXACT_MATCH';
      if (diff < 0) varianceType = 'REFUND_TO_COMPANY';
      else if (diff > 0) varianceType = 'REIMBURSE_TO_EMPLOYEE';

      const newSettlement: AdvanceSettlement = {
        id: `st-${Date.now()}`,
        code,
        advanceId: targetAdv.id,
        advanceCode: targetAdv.code,
        companyId: targetAdv.companyId,
        applicantId: targetAdv.applicantId,
        applicantName: targetAdv.applicantName,
        applicantDepartment: targetAdv.applicantDepartment,
        settlementDate: today,
        advanceAmount: targetAdv.totalAmount,
        actualItems: processedItems,
        totalActualAmount: totalActual,
        difference: diff,
        varianceType,
        refundProofUrl: data.refundProofUrl,
        status: 'PENDING_FINANCE',
        notes: data.notes,
        approvalHistory: [
          {
            id: `sah-${Date.now()}`,
            timestamp: nowTimestamp(),
            actorName: currentUser.name,
            actorRole: currentUser.role,
            actorRoleLabel: currentUser.roleLabel,
            action: 'SUBMITTED',
            notes: 'Pertanggungjawaban kasbon diserahkan.',
          },
        ],
      };

      setSettlements(prev => [newSettlement, ...prev]);
      setAdvances(prev =>
        prev.map(a => (a.id === targetAdv.id ? { ...a, settlementId: newSettlement.id } : a))
      );
      return newSettlement;
    }
  };

  const verifySettlement = async (id: string, notes?: string) => {
    try {
      const updated = await apiVerifySettlement(id, currentUser, notes);
      setSettlements(prev => prev.map(s => (s.id === id ? updated : s)));
      const adv = advances.find(a => a.id === updated.advanceId);
      if (adv) {
        setAdvances(prev =>
          prev.map(a => (a.id === updated.advanceId ? { ...a, status: 'SETTLED' } : a))
        );
      }
    } catch (err) {
      const targetSet = settlements.find(s => s.id === id);
      if (!targetSet) return;

      setSettlements(prev =>
        prev.map(s => {
          if (s.id !== id) return s;
          return {
            ...s,
            status: 'VERIFIED',
            approvalHistory: [
              ...s.approvalHistory,
              {
                id: `sah-${Date.now()}`,
                timestamp: nowTimestamp(),
                actorName: currentUser.name,
                actorRole: currentUser.role,
                actorRoleLabel: currentUser.roleLabel,
                action: 'SETTLED',
                notes: notes || 'Pertanggungjawaban terverifikasi.',
              },
            ],
          };
        })
      );

      setAdvances(prev =>
        prev.map(a => (a.id === targetSet.advanceId ? { ...a, status: 'SETTLED' } : a))
      );
    }
  };

  const resetToDefaultData = () => {
    setAdvances(INITIAL_ADVANCES);
    setReimbursements(INITIAL_REIMBURSEMENTS);
    setSettlements(INITIAL_SETTLEMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(MOCK_USERS[0]);
    setSelectedCompany('ALL');
    localStorage.removeItem(STORAGE_KEY_ADVANCES);
    localStorage.removeItem(STORAGE_KEY_REIMBURSEMENTS);
    localStorage.removeItem(STORAGE_KEY_SETTLEMENTS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_COMPANY);
  };

  return (
    <FinanceContext.Provider
      value={{
        isAuthenticated,
        authToken,
        currentUser,
        permissions,
        onlyMyRequests,
        setOnlyMyRequests,
        login,
        logout,
        setCurrentUser,
        users: MOCK_USERS,
        selectedCompany,
        setSelectedCompany,
        activeTab,
        setActiveTab,
        advances,
        reimbursements,
        settlements,
        drafts,
        filteredAdvances,
        filteredReimbursements,
        filteredSettlements,
        filteredDrafts,
        saveDraft,
        deleteDraft,
        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        clearNotifications,
        addNotification,
        createCostAdvance,
        approveCostAdvance,
        rejectCostAdvance,
        disburseCostAdvance,
        createReimbursement,
        approveReimbursement,
        rejectReimbursement,
        payReimbursement,
        createSettlement,
        verifySettlement,
        resetToDefaultData,
        getCompany,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
