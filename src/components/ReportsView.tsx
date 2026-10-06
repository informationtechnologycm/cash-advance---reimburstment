import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateIndo, CATEGORY_LABELS } from '../utils/formatters';
import { ExpenseCategory } from '../types/finance';
import { exportFinancialDataToExcel } from '../utils/excelExport';
import {
  Download,
  RotateCcw,
  Calendar,
  FileSpreadsheet,
  CheckCircle,
  Building,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    filteredAdvances,
    filteredReimbursements,
    filteredSettlements,
    selectedCompany,
    setSelectedCompany,
    currentUser,
    resetToDefaultData,
  } = useFinance();

  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Category breakdown calculation across all active & settled advances and reimbursements
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

  // Add from advances
  filteredAdvances.forEach(adv => {
    adv.items.forEach(it => {
      categoryTotals[it.category] = (categoryTotals[it.category] || 0) + it.total;
    });
  });

  // Add from reimbursements
  filteredReimbursements.forEach(rb => {
    rb.items.forEach(it => {
      categoryTotals[it.category] = (categoryTotals[it.category] || 0) + it.total;
    });
  });

  const totalAllExpenses = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  // Aging Analysis for Outstanding Advances (Status DISBURSED or PENDING_SETTLEMENT)
  const outstandingAdvances = filteredAdvances.filter(
    a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT'
  );

  const now = new Date().getTime();
  const agingGroups = {
    current: [] as typeof outstandingAdvances, // <= 7 days from request
    warning: [] as typeof outstandingAdvances, // 8 - 14 days
    overdue: [] as typeof outstandingAdvances, // > 14 days
  };

  outstandingAdvances.forEach(adv => {
    const reqTime = new Date(adv.requestDate).getTime();
    const diffDays = Math.floor((now - reqTime) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      agingGroups.current.push(adv);
    } else if (diffDays <= 14) {
      agingGroups.warning.push(adv);
    } else {
      agingGroups.overdue.push(adv);
    }
  });

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const fileName = exportFinancialDataToExcel({
        advances: filteredAdvances,
        reimbursements: filteredReimbursements,
        settlements: filteredSettlements,
        selectedCompany,
        currentUserName: currentUser.name,
        currentUserRole: currentUser.roleLabel,
      });

      setDownloadSuccess(`File Excel '${fileName}' berhasil diunduh (5 Worksheets multi-tab).`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error('Gagal mengekspor file Excel:', err);
      alert('Terjadi kesalahan saat mengekspor file Excel. Silakan coba kembali.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export CSV handler (alternative simple format)
  const handleExportCSV = () => {
    const rows = [
      ['Tipe', 'Kode Dokumen', 'Perusahaan', 'Pemohon', 'Departemen', 'Tanggal', 'Tujuan', 'Total (IDR)', 'Status'],
    ];

    filteredAdvances.forEach(a => {
      rows.push([
        'Cost Advance',
        a.code,
        `PT ${a.companyId}`,
        `"${a.applicantName}"`,
        `"${a.applicantDepartment}"`,
        a.requestDate,
        `"${a.purpose.replace(/"/g, '""')}"`,
        String(a.totalAmount),
        a.status,
      ]);
    });

    filteredReimbursements.forEach(r => {
      rows.push([
        'Reimbursement',
        r.code,
        `PT ${r.companyId}`,
        `"${r.applicantName}"`,
        `"${r.applicantDepartment}"`,
        r.requestDate,
        `"${r.purpose.replace(/"/g, '""')}"`,
        String(r.totalAmount),
        r.status,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `Laporan_Biaya_${selectedCompany}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(`File CSV '${fileName}' berhasil diunduh ke perangkat Anda.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Laporan &amp; Rekapitulasi Finansial
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
              <span>Support .XLSX</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis aging kasbon gantung, distribusi kategori beban, dan ekspor data akuntansi komprehensif
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Action: Export to Excel */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-300 rounded-lg shadow-sm transition-all"
            title="Download seluruh data keuangan dalam format Microsoft Excel (.xlsx) dengan 5 sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>{isExportingExcel ? 'Membuat File Excel...' : 'Export to Excel (.xlsx)'}</span>
          </button>

          {/* Secondary Action: Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
            title="Ekspor format teks CSV sederhana"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={() => {
              if (window.confirm('Reset data transaksi ke konfigurasi data contoh bawaan?')) {
                resetToDefaultData();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Kembalikan data ke awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {downloadSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-3 shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{downloadSuccess}</span>
          </div>
          <button
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 text-[11px] font-bold"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Excel Structure Info Banner */}
      <div className="bg-gradient-to-r from-emerald-50/80 via-blue-50/50 to-slate-50 border border-emerald-200/80 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/50 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                Fitur Export Excel Multi-Sheet (.xlsx) Siap Analisis Offline
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                File .xlsx diformat dengan tipe data numerik (kompatibel formula SUM &amp; Pivot Table) dan kolom rapi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-[11px]">Filter Aktif:</span>
            <span className="font-bold text-slate-900">
              {selectedCompany === 'ALL'
                ? 'PT AMS & PT AMI'
                : selectedCompany === 'AMS'
                ? 'PT AMS'
                : 'PT AMI'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>1. Ringkasan Eksekutif</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              KPI arus kas, rekap outstanding, aging matrix, dan proporsi beban biaya.
            </p>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>2. Cost Advance</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {filteredAdvances.length} data kasbon, cost center, rekening transfer, status &amp; deadline LPJ.
            </p>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>3. Reimbursement</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {filteredReimbursements.length} klaim biaya mandiri, nomor rekening, tanggal bayar, &amp; total nota.
            </p>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              <span>4. Rincian Item Nota</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Detail baris transaksi individual, qty, harga satuan, kategori, &amp; no kuitansi.
            </p>
          </div>

          <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>5. Rekap LPJ Kasbon</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              {filteredSettlements.length} berkas penyelesaian, selisih lebih/kurang bayar, &amp; status verifikasi.
            </p>
          </div>
        </div>
      </div>

      {/* Aging Analysis Table (Kasbon Gantung) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Analisis Aging Kasbon Gantung (Outstanding Advance)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pemantauan umur uang muka kerja yang belum diserahkan pertanggungjawabannya
            </p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-emerald-900">
              <span>0 - 7 Hari (Lancar)</span>
              <span>{agingGroups.current.length} Berkas</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-2">
              {formatRupiah(agingGroups.current.reduce((s, a) => s + a.totalAmount, 0))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Dalam batas wajar durasi kegiatan</p>
          </div>

          <div className="border border-amber-200 bg-amber-50/30 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-amber-900">
              <span>8 - 14 Hari (Perlu Follow-up)</span>
              <span>{agingGroups.warning.length} Berkas</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-2">
              {formatRupiah(agingGroups.warning.reduce((s, a) => s + a.totalAmount, 0))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Finance perlu mengirim pengingat ke karyawan</p>
          </div>

          <div className="border border-rose-200 bg-rose-50/30 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-semibold text-rose-900">
              <span>&gt; 14 Hari (Jatuh Tempo)</span>
              <span>{agingGroups.overdue.length} Berkas</span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900 mt-2">
              {formatRupiah(agingGroups.overdue.reduce((s, a) => s + a.totalAmount, 0))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Berpotensi dilakukan pemotongan payroll jika belum ada nota</p>
          </div>
        </div>
      </div>

      {/* Expense Category Distribution */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Distribusi Kategori Beban Biaya
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian total alokasi pengeluaran dari Cost Advance &amp; Reimbursement
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-900">
            Total: {formatRupiah(totalAllExpenses)}
          </span>
        </div>

        <div className="space-y-3">
          {(Object.keys(categoryTotals) as ExpenseCategory[]).map(catKey => {
            const amount = categoryTotals[catKey];
            const percent = totalAllExpenses > 0 ? ((amount / totalAllExpenses) * 100).toFixed(1) : '0';

            return (
              <div key={catKey} className="text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-slate-700">{CATEGORY_LABELS[catKey]}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatRupiah(amount)}
                    </span>
                    <span className="text-slate-400 font-mono w-10 text-right">({percent}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

