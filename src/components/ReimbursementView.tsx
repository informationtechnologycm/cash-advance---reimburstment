import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ReimbursementStatus } from '../types/finance';
import { formatRupiah, formatDateIndo, getReimbursementStatusInfo, CATEGORY_LABELS } from '../utils/formatters';
import { TableFilterBar, StatusOption } from './TableFilterBar';
import { TableExportDropdown } from './TableExportDropdown';
import { exportReimbursementsToCSV, exportReimbursementsToPDF } from '../utils/tableExport';
import {
  Plus,
  Printer,
  Eye,
  AlertCircle,
  Receipt,
  CheckCircle,
} from 'lucide-react';

interface ReimbursementViewProps {
  onOpenNewReimbursement: () => void;
  onSelectReimbursement: (id: string) => void;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const ReimbursementView: React.FC<ReimbursementViewProps> = ({
  onOpenNewReimbursement,
  onSelectReimbursement,
  onPrintVoucher,
}) => {
  const { filteredReimbursements, currentUser, selectedCompany } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [requestorQuery, setRequestorQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReimbursementStatus>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyMine, setOnlyMine] = useState(currentUser.role === 'STAFF');

  const availableRequestors = useMemo(() => {
    const names = new Set<string>();
    filteredReimbursements.forEach(r => {
      if (r.applicantName) names.add(r.applicantName);
    });
    return Array.from(names).sort();
  }, [filteredReimbursements]);

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
    { value: 'ALL', label: 'Semua Status', count: filteredReimbursements.length },
    {
      value: 'PENDING_MANAGER',
      label: 'Review Manager',
      count: filteredReimbursements.filter(r => r.status === 'PENDING_MANAGER').length,
    },
    {
      value: 'PENDING_FINANCE',
      label: 'Verifikasi Finance',
      count: filteredReimbursements.filter(r => r.status === 'PENDING_FINANCE').length,
    },
    {
      value: 'APPROVED',
      label: 'Disetujui (Siap Bayar)',
      count: filteredReimbursements.filter(r => r.status === 'APPROVED').length,
    },
    {
      value: 'PAID',
      label: 'Lunas Terbayar',
      count: filteredReimbursements.filter(r => r.status === 'PAID').length,
    },
    {
      value: 'REJECTED',
      label: 'Ditolak',
      count: filteredReimbursements.filter(r => r.status === 'REJECTED').length,
    },
  ];

  const displayReimbursements = filteredReimbursements.filter(rb => {
    if (onlyMine) {
      const isMine =
        rb.applicantId === currentUser.id ||
        rb.applicantName.toLowerCase() === currentUser.name.toLowerCase();
      if (!isMine) return false;
    }

    if (requestorQuery.trim()) {
      if (rb.applicantName.toLowerCase() !== requestorQuery.toLowerCase()) {
        return false;
      }
    }

    if (startDate && rb.requestDate < startDate) {
      return false;
    }
    if (endDate && rb.requestDate > endDate) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        rb.code.toLowerCase().includes(q) ||
        rb.applicantName.toLowerCase().includes(q) ||
        rb.purpose.toLowerCase().includes(q) ||
        rb.costCenter.toLowerCase().includes(q) ||
        rb.applicantDepartment.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (statusFilter === 'ALL') return true;
    return rb.status === statusFilter;
  });

  const totalFiltered = displayReimbursements.reduce((sum, r) => sum + r.totalAmount, 0);

  // Export Handlers for External Audit and Accounting
  const handleExportCSV = (scope: 'FILTERED' | 'ALL') => {
    const dataToExport = scope === 'FILTERED' ? displayReimbursements : filteredReimbursements;
    exportReimbursementsToCSV(dataToExport, {
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
    const dataToExport = scope === 'FILTERED' ? displayReimbursements : filteredReimbursements;
    exportReimbursementsToPDF(dataToExport, {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Reimbursement (Klaim Pengeluaran)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Penggantian biaya operasional mandiri karyawan dengan bukti kuitansi / nota riil
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Export to CSV/PDF Dropdown */}
          <TableExportDropdown
            itemTypeLabel="Klaim"
            filteredCount={displayReimbursements.length}
            totalCount={filteredReimbursements.length}
            filteredAmount={totalFiltered}
            totalAmount={filteredReimbursements.reduce((sum, r) => sum + r.totalAmount, 0)}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />

          <button
            onClick={onOpenNewReimbursement}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Klaim Reimbursement Baru</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter and Search Bar Component */}
      <TableFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari kode (misal RB-AMS-2026), pemohon, tujuan klaim, departemen..."
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
        totalCount={filteredReimbursements.length}
        filteredCount={displayReimbursements.length}
        totalAmount={totalFiltered}
        itemName="klaim"
        exportActions={
          <TableExportDropdown
            label="Export"
            itemTypeLabel="Klaim"
            filteredCount={displayReimbursements.length}
            totalCount={filteredReimbursements.length}
            filteredAmount={totalFiltered}
            totalAmount={filteredReimbursements.reduce((sum, r) => sum + r.totalAmount, 0)}
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            compact={true}
          />
        }
      />

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {displayReimbursements.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-700">Tidak ada klaim reimbursement</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Karyawan dapat mengajukan penggantian nota BBM, konsumsi, tiket, atau medis di sini.
            </p>
            <button
              onClick={onOpenNewReimbursement}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              Buat Klaim Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-3 px-4">No. Dokumen &amp; Entitas</th>
                  <th className="py-3 px-4">Tujuan Klaim Biaya</th>
                  <th className="py-3 px-4">Pemohon &amp; Dept</th>
                  <th className="py-3 px-4">Rekening Tujuan</th>
                  <th className="py-3 px-4 text-right">Total Klaim</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayReimbursements.map(rb => {
                  const statusInfo = getReimbursementStatusInfo(rb.status);

                  return (
                    <tr
                      key={rb.id}
                      onClick={() => onSelectReimbursement(rb.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{rb.code}</span>
                          {(rb.applicantId === currentUser.id || rb.applicantName.toLowerCase() === currentUser.name.toLowerCase()) && (
                            <span className="text-[9px] px-1 bg-emerald-600 text-white rounded font-bold">
                              SAYA
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              rb.companyId === 'AMS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            PT {rb.companyId}
                          </span>
                          <span>·</span>
                          <span>{formatDateIndo(rb.requestDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 line-clamp-1">{rb.purpose}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rb.items.length} item kuitansi · {rb.costCenter}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{rb.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{rb.applicantDepartment}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800">
                          {rb.applicantBankAccount.bankName} - {rb.applicantBankAccount.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          a.n {rb.applicantBankAccount.accountHolder}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatRupiah(rb.totalAmount)}
                        </div>
                        {rb.status === 'PAID' && rb.paymentDetails && (
                          <div className="text-[10px] text-emerald-600 font-medium">
                            Lunas tgl {formatDateIndo(rb.paymentDetails.paidDate)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusInfo.textColor} ${statusInfo.bgLight} ${statusInfo.borderColor}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectReimbursement(rb.id)}
                            title="Lihat Detail & Persetujuan"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onPrintVoucher('REIMBURSEMENT', rb.id)}
                            title="Cetak & Unduh Voucher PDF (BKK)"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
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
