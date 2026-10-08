import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { CostAdvanceRequest, ReimbursementRequest, CompanyId } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  DEPARTMENT_BUDGET_DEFINITIONS,
  DepartmentSpendDataPoint,
  shortenDepartmentName,
} from '../data/departmentBudgets';
import {
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PieChart,
  ShieldCheck,
  ChevronDown,
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
} from 'lucide-react';

interface DepartmentBudgetChartProps {
  advances: CostAdvanceRequest[];
  reimbursements: ReimbursementRequest[];
  selectedCompany: CompanyId | 'ALL';
  onCompanyChange?: (company: CompanyId | 'ALL') => void;
}

const AVAILABLE_PERIODS = [
  { key: '2026-10', label: 'Oktober 2026 (Bulan Berjalan)', monthName: 'Oktober 2026', isCurrent: true },
  { key: '2026-09', label: 'September 2026', monthName: 'September 2026', isCurrent: false },
  { key: '2026-08', label: 'Agustus 2026', monthName: 'Agustus 2026', isCurrent: false },
  { key: '2026-07', label: 'Juli 2026', monthName: 'Juli 2026', isCurrent: false },
  { key: '2026-06', label: 'Juni 2026', monthName: 'Juni 2026', isCurrent: false },
];

export const DepartmentBudgetChart: React.FC<DepartmentBudgetChartProps> = ({
  advances,
  reimbursements,
  selectedCompany,
  onCompanyChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-10');
  const [displayMode, setDisplayMode] = useState<'nominal' | 'percentage'>('nominal');
  const [showTableDetails, setShowTableDetails] = useState<boolean>(false);
  const [activeDepartmentFilter, setActiveDepartmentFilter] = useState<string | null>(null);

  // Compute departmental spending and budget limits for the current period
  const departmentalData = useMemo<DepartmentSpendDataPoint[]>(() => {
    // 1. Determine relevant departments based on selected company
    const relevantDefs = DEPARTMENT_BUDGET_DEFINITIONS.filter(def => {
      if (selectedCompany === 'ALL') return true;
      return def.companyId === selectedCompany;
    });

    // Group definitions by department if 'ALL' is selected
    const departmentMap = new Map<
      string,
      {
        department: string;
        companyId: CompanyId | 'ALL';
        budgetLimit: number;
      }
    >();

    if (selectedCompany === 'ALL') {
      relevantDefs.forEach(def => {
        const existing = departmentMap.get(def.department);
        if (existing) {
          existing.budgetLimit += def.monthlyBudget;
        } else {
          departmentMap.set(def.department, {
            department: def.department,
            companyId: 'ALL',
            budgetLimit: def.monthlyBudget,
          });
        }
      });
    } else {
      relevantDefs.forEach(def => {
        departmentMap.set(def.department, {
          department: def.department,
          companyId: def.companyId,
          budgetLimit: def.monthlyBudget,
        });
      });
    }

    // 2. Filter transactions matching the chosen period and company
    const periodAdvances = advances.filter(a => {
      const matchCompany = selectedCompany === 'ALL' || a.companyId === selectedCompany;
      const matchPeriod = (a.requestDate || '').startsWith(selectedPeriod);
      const notRejected = a.status !== 'REJECTED';
      return matchCompany && matchPeriod && notRejected;
    });

    const periodReimbursements = reimbursements.filter(r => {
      const matchCompany = selectedCompany === 'ALL' || r.companyId === selectedCompany;
      const matchPeriod = (r.requestDate || '').startsWith(selectedPeriod);
      const notRejected = r.status !== 'REJECTED';
      return matchCompany && matchPeriod && notRejected;
    });

    // 3. Also include any department present in transactions even if not in static list
    const allDeptNames = new Set<string>();
    departmentMap.forEach((_, dept) => allDeptNames.add(dept));
    periodAdvances.forEach(a => {
      if (a.applicantDepartment) allDeptNames.add(a.applicantDepartment);
    });
    periodReimbursements.forEach(r => {
      if (r.applicantDepartment) allDeptNames.add(r.applicantDepartment);
    });

    // 4. Build data points for each department
    const results: DepartmentSpendDataPoint[] = [];

    allDeptNames.forEach(dept => {
      const config = departmentMap.get(dept);
      const budgetLimit = config ? config.budgetLimit : 20000000; // default 20jt if unlisted

      const deptAdv = periodAdvances.filter(
        a => a.applicantDepartment?.toLowerCase() === dept.toLowerCase()
      );
      const deptReimb = periodReimbursements.filter(
        r => r.applicantDepartment?.toLowerCase() === dept.toLowerCase()
      );

      const advanceSpending = deptAdv.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
      const reimbursementSpending = deptReimb.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const actualSpending = advanceSpending + reimbursementSpending;

      const remainingBudget = Math.max(0, budgetLimit - actualSpending);
      const utilizationRate = budgetLimit > 0 ? (actualSpending / budgetLimit) * 100 : 0;

      let status: 'NORMAL' | 'WARNING' | 'OVER_BUDGET' = 'NORMAL';
      if (utilizationRate > 100) {
        status = 'OVER_BUDGET';
      } else if (utilizationRate >= 80) {
        status = 'WARNING';
      }

      results.push({
        department: dept,
        shortDepartment: shortenDepartmentName(dept),
        companyId: config ? config.companyId : selectedCompany,
        budgetLimit,
        actualSpending,
        advanceSpending,
        reimbursementSpending,
        remainingBudget,
        utilizationRate: Math.round(utilizationRate * 10) / 10,
        advanceCount: deptAdv.length,
        reimbursementCount: deptReimb.length,
        totalTransactions: deptAdv.length + deptReimb.length,
        status,
      });
    });

    // Sort by actual spending descending to prioritize high-spend departments
    return results.sort((a, b) => b.actualSpending - a.actualSpending);
  }, [advances, reimbursements, selectedCompany, selectedPeriod]);

  // Overall aggregate financial metrics for the current period
  const totalBudgetPeriod = useMemo(
    () => departmentalData.reduce((acc, d) => acc + d.budgetLimit, 0),
    [departmentalData]
  );

  const totalActualSpending = useMemo(
    () => departmentalData.reduce((acc, d) => acc + d.actualSpending, 0),
    [departmentalData]
  );

  const totalRemainingBudget = Math.max(0, totalBudgetPeriod - totalActualSpending);

  const overallUtilizationRate =
    totalBudgetPeriod > 0
      ? Math.round((totalActualSpending / totalBudgetPeriod) * 1000) / 10
      : 0;

  const overBudgetCount = departmentalData.filter(d => d.status === 'OVER_BUDGET').length;
  const warningCount = departmentalData.filter(d => d.status === 'WARNING').length;

  // Formatting compact Rupiah for Y-axis (e.g., 20 Jt)
  const formatYAxisTick = (val: number): string => {
    if (val === 0) return '0';
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)} M`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(0)} Jt`;
    }
    if (val >= 1_000) {
      return `${(val / 1_000).toFixed(0)} Rb`;
    }
    return String(val);
  };

  // Get current period title
  const currentPeriodMeta =
    AVAILABLE_PERIODS.find(p => p.key === selectedPeriod) || AVAILABLE_PERIODS[0];

  // Custom Rich Tooltip for Recharts
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const deptData = departmentalData.find(d => d.shortDepartment === label || d.department === label);
      if (!deptData) return null;

      const isOver = deptData.status === 'OVER_BUDGET';
      const isWarn = deptData.status === 'WARNING';

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 border border-slate-700 min-w-[270px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
            <div>
              <div className="font-bold text-slate-100 text-sm">{deptData.department}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {deptData.companyId === 'ALL'
                  ? 'Gabungan AMS & AMI'
                  : `Entitas PT ${deptData.companyId}`}
              </div>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                isOver
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : isWarn
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isOver ? 'Melebihi Anggaran' : isWarn ? 'Mendekati Limit' : 'Dalam Anggaran'}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Pengeluaran Aktual:</span>
              <span className="font-mono font-bold text-blue-300">
                {formatRupiah(deptData.actualSpending)}
              </span>
            </div>

            <div className="pl-2 border-l border-slate-700 space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>· Kasbon (Cost Advance):</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(deptData.advanceSpending)} ({deptData.advanceCount} berkas)
                </span>
              </div>
              <div className="flex justify-between">
                <span>· Klaim Reimbursement:</span>
                <span className="font-mono text-slate-300">
                  {formatRupiah(deptData.reimbursementSpending)} ({deptData.reimbursementCount} berkas)
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300">Pagu Anggaran (Limit):</span>
              <span className="font-mono font-medium text-slate-300">
                {formatRupiah(deptData.budgetLimit)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300">Sisa Anggaran Tersedia:</span>
              <span
                className={`font-mono font-medium ${
                  deptData.remainingBudget === 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {formatRupiah(deptData.remainingBudget)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-700">
              <span className="text-slate-200 font-semibold">Tingkat Penyerapan:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  isOver ? 'text-rose-400' : isWarn ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {deptData.utilizationRate}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200/60">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Realisasi Pengeluaran Departemen vs Batas Anggaran
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Monitoring Pagu Anggaran
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi bulanan realisasi kasbon dan reimbursement per divisi terhadap batas pagu biaya periode berjalan
          </p>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer"
              title="Pilih Periode Bulan"
            >
              {AVAILABLE_PERIODS.map(p => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Company Selector (if callback provided) */}
          {onCompanyChange && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => onCompanyChange('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedCompany === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => onCompanyChange('AMS')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedCompany === 'AMS'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PT AMS
              </button>
              <button
                onClick={() => onCompanyChange('AMI')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedCompany === 'AMI'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PT AMI
              </button>
            </div>
          )}

          {/* Display Mode: Nominal vs Percentage */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setDisplayMode('nominal')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                displayMode === 'nominal'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan nominal rupiah per departemen"
            >
              Nominal (Rp)
            </button>
            <button
              onClick={() => setDisplayMode('percentage')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                displayMode === 'percentage'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan tingkat penyerapan anggaran (%)"
            >
              Utilisasi (%)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Financial Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {/* Total Budget Limit */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 font-medium mb-1">
            <span>Total Pagu Anggaran</span>
            <span className="text-[10px] text-slate-500">{currentPeriodMeta.monthName}</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {formatRupiah(totalBudgetPeriod)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {departmentalData.length} Departemen aktif
          </div>
        </div>

        {/* Actual Total Spending */}
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between text-blue-700 font-medium mb-1">
            <span>Realisasi Pengeluaran</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-base font-bold font-mono text-blue-950">
            {formatRupiah(totalActualSpending)}
          </div>
          <div className="text-[11px] text-blue-700 mt-1">
            Kasbon + Klaim Nota Disetujui
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-700 font-medium mb-1">
            <span>Sisa Anggaran Bebas</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-base font-bold font-mono text-emerald-950">
            {formatRupiah(totalRemainingBudget)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {overallUtilizationRate}% pagu terserap
          </div>
        </div>

        {/* Budget Health / Status */}
        <div
          className={`p-3 rounded-xl border ${
            overBudgetCount > 0
              ? 'bg-rose-50/60 border-rose-200'
              : warningCount > 0
              ? 'bg-amber-50/60 border-amber-200'
              : 'bg-indigo-50/60 border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between font-medium mb-1">
            <span
              className={
                overBudgetCount > 0
                  ? 'text-rose-700'
                  : warningCount > 0
                  ? 'text-amber-700'
                  : 'text-indigo-700'
              }
            >
              Status Pagu Biaya
            </span>
            {overBudgetCount > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            )}
          </div>
          <div
            className={`text-base font-bold font-mono ${
              overBudgetCount > 0
                ? 'text-rose-900'
                : warningCount > 0
                ? 'text-amber-900'
                : 'text-indigo-900'
            }`}
          >
            {overBudgetCount > 0
              ? `${overBudgetCount} Over Budget`
              : warningCount > 0
              ? `${warningCount} Perlu Perhatian`
              : 'Terkendali Aman'}
          </div>
          <div className="text-[11px] text-slate-600 mt-1">
            {overBudgetCount > 0
              ? 'Memerlukan otorisasi Direktur'
              : 'Semua divisi dalam koridor batas'}
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full pt-2">
        {displayMode === 'nominal' ? (
          // ============================================
          // 1. NOMINAL RUPIAH: Grouped Bar Chart (Actual vs Budget Limit)
          // ============================================
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentalData}
                margin={{ top: 12, right: 16, left: 10, bottom: 28 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortDepartment"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={formatYAxisTick}
                />
                <Tooltip content={renderCustomTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  iconType="circle"
                  formatter={(value: string) => {
                    if (value === 'actualSpending') return 'Realisasi Pengeluaran Aktual';
                    if (value === 'budgetLimit') return 'Batas Pagu Anggaran (Limit)';
                    return value;
                  }}
                />
                <Bar
                  dataKey="budgetLimit"
                  name="budgetLimit"
                  fill="#cbd5e1"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                />
                <Bar
                  dataKey="actualSpending"
                  name="actualSpending"
                  radius={[4, 4, 0, 0]}
                  barSize={18}
                >
                  {departmentalData.map((entry, index) => {
                    let barColor = '#3b82f6'; // Blue default
                    if (entry.status === 'OVER_BUDGET') {
                      barColor = '#ef4444'; // Red over budget
                    } else if (entry.status === 'WARNING') {
                      barColor = '#f59e0b'; // Amber near budget
                    } else if (entry.utilizationRate <= 60) {
                      barColor = '#10b981'; // Healthy green
                    }
                    return <Cell key={`cell-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          // ============================================
          // 2. UTILIZATION PERCENTAGE: Single Bar with 100% Reference Threshold
          // ============================================
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentalData}
                margin={{ top: 16, right: 16, left: 10, bottom: 28 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortDepartment"
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={val => `${val}%`}
                  domain={[0, (dataMax: number) => Math.max(120, Math.ceil(dataMax * 1.15))]}
                />
                <Tooltip content={renderCustomTooltip} />
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: 'Batas Pagu (100%)',
                    fill: '#dc2626',
                    fontSize: 11,
                    position: 'top',
                  }}
                />
                <ReferenceLine
                  y={80}
                  stroke="#f59e0b"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: 'Ambang Waspada (80%)',
                    fill: '#d97706',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
                <Bar
                  dataKey="utilizationRate"
                  name="Tingkat Penyerapan Anggaran (%)"
                  radius={[4, 4, 0, 0]}
                  barSize={24}
                >
                  {departmentalData.map((entry, index) => {
                    let barColor = '#10b981';
                    if (entry.utilizationRate > 100) {
                      barColor = '#ef4444';
                    } else if (entry.utilizationRate >= 80) {
                      barColor = '#f59e0b';
                    } else if (entry.utilizationRate >= 60) {
                      barColor = '#3b82f6';
                    }
                    return <Cell key={`cell-pct-${index}`} fill={barColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Dynamic Status Legend & Indicator Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
            <span>Optimal (&lt; 70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
            <span>Normal (70% - 80%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
            <span>Mendekati Limit (80% - 100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
            <span>Melebihi Limit (&gt; 100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 inline-block"></span>
            <span>Batas Pagu (Budget Limit)</span>
          </div>
        </div>

        {/* Toggle Detailed Breakdown Drawer */}
        <button
          onClick={() => setShowTableDetails(!showTableDetails)}
          className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1 hover:underline"
        >
          <span>{showTableDetails ? 'Sembunyikan Rincian Divisi' : 'Lihat Rincian Lengkap Divisi'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showTableDetails ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Expandable Departmental Breakdown Table & Cards */}
      {showTableDetails && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tabel Alokasi &amp; Penyerapan Pagu Per Divisi ({currentPeriodMeta.monthName})
            </h3>
            <span className="text-xs text-slate-500">
              Total {departmentalData.length} Departemen
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Departemen</th>
                  <th className="py-2.5 px-3 text-right">Pagu Budget</th>
                  <th className="py-2.5 px-3 text-right">Realisasi Kasbon</th>
                  <th className="py-2.5 px-3 text-right">Realisasi Klaim</th>
                  <th className="py-2.5 px-3 text-right">Total Belanja</th>
                  <th className="py-2.5 px-3 text-right">Sisa Anggaran</th>
                  <th className="py-2.5 px-3 text-center">Utilisasi</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departmentalData.map(d => {
                  const isOver = d.status === 'OVER_BUDGET';
                  const isWarn = d.status === 'WARNING';

                  return (
                    <tr
                      key={d.department}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        <div>{d.department}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {d.companyId === 'ALL' ? 'AMS & AMI' : `PT ${d.companyId}`} · {d.totalTransactions} transaksi
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(d.budgetLimit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(d.advanceSpending)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {formatRupiah(d.reimbursementSpending)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(d.actualSpending)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono font-medium ${
                          d.remainingBudget === 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(d.remainingBudget)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOver ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, d.utilizationRate)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold">
                            {d.utilizationRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold ${
                            isOver
                              ? 'bg-rose-100 text-rose-800'
                              : isWarn
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOver ? 'Over Budget' : isWarn ? 'Waspada' : 'Aman'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
