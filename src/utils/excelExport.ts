import * as XLSX from 'xlsx';
import {
  CostAdvanceRequest,
  ReimbursementRequest,
  AdvanceSettlement,
  ExpenseCategory,
  CompanyId,
  ExpenseItem,
} from '../types/finance';
import { CATEGORY_LABELS, getAdvanceStatusInfo, getReimbursementStatusInfo, checkIsOverdue } from './formatters';

interface ExportFinancialDataOptions {
  advances: CostAdvanceRequest[];
  reimbursements: ReimbursementRequest[];
  settlements: AdvanceSettlement[];
  selectedCompany: CompanyId | 'ALL';
  currentUserName: string;
  currentUserRole: string;
}

export function exportFinancialDataToExcel({
  advances,
  reimbursements,
  settlements,
  selectedCompany,
  currentUserName,
  currentUserRole,
}: ExportFinancialDataOptions): string {
  // Create a new workbook
  const wb = XLSX.utils.book_new();

  const companyTitle =
    selectedCompany === 'ALL'
      ? 'PT AMS & PT AMI (Konsolidasi Holding)'
      : selectedCompany === 'AMS'
      ? 'PT ANUGERAH MITRA SEJAHTERA (PT AMS)'
      : 'PT ANUGERAH MANDIRI INVESTAMA (PT AMI)';

  const todayStr = new Date().toISOString().split('T')[0];
  const printTimestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  /* ----------------------------------------------------
   * 1. SHEET: RINGKASAN & KPI (Financial Summary)
   * ---------------------------------------------------- */
  const totalAdvancesNominal = advances.reduce((sum, a) => sum + a.totalAmount, 0);
  const disbursedAdvances = advances.filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT');
  const disbursedNominal = disbursedAdvances.reduce((sum, a) => sum + a.totalAmount, 0);
  const settledAdvances = advances.filter(a => a.status === 'SETTLED');
  const settledNominal = settledAdvances.reduce((sum, a) => sum + a.totalAmount, 0);

  const totalReimbNominal = reimbursements.reduce((sum, r) => sum + r.totalAmount, 0);
  const paidReimb = reimbursements.filter(r => r.status === 'PAID');
  const paidReimbNominal = paidReimb.reduce((sum, r) => sum + r.totalAmount, 0);

  // Aging calculation
  const now = new Date().getTime();
  const agingCurrent = disbursedAdvances.filter(a => {
    const diffDays = Math.floor((now - new Date(a.requestDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  });
  const agingWarning = disbursedAdvances.filter(a => {
    const diffDays = Math.floor((now - new Date(a.requestDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 7 && diffDays <= 14;
  });
  const agingOverdue = disbursedAdvances.filter(a => {
    const diffDays = Math.floor((now - new Date(a.requestDate).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 14;
  });

  // Category breakdown
  const categoryTotals: Record<ExpenseCategory, number> = {
    TRANSPORT: 0,
    MEALS: 0,
    ACCOMMODATION: 0,
    OFFICE_SUPPLIES: 0,
    FIELD_OPERATIONS: 0,
    CLIENT_ENTERTAINMENT: 0,
    MEDICAL: 0,
    TOOLS_EQUIPMENT: 0,
    OTHER: 0,
  };

  advances.forEach(a => {
    a.items.forEach((it: ExpenseItem) => {
      categoryTotals[it.category] = (categoryTotals[it.category] || 0) + it.total;
    });
  });

  reimbursements.forEach(r => {
    r.items.forEach((it: ExpenseItem) => {
      categoryTotals[it.category] = (categoryTotals[it.category] || 0) + it.total;
    });
  });

  const totalAllExpenses = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  const summaryRows: (string | number)[][] = [
    ['LAPORAN REKAPITULASI KEUANGAN - COST ADVANCE & REIMBURSEMENT'],
    [`Entitas / Perusahaan: ${companyTitle}`],
    [`Tanggal Ekspor: ${printTimestamp}`],
    [`Diekspor Oleh: ${currentUserName} (${currentUserRole})`],
    [],
    ['I. RINGKASAN TRANSAKSI UTAMA'],
    ['Kategori Transaksi', 'Jumlah Berkas', 'Total Nominal (IDR)', 'Keterangan'],
    ['Total Pengajuan Cost Advance', advances.length, totalAdvancesNominal, 'Semua permohonan kasbon dalam sistem'],
    ['Kasbon Aktif / Telah Dicairkan (Outstanding)', disbursedAdvances.length, disbursedNominal, 'Dana sudah diserahkan ke staf'],
    ['Kasbon Selesai LPJ (Settled & Lunas)', settledAdvances.length, settledNominal, 'Pertanggungjawaban terverifikasi penuh'],
    ['Total Pengajuan Reimbursement', reimbursements.length, totalReimbNominal, 'Semua klaim penggantian operasional'],
    ['Reimbursement Lunas Dibayarkan', paidReimb.length, paidReimbNominal, 'Klaim telah ditransfer ke pemohon'],
    ['Total Arus Kas Keluar (Disbursed + Paid Reimb)', disbursedAdvances.length + paidReimb.length, disbursedNominal + paidReimbNominal, 'Realisasi kas/bank keluar'],
    [],
    ['II. ANALISIS AGING KASBON GANTUNG (OUTSTANDING ADVANCE)'],
    ['Rentang Umur Kasbon', 'Jumlah Dokumen', 'Total Nominal (IDR)', 'Tingkat Risiko', 'Tindakan Finance'],
    ['0 - 7 Hari (Lancar)', agingCurrent.length, agingCurrent.reduce((s, a) => s + a.totalAmount, 0), 'Rendah', 'Dalam batas wajar durasi operasional'],
    ['8 - 14 Hari (Perlu Follow-up)', agingWarning.length, agingWarning.reduce((s, a) => s + a.totalAmount, 0), 'Sedang', 'Finance kirim reminder penyerahan nota LPJ'],
    ['> 14 Hari (Jatuh Tempo / Overdue)', agingOverdue.length, agingOverdue.reduce((s, a) => s + a.totalAmount, 0), 'Tinggi', 'Peringatan keras & potensi pemotongan payroll'],
    [],
    ['III. DISTRIBUSI PENGELUARAN BERDASARKAN KATEGORI BEBAN'],
    ['Kategori Beban', 'Total Nilai (IDR)', 'Porsi Persentase (%)'],
  ];

  (Object.keys(categoryTotals) as ExpenseCategory[]).forEach(catKey => {
    const val = categoryTotals[catKey];
    const pct = totalAllExpenses > 0 ? Number(((val / totalAllExpenses) * 100).toFixed(2)) : 0;
    summaryRows.push([CATEGORY_LABELS[catKey], val, `${pct}%`]);
  });
  summaryRows.push(['TOTAL KESELURUHAN BEBAN', totalAllExpenses, '100%']);

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 38 },
    { wch: 22 },
    { wch: 24 },
    { wch: 18 },
    { wch: 45 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Eksekutif');

  /* ----------------------------------------------------
   * 2. SHEET: COST ADVANCE (Kasbon)
   * ---------------------------------------------------- */
  const advanceHeaders = [
    'No',
    'Kode Kasbon',
    'Perusahaan',
    'Nama Pemohon',
    'Departemen',
    'Cost Center',
    'Tanggal Pengajuan',
    'Tanggal Diperlukan',
    'Batas Akhir LPJ',
    'Tujuan / Keperluan',
    'Metode Bayar',
    'Bank Tujuan',
    'No Rekening',
    'Pemilik Rekening',
    'Nominal Kasbon (IDR)',
    'Status Kasbon',
    'Status LPJ',
    'Tanggal Dicairkan',
    'Jumlah Item',
  ];

  const advanceRows: (string | number)[][] = [advanceHeaders];

  advances.forEach((adv, idx) => {
    const statusInfo = getAdvanceStatusInfo(adv.status);
    const isOverdue = adv.status === 'PENDING_SETTLEMENT' && checkIsOverdue(adv.settlementDeadlineDate);
    const lpjStatus =
      adv.status === 'SETTLED'
        ? 'Lunas & Diverifikasi'
        : adv.settlementId
        ? 'Sedang Diverifikasi Finance'
        : isOverdue
        ? 'OVERDUE (Terlambat LPJ)'
        : adv.status === 'DISBURSED' || adv.status === 'PENDING_SETTLEMENT'
        ? 'Menunggu Penyerahan Nota'
        : 'Belum Dicairkan';

    advanceRows.push([
      idx + 1,
      adv.code,
      `PT ${adv.companyId}`,
      adv.applicantName,
      adv.applicantDepartment,
      adv.costCenter,
      adv.requestDate,
      adv.requiredDate,
      adv.settlementDeadlineDate,
      adv.purpose,
      adv.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Kas Kecil (Cash)',
      adv.applicantBankAccount?.bankName || '-',
      adv.applicantBankAccount?.accountNumber || '-',
      adv.applicantBankAccount?.accountHolder || '-',
      adv.totalAmount,
      statusInfo.label,
      lpjStatus,
      adv.disbursementDetails?.disbursedDate || '-',
      adv.items.length,
    ]);
  });

  const wsAdvance = XLSX.utils.aoa_to_sheet(advanceRows);
  wsAdvance['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 35 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsAdvance, 'Cost Advance');

  /* ----------------------------------------------------
   * 3. SHEET: REIMBURSEMENT (Klaim)
   * ---------------------------------------------------- */
  const reimbHeaders = [
    'No',
    'Kode Klaim',
    'Perusahaan',
    'Nama Pemohon',
    'Departemen',
    'Cost Center',
    'Tanggal Pengajuan',
    'Tujuan / Keterangan',
    'Bank Pembayaran',
    'No Rekening',
    'Pemilik Rekening',
    'Total Klaim (IDR)',
    'Status Klaim',
    'Tanggal Dibayar',
    'Jumlah Bukti / Nota',
  ];

  const reimbRows: (string | number)[][] = [reimbHeaders];

  reimbursements.forEach((rb, idx) => {
    const statusInfo = getReimbursementStatusInfo(rb.status);

    reimbRows.push([
      idx + 1,
      rb.code,
      `PT ${rb.companyId}`,
      rb.applicantName,
      rb.applicantDepartment,
      rb.costCenter,
      rb.requestDate,
      rb.purpose,
      rb.applicantBankAccount?.bankName || '-',
      rb.applicantBankAccount?.accountNumber || '-',
      rb.applicantBankAccount?.accountHolder || '-',
      rb.totalAmount,
      statusInfo.label,
      rb.paymentDetails?.paidDate || '-',
      rb.items.length,
    ]);
  });

  const wsReimb = XLSX.utils.aoa_to_sheet(reimbRows);
  wsReimb['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 35 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReimb, 'Reimbursement');

  /* ----------------------------------------------------
   * 4. SHEET: DETAIL RINCIAN NOTA & ITEM BIAYA
   * ---------------------------------------------------- */
  const itemHeaders = [
    'No',
    'Tipe Dokumen',
    'Kode Dokumen Induk',
    'Perusahaan',
    'Pemohon',
    'Departemen',
    'Tanggal Dokumen',
    'Deskripsi Item Biaya',
    'Kategori Beban',
    'Kuantitas',
    'Harga Satuan (IDR)',
    'Subtotal (IDR)',
    'No Bukti / Kuitansi',
    'Status Dokumen Induk',
  ];

  const itemRows: (string | number)[][] = [itemHeaders];
  let itemCounter = 1;

  advances.forEach(a => {
    const statusInfo = getAdvanceStatusInfo(a.status);
    a.items.forEach((it: ExpenseItem) => {
      itemRows.push([
        itemCounter++,
        'Cost Advance',
        a.code,
        `PT ${a.companyId}`,
        a.applicantName,
        a.applicantDepartment,
        a.requestDate,
        it.description,
        CATEGORY_LABELS[it.category] || it.category,
        it.quantity,
        it.unitPrice,
        it.total,
        it.receiptNumber || '-',
        statusInfo.label,
      ]);
    });
  });

  reimbursements.forEach(r => {
    const statusInfo = getReimbursementStatusInfo(r.status);
    r.items.forEach((it: ExpenseItem) => {
      itemRows.push([
        itemCounter++,
        'Reimbursement',
        r.code,
        `PT ${r.companyId}`,
        r.applicantName,
        r.applicantDepartment,
        r.requestDate,
        it.description,
        CATEGORY_LABELS[it.category] || it.category,
        it.quantity,
        it.unitPrice,
        it.total,
        it.receiptNumber || '-',
        statusInfo.label,
      ]);
    });
  });

  const wsItems = XLSX.utils.aoa_to_sheet(itemRows);
  wsItems['!cols'] = [
    { wch: 5 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 35 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Rincian Item & Nota');

  /* ----------------------------------------------------
   * 5. SHEET: PERTANGGUNGJAWABAN (Settlement LPJ)
   * ---------------------------------------------------- */
  const settlementHeaders = [
    'No',
    'Kode LPJ',
    'Kode Kasbon Terkait',
    'Perusahaan',
    'Pemohon',
    'Tanggal LPJ',
    'Total Kasbon Diterima (IDR)',
    'Total Realisasi Pengeluaran (IDR)',
    'Selisih Lebih / Kurang (IDR)',
    'Status Selisih',
    'Status LPJ',
    'Catatan / Keterangan',
  ];

  const settlementRows: (string | number)[][] = [settlementHeaders];

  settlements.forEach((s, idx) => {
    const diffType =
      s.varianceType === 'EXACT_MATCH' || s.difference === 0
        ? 'PAS (Nihil)'
        : s.varianceType === 'REIMBURSE_TO_EMPLOYEE'
        ? 'KURANG BAYAR (Perusahaan ganti ke karyawan)'
        : 'LEBIH BAYAR (Karyawan kembalikan ke kasir)';

    settlementRows.push([
      idx + 1,
      s.code,
      s.advanceCode,
      `PT ${s.companyId}`,
      s.applicantName,
      s.settlementDate,
      s.advanceAmount,
      s.totalActualAmount,
      s.difference,
      diffType,
      s.status === 'VERIFIED' ? 'Terverifikasi (Lunas Selesai)' : 'Menunggu Review Finance',
      s.notes || '-',
    ]);
  });

  const wsSettlements = XLSX.utils.aoa_to_sheet(settlementRows);
  wsSettlements['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 18 },
    { wch: 12 },
    { wch: 20 },
    { wch: 16 },
    { wch: 24 },
    { wch: 26 },
    { wch: 24 },
    { wch: 35 },
    { wch: 26 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSettlements, 'Pertanggungjawaban LPJ');

  // Trigger browser download of .xlsx file
  const fileName = `Laporan_Keuangan_${selectedCompany}_${todayStr}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return fileName;
}
