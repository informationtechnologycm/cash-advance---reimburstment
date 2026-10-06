import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, formatDateIndo, CATEGORY_LABELS } from '../../utils/formatters';
import { COMPANIES } from '../../data/initialData';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface SettlementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlementId: string | null;
  onPrintVoucher: (type: 'ADVANCE' | 'REIMBURSEMENT' | 'SETTLEMENT', id: string) => void;
}

export const SettlementDetailModal: React.FC<SettlementDetailModalProps> = ({
  isOpen,
  onClose,
  settlementId,
  onPrintVoucher,
}) => {
  const { settlements, currentUser, verifySettlement } = useFinance();
  const [verifyNotes, setVerifyNotes] = useState('');

  const settlement = settlements.find(s => s.id === settlementId);

  if (!isOpen || !settlement) return null;

  const isRefundToCompany = settlement.difference < 0;
  const isReimburseToEmployee = settlement.difference > 0;
  const isExact = settlement.difference === 0;

  const canVerify =
    settlement.status !== 'VERIFIED' &&
    (currentUser.role === 'FINANCE' || currentUser.role === 'DIRECTOR');

  const handleVerify = () => {
    verifySettlement(settlement.id, verifyNotes);
    setVerifyNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-slate-900">
                {settlement.code}
              </span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  settlement.companyId === 'AMS'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                PT {settlement.companyId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pertanggungjawaban Kasbon: <span className="font-mono font-medium">{settlement.advanceCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintVoucher('SETTLEMENT', settlement.id)}
              className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium px-2.5"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak LPJ</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Top Comparison Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Uang Muka Diterima</span>
              <div className="text-base font-bold font-mono text-slate-800 mt-0.5 tabular-nums">
                {formatRupiah(settlement.advanceAmount)}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Realisasi Pengeluaran Riil</span>
              <div className="text-base font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
                {formatRupiah(settlement.totalActualAmount)}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Status Selisih</span>
              <div
                className={`text-base font-bold font-mono mt-0.5 tabular-nums ${
                  isRefundToCompany ? 'text-emerald-700' : isReimburseToEmployee ? 'text-amber-700' : 'text-slate-700'
                }`}
              >
                {isRefundToCompany && `+ ${formatRupiah(Math.abs(settlement.difference))} (Lebih)`}
                {isReimburseToEmployee && `- ${formatRupiah(settlement.difference)} (Kurang)`}
                {isExact && 'Rp 0 (Pas)'}
              </div>
            </div>
          </div>

          {/* Refund details if applicable */}
          {isRefundToCompany && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
              <span className="font-semibold block text-xs">Bukti Pengembalian Kelebihan Kasbon</span>
              <p className="text-[11px] text-emerald-800">
                Karyawan telah mengembalikan sisa dana kasbon sebesar{' '}
                <strong>{formatRupiah(Math.abs(settlement.difference))}</strong> ke rekening perusahaan.
              </p>
              {settlement.refundProofUrl && (
                <div className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-emerald-200 mt-1">
                  No. Ref Transfer Bank: <strong>{settlement.refundProofUrl}</strong>
                </div>
              )}
            </div>
          )}

          {/* Actual items */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Daftar Realisasi Bukti Pengeluaran
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Tanggal &amp; Kategori</th>
                    <th className="py-2.5 px-3">Uraian Nota</th>
                    <th className="py-2.5 px-3">No. Invoice / Kuitansi</th>
                    <th className="py-2.5 px-3 text-right">Nominal Riil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settlement.actualItems.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">
                          {CATEGORY_LABELS[it.category] || it.category}
                        </div>
                        <div className="text-[11px] text-slate-400">{formatDateIndo(it.date)}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-900">{it.description}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {it.receiptNumber || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {formatRupiah(it.total)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70 font-semibold text-slate-900 border-t border-slate-200">
                    <td colSpan={3} className="py-2.5 px-3 text-right">
                      Total Realisasi:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm tabular-nums">
                      {formatRupiah(settlement.totalActualAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {settlement.notes && (
            <div>
              <span className="text-[11px] text-slate-500 uppercase block font-medium">Catatan Pelaksanaan</span>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 mt-1">
                {settlement.notes}
              </p>
            </div>
          )}

          {/* Audit trail */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Riwayat Verifikasi
            </h4>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              {settlement.approvalHistory.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        {entry.actorName} ({entry.actorRoleLabel})
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{entry.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-blue-700 font-medium uppercase mt-0.5">
                      {entry.action}
                    </div>
                    {entry.notes && (
                      <p className="text-slate-600 mt-0.5 text-[11px] italic bg-white p-2 rounded border border-slate-100">
                        &quot;{entry.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verify action */}
          {canVerify ? (
            <div className="pt-4 border-t border-slate-200">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-emerald-950 text-xs block">
                  Verifikasi Akunting &amp; Penutupan Kasbon Lunas
                </span>
                <input
                  type="text"
                  placeholder="Catatan verifikasi akunting..."
                  value={verifyNotes}
                  onChange={e => setVerifyNotes(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => onPrintVoucher('SETTLEMENT', settlement.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cetak Lembar LPJ</span>
                  </button>

                  <button
                    onClick={handleVerify}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Verifikasi Lunas (Close Settlement)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : settlement.status !== 'VERIFIED' ? (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-600">
                Menunggu verifikasi pemeriksaan Finance.
              </span>
              <button
                onClick={() => onPrintVoucher('SETTLEMENT', settlement.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Print LPJ</span>
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-semibold">
                Pertanggungjawaban telah terverifikasi lunas oleh Finance.
              </span>
              <button
                onClick={() => onPrintVoucher('SETTLEMENT', settlement.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100/50 flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Arsip LPJ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
