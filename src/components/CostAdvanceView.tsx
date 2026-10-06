import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { AdvanceStatus, CompanyId } from '../types/finance';
import { formatRupiah, formatDateIndo, getAdvanceStatusInfo, checkIsOverdue } from '../utils/formatters';
import {
  Search,
  Filter,
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
  const { filteredAdvances, currentUser } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdvanceStatus | 'ACTIVE'>('ALL');
  const [onlyMine, setOnlyMine] = useState(currentUser.role === 'STAFF');

  // Filtered list
  const displayAdvances = filteredAdvances.filter(adv => {
    // Only mine filter
    if (onlyMine) {
      const isMine =
        adv.applicantId === currentUser.id ||
        adv.applicantName.toLowerCase() === currentUser.name.toLowerCase();
      if (!isMine) return false;
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

        <button
          onClick={onOpenNewAdvance}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Cost Advance Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kode (misal CA-AMS-2026), pemohon, tujuan, cost center..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Status Tabs and Only Mine toggle */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                onlyMine
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{onlyMine ? '✓ Pengajuan Saya Saja' : 'Pengajuan Saya'}</span>
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_MANAGER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PENDING_MANAGER'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Mengetahui Atasan ({filteredAdvances.filter(a => a.status === 'PENDING_MANAGER').length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_FINANCE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PENDING_FINANCE'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Verifikasi Finance ({filteredAdvances.filter(a => a.status === 'PENDING_FINANCE').length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Kasbon Aktif (
              {filteredAdvances.filter(a => a.status === 'DISBURSED' || a.status === 'PENDING_SETTLEMENT').length}
              )
            </button>
            <button
              onClick={() => setStatusFilter('SETTLED')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'SETTLED'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Lunas ({filteredAdvances.filter(a => a.status === 'SETTLED').length})
            </button>
          </div>
        </div>

        {/* Summary info strip */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{displayAdvances.length}</span> berkas
          </div>
          <div>
            Total Nilai:{' '}
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {formatRupiah(totalFilteredAmount)}
            </span>
          </div>
        </div>
      </div>

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
