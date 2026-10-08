import { jsPDF } from 'jspdf';
import {
  CostAdvanceRequest,
  ReimbursementRequest,
  CompanyId,
  AdvanceStatus,
  ReimbursementStatus,
} from '../types/finance';
import { COMPANIES } from '../data/initialData';
import {
  formatRupiah,
  formatDateIndo,
  getAdvanceStatusInfo,
  getReimbursementStatusInfo,
} from './formatters';

export interface ExportAuditMeta {
  selectedCompany: 'ALL' | CompanyId;
  currentUserName: string;
  currentUserRole: string;
  searchQuery?: string;
  requestorQuery?: string;
  statusFilter?: string;
  startDate?: string;
  endDate?: string;
  isOnlyMine?: boolean;
}

/**
 * Clean and escape CSV cells to prevent Excel formula injection and handle quotes/commas
 */
function escapeCSV(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Prevent formula injection in Excel (e.g. =+@-)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Replace quotes with double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Trigger download of a text/csv file with UTF-8 BOM so Excel opens with proper Indonesian formatting
 */
function downloadCSV(csvContent: string, fileName: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Cost Advances table to CSV
 */
export function exportCostAdvancesToCSV(
  advances: CostAdvanceRequest[],
  meta: ExportAuditMeta
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const companyLabel =
    meta.selectedCompany === 'ALL'
      ? 'Konsolidasi (PT AMS & PT AMI)'
      : meta.selectedCompany === 'AMS'
      ? 'PT Anugerah Mitra Sejahtera (AMS)'
      : 'PT Anugerah Mandiri Investama (AMI)';

  const headers = [
    'No',
    'Nomor Dokumen (Kode)',
    'Badan Usaha (Entitas)',
    'Tanggal Pengajuan',
    'Tanggal Dibutuhkan',
    'Batas Waktu LPJ',
    'Nama Pemohon',
    'Departemen / Divisi',
    'Jabatan',
    'Keperluan / Tujuan Kasbon',
    'Cost Center / Proyek',
    'Nominal Kasbon (IDR)',
    'Status Approval',
    'Metode Pembayaran',
    'Bank Pemohon',
    'Nomor Rekening',
    'Nama Pemilik Rekening',
    'Status Pencairan',
    'Tanggal Pencairan',
    'Dicairkan Oleh',
    'Bank Sumber Pencairan',
    'No Referensi Transfer',
    'ID Penyelesaian (LPJ)',
    'Alasan Penolakan',
    'Catatan / Approver Terakhir',
  ];

  const rows = advances.map((adv, index) => {
    const statusInfo = getAdvanceStatusInfo(adv.status);
    const lastHistory = adv.approvalHistory && adv.approvalHistory.length > 0
      ? adv.approvalHistory[adv.approvalHistory.length - 1]
      : null;
    const approverNote = lastHistory
      ? `${lastHistory.action} oleh ${lastHistory.actorName} (${lastHistory.actorRoleLabel || lastHistory.actorRole}) - ${lastHistory.timestamp}`
      : '-';

    const disbursementStatus =
      adv.status === 'SETTLED'
        ? 'Lunas LPJ Tuntas'
        : adv.status === 'PENDING_SETTLEMENT' || adv.status === 'DISBURSED'
        ? 'Telah Dicairkan (Kasbon Aktif)'
        : adv.status === 'APPROVED'
        ? 'Disetujui (Menunggu Pencairan)'
        : adv.status === 'REJECTED'
        ? 'Ditolak'
        : 'Menunggu Persetujuan';

    return [
      escapeCSV(index + 1),
      escapeCSV(adv.code),
      escapeCSV(`PT ${adv.companyId}`),
      escapeCSV(adv.requestDate),
      escapeCSV(adv.requiredDate || '-'),
      escapeCSV(adv.settlementDeadlineDate || '-'),
      escapeCSV(adv.applicantName),
      escapeCSV(adv.applicantDepartment),
      escapeCSV(adv.jobTitle || '-'),
      escapeCSV(adv.purpose),
      escapeCSV(adv.costCenter),
      escapeCSV(adv.totalAmount),
      escapeCSV(statusInfo.label),
      escapeCSV(adv.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Petty Cash'),
      escapeCSV(adv.applicantBankAccount?.bankName || '-'),
      escapeCSV(adv.applicantBankAccount?.accountNumber || '-'),
      escapeCSV(adv.applicantBankAccount?.accountHolder || '-'),
      escapeCSV(disbursementStatus),
      escapeCSV(adv.disbursementDetails?.disbursedDate || '-'),
      escapeCSV(adv.disbursementDetails?.disbursedBy || '-'),
      escapeCSV(adv.disbursementDetails?.sourceBank || '-'),
      escapeCSV(adv.disbursementDetails?.referenceNumber || '-'),
      escapeCSV(adv.settlementId || '-'),
      escapeCSV(adv.rejectionReason || '-'),
      escapeCSV(approverNote),
    ].join(',');
  });

  // Include audit report summary banner at the top of the CSV file
  const metaLines = [
    `# LAPORAN AUDIT KEUANGAN - DAFTAR BIAYA UANG MUKA (COST ADVANCE)`,
    `# Entitas: ${companyLabel}`,
    `# Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`,
    `# Auditor / Pengunduh: ${meta.currentUserName} (${meta.currentUserRole})`,
    `# Total Baris: ${advances.length} pengajuan`,
    `# Total Akumulasi Nilai: Rp ${advances.reduce((sum, a) => sum + a.totalAmount, 0).toLocaleString('id-ID')}`,
    ...(meta.statusFilter && meta.statusFilter !== 'ALL' ? [`# Filter Status: ${meta.statusFilter}`] : []),
    ...(meta.startDate || meta.endDate ? [`# Filter Periode: ${meta.startDate || 'Awal'} s/d ${meta.endDate || 'Sekarang'}`] : []),
    ...(meta.requestorQuery ? [`# Filter Pemohon: ${meta.requestorQuery}`] : []),
    '',
  ];

  const fullCSV = metaLines.join('\n') + headers.join(',') + '\n' + rows.join('\n');
  const fileName = `Audit_CostAdvance_${meta.selectedCompany}_${todayStr}.csv`;
  downloadCSV(fullCSV, fileName);
}

/**
 * Export Reimbursement table to CSV
 */
export function exportReimbursementsToCSV(
  reimbursements: ReimbursementRequest[],
  meta: ExportAuditMeta
) {
  const todayStr = new Date().toISOString().split('T')[0];
  const companyLabel =
    meta.selectedCompany === 'ALL'
      ? 'Konsolidasi (PT AMS & PT AMI)'
      : meta.selectedCompany === 'AMS'
      ? 'PT Anugerah Mitra Sejahtera (AMS)'
      : 'PT Anugerah Mandiri Investama (AMI)';

  const headers = [
    'No',
    'Nomor Dokumen (Kode)',
    'Badan Usaha (Entitas)',
    'Tanggal Pengajuan Klaim',
    'Nama Pemohon',
    'Departemen / Divisi',
    'Jabatan',
    'Keperluan / Tujuan Klaim',
    'Cost Center / Proyek',
    'Jumlah Item Biaya',
    'Total Nominal Klaim (IDR)',
    'Status Approval',
    'Bank Pemohon',
    'Nomor Rekening',
    'Nama Pemilik Rekening',
    'Status Pembayaran',
    'Tanggal Pembayaran',
    'Dibayarkan Oleh',
    'Bank Sumber Pembayaran',
    'No Referensi Transfer',
    'Alasan Penolakan',
    'Catatan / Approver Terakhir',
  ];

  const rows = reimbursements.map((rb, index) => {
    const statusInfo = getReimbursementStatusInfo(rb.status);
    const lastHistory = rb.approvalHistory && rb.approvalHistory.length > 0
      ? rb.approvalHistory[rb.approvalHistory.length - 1]
      : null;
    const approverNote = lastHistory
      ? `${lastHistory.action} oleh ${lastHistory.actorName} (${lastHistory.actorRoleLabel || lastHistory.actorRole}) - ${lastHistory.timestamp}`
      : '-';

    const paymentStatus =
      rb.status === 'PAID'
        ? 'Lunas Dibayarkan'
        : rb.status === 'APPROVED'
        ? 'Disetujui (Siap Bayar)'
        : rb.status === 'REJECTED'
        ? 'Ditolak'
        : 'Dalam Proses Verifikasi';

    return [
      escapeCSV(index + 1),
      escapeCSV(rb.code),
      escapeCSV(`PT ${rb.companyId}`),
      escapeCSV(rb.requestDate),
      escapeCSV(rb.applicantName),
      escapeCSV(rb.applicantDepartment),
      escapeCSV(rb.jobTitle || '-'),
      escapeCSV(rb.purpose),
      escapeCSV(rb.costCenter),
      escapeCSV(rb.items?.length || 0),
      escapeCSV(rb.totalAmount),
      escapeCSV(statusInfo.label),
      escapeCSV(rb.applicantBankAccount?.bankName || '-'),
      escapeCSV(rb.applicantBankAccount?.accountNumber || '-'),
      escapeCSV(rb.applicantBankAccount?.accountHolder || '-'),
      escapeCSV(paymentStatus),
      escapeCSV(rb.paymentDetails?.paidDate || '-'),
      escapeCSV(rb.paymentDetails?.paidBy || '-'),
      escapeCSV(rb.paymentDetails?.sourceBank || '-'),
      escapeCSV(rb.paymentDetails?.referenceNumber || '-'),
      escapeCSV(rb.rejectionReason || '-'),
      escapeCSV(approverNote),
    ].join(',');
  });

  const metaLines = [
    `# LAPORAN AUDIT KEUANGAN - DAFTAR KLAIM REIMBURSEMENT OPERASIONAL`,
    `# Entitas: ${companyLabel}`,
    `# Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`,
    `# Auditor / Pengunduh: ${meta.currentUserName} (${meta.currentUserRole})`,
    `# Total Baris: ${reimbursements.length} klaim`,
    `# Total Akumulasi Nilai: Rp ${reimbursements.reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString('id-ID')}`,
    ...(meta.statusFilter && meta.statusFilter !== 'ALL' ? [`# Filter Status: ${meta.statusFilter}`] : []),
    ...(meta.startDate || meta.endDate ? [`# Filter Periode: ${meta.startDate || 'Awal'} s/d ${meta.endDate || 'Sekarang'}`] : []),
    ...(meta.requestorQuery ? [`# Filter Pemohon: ${meta.requestorQuery}`] : []),
    '',
  ];

  const fullCSV = metaLines.join('\n') + headers.join(',') + '\n' + rows.join('\n');
  const fileName = `Audit_Reimbursement_${meta.selectedCompany}_${todayStr}.csv`;
  downloadCSV(fullCSV, fileName);
}

/**
 * Export Cost Advances to Official Audit PDF Document (A4 Landscape)
 */
export function exportCostAdvancesToPDF(
  advances: CostAdvanceRequest[],
  meta: ExportAuditMeta
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 273mm

  const company =
    meta.selectedCompany === 'AMS'
      ? COMPANIES.AMS
      : meta.selectedCompany === 'AMI'
      ? COMPANIES.AMI
      : null;

  const entityTitle = company
    ? company.fullName
    : 'PT ANUGERAH MITRA SEJAHTERA & PT ANUGERAH MANDIRI INVESTAMA';
  const entitySubtitle = company
    ? `${company.address} · Telp: ${company.phone} · NPWP: ${company.npwp}`
    : 'KONSOLIDASI GRUP USAHA (HOLDING FINANCIAL REPORT & AUDIT TRAIL)';

  const todayStr = new Date().toISOString().split('T')[0];
  const auditDocRef = `AUD-CA-${todayStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let currentPage = 1;
  let totalPages = 1; // Will calculate or use standard jsPDF pages

  // Table Column Definitions (Total = 273mm)
  const cols = [
    { header: 'No', width: 9, align: 'center' as const },
    { header: 'No. Dokumen', width: 28, align: 'left' as const },
    { header: 'Ent.', width: 11, align: 'center' as const },
    { header: 'Tanggal', width: 20, align: 'left' as const },
    { header: 'Pemohon / Divisi', width: 44, align: 'left' as const },
    { header: 'Keperluan & Cost Center', width: 63, align: 'left' as const },
    { header: 'Status Approval', width: 34, align: 'left' as const },
    { header: 'Status LPJ / Kasbon', width: 34, align: 'left' as const },
    { header: 'Nominal (Rp)', width: 30, align: 'right' as const },
  ];

  const totalAdvanceNominal = advances.reduce((sum, a) => sum + a.totalAmount, 0);

  // Helper to draw document header on each page
  const drawPageHeader = (pageNum: number) => {
    let y = margin;

    // Corporate Letterhead Bar
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(entityTitle, margin, y);

    // Right-aligned report code
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Doc Ref: ${auditDocRef}`, pageWidth - margin, y, { align: 'right' });

    y += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(entitySubtitle, margin, y);

    // Right-aligned print timestamp
    doc.text(
      `Tanggal Cetak: ${formatDateIndo(todayStr)} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;

    // Title banner (Only on page 1 full, compact on next pages)
    if (pageNum === 1) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(
        'LAPORAN AUDIT KEUANGAN: REKAPITULASI BIAYA UANG MUKA (COST ADVANCE)',
        margin + 4,
        y + 5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const filterSummary = [
        `Entitas: ${meta.selectedCompany === 'ALL' ? 'Semua (AMS & AMI)' : meta.selectedCompany}`,
        meta.statusFilter && meta.statusFilter !== 'ALL' ? `Status: ${meta.statusFilter}` : 'Status: Semua',
        meta.startDate || meta.endDate ? `Periode: ${meta.startDate || 'Awal'} s/d ${meta.endDate || 'Sekarang'}` : 'Periode: Semua Periode',
        meta.requestorQuery ? `Pemohon: ${meta.requestorQuery}` : null,
      ].filter(Boolean).join(' | ');

      doc.text(`Parameter Filter: ${filterSummary}`, margin + 4, y + 9.5);

      // KPI box on right of banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `Total: ${advances.length} Pengajuan | Akumulasi: ${formatRupiah(totalAdvanceNominal)}`,
        pageWidth - margin - 4,
        y + 7.5,
        { align: 'right' }
      );

      y += 18;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'LAPORAN AUDIT: REKAPITULASI COST ADVANCE (Lanjutan)',
        margin,
        y + 1
      );
      y += 6;
    }

    // Table Header Row
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = margin;
    cols.forEach(col => {
      const textX =
        col.align === 'center'
          ? x + col.width / 2
          : col.align === 'right'
          ? x + col.width - 2
          : x + 2;
      doc.text(col.header, textX, y + 4.5, { align: col.align });
      x += col.width;
    });

    y += 7;
    return y;
  };

  // Draw Page Footer
  const drawPageFooter = (pageNum: number) => {
    const y = pageHeight - 7;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen ini dicetak otomatis dari Sistem Keuangan Operasional PT AMS & PT AMI · Auditor: ${meta.currentUserName} (${meta.currentUserRole})`,
      margin,
      y + 1.5
    );

    doc.text(`Halaman ${pageNum}`, pageWidth - margin, y + 1.5, { align: 'right' });
  };

  // Render Table Data
  let currentY = drawPageHeader(currentPage);
  const rowHeight = 7.5;

  advances.forEach((adv, index) => {
    // Check if new page needed (leave 35mm for signature box if last item or next page)
    if (currentY + rowHeight > pageHeight - 16) {
      drawPageFooter(currentPage);
      doc.addPage();
      currentPage++;
      currentY = drawPageHeader(currentPage);
    }

    // Alternate row fill
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Light border bottom
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    const statusInfo = getAdvanceStatusInfo(adv.status);
    const lpjStatus =
      adv.status === 'SETTLED'
        ? 'Lunas LPJ'
        : adv.status === 'PENDING_SETTLEMENT' || adv.status === 'DISBURSED'
        ? 'Kasbon Aktif'
        : adv.status === 'APPROVED'
        ? 'Siap Cair'
        : adv.status === 'REJECTED'
        ? 'Ditolak'
        : 'Review';

    let x = margin;

    // 1. No
    doc.text(String(index + 1), x + cols[0].width / 2, currentY + 4.8, { align: 'center' });
    x += cols[0].width;

    // 2. Code (Courier bold)
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.text(adv.code, x + 1.5, currentY + 4.8);
    x += cols[1].width;

    // 3. Entity
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(adv.companyId, x + cols[2].width / 2, currentY + 4.8, { align: 'center' });
    x += cols[2].width;

    // 4. Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(adv.requestDate, x + 1.5, currentY + 4.8);
    x += cols[3].width;

    // 5. Applicant / Dept
    const appText = `${adv.applicantName} (${adv.applicantDepartment})`;
    doc.text(doc.splitTextToSize(appText, cols[4].width - 3)[0] || appText, x + 1.5, currentY + 4.8);
    x += cols[4].width;

    // 6. Purpose & Cost Center
    const purpText = `${adv.purpose} [CC: ${adv.costCenter}]`;
    doc.text(doc.splitTextToSize(purpText, cols[5].width - 3)[0] || purpText, x + 1.5, currentY + 4.8);
    x += cols[5].width;

    // 7. Status Approval
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (adv.status === 'REJECTED') {
      doc.setTextColor(190, 18, 60); // Red
    } else if (adv.status === 'APPROVED' || adv.status === 'DISBURSED' || adv.status === 'SETTLED') {
      doc.setTextColor(16, 120, 70); // Green
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(statusInfo.label, x + 1.5, currentY + 4.8);
    x += cols[6].width;

    // 8. LPJ Status
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(lpjStatus, x + 1.5, currentY + 4.8);
    x += cols[7].width;

    // 9. Nominal (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(adv.totalAmount), x + cols[8].width - 2, currentY + 4.8, { align: 'right' });

    currentY += rowHeight;
  });

  // Grand Total Summary Row
  if (currentY + 12 > pageHeight - 16) {
    drawPageFooter(currentPage);
    doc.addPage();
    currentPage++;
    currentY = drawPageHeader(currentPage);
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`GRAND TOTAL (${advances.length} PENGELUARAN KASBON):`, margin + 4, currentY + 4.8);

  doc.setFontSize(9);
  doc.text(
    formatRupiah(totalAdvanceNominal),
    pageWidth - margin - 2,
    currentY + 4.8,
    { align: 'right' }
  );

  currentY += 12;

  // Audit Verification & Signature Box
  if (currentY + 36 > pageHeight - 10) {
    drawPageFooter(currentPage);
    doc.addPage();
    currentPage++;
    currentY = drawPageHeader(currentPage);
  }

  // 3 Signature Columns for External Audit & Financial Compliance
  const signBoxWidth = (contentWidth - 16) / 3;
  const signBoxHeight = 28;
  const signY = currentY;

  const signers = [
    { title: 'Disiapkan Oleh (Prepared By):', role: 'Staff Akuntansi & Keuangan', name: meta.currentUserName },
    { title: 'Diverifikasi Oleh (Verified By):', role: 'Internal Auditor / Tax Compliance', name: '( .......................................... )' },
    { title: 'Disetujui Oleh (Approved By):', role: 'Finance Manager / Direktur Keuangan', name: '( .......................................... )' },
  ];

  signers.forEach((s, idx) => {
    const sx = margin + idx * (signBoxWidth + 8);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(sx, signY, signBoxWidth, signBoxHeight, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(s.title, sx + 3, signY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Tanggal: ${formatDateIndo(todayStr)}`, sx + 3, signY + 8.5);

    // Signature line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(sx + 4, signY + 22, sx + signBoxWidth - 4, signY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(s.name, sx + signBoxWidth / 2, signY + 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.role, sx + signBoxWidth / 2, signY + 25.5, { align: 'center' });
  });

  drawPageFooter(currentPage);

  // Save the PDF file
  const fileName = `Laporan_Audit_CostAdvance_${meta.selectedCompany}_${todayStr}.pdf`;
  doc.save(fileName);
}

/**
 * Export Reimbursements to Official Audit PDF Document (A4 Landscape)
 */
export function exportReimbursementsToPDF(
  reimbursements: ReimbursementRequest[],
  meta: ExportAuditMeta
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentWidth = pageWidth - margin * 2; // 273mm

  const company =
    meta.selectedCompany === 'AMS'
      ? COMPANIES.AMS
      : meta.selectedCompany === 'AMI'
      ? COMPANIES.AMI
      : null;

  const entityTitle = company
    ? company.fullName
    : 'PT ANUGERAH MITRA SEJAHTERA & PT ANUGERAH MANDIRI INVESTAMA';
  const entitySubtitle = company
    ? `${company.address} · Telp: ${company.phone} · NPWP: ${company.npwp}`
    : 'KONSOLIDASI GRUP USAHA (HOLDING FINANCIAL REPORT & AUDIT TRAIL)';

  const todayStr = new Date().toISOString().split('T')[0];
  const auditDocRef = `AUD-RB-${todayStr.replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  let currentPage = 1;

  // Table Column Definitions (Total = 273mm)
  const cols = [
    { header: 'No', width: 9, align: 'center' as const },
    { header: 'No. Dokumen', width: 28, align: 'left' as const },
    { header: 'Ent.', width: 11, align: 'center' as const },
    { header: 'Tanggal Klaim', width: 22, align: 'left' as const },
    { header: 'Pemohon / Divisi', width: 44, align: 'left' as const },
    { header: 'Keperluan & Cost Center', width: 62, align: 'left' as const },
    { header: 'Status Approval', width: 34, align: 'left' as const },
    { header: 'Status Bayar', width: 33, align: 'left' as const },
    { header: 'Total Klaim (Rp)', width: 30, align: 'right' as const },
  ];

  const totalReimbNominal = reimbursements.reduce((sum, r) => sum + r.totalAmount, 0);

  // Helper to draw document header on each page
  const drawPageHeader = (pageNum: number) => {
    let y = margin;

    // Corporate Letterhead Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, y, contentWidth, 1.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(entityTitle, margin, y);

    // Right-aligned report code
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Doc Ref: ${auditDocRef}`, pageWidth - margin, y, { align: 'right' });

    y += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(entitySubtitle, margin, y);

    // Right-aligned print timestamp
    doc.text(
      `Tanggal Cetak: ${formatDateIndo(todayStr)} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4.5;

    // Title banner
    if (pageNum === 1) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(
        'LAPORAN AUDIT KEUANGAN: REKAPITULASI KLAIM REIMBURSEMENT OPERASIONAL',
        margin + 4,
        y + 5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const filterSummary = [
        `Entitas: ${meta.selectedCompany === 'ALL' ? 'Semua (AMS & AMI)' : meta.selectedCompany}`,
        meta.statusFilter && meta.statusFilter !== 'ALL' ? `Status: ${meta.statusFilter}` : 'Status: Semua',
        meta.startDate || meta.endDate ? `Periode: ${meta.startDate || 'Awal'} s/d ${meta.endDate || 'Sekarang'}` : 'Periode: Semua Periode',
        meta.requestorQuery ? `Pemohon: ${meta.requestorQuery}` : null,
      ].filter(Boolean).join(' | ');

      doc.text(`Parameter Filter: ${filterSummary}`, margin + 4, y + 9.5);

      // KPI box on right of banner
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `Total: ${reimbursements.length} Klaim | Akumulasi: ${formatRupiah(totalReimbNominal)}`,
        pageWidth - margin - 4,
        y + 7.5,
        { align: 'right' }
      );

      y += 18;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(
        'LAPORAN AUDIT: REKAPITULASI KLAIM REIMBURSEMENT (Lanjutan)',
        margin,
        y + 1
      );
      y += 6;
    }

    // Table Header Row
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = margin;
    cols.forEach(col => {
      const textX =
        col.align === 'center'
          ? x + col.width / 2
          : col.align === 'right'
          ? x + col.width - 2
          : x + 2;
      doc.text(col.header, textX, y + 4.5, { align: col.align });
      x += col.width;
    });

    y += 7;
    return y;
  };

  const drawPageFooter = (pageNum: number) => {
    const y = pageHeight - 7;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Dokumen ini dicetak otomatis dari Sistem Keuangan Operasional PT AMS & PT AMI · Auditor: ${meta.currentUserName} (${meta.currentUserRole})`,
      margin,
      y + 1.5
    );

    doc.text(`Halaman ${pageNum}`, pageWidth - margin, y + 1.5, { align: 'right' });
  };

  // Render Table Data
  let currentY = drawPageHeader(currentPage);
  const rowHeight = 7.5;

  reimbursements.forEach((rb, index) => {
    if (currentY + rowHeight > pageHeight - 16) {
      drawPageFooter(currentPage);
      doc.addPage();
      currentPage++;
      currentY = drawPageHeader(currentPage);
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);

    const statusInfo = getReimbursementStatusInfo(rb.status);
    const bayarStatus =
      rb.status === 'PAID'
        ? 'Lunas Ditransfer'
        : rb.status === 'APPROVED'
        ? 'Siap Bayar'
        : rb.status === 'REJECTED'
        ? 'Ditolak'
        : 'Verifikasi';

    let x = margin;

    // 1. No
    doc.text(String(index + 1), x + cols[0].width / 2, currentY + 4.8, { align: 'center' });
    x += cols[0].width;

    // 2. Code
    doc.setFont('courier', 'bold');
    doc.setFontSize(7);
    doc.text(rb.code, x + 1.5, currentY + 4.8);
    x += cols[1].width;

    // 3. Entity
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(rb.companyId, x + cols[2].width / 2, currentY + 4.8, { align: 'center' });
    x += cols[2].width;

    // 4. Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(rb.requestDate, x + 1.5, currentY + 4.8);
    x += cols[3].width;

    // 5. Applicant / Dept
    const appText = `${rb.applicantName} (${rb.applicantDepartment})`;
    doc.text(doc.splitTextToSize(appText, cols[4].width - 3)[0] || appText, x + 1.5, currentY + 4.8);
    x += cols[4].width;

    // 6. Purpose & Cost Center
    const purpText = `${rb.purpose} [CC: ${rb.costCenter}]`;
    doc.text(doc.splitTextToSize(purpText, cols[5].width - 3)[0] || purpText, x + 1.5, currentY + 4.8);
    x += cols[5].width;

    // 7. Status Approval
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (rb.status === 'REJECTED') {
      doc.setTextColor(190, 18, 60);
    } else if (rb.status === 'PAID' || rb.status === 'APPROVED') {
      doc.setTextColor(16, 120, 70);
    } else {
      doc.setTextColor(30, 41, 59);
    }
    doc.text(statusInfo.label, x + 1.5, currentY + 4.8);
    x += cols[6].width;

    // 8. Payment Status
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(bayarStatus, x + 1.5, currentY + 4.8);
    x += cols[7].width;

    // 9. Nominal (Right aligned)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(rb.totalAmount), x + cols[8].width - 2, currentY + 4.8, { align: 'right' });

    currentY += rowHeight;
  });

  // Grand Total Summary Row
  if (currentY + 12 > pageHeight - 16) {
    drawPageFooter(currentPage);
    doc.addPage();
    currentPage++;
    currentY = drawPageHeader(currentPage);
  }

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`GRAND TOTAL (${reimbursements.length} KLAIM REIMBURSEMENT):`, margin + 4, currentY + 4.8);

  doc.setFontSize(9);
  doc.text(
    formatRupiah(totalReimbNominal),
    pageWidth - margin - 2,
    currentY + 4.8,
    { align: 'right' }
  );

  currentY += 12;

  // Signatures
  if (currentY + 36 > pageHeight - 10) {
    drawPageFooter(currentPage);
    doc.addPage();
    currentPage++;
    currentY = drawPageHeader(currentPage);
  }

  const signBoxWidth = (contentWidth - 16) / 3;
  const signBoxHeight = 28;
  const signY = currentY;

  const signers = [
    { title: 'Disiapkan Oleh (Prepared By):', role: 'Staff Akuntansi & Verifikator', name: meta.currentUserName },
    { title: 'Diverifikasi Oleh (Verified By):', role: 'Internal Auditor / Tax Compliance', name: '( .......................................... )' },
    { title: 'Disetujui Oleh (Approved By):', role: 'Finance Manager / Kasir Utama', name: '( .......................................... )' },
  ];

  signers.forEach((s, idx) => {
    const sx = margin + idx * (signBoxWidth + 8);
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(sx, signY, signBoxWidth, signBoxHeight, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(s.title, sx + 3, signY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Tanggal: ${formatDateIndo(todayStr)}`, sx + 3, signY + 8.5);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(sx + 4, signY + 22, sx + signBoxWidth - 4, signY + 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(s.name, sx + signBoxWidth / 2, signY + 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(s.role, sx + signBoxWidth / 2, signY + 25.5, { align: 'center' });
  });

  drawPageFooter(currentPage);

  const fileName = `Laporan_Audit_Reimbursement_${meta.selectedCompany}_${todayStr}.pdf`;
  doc.save(fileName);
}
