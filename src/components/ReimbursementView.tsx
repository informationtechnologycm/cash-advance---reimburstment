import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { ReimbursementStatus } from '../types/finance';
import { formatRupiah, formatDateIndo, getReimbursementStatusInfo, CATEGORY_LABELS } from '../utils/formatters';
import {
  Search,
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
  const { filteredReimbursements, currentUser } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReimbursementStatus>('ALL');
  const [onlyMine, setOnlyMine] = useState(currentUser.role === 'STAFF');

  const displayReimbursements = filteredReimbursements.filter(rb => {
    if (onlyMine) {
      const isMine =
        rb.applicantId === currentUser.id ||
        rb.applicantName.toLowerCase() === currentUser.name.toLowerCase();
      if (!isMine) return false;
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

        <button
          onClick={onOpenNewReimbursement}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Klaim Reimbursement Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari kode reimbursement, pemohon, tujuan klaim..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
            <button
              onClick={() => setOnlyMine(!onlyMine)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 border ${
                onlyMine
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{onlyMine ? '✓ Klaim Saya Saja' : 'Klaim Saya'}</span>
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
              Semua ({filteredReimbursements.length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_MANAGER')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PENDING_MANAGER'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Review Manager ({filteredReimbursements.filter(r => r.status === 'PENDING_MANAGER').length})
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_FINANCE')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PENDING_FINANCE'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Review Finance ({filteredReimbursements.filter(r => r.status === 'PENDING_FINANCE').length})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'APPROVED'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Siap Bayar ({filteredReimbursements.filter(r => r.status === 'APPROVED').length})
            </button>
            <button
              onClick={() => setStatusFilter('PAID')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === 'PAID'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Lunas ({filteredReimbursements.filter(r => r.status === 'PAID').length})
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-semibold text-slate-800">{displayReimbursements.length}</span> klaim
          </div>
          <div>
            Total Klaim:{' '}
            <span className="font-mono font-bold text-slate-900 tabular-nums">
              {formatRupiah(totalFiltered)}
            </span>
          </div>
        </div>
      </div>

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
