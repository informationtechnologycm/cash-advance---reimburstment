import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AdvanceStatus, CompanyId } from '../types/finance';
import { formatRupiah, formatDateIndo, getAdvanceStatusInfo, checkIsOverdue } from '../utils/formatters';
import { TableFilterBar, StatusOption } from './TableFilterBar';
import { TableExportDropdown } from './TableExportDropdown';
import { exportCostAdvancesToCSV, exportCostAdvancesToPDF } from '../utils/tableExport';
import {
  Plus,
  Printer,
  FileCheck,
  AlertCircle,
  Eye,
  Check,
  X,
  CreditCard,
} from 'lucide-react';

interface CostAdvanceViewProps {
  onOpenNewAdvance: () => void;
  onSelectAdvance: (id: string) => void;
  onOpenSettlement: (advanceId: string) => void;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const CostAdvanceView: React.FC<CostAdvanceViewProps> = ({
  onOpenNewAdvance,
  onSelectAdvance,
  onOpenSettlement,
  onPrintVoucher,
}) => {
  const { filteredAdvances, currentUser, selectedCompany } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [requestorQuery, setRequestorQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdvanceStatus | 'ACTIVE'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyMine, setOnlyMine] = useState(currentUser.role === 'STAFF');

  const availableRequestors = useMemo(() => {
    const names = new Set<string>();
    filteredAdvances.forEach(a => {
      if (a.applicantName) names.add(a.applicantName);
    });
    return Array.from(names).sort();
  }, [filteredAdvances]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    requestorQuery.trim() ||
    statusFilter !== 'ALL' ||
    startDate ||
    endDate ||
    (currentUser.role !== 'STAFF' && onlyMine)
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setRequestorQuery('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    if (currentUser.role !== 'STAFF') {
      setOnlyMine(false);
    }
  };

  const statusOptions: StatusOption[] = [
    { value: 'ALL', label: 'Semua Status', count: filteredAdvances.length },
    {
      value: 'PENDING_MANAGER',
      label: 'Mengetahui Atasan',
      count: filteredAdvances.filter(a => a.status === 'PENDING_MANAGER').length,
    },
    {
      value: 'PENDING_FINANCE',
      label: 'Verifikasi Finance',
      count: filteredAdvances.filter(a => a.status === 'PENDING_FINANCE').length,
    },
    {
      value: 'PENDING_DIRECTOR',
      label: 'Review Direksi',
      count: filteredAdvances.filter(a => a.status === 'PENDING_DIRECTOR').length,
    },
    {
      value: 'ACTIVE',
      label: 'Kasbon Aktif',
      count: filteredAdvances.filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT').length,
    },
    {
      value: 'SETTLED',
      label: 'Lunas (LPJ Tuntas)',
      count: filteredAdvances.filter(a => a.status === 'SETTLED').length,
    },
    {
      value: 'REJECTED',
      label: 'Ditolak',
      count: filteredAdvances.filter(a => a.status === 'REJECTED').length,
    },
  ];

  // Filtered list
  const displayAdvances = filteredAdvances.filter(adv => {
    // Only mine filter
    if (onlyMine) {
      const isMine =
        adv.applicantId === currentUser.id ||
        adv.applicantName.toLowerCase() === currentUser.name.toLowerCase();
      if (!isMine) return false;
    }

    // Requestor filter
    if (requestorQuery.trim()) {
      if (adv.applicantName.toLowerCase() !== requestorQuery.toLowerCase()) {
        return false;
      }
    }

    // Date range filter
    if (startDate && adv.requestDate < startDate) {
      return false;
    }
    if (endDate && adv.requestDate > endDate) {
      return false;
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        adv.code.toLowerCase().includes(q) ||
        adv.applicantName.toLowerCase().includes(q) ||
        adv.purpose.toLowerCase().includes(q) ||
        adv.costCenter.toLowerCase().includes(q) ||
        adv.applicantDepartment.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Status filter
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') {
      return adv.status === 'DISBURSED' || adv.status === 'PENDING_SETTLEMENT';
    }
    return adv.status === statusFilter;
  });

  const totalFilteredAmount = displayAdvances.reduce((sum, a) => sum + a.totalAmount, 0);

  // Export Handlers for External Audit and Accounting
  const handleExportCSV = (scope: 'FILTERED' | 'ALL') => {
    const dataToExport = scope === 'FILTERED' ? displayAdvances : filteredAdvances;
    exportCostAdvancesToCSV(dataToExport, {
      selectedCompany,
      currentUserName: currentUser.name,
      currentUserRole: currentUser.roleLabel || currentUser.role,
      searchQuery: scope === 'FILTERED' ? searchQuery : undefined,
      requestorQuery: scope === 'FILTERED' ? requestorQuery : undefined,
      statusFilter: scope === 'FILTERED' ? statusFilter : undefined,
      startDate: scope === 'FILTERED' ? startDate : undefined,
      endDate: scope === 'FILTERED' ? endDate : undefined,
      isOnlyMine: scope === 'FILTERED' ? onlyMine : undefined,
    });
  };

  const handleExportPDF = (scope: 'FILTERED' | 'ALL') => {
    const dataToExport = scope === 'FILTERED' ? displayAdvances : filteredAdvances;
    exportCostAdvancesToPDF(dataToExport, {
      selectedCompany,
      currentUserName: currentUser.name,
      currentUserRole: currentUser.roleLabel || currentUser.role,
      searchQuery: scope === 'FILTERED' ? searchQuery : undefined,
      requestorQuery: scope === 'FILTERED' ? requestorQuery : undefined,
      statusFilter: scope === 'FILTERED' ? statusFilter : undefined,
      startDate: scope === 'FILTERED' ? startDate : undefined,
      endDate: scope === 'FILTERED' ? endDate : undefined,
      isOnlyMine: scope === 'FILTERED' ? onlyMine : undefined,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Cost Advance (Uang Muka Biaya)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen pengajuan kasbon operasional dan proyek untuk PT AMS &amp; PT AMI
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export to CSV/PDF Dropdown */}
          <TableExportDropdown
            itemTypeLabel="Kasbon"
            filteredCount={displayAdvances.length}
            totalCount={filteredAdvances.length}
            filteredAmount={totalFilteredAmount}
            totalAmount={filteredAdvances.reduce((sum, a) => sum + a.totalAmount, 0)}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />

          <button
            onClick={onOpenNewAdvance}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Cost Advance Baru</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter and Search Bar Component */}
      <TableFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode (misal CA-AMS-2026), keperluan, cost center, departemen..."
        requestorQuery={requestorQuery}
        onRequestorChange={setRequestorQuery}
        availableRequestors={availableRequestors}
        status={statusFilter}
        onStatusChange={val => setStatusFilter(val as any)}
        statusOptions={statusOptions}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onlyMine={onlyMine}
        onToggleOnlyMine={() => setOnlyMine(!onlyMine)}
        showOnlyMine={true}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        totalCount={filteredAdvances.length}
        filteredCount={displayAdvances.length}
        totalAmount={totalFilteredAmount}
        itemName="kasbon"
        exportActions={
          <TableExportDropdown
            label="Export"
            itemTypeLabel="Kasbon"
            filteredCount={displayAdvances.length}
            totalCount={filteredAdvances.length}
            filteredAmount={totalFilteredAmount}
            totalAmount={filteredAdvances.reduce((sum, a) => sum + a.totalAmount, 0)}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            compact={true}
          />
        }
      />

      {/* Table Section */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {displayAdvances.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Tidak ada pengajuan kasbon yang cocok</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cobalah ubah filter pencarian atau buat pengajuan Cost Advance baru.
            </p>
            <button
              onClick={onOpenNewAdvance}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              Buat Kasbon Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-3 px-4">No. Dokumen &amp; Entitas</th>
                  <th className="py-3 px-4">Tujuan Penggunaan</th>
                  <th className="py-3 px-4">Pemohon &amp; Dept</th>
                  <th className="py-3 px-4">Tgl Diperlukan</th>
                  <th className="py-3 px-4 text-right">Nominal Kasbon</th>
                  <th className="py-3 px-4">Status &amp; Jatuh Tempo</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayAdvances.map(adv => {
                  const statusInfo = getAdvanceStatusInfo(adv.status);
                  const isOverdue =
                    adv.status === 'PENDING_SETTLEMENT' && checkIsOverdue(adv.settlementDeadlineDate);

                  return (
                    <tr
                      key={adv.id}
                      onClick={() => onSelectAdvance(adv.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{adv.code}</span>
                          {(adv.applicantId === currentUser.id || adv.applicantName.toLowerCase() === currentUser.name.toLowerCase()) && (
                            <span className="text-[9px] px-1 bg-blue-600 text-white rounded font-bold">
                              SAYA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              adv.companyId === 'AMS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            PT {adv.companyId}
                          </span>
                          <span>·</span>
                          <span>{formatDateIndo(adv.requestDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">{adv.purpose}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Cost Center: {adv.costCenter}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{adv.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{adv.applicantDepartment}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{formatDateIndo(adv.requiredDate)}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {adv.paymentMethod === 'TRANSFER' ? 'Transfer Bank' : 'Kas Kecil'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatRupiah(adv.totalAmount)}
                        </div>
                        <div className="text-[11px] text-slate-400">{adv.items.length} rincian biaya</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                        >
                          {statusInfo.label}
                        </span>
                        {isOverdue && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Overdue Settlement!
                          </div>
                        )}
                        {adv.status === 'PENDING_SETTLEMENT' && !isOverdue && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Deadline: {formatDateIndo(adv.settlementDeadlineDate)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectAdvance(adv.id)}
                            title="Lihat Detail & Persetujuan"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onPrintVoucher('ADVANCE', adv.id)}
                            title="Cetak & Unduh Voucher PDF (BKK)"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* If advance is disbursed/pending settlement, show button to settle */}
                          {(adv.status === 'PENDING_SETTLEMENT' || adv.status === 'DISBURSED') && (
                            <button
                              onClick={() => onOpenSettlement(adv.id)}
                              title="Buat Pertanggungjawaban (Settlement)"
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              Settle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
