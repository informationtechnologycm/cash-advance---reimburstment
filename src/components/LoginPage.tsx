import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { COMPANIES } from '../data/initialData';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Building2,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  Check,
  Info,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, users } = useFinance();

  const [email, setEmail] = useState('rian@ams.co.id');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email, password);
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword('password123');
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(userEmail, 'password123');
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal melakukan login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-radial from-slate-800/80 via-slate-900 to-slate-950 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 text-center">
        {/* Dual Company Brand Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full border border-white/15 text-slate-300 text-xs font-medium mb-3">
          <span className="font-bold text-blue-400">PT AMS</span>
          <span className="text-slate-500">·</span>
          <span className="font-bold text-emerald-400">PT AMI</span>
          <span className="text-slate-500">·</span>
          <span>Sistem Finansial &amp; Otorisasi Bertingkat</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white">
          Cost Advance &amp; Reimbursement
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Sistem Pengajuan, Pelacakan Alur Persetujuan, dan Pencairan Biaya
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
        <div className="bg-white py-7 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-200">
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alamat Email Perusahaan
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@ams.co.id atau nama@ami.co.id"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <span className="text-[11px] text-slate-400 font-mono">password123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Role & Access Rights Guide */}
          <div className="mt-5 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Matriks Hak Akses &amp; Otorisasi Sistem:</span>
            </div>
            <div className="space-y-1.5 text-[11px] text-slate-700">
              <div className="p-2 bg-white rounded-lg border border-blue-100">
                <span className="font-bold text-blue-900 block">
                  1. Pemohon (Staff Operasional &amp; Logistik):
                </span>
                <span className="text-slate-600">
                  Hanya membuat pengajuan (Kasbon/Reimbursement) serta <strong>mengetahui &amp; memantau alur verifikasi</strong> secara transparan dari <em>Persetujuan Atasan Langsung</em> hingga <em>Verifikasi Finance &amp; Kasir</em>. Pemohon tidak memiliki hak menyetujui, mencairkan, atau mengubah status.
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-amber-100">
                <span className="font-bold text-amber-900 block">
                  2. Atasan Langsung (Manager Departemen):
                </span>
                <span className="text-slate-600">
                  Memeriksa kelayakan kegiatan &amp; menyetujui/menolak pengajuan tim untuk diteruskan ke Finance.
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100">
                <span className="font-bold text-indigo-900 block">
                  3. Finance &amp; Akunting:
                </span>
                <span className="text-slate-600">
                  Verifikasi keabsahan kuitansi, kepatuhan pajak, otorisasi transfer pencairan dana kasbon, dan penutupan LPJ.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Login Personas */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pilih Akun Demo Sesuai Hak Akses (1-Klik Masuk)
              </span>
              <span className="text-[10px] text-slate-400">Pilih peran</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Pemohon AMS */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('rian@ams.co.id')}
                className="p-2.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-blue-950 flex items-center justify-between">
                    <span>Rian Pratama</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white rounded font-mono font-bold">
                      PEMOHON
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Staff Lapangan · PT AMS</div>
                </div>
                <div className="text-[10px] text-blue-800 mt-2 font-medium bg-blue-100/80 p-1 rounded">
                  Hanya pengajuan &amp; pelacakan alur
                </div>
              </button>

              {/* Pemohon AMI */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('siti@ami.co.id')}
                className="p-2.5 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-emerald-950 flex items-center justify-between">
                    <span>Siti Nurhaliza</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-emerald-600 text-white rounded font-mono font-bold">
                      PEMOHON
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Staff Logistik · PT AMI</div>
                </div>
                <div className="text-[10px] text-emerald-800 mt-2 font-medium bg-emerald-100/80 p-1 rounded">
                  Hanya pengajuan &amp; pelacakan alur
                </div>
              </button>

              {/* Atasan / Manager AMS */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('dewi@ams.co.id')}
                className="p-2.5 border border-amber-200 bg-amber-50/40 hover:bg-amber-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span>Dewi Lestari</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-600 text-white rounded font-mono font-bold">
                      ATASAN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Manager Proyek · PT AMS</div>
                </div>
                <div className="text-[10px] text-amber-800 mt-2 font-medium bg-amber-100/70 p-1 rounded">
                  Review &amp; Persetujuan Tingkat 1
                </div>
              </button>

              {/* Atasan / Manager AMI */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('agus@ami.co.id')}
                className="p-2.5 border border-amber-200 bg-amber-50/40 hover:bg-amber-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-amber-950 flex items-center justify-between">
                    <span>Agus Wijaya</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-600 text-white rounded font-mono font-bold">
                      ATASAN
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Manager Pabrik · PT AMI</div>
                </div>
                <div className="text-[10px] text-amber-800 mt-2 font-medium bg-amber-100/70 p-1 rounded">
                  Review &amp; Persetujuan Tingkat 1
                </div>
              </button>

              {/* Finance AMS & Holding */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('budi@holding.co.id')}
                className="p-2.5 border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-indigo-950 flex items-center justify-between">
                    <span>Budi Santoso</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-600 text-white rounded font-mono font-bold">
                      FINANCE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Lead Finance · PT AMS</div>
                </div>
                <div className="text-[10px] text-indigo-800 mt-2 font-medium bg-indigo-100/70 p-1 rounded">
                  Verifikasi Berkas, Pencairan &amp; LPJ
                </div>
              </button>

              {/* Finance AMI */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('maya@ami.co.id')}
                className="p-2.5 border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-100/70 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="font-bold text-indigo-950 flex items-center justify-between">
                    <span>Maya Anggraini</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-indigo-600 text-white rounded font-mono font-bold">
                      FINANCE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Finance &amp; Kasir · PT AMI</div>
                </div>
                <div className="text-[10px] text-indigo-800 mt-2 font-medium bg-indigo-100/70 p-1 rounded">
                  Verifikasi Berkas, Pencairan &amp; LPJ
                </div>
              </button>

              {/* Direktur Utama */}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickLogin('hendra@holding.co.id')}
                className="p-2.5 border border-purple-200 bg-purple-50/40 hover:bg-purple-100/70 rounded-xl text-left transition-colors flex flex-col justify-between sm:col-span-2"
              >
                <div>
                  <div className="font-bold text-purple-950 flex items-center justify-between">
                    <span>Ir. Hendra Kusuma</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-600 text-white rounded font-mono font-bold">
                      DIREKSI
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-700 mt-0.5">Direktur Utama (Holding PT AMS &amp; PT AMI)</div>
                </div>
                <div className="text-[10px] text-purple-800 mt-2 font-medium bg-purple-100/60 p-1 rounded">
                  Approval Plafon Khusus &gt; Rp 15 Juta &amp; Audit Laporan
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
