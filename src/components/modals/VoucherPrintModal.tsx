import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { COMPANIES } from '../../data/initialData';
import { formatRupiah, formatDateIndo, terbilang, CATEGORY_LABELS } from '../../utils/formatters';
import { generateVoucherPDF, downloadVoucherPDF, VoucherPDFData } from '../../utils/pdfGenerator';
import { X, Printer, Download, Check, FileCheck, Building } from 'lucide-react';

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
  let cashierSigner = 'Kasir Bank';

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
    if (adv.disbursementDetails?.disbursedBy) cashierSigner = adv.disbursementDetails.disbursedBy.split(' ')[0];
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
    if (rb.paymentDetails?.paidBy) cashierSigner = rb.paymentDetails.paidBy.split(' ')[0];
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

    const fin = st.approvalHistory.find(h => h.action === 'SETTLED' && h.actorRole === 'FINANCE');
    financeSigner = fin?.actorName || COMPANIES[companyId].financeHeadName;
  }

  const company = COMPANIES[companyId];
  if (!financeSigner) financeSigner = company.financeHeadName;

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

          <div className="flex items-center gap-2">
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
                  <span>Unduh Dokumen PDF (.pdf)</span>
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

        {/* Printable Voucher Paper Content */}
        <div className="p-8 font-sans text-slate-900 bg-white max-h-[82vh] overflow-y-auto printable-content">
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
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 text-center text-xs divide-x divide-slate-300 bg-slate-100 font-bold text-slate-700 py-2 border-b border-slate-300">
              <div>Dibuat Oleh</div>
              <div>Disetujui Atasan</div>
              <div>Diperiksa Finance</div>
              <div>Dibayar Kasir</div>
              <div>Diterima Pemohon</div>
            </div>

            <div className="grid grid-cols-5 text-center text-xs divide-x divide-slate-300 h-28">
              <div className="flex flex-col justify-end pb-2 px-1">
                <span className="font-bold text-slate-900 underline text-[11px] truncate">{payTo}</span>
                <span className="text-[10px] text-slate-500">Pemohon Dana</span>
              </div>
              <div className="flex flex-col justify-end pb-2 px-1">
                <span className="font-bold text-slate-900 underline text-[11px] truncate">{managerSigner}</span>
                <span className="text-[10px] text-slate-500">Manager Divisi</span>
              </div>
              <div className="flex flex-col justify-end pb-2 px-1">
                <span className="font-bold text-slate-900 underline text-[11px] truncate">{financeSigner}</span>
                <span className="text-[10px] text-slate-500">Finance &amp; Akunting</span>
              </div>
              <div className="flex flex-col justify-end pb-2 px-1">
                <span className="font-bold text-slate-900 underline text-[11px] truncate">{cashierSigner}</span>
                <span className="text-[10px] text-slate-500">Kasir / Treasury</span>
              </div>
              <div className="flex flex-col justify-end pb-2 px-1">
                <span className="font-bold text-slate-900 underline text-[11px] truncate">{payTo}</span>
                <span className="text-[10px] text-slate-500">Penerima Dana</span>
              </div>
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
