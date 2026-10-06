import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { COMPANIES } from '../data/initialData';
import { Building2, UserCircle, Plus, ChevronDown, Check, LogOut, Radio } from 'lucide-react';

interface TopNavProps {
  onOpenNewAdvance: () => void;
  onOpenNewReimbursement: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenNewAdvance,
  onOpenNewReimbursement,
}) => {
  const {
    selectedCompany,
    setSelectedCompany,
    currentUser,
    setCurrentUser,
    users,
    activeTab,
    setActiveTab,
    filteredAdvances,
    filteredReimbursements,
    logout,
  } = useFinance();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);

  // Count pending approvals that current user can act on
  const pendingApprovalsCount = (() => {
    let count = 0;
    if (currentUser.role === 'MANAGER' || currentUser.role === 'DIRECTOR') {
      count += filteredAdvances.filter(a => a.status === 'PENDING_MANAGER').length;
      count += filteredReimbursements.filter(r => r.status === 'PENDING_MANAGER').length;
    }
    if (currentUser.role === 'FINANCE') {
      count += filteredAdvances.filter(a => a.status === 'PENDING_FINANCE' || a.status === 'APPROVED').length;
      count += filteredReimbursements.filter(r => r.status === 'PENDING_FINANCE' || r.status === 'APPROVED').length;
    }
    if (currentUser.role === 'DIRECTOR') {
      count += filteredAdvances.filter(a => a.status === 'PENDING_DIRECTOR').length;
    }
    return count;
  })();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      {/* Zone 1, 2, 3 following strict Top Bar Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left focus:outline-none"
            >
              <span className="text-lg font-bold tracking-tight text-slate-900 block">
                AMS <span className="text-slate-400 font-light">&amp;</span> AMI
              </span>
              <span className="text-[11px] font-medium tracking-wide text-slate-500 block -mt-0.5">
                Cost Advance &amp; Reimbursement
              </span>
            </button>

            {/* Company Selector Tab Group */}
            <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setSelectedCompany('ALL')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedCompany === 'ALL'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Entitas
              </button>
              <button
                onClick={() => setSelectedCompany('AMS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  selectedCompany === 'AMS'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>PT AMS</span>
              </button>
              <button
                onClick={() => setSelectedCompany('AMI')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  selectedCompany === 'AMI'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>PT AMI</span>
              </button>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 font-semibold bg-slate-100'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('advances')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'advances'
                  ? 'text-slate-900 font-semibold bg-slate-100'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Cost Advance</span>
              <span className="text-xs text-slate-500 font-mono">({filteredAdvances.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('reimbursements')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'reimbursements'
                  ? 'text-slate-900 font-semibold bg-slate-100'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>Reimbursement</span>
              <span className="text-xs text-slate-500 font-mono">({filteredReimbursements.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`px-3 py-2 rounded-md transition-colors ${
                activeTab === 'settlements'
                  ? 'text-slate-900 font-semibold bg-slate-100'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Pertanggungjawaban
            </button>
            {currentUser.role !== 'STAFF' && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 rounded-md transition-colors ${
                  activeTab === 'reports'
                    ? 'text-slate-900 font-semibold bg-slate-100'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Laporan &amp; BKK
              </button>
            )}
          </nav>

          {/* Zone 3: Primary Actions & User Role Indicator */}
          <div className="flex items-center gap-3">
            {/* Role Simulator Switcher & Current User Badge */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl border transition-colors ${
                  currentUser.role === 'STAFF'
                    ? 'bg-blue-50/80 border-blue-200 text-blue-950 hover:bg-blue-100/70'
                    : currentUser.role === 'MANAGER'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950 hover:bg-amber-100/70'
                    : currentUser.role === 'FINANCE'
                    ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 hover:bg-indigo-100/70'
                    : 'bg-purple-50/80 border-purple-200 text-purple-950 hover:bg-purple-100/70'
                }`}
                title="Ganti Peran Pengguna untuk Menguji Alur Approval & Hak Akses"
              >
                <UserCircle className="w-4 h-4 shrink-0 text-slate-600" />
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        currentUser.role === 'STAFF'
                          ? 'bg-blue-600 text-white'
                          : currentUser.role === 'MANAGER'
                          ? 'bg-amber-500 text-white'
                          : currentUser.role === 'FINANCE'
                          ? 'bg-indigo-600 text-white'
                          : 'bg-purple-600 text-white'
                      }`}
                    >
                      {currentUser.role === 'STAFF'
                        ? 'PEMOHON'
                        : currentUser.role === 'MANAGER'
                        ? 'ATASAN'
                        : currentUser.role === 'FINANCE'
                        ? 'FINANCE'
                        : 'DIREKSI'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                    {currentUser.role === 'STAFF'
                      ? 'Hanya Pengajuan & Pelacakan'
                      : currentUser.roleLabel}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                        Hak Akses Akun Aktif
                      </p>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-bold">
                        {currentUser.companyId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {currentUser.role === 'STAFF'
                        ? 'Wewenang: Hanya membuat pengajuan kasbon/klaim & memantau alur verifikasi Atasan hingga Finance.'
                        : currentUser.role === 'MANAGER'
                        ? 'Wewenang: Melakukan review & persetujuan tingkat 1 atas pengajuan tim departemen.'
                        : currentUser.role === 'FINANCE'
                        ? 'Wewenang: Verifikasi bukti riil, transfer pencairan kasbon, dan penutupan LPJ.'
                        : 'Wewenang: Persetujuan plafon tinggi (> Rp 15 Juta) & monitoring.'}
                    </p>
                  </div>

                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Ganti Peran Pengguna (Simulasi Hak Akses)
                  </div>

                  <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-50">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                          currentUser.id === u.id ? 'bg-blue-50/70 font-semibold text-blue-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">{u.name}</span>
                            <span
                              className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${
                                u.role === 'STAFF'
                                  ? 'bg-blue-100 text-blue-800'
                                  : u.role === 'MANAGER'
                                  ? 'bg-amber-100 text-amber-800'
                                  : u.role === 'FINANCE'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {u.role === 'STAFF'
                                ? 'PEMOHON'
                                : u.role === 'MANAGER'
                                ? 'ATASAN'
                                : u.role === 'FINANCE'
                                ? 'FINANCE'
                                : 'DIREKSI'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {u.roleLabel} · PT {u.companyId}
                          </div>
                        </div>
                        {currentUser.id === u.id && (
                          <Check className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Backend Status & Logout */}
                  <div className="pt-2 mt-1 border-t border-slate-100 px-3.5 pb-1 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Backend Express
                      </span>
                      <span className="font-mono">Tersambung OK</span>
                    </div>

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Create Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengajuan</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showNewMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      onOpenNewAdvance();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-50 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-slate-900">+ Cost Advance (Kasbon)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Uang muka biaya operasional/proyek
                    </span>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={() => {
                      setShowNewMenu(false);
                      onOpenNewReimbursement();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-50 flex flex-col transition-colors"
                  >
                    <span className="font-semibold text-slate-900">+ Reimbursement (Klaim)</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      Penggantian uang pribadi karyawan
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile secondary tab selector */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 text-xs overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('advances')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'advances' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Cost Advance
          </button>
          <button
            onClick={() => setActiveTab('reimbursements')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'reimbursements' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Reimbursement
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'settlements' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Settlement
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 rounded whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-slate-900 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Laporan
          </button>
        </div>
      </div>
    </header>
  );
};
