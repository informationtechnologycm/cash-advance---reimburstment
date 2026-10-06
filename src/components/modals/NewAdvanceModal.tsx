import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CompanyId, ExpenseCategory, ExpenseItem } from '../../types/finance';
import { COMPANIES, DEPARTMENTS } from '../../data/initialData';
import { CATEGORY_LABELS, formatRupiah } from '../../utils/formatters';
import { X, Plus, Trash2, Calendar, DollarSign, Building } from 'lucide-react';

interface NewAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId: string) => void;
}

export const NewAdvanceModal: React.FC<NewAdvanceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { selectedCompany, currentUser, createCostAdvance } = useFinance();

  const [companyId, setCompanyId] = useState<CompanyId>(
    selectedCompany === 'ALL' ? currentUser.companyId : selectedCompany
  );
  const [purpose, setPurpose] = useState('');
  const [requiredDate, setRequiredDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [costCenter, setCostCenter] = useState('Operasional Lapangan');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'PETTY_CASH'>('TRANSFER');

  // Bank destination
  const [bankName, setBankName] = useState(currentUser.bankAccount.bankName);
  const [accountNumber, setAccountNumber] = useState(currentUser.bankAccount.accountNumber);
  const [accountHolder, setAccountHolder] = useState(currentUser.bankAccount.accountHolder);

  // Dynamic items
  const [items, setItems] = useState<Array<{
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    date: string;
  }>>([
    {
      category: 'TRANSPORT',
      description: 'BBM & Tol Mobil Operasional',
      quantity: 1,
      unitPrice: 500000,
      date: new Date().toISOString().split('T')[0],
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        category: 'MEALS',
        description: '',
        quantity: 1,
        unitPrice: 100000,
        date: requiredDate,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totalEstimate = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert('Mohon isi tujuan pengajuan kasbon');
      return;
    }
    if (totalEstimate <= 0) {
      alert('Total estimasi kasbon harus lebih dari Rp 0');
      return;
    }

    const created = await createCostAdvance({
      companyId,
      purpose,
      requiredDate,
      costCenter: `CC-${companyId}-${costCenter.slice(0, 3).toUpperCase()}`,
      paymentMethod,
      items: items.map(it => ({
        category: it.category,
        description: it.description || 'Pengeluaran kasbon',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        date: it.date,
      })),
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder,
      },
    });

    onSuccess(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Formulir Permohonan Cost Advance (Kasbon)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pengajuan uang muka operasional atau perjalanan dinas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Company & Department Choice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Entitas Perusahaan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyId('AMS')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    companyId === 'AMS'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>PT AMS</span>
                  <span className="text-[10px] text-blue-600">Artha Mandiri</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompanyId('AMI')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    companyId === 'AMI'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>PT AMI</span>
                  <span className="text-[10px] text-emerald-600">Anugerah Mitra</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen / Cost Center
              </label>
              <select
                value={costCenter}
                onChange={e => setCostCenter(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              >
                {DEPARTMENTS[companyId].map(dept => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Purpose & Required Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tujuan Penggunaan Dana (Uraian Tugas / Proyek) *
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Contoh: Kunjungan Supervisi Kalibrasi Turbin PLTU / Tender Surabaya"
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Diperlukan *
              </label>
              <input
                type="date"
                required
                value={requiredDate}
                onChange={e => setRequiredDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          </div>

          {/* Itemized Budget Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Rincian Estimasi Biaya Kasbon
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map((it, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row gap-2 items-center text-xs">
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
                    placeholder="Deskripsi kebutuhan..."
                    value={it.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                    className="flex-1 w-full p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs"
                  />

                  <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      placeholder="Harga Satuan"
                      value={it.unitPrice}
                      onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)}
                      className="w-28 p-2 bg-white border border-slate-200 rounded-md focus:outline-none text-xs font-mono text-right"
                    />

                    <span className="w-24 text-right font-mono font-semibold text-slate-800 tabular-nums">
                      {formatRupiah((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                    </span>

                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Total Pengajuan Kasbon:</span>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {formatRupiah(totalEstimate)}
              </span>
            </div>
            {totalEstimate > 15000000 && (
              <p className="text-[11px] text-purple-700 mt-1">
                Catatan: Nominal &gt; Rp 15.000.000 mewajibkan approval akhir dari Direktur Utama.
              </p>
            )}
          </div>

          {/* Payment & Bank Destination */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Penerimaan Dana Kasbon
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Bank Penerima</span>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Nomor Rekening</span>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Atas Nama Rekening</span>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
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
              Kirim Pengajuan Kasbon
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
