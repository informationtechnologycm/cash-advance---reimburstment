import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatDateIndo, checkIsOverdue } from '../utils/formatters';
import {
  FileText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface SettlementViewProps {
  onOpenSettlement: (advanceId: string) => void;
  onSelectSettlement: (id: string) => void;
  onSelectAdvance: (id: string) => void;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const SettlementView: React.FC<SettlementViewProps> = ({
  onOpenSettlement,
  onSelectSettlement,
  onSelectAdvance,
  onPrintVoucher,
}) => {
  const { filteredAdvances, filteredSettlements, currentUser } = useFinance();
  const [onlyMine, setOnlyMine] = useState(currentUser.role === 'STAFF');

  // Active advances that need settlement (Status DISBURSED or PENDING_SETTLEMENT)
  const advancesNeedingSettlement = filteredAdvances.filter(a => {
    if ((a.status !== 'PENDING_SETTLEMENT' && a.status !== 'DISBURSED') || a.settlementId) return false;
    if (onlyMine) {
      return a.applicantId === currentUser.id || a.applicantName.toLowerCase() === currentUser.name.toLowerCase();
    }
    return true;
  });

  const displaySettlements = filteredSettlements.filter(s => {
    if (onlyMine) {
      return s.applicantId === currentUser.id || s.applicantName.toLowerCase() === currentUser.name.toLowerCase();
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Pertanggungjawaban Kasbon (Advance Settlement)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Penyelesaian uang muka biaya dengan bukti nota riil, perhitungan lebih/kurang bayar, dan verifikasi akuntansi
        </p>
      </div>

      {/* Top Section: Outstanding Kasbon awaiting settlement */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Kasbon Aktif Belum Dipertanggungjawabkan ({advancesNeedingSettlement.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uang muka yang telah dicairkan dan perlu dilaporkan kuitansi penggunaannya
            </p>
          </div>
        </div>

        {advancesNeedingSettlement.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
            Semua kasbon yang telah dicairkan sudah dipertanggungjawabkan dengan lengkap.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {advancesNeedingSettlement.map(adv => {
              const isOverdue = checkIsOverdue(adv.settlementDeadlineDate);

              return (
                <div
                  key={adv.id}
                  className={`border rounded-xl p-4 flex flex-col justify-between transition-all ${
                    isOverdue
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{adv.code}</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                            adv.companyId === 'AMS'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          PT {adv.companyId}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 tabular-nums">
                        {formatRupiah(adv.totalAmount)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium mt-2 line-clamp-1">{adv.purpose}</p>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>Pemohon: {adv.applicantName}</span>
                      <span>·</span>
                      <span>{adv.applicantDepartment}</span>
                    </div>

                    <div className="mt-2 text-[11px] flex items-center gap-1.5">
                      <span className="text-slate-500">Batas Lapor:</span>
                      <span className={`font-medium ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                        {formatDateIndo(adv.settlementDeadlineDate)} {isOverdue && '(Jatuh Tempo!)'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      onClick={() => onSelectAdvance(adv.id)}
                      className="text-xs text-slate-600 hover:text-slate-900 font-medium"
                    >
                      Lihat Rincian Kasbon
                    </button>
                    <button
                      onClick={() => onOpenSettlement(adv.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
                    >
                      <span>+ Buat Pertanggungjawaban</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: History of settlements */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Riwayat Pertanggungjawaban Kasbon (Realized Settlements)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dokumen pencocokan nota riil terhadap kasbon yang telah diajukan
            </p>
          </div>
        </div>

        {filteredSettlements.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">
            Belum ada berkas pertanggungjawaban kasbon yang diserahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-medium">
                  <th className="py-3 px-4">No. Settlement &amp; Kasbon</th>
                  <th className="py-3 px-4">Pemohon &amp; Dept</th>
                  <th className="py-3 px-4">Tgl Lapor</th>
                  <th className="py-3 px-4 text-right">Kasbon Diterima</th>
                  <th className="py-3 px-4 text-right">Total Realisasi</th>
                  <th className="py-3 px-4 text-right">Selisih &amp; Status Dana</th>
                  <th className="py-3 px-4">Status Akunting</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSettlements.map(st => {
                  const isRefund = st.difference < 0;
                  const isReimburse = st.difference > 0;
                  const isExact = st.difference === 0;

                  return (
                    <tr
                      key={st.id}
                      onClick={() => onSelectSettlement(st.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{st.code}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span
                            className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                              st.companyId === 'AMS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            PT {st.companyId}
                          </span>
                          <span>·</span>
                          <span className="font-mono text-slate-600">{st.advanceCode}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{st.applicantName}</div>
                        <div className="text-[11px] text-slate-500">{st.applicantDepartment}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">{formatDateIndo(st.settlementDate)}</td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {formatRupiah(st.advanceAmount)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(st.totalActualAmount)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isRefund && (
                          <div>
                            <span className="font-mono font-semibold text-emerald-700">
                              + {formatRupiah(Math.abs(st.difference))}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Karyawan Refund ke Kas
                            </div>
                          </div>
                        )}
                        {isReimburse && (
                          <div>
                            <span className="font-mono font-semibold text-amber-700">
                              - {formatRupiah(st.difference)}
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Perusahaan Ganti Sisa
                            </div>
                          </div>
                        )}
                        {isExact && (
                          <div>
                            <span className="font-mono font-semibold text-slate-700">Rp 0</span>
                            <div className="text-[10px] text-slate-500">Nihil / Pas</div>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {st.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-300 bg-emerald-50 text-emerald-800">
                            Terverifikasi &amp; Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-blue-300 bg-blue-50 text-blue-800">
                            Menunggu Verifikasi
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectSettlement(st.id)}
                            title="Lihat Detail Settlement"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onPrintVoucher('SETTLEMENT', st.id)}
                            title="Cetak Formulir Pertanggungjawaban"
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
