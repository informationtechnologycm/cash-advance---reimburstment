import { AdvanceStatus, ReimbursementStatus, SettlementStatus, ExpenseCategory } from '../types/finance';

/**
 * Format number to Indonesian Rupiah currency format
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO date string into Indonesian readable format
 * e.g. "2026-10-06" -> "06 Okt 2026"
 */
export function formatDateIndo(dateStr: string | null | undefined, includeTime = false): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Indonesian Terbilang converter (e.g. 1250000 -> "Satu Juta Dua Ratus Lima Puluh Ribu Rupiah")
 */
const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function bilang(n: number): string {
  n = Math.floor(n);
  if (n < 12) {
    return ' ' + SATUAN[n];
  } else if (n < 20) {
    return bilang(n - 10) + ' Belas';
  } else if (n < 100) {
    return bilang(Math.floor(n / 10)) + ' Puluh' + bilang(n % 10);
  } else if (n < 200) {
    return ' Seratus' + bilang(n - 100);
  } else if (n < 1000) {
    return bilang(Math.floor(n / 100)) + ' Ratus' + bilang(n % 100);
  } else if (n < 2000) {
    return ' Seribu' + bilang(n - 1000);
  } else if (n < 1000000) {
    return bilang(Math.floor(n / 1000)) + ' Ribu' + bilang(n % 1000);
  } else if (n < 1000000000) {
    return bilang(Math.floor(n / 1000000)) + ' Juta' + bilang(n % 1000000);
  } else if (n < 1000000000000) {
    return bilang(Math.floor(n / 1000000000)) + ' Milyar' + bilang(n % 1000000000);
  }
  return '';
}

export function terbilang(nominal: number): string {
  if (nominal === 0) return 'Nol Rupiah';
  if (nominal < 0) return 'Minus' + bilang(Math.abs(nominal)) + ' Rupiah';
  return (bilang(nominal).trim() + ' Rupiah').replace(/\s+/g, ' ');
}

/**
 * Category friendly names
 */
export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  TRANSPORT: 'BBM, Tol & Transportasi',
  MEALS: 'Konsumsi & Makan Lapangan',
  ACCOMMODATION: 'Penginapan / Hotel',
  OFFICE_SUPPLIES: 'ATK & Keperluan Kantor',
  FIELD_OPERATIONS: 'Operasional Lapangan & Sewa',
  CLIENT_ENTERTAINMENT: 'Representasi & Klien',
  MEDICAL: 'Klaim Kesehatan & Medis',
  TOOLS_EQUIPMENT: 'Alat Kerja & Peralatan',
  OTHER: 'Biaya Lain-Lain',
};

/**
 * Advance status translations and text styling
 */
export function getAdvanceStatusInfo(status: AdvanceStatus): {
  label: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
  description: string;
} {
  switch (status) {
    case 'DRAFT':
      return {
        label: 'Draf',
        textColor: 'text-slate-600',
        bgLight: 'bg-slate-100',
        borderColor: 'border-slate-300',
        description: 'Pengajuan belum diserahkan',
      };
    case 'PENDING_MANAGER':
      return {
        label: 'Review Manager',
        textColor: 'text-amber-700',
        bgLight: 'bg-amber-50',
        borderColor: 'border-amber-200',
        description: 'Menunggu persetujuan Manager Departemen',
      };
    case 'PENDING_FINANCE':
      return {
        label: 'Verifikasi Finance',
        textColor: 'text-blue-700',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: 'Menunggu verifikasi Finance & Akunting',
      };
    case 'PENDING_DIRECTOR':
      return {
        label: 'Approval Direktur',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-50',
        borderColor: 'border-purple-200',
        description: 'Nominal > Rp 15jt, menunggu tanda tangan Direksi',
      };
    case 'APPROVED':
      return {
        label: 'Siap Dicairkan',
        textColor: 'text-indigo-700',
        bgLight: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        description: 'Disetujui, menunggu pembayaran kas/transfer',
      };
    case 'DISBURSED':
      return {
        label: 'Kasbon Aktif (Dicairkan)',
        textColor: 'text-emerald-700',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        description: 'Dana telah dicairkan, kegiatan sedang berlangsung',
      };
    case 'PENDING_SETTLEMENT':
      return {
        label: 'Perlu Settlement',
        textColor: 'text-amber-800',
        bgLight: 'bg-amber-100',
        borderColor: 'border-amber-300',
        description: 'Kegiatan selesai, nota & kuitansi harus dilaporkan',
      };
    case 'SETTLED':
      return {
        label: 'Selesai (Lunas)',
        textColor: 'text-emerald-800',
        bgLight: 'bg-emerald-100',
        borderColor: 'border-emerald-300',
        description: 'Pertanggungjawaban terverifikasi dan ditutup',
      };
    case 'REJECTED':
      return {
        label: 'Ditolak',
        textColor: 'text-rose-700',
        bgLight: 'bg-rose-50',
        borderColor: 'border-rose-200',
        description: 'Pengajuan ditolak oleh approver',
      };
  }
}

/**
 * Reimbursement status translations
 */
export function getReimbursementStatusInfo(status: ReimbursementStatus): {
  label: string;
  textColor: string;
  bgLight: string;
  borderColor: string;
} {
  switch (status) {
    case 'DRAFT':
      return { label: 'Draf', textColor: 'text-slate-600', bgLight: 'bg-slate-100', borderColor: 'border-slate-300' };
    case 'PENDING_MANAGER':
      return { label: 'Review Manager', textColor: 'text-amber-700', bgLight: 'bg-amber-50', borderColor: 'border-amber-200' };
    case 'PENDING_FINANCE':
      return { label: 'Review Finance', textColor: 'text-blue-700', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' };
    case 'APPROVED':
      return { label: 'Disetujui', textColor: 'text-indigo-700', bgLight: 'bg-indigo-50', borderColor: 'border-indigo-200' };
    case 'PAID':
      return { label: 'Dibayarkan', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' };
    case 'REJECTED':
      return { label: 'Ditolak', textColor: 'text-rose-700', bgLight: 'bg-rose-50', borderColor: 'border-rose-200' };
  }
}

/**
 * Check if a date is overdue compared to today
 */
export function checkIsOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(23, 59, 59, 999);
  return target.getTime() < now.getTime();
}
