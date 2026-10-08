import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  CheckCircle2,
  Filter,
  Layers,
  Printer,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export interface TableExportDropdownProps {
  label?: string;
  itemTypeLabel: string; // e.g. 'Kasbon' or 'Reimbursement'
  filteredCount: number;
  totalCount: number;
  filteredAmount?: number;
  totalAmount?: number;
  onExportCSV: (scope: 'FILTERED' | 'ALL') => Promise<void> | void;
  onExportPDF: (scope: 'FILTERED' | 'ALL') => Promise<void> | void;
  compact?: boolean;
}

export const TableExportDropdown: React.FC<TableExportDropdownProps> = ({
  label = 'Export Laporan',
  itemTypeLabel,
  filteredCount,
  totalCount,
  filteredAmount,
  totalAmount,
  onExportCSV,
  onExportPDF,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<'FILTERED' | 'ALL'>('FILTERED');
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeCount = selectedScope === 'FILTERED' ? filteredCount : totalCount;
  const activeAmount = selectedScope === 'FILTERED' ? filteredAmount : totalAmount;

  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true);
      await onExportCSV(selectedScope);
      setSuccessMsg(`File CSV (${activeCount} ${itemTypeLabel}) berhasil diunduh`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setIsOpen(false);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await onExportPDF(selectedScope);
      setSuccessMsg(`Laporan Audit PDF (${activeCount} ${itemTypeLabel}) berhasil dibuat`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setIsOpen(false);
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          isOpen
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
        } ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-xs'}`}
        title="Export data ke CSV atau PDF untuk audit dan akuntansi"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>{label}</span>
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          {filteredCount}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Success Indicator Toast */}
      {successMsg && (
        <div className="absolute right-0 top-full mt-1.5 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 text-white text-xs rounded-lg shadow-lg border border-emerald-700 whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-88 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200/80 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export Laporan Keuangan &amp; Audit</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Laporan resmi untuk audit eksternal, perpajakan &amp; akuntansi
                </p>
              </div>
            </div>

            {/* Scope Selection (Filtered vs All) */}
            <div className="mt-3 p-1 bg-white rounded-lg border border-slate-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedScope('FILTERED')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
                  selectedScope === 'FILTERED'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Hasil Filter ({filteredCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScope('ALL')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-md text-[11px] font-medium transition-all ${
                  selectedScope === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Seluruh Data ({totalCount})</span>
              </button>
            </div>

            {/* Scope Info Summary */}
            <div className="mt-2 text-[10.5px] text-slate-500 flex items-center justify-between px-1">
              <span>Target: <strong className="text-slate-700">{activeCount} {itemTypeLabel}</strong></span>
              {typeof activeAmount === 'number' && (
                <span>Total: <strong className="text-slate-800 font-mono">{formatRupiah(activeAmount)}</strong></span>
              )}
            </div>
          </div>

          {/* Export Options Body */}
          <div className="p-3 space-y-2.5">
            {/* Option 1: CSV Export */}
            <div className="group p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Export ke CSV (.csv)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                        Spreadsheet
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Format tabel lengkap 25 kolom dengan enkoding UTF-8 BOM untuk Microsoft Excel &amp; software akuntansi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  disabled={isExportingCSV || activeCount === 0}
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-2xs transition-all"
                >
                  {isExportingCSV ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Membuat CSV...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Unduh File CSV ({activeCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Option 2: PDF Audit Export */}
            <div className="group p-2.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">Export ke PDF (.pdf)</span>
                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-semibold bg-rose-100 text-rose-800">
                        Audit Resmi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Dokumen A4 Landscape resmi dengan kop surat entitas, parameter filter audit, dan 3 kolom tanda tangan verifikasi.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  disabled={isExportingPDF || activeCount === 0}
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-2xs transition-all"
                >
                  {isExportingPDF ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      <span>Unduh Laporan PDF ({activeCount})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[10.5px] text-slate-500">
            <span>Standar PSAK &amp; Rekonsiliasi Pajak</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-700 font-medium"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
