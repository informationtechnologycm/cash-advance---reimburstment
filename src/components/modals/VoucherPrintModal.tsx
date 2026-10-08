import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { COMPANIES } from '../../data/initialData';
import { formatRupiah, formatDateIndo, terbilang, CATEGORY_LABELS } from '../../utils/formatters';
import { generateVoucherPDF, downloadVoucherPDF, VoucherPDFData } from '../../utils/pdfGenerator';
import { X, Printer, Download, Check, FileCheck, Building, CheckCircle2, Clock, ShieldCheck, CheckCheck } from 'lucide-react';

interface VoucherPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucherType: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT';
  documentId: string | null;
}

export const VoucherPrintModal: React.FC<VoucherPrintModalProps> = ({
  isOpen,
  onClose,
  voucherType,
  documentId,
}) => {
  const { advances, reimbursements, settlements } = useFinance();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showDigitalStamps, setShowDigitalStamps] = useState<boolean>(true);

  if (!isOpen || !documentId) return null;

  let title = 'BUKTI KAS / BANK KELUAR (BKK)';
  let docCode = '';
  let companyId: 'AMS' | 'AMI' = 'AMS';
  let date = '';
  let payTo = '';
  let department = '';
  let purpose = '';
  let bankInfo = '';
  let totalAmount = 0;
  let items: Array<{ category: string; description: string; total: number; receiptNo?: string }> = [];

  let managerSigner = 'Dewi Lestari';
  let financeSigner = '';
  let cashierSigner = 'Kasir Treasury';

  let isManagerApproved = false;
  let isFinanceApproved = false;
  let isCashierPaid = false;
  let isRecipientReceived = false;

  let creatorDate = '';
  let managerDate = '';
  let financeDate = '';
  let cashierDate = '';
  let recipientDate = '';

  let cashierNote = 'Kasir Treasury';
  let recipientNote = 'Dana Diterima';

  if (voucherType === 'ADVANCE') {
    const adv = advances.find(a => a.id === documentId);
    if (!adv) return null;
    title = 'BUKTI PENGELUARAN KAS / BANK KELUAR (BKK) - COST ADVANCE';
    docCode = adv.code;
    companyId = adv.companyId;
    date = adv.requestDate;
    payTo = adv.applicantName;
    department = adv.applicantDepartment;
    purpose = adv.purpose;
    bankInfo = `${adv.applicantBankAccount.bankName} - ${adv.applicantBankAccount.accountNumber} a.n ${adv.applicantBankAccount.accountHolder}`;
    totalAmount = adv.totalAmount;
    items = adv.items.map(it => ({
      category: CATEGORY_LABELS[it.category] || it.category,
      description: it.description,
      total: it.total,
    }));

    const mgr = adv.approvalHistory.find(h => h.action === 'APPROVED' && (h.actorRole === 'MANAGER' || h.actorRole === 'DIRECTOR'));
    if (mgr) managerSigner = mgr.actorName;
    const fin = adv.approvalHistory.find(h => h.action === 'APPROVED' && h.actorRole === 'FINANCE');
    financeSigner = fin?.actorName || COMPANIES[companyId].financeHeadName;
    const disburseEntry = adv.approvalHistory.find(h => h.action === 'DISBURSED');

    if (adv.disbursementDetails?.disbursedBy) {
      cashierSigner = adv.disbursementDetails.disbursedBy.replace(/\s*\(.*\)/, '').trim();
    } else if (disburseEntry?.actorName) {
      cashierSigner = disburseEntry.actorName.replace(/\s*\(.*\)/, '').trim();
    } else {
      cashierSigner = COMPANIES[companyId].financeHeadName;
    }

    isManagerApproved = !!mgr || ['PENDING_FINANCE', 'PENDING_DIRECTOR', 'APPROVED', 'DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(adv.status);
    isFinanceApproved = !!fin || ['APPROVED', 'DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(adv.status);
    isCashierPaid = ['DISBURSED', 'PENDING_SETTLEMENT', 'SETTLED'].includes(adv.status) || !!adv.disbursementDetails || !!disburseEntry;
    // Jika sudah lunas / dicairkan, pemohon telah menerima dana kasbon
    isRecipientReceived = isCashierPaid;

    const submitEntry = adv.approvalHistory.find(h => h.action === 'SUBMITTED');
    creatorDate = submitEntry?.timestamp || adv.requestDate;
    managerDate = mgr?.timestamp || adv.requestDate;
    financeDate = fin?.timestamp || adv.requestDate;
    cashierDate = adv.disbursementDetails?.disbursedDate || disburseEntry?.timestamp || adv.requestDate;
    recipientDate = cashierDate;
    cashierNote = adv.disbursementDetails?.referenceNumber 
      ? `Ref: ${adv.disbursementDetails.referenceNumber}` 
      : (adv.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Kasir Kas');
    recipientNote = isRecipientReceived ? 'Dana Kasbon Diterima (Lunas)' : 'Menunggu Pencairan Kasir';
  } else if (voucherType === 'REIMBURSEMENT') {
    const rb = reimbursements.find(r => r.id === documentId);
    if (!rb) return null;
    title = 'BUKTI PENGELUARAN KAS / BANK KELUAR (BKK) - REIMBURSEMENT';
    docCode = rb.code;
    companyId = rb.companyId;
    date = rb.requestDate;
    payTo = rb.applicantName;
    department = rb.applicantDepartment;
    purpose = rb.purpose;
    bankInfo = `${rb.applicantBankAccount.bankName} - ${rb.applicantBankAccount.accountNumber} a.n ${rb.applicantBankAccount.accountHolder}`;
    totalAmount = rb.totalAmount;
    items = rb.items.map(it => ({
      category: CATEGORY_LABELS[it.category] || it.category,
      description: it.description,
      total: it.total,
      receiptNo: it.receiptNumber,
    }));

    const mgr = rb.approvalHistory.find(h => h.action === 'APPROVED' && (h.actorRole === 'MANAGER' || h.actorRole === 'DIRECTOR'));
    if (mgr) managerSigner = mgr.actorName;
    const fin = rb.approvalHistory.find(h => h.action === 'APPROVED' && h.actorRole === 'FINANCE');
    financeSigner = fin?.actorName || COMPANIES[companyId].financeHeadName;
    const paidEntry = rb.approvalHistory.find(h => h.action === 'PAID');

    if (rb.paymentDetails?.paidBy) {
      cashierSigner = rb.paymentDetails.paidBy.replace(/\s*\(.*\)/, '').trim();
    } else if (paidEntry?.actorName) {
      cashierSigner = paidEntry.actorName.replace(/\s*\(.*\)/, '').trim();
    } else {
      cashierSigner = COMPANIES[companyId].financeHeadName;
    }

    isManagerApproved = !!mgr || ['PENDING_FINANCE', 'APPROVED', 'PAID'].includes(rb.status);
    isFinanceApproved = !!fin || ['APPROVED', 'PAID'].includes(rb.status);
    isCashierPaid = rb.status === 'PAID' || !!rb.paymentDetails || !!paidEntry;
    // Jika sudah lunas / dibayarkan, pemohon telah menerima pembayaran reimbursement
    isRecipientReceived = isCashierPaid;

    const submitEntry = rb.approvalHistory.find(h => h.action === 'SUBMITTED');
    creatorDate = submitEntry?.timestamp || rb.requestDate;
    managerDate = mgr?.timestamp || rb.requestDate;
    financeDate = fin?.timestamp || rb.requestDate;
    cashierDate = rb.paymentDetails?.paidDate || paidEntry?.timestamp || rb.requestDate;
    recipientDate = cashierDate;
    cashierNote = rb.paymentDetails?.referenceNumber 
      ? `Ref: ${rb.paymentDetails.referenceNumber}` 
      : 'Transfer Rekening';
    recipientNote = isRecipientReceived ? 'Klaim Diterima (Lunas)' : 'Menunggu Pembayaran Kasir';
  } else if (voucherType === 'SETTLEMENT') {
    const st = settlements.find(s => s.id === documentId);
    if (!st) return null;
    title = 'LEMBAR PERTANGGUNGJAWABAN BIAYA & REALISASI (LPJ KASBON)';
    docCode = st.code;
    companyId = st.companyId;
    date = st.settlementDate;
    payTo = st.applicantName;
    department = st.applicantDepartment;
    purpose = `Penyelesaian Kasbon Ref: ${st.advanceCode} (Uang Muka: ${formatRupiah(st.advanceAmount)})`;
    bankInfo = st.difference < 0 ? `Pengembalian Sisa ke Rekening PT ${st.companyId}: Ref ${st.refundProofUrl || '-'}` : 'Klaim Kekurangan Biaya (Reimburse)';
    totalAmount = st.totalActualAmount;
    items = st.actualItems.map(it => ({
      category: CATEGORY_LABELS[it.category] || it.category,
      description: it.description,
      total: it.total,
      receiptNo: it.receiptNumber,
    }));

    const fin = st.approvalHistory.find(h => (h.action === 'SETTLED' || h.action === 'APPROVED') && h.actorRole === 'FINANCE');
    financeSigner = fin?.actorName || COMPANIES[companyId].financeHeadName;
    cashierSigner = financeSigner;

    isManagerApproved = true;
    isFinanceApproved = st.status === 'VERIFIED' || !!fin;
    isCashierPaid = st.status === 'VERIFIED';
    isRecipientReceived = st.status === 'VERIFIED';

    creatorDate = st.settlementDate;
    managerDate = st.settlementDate;
    financeDate = fin?.timestamp || st.settlementDate;
    cashierDate = financeDate;
    recipientDate = financeDate;
    cashierNote = st.difference < 0 
      ? 'Pengembalian Sisa Lunas' 
      : (st.difference > 0 ? 'Klaim Kurang Bayar Lunas' : 'Nol Selisih Selesai');
    recipientNote = isRecipientReceived ? 'LPJ Diterima & Disetujui' : 'Menunggu Review LPJ';
  }

  const company = COMPANIES[companyId];
  if (!financeSigner) financeSigner = company.financeHeadName;

  // 5 Official Roles Signature Config
  const signatureBoxes = [
    {
      roleTitle: 'Dibuat Oleh',
      roleSubtitle: 'Pemohon Dana',
      signerName: payTo,
      isApproved: true,
      stampText: 'DIAJUKAN',
      statusBadge: 'Sudah Dibuat',
      date: creatorDate,
      referenceNote: 'Digital Submission',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      roleTitle: 'Disetujui Atasan',
      roleSubtitle: 'Manager Divisi',
      signerName: managerSigner,
      isApproved: isManagerApproved,
      stampText: 'APPROVED',
      statusBadge: isManagerApproved ? 'Disetujui' : 'Menunggu',
      date: managerDate,
      referenceNote: isManagerApproved ? 'Disetujui Atasan' : 'Belum Approval',
      badgeBg: isManagerApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      roleTitle: 'Diperiksa Finance',
      roleSubtitle: 'Finance & Akunting',
      signerName: financeSigner,
      isApproved: isFinanceApproved,
      stampText: 'VERIFIED',
      statusBadge: isFinanceApproved ? 'Terverifikasi' : 'Menunggu',
      date: financeDate,
      referenceNote: isFinanceApproved ? 'Verifikasi Lolos' : 'Belum Verifikasi',
      badgeBg: isFinanceApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      roleTitle: 'Dibayar Kasir',
      roleSubtitle: 'Kasir / Treasury',
      signerName: cashierSigner,
      isApproved: isCashierPaid,
      stampText: 'DIBAYARKAN',
      statusBadge: isCashierPaid ? 'Lunas / Dibayar' : 'Menunggu',
      date: cashierDate,
      referenceNote: cashierNote,
      badgeBg: isCashierPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200',
    },
    {
      roleTitle: 'Diterima Pemohon',
      roleSubtitle: 'Penerima Dana',
      signerName: payTo,
      isApproved: isRecipientReceived,
      stampText: 'DITERIMA (LUNAS)',
      statusBadge: isRecipientReceived ? 'Lunas Diterima' : 'Belum Diterima',
      date: recipientDate,
      referenceNote: recipientNote,
      badgeBg: isRecipientReceived ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200',
    },
  ];

  // Lifecycle Stage determination for visual stamp overlay (PAID, APPROVED, REVIEWED, REJECTED, PENDING)
  let lifecycleStage: 'PAID' | 'APPROVED' | 'REVIEWED' | 'REJECTED' | 'PENDING' = 'PENDING';
  let stampMainText = 'PENDING';
  let stampSubText = 'MENUNGGU PERSETUJUAN';
  let stampDate = creatorDate || date;

  const isDocRejected = (voucherType === 'ADVANCE' && advances.find(a => a.id === documentId)?.status === 'REJECTED') ||
    (voucherType === 'REIMBURSEMENT' && reimbursements.find(r => r.id === documentId)?.status === 'REJECTED') ||
    (voucherType === 'SETTLEMENT' && settlements.find(s => s.id === documentId)?.status === 'REJECTED');

  if (isDocRejected) {
    lifecycleStage = 'REJECTED';
    stampMainText = 'REJECTED';
    stampSubText = 'PENGAJUAN DITOLAK';
    stampDate = date;
  } else if (isCashierPaid) {
    lifecycleStage = 'PAID';
    stampMainText = 'PAID';
    stampSubText = 'LUNAS / DIBAYARKAN';
    stampDate = cashierDate || financeDate || date;
  } else if (isFinanceApproved) {
    lifecycleStage = 'APPROVED';
    stampMainText = 'APPROVED';
    stampSubText = 'DISETUJUI / SIAP CAIR';
    stampDate = financeDate || managerDate || date;
  } else if (isManagerApproved) {
    lifecycleStage = 'REVIEWED';
    stampMainText = 'REVIEWED';
    stampSubText = 'DISETUJUI ATASAN';
    stampDate = managerDate || date;
  } else {
    lifecycleStage = 'PENDING';
    stampMainText = 'PENDING';
    stampSubText = 'MENUNGGU PERSETUJUAN';
    stampDate = creatorDate || date;
  }

  const lifecycleTheme = {
    PAID: {
      border: 'border-emerald-600 print:border-emerald-700',
      bg: 'bg-emerald-50/90 print:bg-emerald-50',
      text: 'text-emerald-700 print:text-emerald-900',
      badgeBorder: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    APPROVED: {
      border: 'border-blue-600 print:border-blue-700',
      bg: 'bg-blue-50/90 print:bg-blue-50',
      text: 'text-blue-700 print:text-blue-900',
      badgeBorder: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    REVIEWED: {
      border: 'border-amber-600 print:border-amber-700',
      bg: 'bg-amber-50/90 print:bg-amber-50',
      text: 'text-amber-700 print:text-amber-900',
      badgeBorder: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    REJECTED: {
      border: 'border-rose-600 print:border-rose-700',
      bg: 'bg-rose-50/90 print:bg-rose-50',
      text: 'text-rose-700 print:text-rose-900',
      badgeBorder: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    PENDING: {
      border: 'border-slate-500 print:border-slate-600',
      bg: 'bg-slate-50/90 print:bg-slate-50',
      text: 'text-slate-600 print:text-slate-800',
      badgeBorder: 'bg-slate-200 text-slate-700 border-slate-300',
    },
  }[lifecycleStage];

  // Prepare data payload for PDF generation
  const voucherPdfPayload: VoucherPDFData = {
    type: voucherType,
    docCode,
    company,
    date,
    payTo,
    department,
    purpose,
    bankInfo,
    totalAmount,
    items,
    showDigitalStamps,
    lifecycleStamp: {
      status: lifecycleStage,
      text: stampMainText,
      subtext: stampSubText,
      date: stampDate,
    },
    signatures: signatureBoxes.map(b => ({
      title: b.roleTitle,
      role: b.roleSubtitle,
      name: b.signerName,
      isApproved: b.isApproved,
      stampText: b.stampText,
      date: b.date,
      note: b.referenceNote,
    })),
    signers: {
      creator: payTo,
      creatorRole: 'Pemohon Dana',
      manager: managerSigner,
      managerRole: 'Manager Divisi',
      finance: financeSigner,
      financeRole: 'Finance & Akunting',
      cashier: cashierSigner,
      cashierRole: 'Kasir Bank',
      recipient: payTo,
      recipientRole: 'Penerima Dana',
    },
  };

  const handleDownloadPDF = () => {
    downloadVoucherPDF(voucherPdfPayload);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 border border-slate-200">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="no-print px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Format Voucher Cetak &amp; PDF Resmi (Standar PSAK)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle Digital Stamps */}
            <button
              onClick={() => setShowDigitalStamps(!showDigitalStamps)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                showDigitalStamps
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                  : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
              title="Aktifkan atau nonaktifkan tanda approved dan cap digital pada lembar cetak"
            >
              {showDigitalStamps ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span>Tanda Approved: <strong className="font-bold">{showDigitalStamps ? 'Cap Digital' : 'Tanda Tangan Basah'}</strong></span>
            </button>

            {/* Primary Minimal PDF Download Button */}
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              title="Unduh dokumen voucher sebagai file PDF resmi"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>File PDF Diunduh!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF (.pdf)</span>
                </>
              )}
            </button>

            {/* Print preview button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
              title="Buka dialog cetak browser (Ctrl + P)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Approval Status Banner (Hidden during print) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">Cap Siklus:</span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${lifecycleTheme.badgeBorder}`}>
              {lifecycleStage === 'PAID' ? (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : lifecycleStage === 'APPROVED' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              ) : lifecycleStage === 'REVIEWED' ? (
                <Clock className="w-3.5 h-3.5 text-amber-600" />
              ) : lifecycleStage === 'REJECTED' ? (
                <X className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-slate-500" />
              )}
              CAP STAMP: {stampMainText} ({stampSubText})
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">Status 5 Pengesahan:</span>
            {isRecipientReceived ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                LUNAS &amp; DISETUJUI LENGKAP
              </span>
            ) : isCashierPaid ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                DIBAYARKAN KASIR (LUNAS)
              </span>
            ) : isFinanceApproved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                VERIFIKASI FINANCE LENGKAP (MENUNGGU PENCAIRAN)
              </span>
            ) : isManagerApproved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                DISETUJUI ATASAN (MENUNGGU FINANCE)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                MENUNGGU PERSETUJUAN ATASAN
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{showDigitalStamps ? 'Cap stempel siklus & 5 tanda approval resmi tercetak pada lembar voucher' : 'Kolom disiapkan untuk tanda tangan basah'}</span>
          </div>
        </div>

        {/* Printable Voucher Paper Content */}
        <div className="relative p-8 font-sans text-slate-900 bg-white max-h-[82vh] overflow-y-auto printable-content">
          {/* Dynamic Official Lifecycle Stamp Overlay */}
          {showDigitalStamps && (
            <div 
              className="print-stamp absolute top-8 right-6 sm:top-8 sm:right-10 pointer-events-none select-none z-20 transform -rotate-12 transition-transform print:block"
              style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
            >
              <div
                className={`border-4 border-double rounded-xl px-5 py-2.5 text-center shadow-md print:shadow-none backdrop-blur-[0.5px] print:border-solid ${lifecycleTheme.border} ${lifecycleTheme.bg} ${lifecycleTheme.text} print:opacity-100`}
                style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
              >
                <div className="flex items-center justify-center gap-1.5 leading-none">
                  {lifecycleStage === 'PAID' ? (
                    <CheckCheck className="w-5 h-5 text-emerald-600 print:text-emerald-800 shrink-0" />
                  ) : lifecycleStage === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600 print:text-blue-800 shrink-0" />
                  ) : lifecycleStage === 'REVIEWED' ? (
                    <Clock className="w-5 h-5 text-amber-600 print:text-amber-800 shrink-0" />
                  ) : lifecycleStage === 'REJECTED' ? (
                    <X className="w-5 h-5 text-rose-600 print:text-rose-800 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-500 print:text-slate-700 shrink-0" />
                  )}
                  <span className="text-xl sm:text-2xl font-black tracking-widest uppercase font-mono">
                    {stampMainText}
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase mt-1 leading-tight">
                  {stampSubText}
                </div>
                <div className="text-[8.5px] sm:text-[9px] font-mono font-bold mt-1 opacity-95 leading-tight">
                  {formatDateIndo(stampDate, false)}
                </div>
                <div className="text-[7.5px] tracking-tight uppercase border-t border-current/40 pt-1 mt-1 font-semibold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 shrink-0" />
                  <span>PT {company.id} · FINANCEFLOW VERIFIED</span>
                </div>
              </div>
            </div>
          )}

          {/* Header Kop Surat Perusahaan */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  {company.fullName}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    company.id === 'AMS' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  PT {company.id}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 font-medium">{company.tagline}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                {company.address} <br />
                Telp: {company.phone} · NPWP: {company.npwp}
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm font-black tracking-tight text-slate-900 block uppercase">
                {title}
              </span>
              <div className="font-mono text-xs font-bold text-slate-800 mt-1">
                No. Voucher: <span className="underline">{docCode}</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Tanggal: <span className="font-semibold">{formatDateIndo(date)}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Mata Uang: IDR (Rupiah)
              </div>
            </div>
          </div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium">Dibayarkan Kepada</span>
                <span className="font-bold text-slate-900">: {payTo}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium">Departemen / Divisi</span>
                <span className="text-slate-800">: {department}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-500 font-medium">Badan Usaha</span>
                <span className="text-slate-800 font-semibold">: {company.fullName}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Rekening Bank</span>
                <span className="font-mono text-slate-800 font-semibold">: {bankInfo}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Keperluan</span>
                <span className="text-slate-900 font-medium">: {purpose}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 font-medium">Rekening Sumber</span>
                <span className="font-mono text-slate-600 text-[11px]">: {company.primaryBank} ({company.accountNumber})</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left border-collapse text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center">No</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">Uraian Transaksi / Beban Pengeluaran</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-48">Klasifikasi Akun Biaya</th>
                  <th className="py-2.5 px-3 text-right w-40">Nominal (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 text-center border-r border-slate-300 font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300">
                      <div className="font-medium text-slate-900">{it.description}</div>
                      {it.receiptNo && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Bukti / No. Kuitansi: {it.receiptNo}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-300 text-slate-700">
                      {it.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(it.total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={3} className="py-2.5 px-3 text-right border-r border-slate-300">
                    JUMLAH DIBAYARKAN / TOTAL:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm tabular-nums">
                    {formatRupiah(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terbilang Official Box */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs mb-6">
            <span className="font-semibold text-slate-500 uppercase text-[10px] block">Terbilang :</span>
            <span className="font-bold text-slate-900 italic text-xs">
              &quot;{terbilang(totalAmount)}&quot;
            </span>
          </div>

          {/* 5-Box Official Signature Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
            <div className="grid grid-cols-5 text-center text-xs divide-x divide-slate-300 bg-slate-100 font-bold text-slate-800 py-2 border-b border-slate-300">
              {signatureBoxes.map((box, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center px-1">
                  <div className="text-[11px] font-bold uppercase tracking-tight text-slate-800">
                    {box.roleTitle}
                  </div>
                  {showDigitalStamps && (
                    <div className="mt-0.5">
                      {box.isApproved ? (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.2 rounded-full leading-tight">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{box.statusBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-slate-500 bg-slate-200/80 px-1.5 py-0.2 rounded-full leading-tight">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          <span>Menunggu</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 text-center text-xs divide-x divide-slate-300 min-h-[142px]">
              {signatureBoxes.map((box, idx) => (
                <div key={idx} className="flex flex-col justify-between p-2 relative bg-white">
                  {/* Center Stamp Area */}
                  <div className="flex-1 flex flex-col items-center justify-center my-auto py-1">
                    {showDigitalStamps ? (
                      box.isApproved ? (
                        <div className="w-full max-w-[125px] border-2 border-dashed border-emerald-600 bg-emerald-50/80 rounded-md p-1.5 text-emerald-900 shadow-2xs flex flex-col items-center">
                          <div className="flex items-center justify-center gap-1 text-[9px] font-black uppercase text-emerald-800 tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{box.stampText}</span>
                          </div>
                          <div className="text-[8.5px] font-mono font-bold text-emerald-950 mt-0.5 leading-tight">
                            {formatDateIndo(box.date, false)}
                          </div>
                          <div className="text-[7.5px] text-emerald-700 font-semibold uppercase tracking-tight truncate max-w-[115px] mt-0.5" title={box.referenceNote}>
                            {box.referenceNote}
                          </div>
                          <div className="text-[6.5px] text-emerald-600/90 font-mono tracking-tighter uppercase mt-0.5 flex items-center gap-0.5">
                            <ShieldCheck className="w-2 h-2 text-emerald-600" />
                            <span>DIGITALLY VERIFIED</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full max-w-[125px] border border-dashed border-slate-300 bg-slate-50 rounded-md p-2 text-slate-400 flex flex-col items-center justify-center">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                          <span className="text-[8.5px] font-semibold text-slate-500 uppercase tracking-tight">Menunggu Approval</span>
                          <span className="text-[7.5px] text-slate-400 italic mt-0.5">(Belum Disetujui)</span>
                        </div>
                      )
                    ) : (
                      <div className="h-16 flex items-center justify-center">
                        <span className="text-[9px] text-slate-300 italic">(Tanda Tangan Basah)</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Signer Name & Title */}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-900 underline text-[11px] truncate block px-0.5">
                      {box.signerName}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                      {box.roleSubtitle}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Dokumen ini sah sebagai tanda bukti kas keluar resmi yang diakui secara legal untuk pembukuan akuntansi PT {company.id}.</span>
            <span className="font-mono">
              Waktu Cetak: {formatDateIndo(new Date().toISOString(), true)}
            </span>
          </div>
        </div>

        {/* Modal Bottom Print CTA (Hidden during print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Format: Standar kertas A4 portrait dengan kop surat resmi &amp; 5 kotak pengesahan tanda tangan.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
