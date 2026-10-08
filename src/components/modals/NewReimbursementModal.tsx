import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CompanyId, ExpenseCategory, AttachmentFile, FormDraft, ReimbursementDraftData } from '../../types/finance';
import { DEPARTMENTS } from '../../data/initialData';
import { CATEGORY_LABELS, formatRupiah } from '../../utils/formatters';
import { X, Plus, Trash2, Receipt, Bookmark, Check } from 'lucide-react';
import { SimulatedAttachmentArea } from '../common/SimulatedAttachmentArea';

interface NewReimbursementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newId: string) => void;
  initialDraft?: FormDraft | null;
  onDraftSaved?: (draftId: string) => void;
}

export const NewReimbursementModal: React.FC<NewReimbursementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDraft,
  onDraftSaved,
}) => {
  const { selectedCompany, currentUser, createReimbursement, saveDraft, deleteDraft } = useFinance();

  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  const [companyId, setCompanyId] = useState<CompanyId>(
    selectedCompany === 'ALL' ? currentUser.companyId : selectedCompany
  );
  const [purpose, setPurpose] = useState('');
  const [costCenter, setCostCenter] = useState('Operasional Lapangan');

  // Bank destination for reimbursement transfer
  const [bankName, setBankName] = useState(currentUser.bankAccount.bankName);
  const [accountNumber, setAccountNumber] = useState(currentUser.bankAccount.accountNumber);
  const [accountHolder, setAccountHolder] = useState(currentUser.bankAccount.accountHolder);

  // Attachments (Simulated receipt photos or supporting documents)
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // Dynamic receipts
  const [items, setItems] = useState<Array<{
    category: ExpenseCategory;
    description: string;
    quantity: number;
    unitPrice: number;
    date: string;
    receiptNumber: string;
  }>>([
    {
      category: 'TRANSPORT',
      description: 'Bensin SPBU Shell / Pertamina Operasional',
      quantity: 1,
      unitPrice: 350000,
      date: new Date().toISOString().split('T')[0],
      receiptNumber: 'STRUK-SPBU-01',
    },
  ]);

  // Synchronize state when modal opens or initialDraft changes
  useEffect(() => {
    if (isOpen) {
      if (initialDraft && initialDraft.type === 'REIMBURSEMENT') {
        const d = initialDraft.data as ReimbursementDraftData;
        setCurrentDraftId(initialDraft.id);
        setCompanyId(d.companyId || (selectedCompany === 'ALL' ? currentUser.companyId : selectedCompany));
        setPurpose(d.purpose || '');
        setCostCenter(d.costCenter || 'Operasional Lapangan');
        setBankName(d.bankName || currentUser.bankAccount.bankName);
        setAccountNumber(d.accountNumber || currentUser.bankAccount.accountNumber);
        setAccountHolder(d.accountHolder || currentUser.bankAccount.accountHolder);
        if (d.attachments) setAttachments(d.attachments);
        if (d.items && d.items.length > 0) {
          setItems(d.items);
        }
      } else {
        setCurrentDraftId(null);
        setCompanyId(selectedCompany === 'ALL' ? currentUser.companyId : selectedCompany);
        setPurpose('');
        setCostCenter('Operasional Lapangan');
        setBankName(currentUser.bankAccount.bankName);
        setAccountNumber(currentUser.bankAccount.accountNumber);
        setAccountHolder(currentUser.bankAccount.accountHolder);
        setAttachments([]);
        setItems([
          {
            category: 'TRANSPORT',
            description: 'Bensin SPBU Shell / Pertamina Operasional',
            quantity: 1,
            unitPrice: 350000,
            date: new Date().toISOString().split('T')[0],
            receiptNumber: 'STRUK-SPBU-01',
          },
        ]);
      }
      setSaveSuccessMsg('');
    }
  }, [isOpen, initialDraft]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        category: 'MEALS',
        description: '',
        quantity: 1,
        unitPrice: 50000,
        date: new Date().toISOString().split('T')[0],
        receiptNumber: '',
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

  const totalClaim = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim()) {
      alert('Mohon isi tujuan klaim reimbursement');
      return;
    }
    if (totalClaim <= 0) {
      alert('Total klaim harus lebih dari Rp 0');
      return;
    }

    const created = await createReimbursement({
      companyId,
      purpose,
      costCenter: `CC-${companyId}-${costCenter.slice(0, 3).toUpperCase()}`,
      items: items.map(it => ({
        category: it.category,
        description: it.description || 'Klaim biaya',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        date: it.date,
        receiptNumber: it.receiptNumber || 'Nota Terlampir',
      })),
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder,
      },
      attachments,
    });

    if (currentDraftId) {
      deleteDraft(currentDraftId);
    }

    onSuccess(created.id);
  };

  const handleSaveDraft = () => {
    const draftData: ReimbursementDraftData = {
      companyId,
      purpose: purpose.trim(),
      costCenter,
      bankName,
      accountNumber,
      accountHolder,
      attachments,
      items,
    };

    const savedId = saveDraft('REIMBURSEMENT', draftData, currentDraftId || undefined);
    setCurrentDraftId(savedId);
    setSaveSuccessMsg('Draft reimbursement berhasil disimpan!');
    setTimeout(() => {
      setSaveSuccessMsg('');
      if (onDraftSaved) onDraftSaved(savedId);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Formulir Klaim Reimbursement
              </h2>
              {currentDraftId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Bookmark className="w-3 h-3 text-amber-600" />
                  Melanjutkan Draft
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Penggantian uang pribadi karyawan yang telah digunakan untuk operasional
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
                Departemen Pembebanan
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keperluan Klaim Reimbursement *
            </label>
            <input
              type="text"
              required
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Contoh: Penggantian BBM & E-Toll Kunjungan Client / Medis Rawat Jalan"
              className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Itemized Receipts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Daftar Kuitansi / Bukti Pembayaran
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Bukti</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
              {items.map((it, idx) => (
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
                      placeholder="Uraian pengeluaran..."
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
                      placeholder="No. Struk / Kuitansi (contoh: STRUK-881)"
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
                      placeholder="Nominal"
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
              <span className="font-semibold text-slate-700">Total Klaim Reimbursement:</span>
              <span className="text-base font-bold font-mono text-slate-900 tabular-nums">
                {formatRupiah(totalClaim)}
              </span>
            </div>
          </div>

          {/* Simulated Attachment Area for Receipts & Supporting Invoices */}
          <div className="pt-2 border-t border-slate-100">
            <SimulatedAttachmentArea
              attachments={attachments}
              onChange={setAttachments}
              mode="reimbursement"
              companyId={companyId}
              title="Area Lampiran Foto Struk &amp; Kuitansi Asli"
              description="Unggah foto struk kasir, nota BBM/tol, kuitansi bermaterai, tiket perjalanan, atau faktur fisik untuk verifikasi Finance."
            />
          </div>

          {/* Transfer destination */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Rekening Karyawan (Tujuan Transfer Penggantian)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Nama Bank</span>
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
                <span className="text-[11px] text-slate-500 block mb-1">Atas Nama</span>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {saveSuccessMsg ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Formulir klaim dapat disimpan sementara untuk dilengkapi nanti.
              </div>
            )}
            <div className="flex items-center justify-end gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-slate-900 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                title="Simpan formulir ini sebagai draf dan lanjutkan pengisian nanti di tab Drafts"
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-600" />
                <span>Simpan sebagai Draft</span>
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
              >
                Ajukan Reimbursement
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
