import { CompanyId, CostAdvanceRequest, ReimbursementRequest } from '../types/finance';

export interface DepartmentBudgetDefinition {
  department: string;
  companyId: CompanyId;
  monthlyBudget: number; // in IDR
  code: string;
  description: string;
}

export const DEPARTMENT_BUDGET_DEFINITIONS: DepartmentBudgetDefinition[] = [
  // PT AMS (Artha Mandiri Sejahtera - EPC & Engineering Services)
  {
    department: 'Operasional Lapangan',
    companyId: 'AMS',
    monthlyBudget: 35000000,
    code: 'AMS-OPS',
    description: 'BBM site, akomodasi teknisi lapangan, sewa crane & genset mobile',
  },
  {
    department: 'Engineering & Proyek',
    companyId: 'AMS',
    monthlyBudget: 50000000,
    code: 'AMS-ENG',
    description: 'Supervisi turbin, kick-off meeting tender, pengujian beban mesin',
  },
  {
    department: 'Marketing & Business Dev',
    companyId: 'AMS',
    monthlyBudget: 25000000,
    code: 'AMS-MKT',
    description: 'Presentasi proposal konsorsium, entertainment klien B2B, survei pasar',
  },
  {
    department: 'IT & Sistem Informasi',
    companyId: 'AMS',
    monthlyBudget: 20000000,
    code: 'AMS-IT',
    description: 'Lisensi server cloud, kabel jaringan site, perlengkapan IT data center',
  },
  {
    department: 'HR & General Affairs',
    companyId: 'AMS',
    monthlyBudget: 15000000,
    code: 'AMS-HR',
    description: 'Medical rawat jalan karyawan, kacamata kerja, konsumsi kantor & pelatihan',
  },
  {
    department: 'Finance & Accounting',
    companyId: 'AMS',
    monthlyBudget: 15000000,
    code: 'AMS-FIN',
    description: 'Materai elektronik, audit laporan pajak, biaya administrasi perbankan',
  },

  // PT AMI (Anugerah Mitra Industri - Manufaktur & Distribusi Logistik)
  {
    department: 'Manufaktur & Pabrik',
    companyId: 'AMI',
    monthlyBudget: 55000000,
    code: 'AMI-MFG',
    description: 'Suku cadang conveyor belt, kalibrasi press hydraulic, oli mesin bubut',
  },
  {
    department: 'Logistik & Pengadaan',
    companyId: 'AMI',
    monthlyBudget: 35000000,
    code: 'AMI-LOG',
    description: 'Sewa forklift 7 ton, bongkar muat kontainer, ekspedisi bahan baku',
  },
  {
    department: 'Quality Assurance (QA/QC)',
    companyId: 'AMI',
    monthlyBudget: 20000000,
    code: 'AMI-QA',
    description: 'Alat ukur mikrometer, sertifikasi ISO, sampel uji laboratorium',
  },
  {
    department: 'Sales Distribusi B2B',
    companyId: 'AMI',
    monthlyBudget: 30000000,
    code: 'AMI-SALES',
    description: 'Perjalanan sales regional, katering visit pabrik distributor',
  },
  {
    department: 'Maintenance & Utility',
    companyId: 'AMI',
    monthlyBudget: 25000000,
    code: 'AMI-MNT',
    description: 'Perawatan panel gardu listrik, filter kompresor angin, solar genset',
  },
  {
    department: 'HR & Umum',
    companyId: 'AMI',
    monthlyBudget: 15000000,
    code: 'AMI-HR',
    description: 'Seragam kerja pabrik, APD helm & sepatu safety, katering lembur',
  },
  {
    department: 'Finance & Accounting',
    companyId: 'AMI',
    monthlyBudget: 15000000,
    code: 'AMI-FIN',
    description: 'Perangkat kasir, registrasi faktur pajak e-Faktur, audit tahunan',
  },
];

/**
 * Normalized lookup for a department budget limit
 */
export function getDepartmentBudgetLimit(
  departmentName: string,
  companyId: CompanyId | 'ALL'
): number {
  if (companyId !== 'ALL') {
    const found = DEPARTMENT_BUDGET_DEFINITIONS.find(
      b => b.department.toLowerCase() === departmentName.toLowerCase() && b.companyId === companyId
    );
    if (found) return found.monthlyBudget;
  }

  // If ALL or not found for specific company, sum or find first matching
  const matches = DEPARTMENT_BUDGET_DEFINITIONS.filter(
    b => b.department.toLowerCase() === departmentName.toLowerCase()
  );
  if (matches.length > 0) {
    if (companyId === 'ALL') {
      return matches.reduce((acc, m) => acc + m.monthlyBudget, 0);
    }
    return matches[0].monthlyBudget;
  }

  // Fallback default budget
  return 20000000;
}

