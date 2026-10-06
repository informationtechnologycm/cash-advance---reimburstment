import { jsPDF } from 'jspdf';
import { CompanyInfo, CostAdvanceRequest, ReimbursementRequest, AdvanceSettlement } from '../types/finance';
import { COMPANIES } from '../data/initialData';
import { formatRupiah, formatDateIndo, terbilang, CATEGORY_LABELS } from './formatters';

export interface VoucherPDFData {
  type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT';
  docCode: string;
  company: CompanyInfo;
  date: string;
  payTo: string;
  department: string;
  purpose: string;
  bankInfo: string;
  totalAmount: number;
  items: Array<{
    description: string;
    category: string;
    quantity?: number;
    unitPrice?: number;
    total: number;
    receiptNo?: string;
  }>;
  signers: {
    creator: string;
    creatorRole: string;
    manager: string;
    managerRole: string;
    finance: string;
    financeRole: string;
    cashier: string;
    cashierRole: string;
    recipient: string;
    recipientRole: string;
  };
}

/**
 * Generate a clean, minimal, official corporate voucher in PDF format
 */
export function generateVoucherPDF(data: VoucherPDFData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let y = margin;

  // 1. Header: Corporate Letterhead (Kop Surat)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(20, 25, 35);
  doc.text(data.company.fullName, margin, y);

  // Entity badge text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 115);
  doc.text(`[ PT ${data.company.id} ] · ${data.company.tagline}`, margin, y + 4.5);

  doc.setFontSize(7.5);
  doc.text(
    `${data.company.address} · Telp: ${data.company.phone} · NPWP: ${data.company.npwp}`,
    margin,
    y + 8.5
  );

  // Voucher Title on Top Right
  let titleText = 'BUKTI KAS / BANK KELUAR (BKK)';
  if (data.type === 'ADVANCE') titleText = 'BUKTI PENGELUARAN KASBON (BKK)';
  else if (data.type === 'REIMBURSEMENT') titleText = 'BUKTI PEMBAYARAN KLAIM (BKK)';
  else if (data.type === 'SETTLEMENT') titleText = 'LEMBAR PERTANGGUNGJAWABAN (LPJ)';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(titleText, pageWidth - margin, y + 1, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 95);
  doc.text(`No: ${data.docCode}`, pageWidth - margin, y + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Tanggal: ${formatDateIndo(data.date)}`, pageWidth - margin, y + 9.5, { align: 'right' });

  // Divider line
  y += 13;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.2);
  doc.line(margin, y + 0.8, pageWidth - margin, y + 0.8);

  y += 5;

  // 2. Metadata Box (Two-column layout)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Left Column
  doc.text('Dibayarkan Kepada', margin + 3, y + 5);
  doc.text('Departemen / Divisi', margin + 3, y + 10);
  doc.text('Rekening Tujuan', margin + 3, y + 15);
  doc.text('Badan Usaha', margin + 3, y + 20);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`:  ${data.payTo}`, margin + 33, y + 5);
  doc.text(`:  ${data.department}`, margin + 33, y + 10);
  doc.setFont('courier', 'bold');
  doc.text(`:  ${data.bankInfo}`, margin + 33, y + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`:  ${data.company.fullName}`, margin + 33, y + 20);

  // Right Column
  const rightColX = margin + 98;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Keperluan Biaya', rightColX, y + 5);
  doc.text('Rekening Sumber', rightColX, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  // Split purpose text if long
  const purposeLines = doc.splitTextToSize(`:  ${data.purpose}`, 58);
  doc.text(purposeLines, rightColX + 24, y + 5);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(`:  ${data.company.primaryBank}`, rightColX + 24, y + 15);
  doc.text(`   No. Rek: ${data.company.accountNumber}`, rightColX + 24, y + 19);

  y += 27;

  // 3. Items Table
  const colWidths = [12, 88, 42, 40]; // Total = 182mm
  const colPositions = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
  ];

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('NO', colPositions[0] + 6, y + 4.8, { align: 'center' });
  doc.text('URAIAN TRANSAKSI / RINCIAN BIAYA', colPositions[1] + 3, y + 4.8);
  doc.text('KATEGORI AKUN', colPositions[2] + 3, y + 4.8);
  doc.text('JUMLAH (IDR)', colPositions[3] + colWidths[3] - 3, y + 4.8, { align: 'right' });

  y += 7;

  // Table Body Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);

  data.items.forEach((it, idx) => {
    const rowHeight = 7.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 250);
    doc.rect(margin, y, contentWidth, rowHeight, 'FD');

    // Number
    doc.setFont('courier', 'bold');
    doc.text(String(idx + 1), colPositions[0] + 6, y + 5, { align: 'center' });

    // Description + receipt
    doc.setFont('helvetica', 'normal');
    let descText = it.description;
    if (it.receiptNo) descText += ` [Ref: ${it.receiptNo}]`;
    const truncatedDesc = descText.length > 58 ? descText.substring(0, 55) + '...' : descText;
    doc.text(truncatedDesc, colPositions[1] + 3, y + 5);

    // Category
    doc.setTextColor(71, 85, 105);
    const catShort = it.category.length > 25 ? it.category.substring(0, 23) + '..' : it.category;
    doc.text(catShort, colPositions[2] + 3, y + 5);

    // Amount
    doc.setFont('courier', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(it.total), colPositions[3] + colWidths[3] - 3, y + 5, { align: 'right' });

    y += rowHeight;
  });

  // Table Total Row
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 8, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL KESELURUHAN (IDR):', colPositions[2] + colWidths[2] - 4, y + 5.5, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(formatRupiah(data.totalAmount), colPositions[3] + colWidths[3] - 3, y + 5.5, { align: 'right' });

  y += 11;

  // 4. Terbilang Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('TERBILANG:', margin + 3, y + 4);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const words = `"${terbilang(data.totalAmount)}"`;
  const splitWords = doc.splitTextToSize(words, contentWidth - 26);
  doc.text(splitWords, margin + 22, y + 4.5);

  y += 15;

  // 5. 5-Tier Signature Grid
  const boxWidth = contentWidth / 5;
  const boxHeight = 27;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);

  const signTitles = ['DIBUAT OLEH', 'DISETUJUI ATASAN', 'DIPERIKSA FINANCE', 'DIBAYAR KASIR', 'DITERIMA OLEH'];
  signTitles.forEach((t, i) => {
    doc.text(t, margin + i * boxWidth + boxWidth / 2, y + 4.2, { align: 'center' });
  });

  y += 6;

  // Signature body
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, boxHeight, 'D');

  for (let i = 1; i < 5; i++) {
    doc.line(margin + i * boxWidth, y - 6, margin + i * boxWidth, y + boxHeight);
  }

  const signers = [
    { name: data.signers.creator, role: data.signers.creatorRole },
    { name: data.signers.manager, role: data.signers.managerRole },
    { name: data.signers.finance, role: data.signers.financeRole },
    { name: data.signers.cashier, role: data.signers.cashierRole },
    { name: data.signers.recipient, role: data.signers.recipientRole },
  ];

  signers.forEach((s, i) => {
    const xPos = margin + i * boxWidth + boxWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    const displayName = s.name.length > 20 ? s.name.substring(0, 18) + '..' : s.name;
    doc.text(displayName, xPos, y + boxHeight - 5.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${s.role})`, xPos, y + boxHeight - 2, { align: 'center' });

    // Underline name
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(margin + i * boxWidth + 4, y + boxHeight - 7, margin + (i + 1) * boxWidth - 4, y + boxHeight - 7);
  });

  y += boxHeight + 4;

  // 6. Security Note & Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `* Dokumen ini sah sebagai tanda bukti kas keluar resmi yang diakui secara legal untuk pembukuan akuntansi PT ${data.company.id}.`,
    margin,
    y
  );
  doc.text(
    `Generated by FinanceFlow AMS & AMI · ${formatDateIndo(new Date().toISOString(), true)}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  return doc;
}

/**
 * Direct download helper for voucher PDF
 */
export function downloadVoucherPDF(data: VoucherPDFData): void {
  const doc = generateVoucherPDF(data);
  const cleanDocCode = data.docCode.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `${data.type}_${cleanDocCode}.pdf`;
  doc.save(filename);
}
