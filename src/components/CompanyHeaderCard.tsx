import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { COMPANIES } from '../data/initialData';
import { Building2, CreditCard, ShieldCheck, MapPin } from 'lucide-react';

export const CompanyHeaderCard: React.FC = () => {
  const { selectedCompany, setSelectedCompany } = useFinance();

  if (selectedCompany === 'ALL') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base">
                Konsolidasi Finansial Multi-Entitas
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">PT AMS &amp; PT AMI</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan data gabungan kasbon operasional, klaim reimbursement, dan settlement untuk kedua perusahaan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCompany('AMS')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-800 hover:bg-blue-100/70 transition-colors"
            >
              Fokus PT AMS
            </button>
            <button
              onClick={() => setSelectedCompany('AMI')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100/70 transition-colors"
            >
              Fokus PT AMI
            </button>
          </div>
        </div>
      </div>
    );
  }

  const comp = COMPANIES[selectedCompany];

  return (
    <div
      className={`border rounded-xl p-4 sm:p-5 mb-6 shadow-xs ${
        selectedCompany === 'AMS'
          ? 'bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white border-blue-800'
          : 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white border-emerald-800'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase bg-white/20 text-white">
              {comp.id}
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white">
              {comp.fullName}
            </h1>
          </div>
          <p className="text-xs text-slate-200 mt-1 flex items-center gap-2">
            <span>{comp.tagline}</span>
            <span>·</span>
            <span>NPWP: {comp.npwp}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-200 bg-black/20 p-2.5 rounded-lg backdrop-blur-xs border border-white/10">
          <div className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-slate-300" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Rekening Pencairan</span>
              <span className="font-mono font-medium text-white">
                {comp.primaryBank} · {comp.accountNumber}
              </span>
            </div>
          </div>
          <div className="hidden lg:block h-6 w-px bg-white/10" />
          <div className="hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-300" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Direktur &amp; Finance</span>
              <span className="font-medium text-white">
                {comp.directorName.split(',')[0]} / {comp.financeHeadName.split(',')[0]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