export interface DepartmentSpendDataPoint {
  department: string;
  shortDepartment: string;
  companyId: CompanyId | 'ALL';
  budgetLimit: number;
  actualSpending: number;
  advanceSpending: number;
  reimbursementSpending: number;
  remainingBudget: number;
  utilizationRate: number; // e.g. 78.5 (%)
  advanceCount: number;
  reimbursementCount: number;
  totalTransactions: number;
  status: 'NORMAL' | 'WARNING' | 'OVER_BUDGET';
}

/**
 * Shorten department names for crisp chart X-axis presentation
 */
export function shortenDepartmentName(name: string): string {
  const map: Record<string, string> = {
    'Operasional Lapangan': 'Ops Lapangan',
    'Engineering & Proyek': 'Engineering',
    'Marketing & Business Dev': 'Marketing',
    'IT & Sistem Informasi': 'IT & Sistem',
    'HR & General Affairs': 'HR & GA',
    'Finance & Accounting': 'Finance',
    'Manufaktur & Pabrik': 'Manufaktur',
    'Logistik & Pengadaan': 'Logistik',
    'Quality Assurance (QA/QC)': 'QA / QC',
    'Sales Distribusi B2B': 'Sales B2B',
    'Maintenance & Utility': 'Maintenance',
    'HR & Umum': 'HR & Umum',
  };
  return map[name] || name;
}

export interface DepartmentBudgetCheckResult {
  department: string;
  companyId: CompanyId;
  monthKey: string;
  monthLabel: string;
  monthlyBudget: number;
  actualSpent: number;
  advanceSpent: number;
  reimbursementSpent: number;
  remainingBudget: number;
  requestedAmount: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  currentUtilizationRate: number;
  projectedUtilizationRate: number;
}

/**
 * Check whether a requested advance or reimbursement amount exceeds
 * the remaining departmental budget for the current month.
 */
export function checkDepartmentBudget({
  department,
  companyId,
  requestedAmount,
  advances,
  reimbursements,
  date,
}: {
  department: string;
  companyId: CompanyId;
  requestedAmount: number;
  advances: CostAdvanceRequest[];
  reimbursements: ReimbursementRequest[];
  date?: string;
}): DepartmentBudgetCheckResult {
  const targetDate = date ? new Date(date) : new Date();
  const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;
  const monthKey = validDate.toISOString().slice(0, 7); // e.g. '2026-10'

  let monthLabel = monthKey;
  try {
    monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(validDate);
  } catch {
    monthLabel = monthKey;
  }

  const monthlyBudget = getDepartmentBudgetLimit(department, companyId);
  const normDept = department.trim().toLowerCase();

  // Filter advances in the current period for this department and company (excluding rejected)
  const deptAdvances = advances.filter(a => {
    const matchCompany = a.companyId === companyId;
    const matchPeriod = (a.requestDate || '').startsWith(monthKey);
    const notRejected = a.status !== 'REJECTED';
    const matchDept =
      a.applicantDepartment?.trim().toLowerCase() === normDept ||
      (a.costCenter && a.costCenter.toLowerCase().includes(normDept.slice(0, 3)));
    return matchCompany && matchPeriod && notRejected && matchDept;
  });

  // Filter reimbursements in the current period for this department and company (excluding rejected)
  const deptReimbursements = reimbursements.filter(r => {
    const matchCompany = r.companyId === companyId;
    const matchPeriod = (r.requestDate || '').startsWith(monthKey);
    const notRejected = r.status !== 'REJECTED';
    const matchDept =
      r.applicantDepartment?.trim().toLowerCase() === normDept ||
      (r.costCenter && r.costCenter.toLowerCase().includes(normDept.slice(0, 3)));
    return matchCompany && matchPeriod && notRejected && matchDept;
  });

  const advanceSpent = deptAdvances.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
  const reimbursementSpent = deptReimbursements.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const actualSpent = advanceSpent + reimbursementSpent;

  const remainingBudget = Math.max(0, monthlyBudget - actualSpent);
  const isOverBudget = requestedAmount > remainingBudget && requestedAmount > 0;
  const overBudgetAmount = isOverBudget ? requestedAmount - remainingBudget : 0;

  const currentUtilizationRate = monthlyBudget > 0 ? (actualSpent / monthlyBudget) * 100 : 0;
  const projectedTotal = actualSpent + (requestedAmount > 0 ? requestedAmount : 0);
  const projectedUtilizationRate = monthlyBudget > 0 ? (projectedTotal / monthlyBudget) * 100 : 0;

  return {
    department,
    companyId,
    monthKey,
    monthLabel,
    monthlyBudget,
    actualSpent,
    advanceSpent,
    reimbursementSpent,
    remainingBudget,
    requestedAmount,
    isOverBudget,
    overBudgetAmount,
    currentUtilizationRate: Math.round(currentUtilizationRate * 10) / 10,
    projectedUtilizationRate: Math.round(projectedUtilizationRate * 10) / 10,
  };
}
