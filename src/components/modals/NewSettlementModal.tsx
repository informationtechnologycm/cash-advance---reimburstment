import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ExpenseCategory } from '../../types/finance';
import { CATEGORY_LABELS, formatRupiah, formatDateIndo } from '../../utils/formatters';
import { COMPANIES } from '../../data/initialData';
import { X, Plus, Trash2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface NewSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  advanceId: string | null;
  onSuccess: (newSettlementId: string) => void;
}

export const NewSettlementModal: React.FC<NewSettlementModalProps> = ({
  isOpen,
  onClose,
  advanceId,
  onSuccess,
}) => {
  const { advances, createSettlement } = useFinance();

  const selectedAdvance = advances.find(a => a.id === advanceId);

  // Initialize actual items from the advance estimation items
  const [actualItems, setActualItems] = useState<Array<{
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    date: string;
    receiptNumber: string;
  }>>(() => {
    if (selectedAdvance) {
      return selectedAdvance.items.map(it => ({
        category: it.category,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        date: it.date || new Date().toISOString().split('T')[0],
        receiptNumber: 'NOTA-REALISASI-01',
      }));
    }
    return [
      {
        category: 'TRANSPORT',
        description: 'BBM Riil Sesuai Struk',
        quantity: 1,
        unitPrice: 500000,
        date: new Date().toISOString().split('T')[0],
        receiptNumber: 'SPBU-991',
      },
    ];
  });

  const [notes, setNotes] = useState('');
  const [refundProofUrl, setRefundProofUrl] = useState('');

  if (!isOpen || !selectedAdvance) return null;

  const handleAddItem = () => {
    setActualItems([
      ...actualItems,
      {
        category: 'MEALS',
        description: '',
        quantity: 1,
        unitPrice: 100000,
        date: new Date().toISOString().split('T')[0],
        receiptNumber: '',
      },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (actualItems.length <= 1) return;
    setActualItems(actualItems.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...actualItems];
    updated[idx] = { ...updated[idx], [field]: val };
    setActualItems(updated);
  };

  const totalActual = actualItems.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  const difference = totalActual - selectedAdvance.totalAmount;
  const isRefundToCompany = difference < 0;
  const isReimburseToEmployee = difference > 0;
  const isExact = difference === 0;

  const targetCompany = COMPANIES[selectedAdvance.companyId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalActual <= 0) {
      alert('Total realisasi pengeluaran harus lebih besar dari Rp 0');
      return;
    }

    if (isRefundToCompany && !refundProofUrl.trim()) {
      alert(
        `Kelebihan dana kasbon sebesar ${formatRupiah(
          Math.abs(difference)
        )} wajib disetor kembali ke rekening perusahaan. Mohon masukkan No. Referensi Transfer Pengembalian.`
      );
      return;
    }

    const created = await createSettlement({
      advanceId: selectedAdvance.id,
      actualItems: actualItems.map(it => ({
        category: it.category,
        description: it.description || 'Pengeluaran riil',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        date: it.date,
        receiptNumber: it.receiptNumber || 'Nota Terlampir',
      })),
      notes: notes || undefined,
      refundProofUrl: refundProofUrl || undefined,
    });

    onSuccess(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Formulir Pertanggungjawaban Kasbon (Advance Settlement)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ref: <span className="font-mono font-semibold text-slate-800">{selectedAdvance.code}</span> (PT {selectedAdvance.companyId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary of Original Advance */}
          <div className="p-3.5 bg-slate-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div>
              <div className="font-semibold text-slate-900">{selectedAdvance.purpose}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Pemohon: {selectedAdvance.applicantName} ({selectedAdvance.applicantDepartment})
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-500 block">Kasbon Diterima</span>
              <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                {formatRupiah(selectedAdvance.totalAmount)}
              </span>
            </div>
          </div>

          {/* Actual items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Realisasi Pengeluaran Riil (Sesuai Kuitansi &amp; Nota)
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris Realisasi</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {actualItems.map((it, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <select
                      value={it.category}
                      onChange={e => handleItemChange(idx, 'category', e.target.value)}
                      className="w-full sm:w-44 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs"
                    >
                      {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map(cat => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Uraian riil pengeluaran..."
                      value={it.description}
                      onChange={e => handleItemChange(idx, 'description', e.target.value)}
                      className="flex-1 w-full p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs"
                    />

                    <input
                      type="date"
                      value={it.date}
                      onChange={e => handleItemChange(idx, 'date', e.target.value)}
                      className="w-32 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nomor Nota / Invoice Toko"
                      value={it.receiptNumber}
                      onChange={e => handleItemChange(idx, 'receiptNumber', e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs font-mono"
                    />

                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={it.quantity}
                      onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-16 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs text-center"
                    />

                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Harga"
                      value={it.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-28 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs font-mono text-right"
                    />

                    <span className="w-24 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {formatRupiah((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                    </span>

                    <button
                      type="button"
                      disabled={actualItems.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variance Box (Perhitungan Selisih) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Total Kasbon Diberikan:</span>
              <span className="font-mono text-slate-800 tabular-nums font-semibold">
                {formatRupiah(selectedAdvance.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600">Total Realisasi Pengeluaran:</span>
              <span className="font-mono text-slate-900 tabular-nums font-bold">
                {formatRupiah(totalActual)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Status Selisih Dana:</span>
                <span className="text-[11px] text-slate-500">
                  {isRefundToCompany && 'Sisa uang kasbon lebih kecil dari pagu (Wajib dikembalikan ke kas perusahaan)'}
                  {isReimburseToEmployee && 'Realisasi melebihi pagu (Perusahaan akan mengganti kelebihan)'}
                  {isExact && 'Pengeluaran sama persis dengan kasbon (Nihil)'}
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`text-base font-bold font-mono tabular-nums ${
                    isRefundToCompany ? 'text-emerald-700' : isReimburseToEmployee ? 'text-amber-700' : 'text-slate-700'
                  }`}
                >
                  {isRefundToCompany && `+ ${formatRupiah(Math.abs(difference))} (Lebih)`}
                  {isReimburseToEmployee && `- ${formatRupiah(difference)} (Kurang)`}
                  {isExact && 'Rp 0 (Pas)'}
                </span>
              </div>
            </div>
          </div>

          {/* If employee needs to refund excess money to company */}
          {isRefundToCompany && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Instruksi Pengembalian Sisa Kasbon</span>
              </div>
              <p className="text-emerald-800 text-[11px]">
                Silakan transfer sisa kasbon sebesar{' '}
                <strong className="font-mono font-bold">{formatRupiah(Math.abs(difference))}</strong> ke rekening PT{' '}
                {selectedAdvance.companyId}:
              </p>
              <div className="p-2.5 bg-white border border-emerald-200 rounded-lg font-mono text-[11px] text-slate-900">
                {targetCompany.primaryBank} · {targetCompany.accountNumber} <br />
                a.n {targetCompany.accountName}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-emerald-900 mt-2 mb-1">
                  Nomor Referensi / ID Transaksi Pengembalian Bank *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TRF-REFUND-BCA-202610-9921"
                  value={refundProofUrl}
                  onChange={e => setRefundProofUrl(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-lg font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan Pelaksanaan Kegiatan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Catatan pelaksanaan pekerjaan atau penjelasan selisih nota..."
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Simpan &amp; Serahkan Pertanggungjawaban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
