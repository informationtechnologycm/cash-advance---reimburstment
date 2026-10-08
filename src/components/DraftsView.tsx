import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { FormDraft, FormDraftType } from '../types/finance';
import { COMPANIES } from '../data/initialData';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import {
  Bookmark,
  FileEdit,
  Trash2,
  Plus,
  Search,
  ArrowRight,
  Receipt,
  CreditCard,
  Building,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface DraftsViewProps {
  onResumeAdvanceDraft: (draft: FormDraft) => void;
  onResumeReimbursementDraft: (draft: FormDraft) => void;
  onOpenNewAdvance: () => void;
  onOpenNewReimbursement: () => void;
}

export const DraftsView: React.FC<DraftsViewProps> = ({
  onResumeAdvanceDraft,
  onResumeReimbursementDraft,
  onOpenNewAdvance,
  onOpenNewReimbursement,
}) => {
  const { filteredDrafts, deleteDraft, selectedCompany, currentUser } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | FormDraftType>('ALL');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'created_desc' | 'amount_desc' | 'amount_asc'>('updated_desc');
  const [draftToDelete, setDraftToDelete] = useState<FormDraft | null>(null);

  // Filter and sort drafts
  const displayedDrafts = useMemo(() => {
    return filteredDrafts
      .filter(d => {
        if (typeFilter !== 'ALL' && d.type !== typeFilter) return false;
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.applicantName.toLowerCase().includes(q) ||
          (d.applicantDepartment && d.applicantDepartment.toLowerCase().includes(q)) ||
          d.companyId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'updated_desc') {
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        }
        if (sortBy === 'created_desc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'amount_desc') {
          return b.totalEstimatedAmount - a.totalEstimatedAmount;
        }
        if (sortBy === 'amount_asc') {
          return a.totalEstimatedAmount - b.totalEstimatedAmount;
        }
        return 0;
      });
  }, [filteredDrafts, typeFilter, searchQuery, sortBy]);

  // Summary stats
  const totalDraftCount = filteredDrafts.length;
  const advanceDrafts = filteredDrafts.filter(d => d.type === 'ADVANCE');
  const reimbursementDrafts = filteredDrafts.filter(d => d.type === 'REIMBURSEMENT');
  
  const totalDraftAmount = filteredDrafts.reduce((sum, d) => sum + d.totalEstimatedAmount, 0);
  const totalAdvanceAmount = advanceDrafts.reduce((sum, d) => sum + d.totalEstimatedAmount, 0);
  const totalReimbAmount = reimbursementDrafts.reduce((sum, d) => sum + d.totalEstimatedAmount, 0);

  const handleResume = (draft: FormDraft) => {
    if (draft.type === 'ADVANCE') {
      onResumeAdvanceDraft(draft);
    } else {
      onResumeReimbursementDraft(draft);
    }
  };

  const confirmDeleteDraft = () => {
    if (draftToDelete) {
      deleteDraft(draftToDelete.id);
      setDraftToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <Bookmark className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Draft Pengajuan (Simpan Sementara)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola dan lanjutkan pengisian formulir Cost Advance dan Reimbursement yang disimpan sebelum diajukan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewAdvance}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Kasbon Baru</span>
          </button>
          <button
            onClick={onOpenNewReimbursement}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Klaim Reimbursement</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Draft Tersimpan</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono tabular-nums">
            {totalDraftCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total estimasi: <strong className="font-mono text-slate-700">{formatRupiah(totalDraftAmount)}</strong>
          </div>
        </div>

        <div className="p-4 bg-white border border-blue-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
            <span>Draft Cost Advance</span>
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-950 mt-2 font-mono tabular-nums">
            {advanceDrafts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Estimasi kasbon: <strong className="font-mono text-blue-900">{formatRupiah(totalAdvanceAmount)}</strong>
          </div>
        </div>

        <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Draft Reimbursement</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-mono tabular-nums">
            {reimbursementDrafts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Estimasi klaim: <strong className="font-mono text-emerald-900">{formatRupiah(totalReimbAmount)}</strong>
          </div>
        </div>

        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fitur Simpan Sementara</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
            Draft disimpan aman di browser dan dapat dilanjutkan tanpa kehilangan data nota &amp; rincian transaksi.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Type Filter Pills */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Tipe ({totalDraftCount})
          </button>
          <button
            onClick={() => setTypeFilter('ADVANCE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              typeFilter === 'ADVANCE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cost Advance ({advanceDrafts.length})</span>
          </button>
          <button
            onClick={() => setTypeFilter('REIMBURSEMENT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              typeFilter === 'REIMBURSEMENT'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Reimbursement ({reimbursementDrafts.length})</span>
          </button>
        </div>

        {/* Right: Search Input & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari judul, pemohon, divisi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
            />
          </div>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none"
          >
            <option value="updated_desc">Terbaru Diubah</option>
            <option value="created_desc">Waktu Dibuat</option>
            <option value="amount_desc">Nominal Tertinggi</option>
            <option value="amount_asc">Nominal Terendah</option>
          </select>
        </div>
      </div>

      {/* Drafts List */}
      {displayedDrafts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Bookmark className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            {searchQuery || typeFilter !== 'ALL'
              ? 'Tidak ada draft yang cocok dengan filter'
              : 'Belum Ada Draft Tersimpan'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || typeFilter !== 'ALL'
              ? 'Coba bersihkan kata kunci pencarian atau ubah filter tipe draft.'
              : 'Saat mengisi formulir Cost Advance atau Reimbursement, Anda dapat memilih "Simpan sebagai Draft" untuk melanjutkannya nanti.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={onOpenNewAdvance}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-2xs transition-colors"
            >
              + Buat Draft Kasbon
            </button>
            <button
              onClick={onOpenNewReimbursement}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-colors"
            >
              + Buat Draft Klaim
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedDrafts.map(draft => {
            const company = COMPANIES[draft.companyId];
            const isAdvance = draft.type === 'ADVANCE';

            return (
              <div
                key={draft.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isAdvance
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isAdvance ? (
                          <CreditCard className="w-3 h-3 text-blue-600" />
                        ) : (
                          <Receipt className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{isAdvance ? 'Cost Advance (Kasbon)' : 'Reimbursement (Klaim)'}</span>
                      </span>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          draft.companyId === 'AMS'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        PT {draft.companyId}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">
                      Draft #{draft.id.slice(-6)}
                    </span>
                  </div>

                  {/* Title / Purpose */}
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-blue-900 transition-colors">
                    {draft.title}
                  </h4>

                  {/* Metadata Grid */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Pemohon &amp; Divisi</span>
                      <span className="text-slate-800 font-semibold truncate block mt-0.5">
                        {draft.applicantName}
                      </span>
                      <span className="text-[11px] text-slate-500 truncate block">
                        {draft.applicantDepartment || '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Estimasi Nilai</span>
                      <span className="text-sm font-bold font-mono text-slate-900 block mt-0.5 tabular-nums">
                        {formatRupiah(draft.totalEstimatedAmount)}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {draft.itemsCount} rincian beban
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Diubah: {formatDateIndo(draft.updatedAt, true)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setDraftToDelete(draft)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus draft ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleResume(draft)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-blue-700 rounded-lg shadow-2xs transition-all flex items-center gap-1"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Lanjutkan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-200">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hapus Draft Ini?</h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <div className="font-semibold text-slate-900 truncate">{draftToDelete.title}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Estimasi: {formatRupiah(draftToDelete.totalEstimatedAmount)}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDraftToDelete(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteDraft}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Hapus Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
