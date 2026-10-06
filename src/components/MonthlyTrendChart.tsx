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
} from 'recharts';
import { CostAdvanceRequest, ReimbursementRequest, CompanyId } from '../types/finance';
import { formatRupiah } from '../utils/formatters';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  Filter,
  Building,
} from 'lucide-react';

interface MonthlyTrendChartProps {
  advances: CostAdvanceRequest[];
  reimbursements: ReimbursementRequest[];
  selectedCompany: CompanyId | 'ALL';
  onCompanyChange?: (company: CompanyId | 'ALL') => void;
}

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  monthFullName: string;
  advanceAmount: number;
  reimbursementAmount: number;
  totalAmount: number;
  advanceCount: number;
  reimbursementCount: number;
}

const MONTH_DEFINITIONS = [
  { key: '01', label: 'Jan', fullName: 'Januari' },
  { key: '02', label: 'Feb', fullName: 'Februari' },
  { key: '03', label: 'Mar', fullName: 'Maret' },
  { key: '04', label: 'Apr', fullName: 'April' },
  { key: '05', label: 'Mei', fullName: 'Mei' },
  { key: '06', label: 'Jun', fullName: 'Juni' },
  { key: '07', label: 'Jul', fullName: 'Juli' },
  { key: '08', label: 'Agu', fullName: 'Agustus' },
  { key: '09', label: 'Sep', fullName: 'September' },
  { key: '10', label: 'Okt', fullName: 'Oktober' },
  { key: '11', label: 'Nov', fullName: 'November' },
  { key: '12', label: 'Des', fullName: 'Desember' },
];

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  advances,
  reimbursements,
  selectedCompany,
  onCompanyChange,
}) => {
  const [chartType, setChartType] = useState<'grouped' | 'stacked'>('grouped');
  const [fiscalYear, setFiscalYear] = useState<number>(2026);

  // Filter records by company and fiscal year
  const chartData = useMemo<MonthlyDataPoint[]>(() => {
    const yearPrefix = `${fiscalYear}-`;

    const filteredAdv = advances.filter(a => {
      const matchCompany = selectedCompany === 'ALL' || a.companyId === selectedCompany;
      const matchYear = (a.requestDate || '').startsWith(yearPrefix);
      return matchCompany && matchYear;
    });

    const filteredReimb = reimbursements.filter(r => {
      const matchCompany = selectedCompany === 'ALL' || r.companyId === selectedCompany;
      const matchYear = (r.requestDate || '').startsWith(yearPrefix);
      return matchCompany && matchYear;
    });

    return MONTH_DEFINITIONS.map(m => {
      const monthPrefix = `${fiscalYear}-${m.key}`;

      const advInMonth = filteredAdv.filter(a => (a.requestDate || '').startsWith(monthPrefix));
      const reimbInMonth = filteredReimb.filter(r => (r.requestDate || '').startsWith(monthPrefix));

      const advanceAmount = advInMonth.reduce((sum, a) => sum + (a.totalAmount || 0), 0);
      const reimbursementAmount = reimbInMonth.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

      return {
        monthKey: m.key,
        monthLabel: m.label,
        monthFullName: m.fullName,
        advanceAmount,
        reimbursementAmount,
        totalAmount: advanceAmount + reimbursementAmount,
        advanceCount: advInMonth.length,
        reimbursementCount: reimbInMonth.length,
      };
    });
  }, [advances, reimbursements, selectedCompany, fiscalYear]);

  // Aggregate stats
  const totalAdvancesYTD = useMemo(
    () => chartData.reduce((sum, d) => sum + d.advanceAmount, 0),
    [chartData]
  );
  const totalReimbYTD = useMemo(
    () => chartData.reduce((sum, d) => sum + d.reimbursementAmount, 0),
    [chartData]
  );
  const totalCombinedYTD = totalAdvancesYTD + totalReimbYTD;

  // Find peak month
  const peakMonth = useMemo(() => {
    let peak = chartData[0];
    for (const d of chartData) {
      if (d.totalAmount > (peak?.totalAmount || 0)) {
        peak = d;
      }
    }
    return peak;
  }, [chartData]);

  // Format compact Rupiah for Y-axis (e.g. 10 Jt)
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

  // Custom Rich Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.monthLabel === label);
      const advVal = payload.find((p: any) => p.dataKey === 'advanceAmount')?.value || 0;
      const reimbVal = payload.find((p: any) => p.dataKey === 'reimbursementAmount')?.value || 0;
      const total = advVal + reimbVal;

      const advPct = total > 0 ? ((advVal / total) * 100).toFixed(0) : '0';
      const reimbPct = total > 0 ? ((reimbVal / total) * 100).toFixed(0) : '0';

      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl text-xs space-y-2 border border-slate-700 min-w-[240px]">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>{dataPoint?.monthFullName} {fiscalYear}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-medium">
              {selectedCompany === 'ALL' ? 'AMS & AMI' : `PT ${selectedCompany}`}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
                <span className="text-slate-300">Cost Advance (Kasbon):</span>
              </div>
              <div className="text-right font-mono font-semibold text-blue-300">
                {formatRupiah(advVal)}
                <span className="text-[10px] text-slate-400 ml-1 font-normal">({advPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
                <span className="text-slate-300">Reimbursement:</span>
              </div>
              <div className="text-right font-mono font-semibold text-emerald-300">
                {formatRupiah(reimbVal)}
                <span className="text-[10px] text-slate-400 ml-1 font-normal">({reimbPct}%)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-1.5 flex items-center justify-between font-bold">
            <span className="text-slate-200">Total Pengeluaran:</span>
            <span className="text-yellow-400 font-mono text-sm">{formatRupiah(total)}</span>
          </div>

          {dataPoint && (dataPoint.advanceCount > 0 || dataPoint.reimbursementCount > 0) && (
            <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
              <span>{dataPoint.advanceCount} Kasbon</span>
              <span>·</span>
              <span>{dataPoint.reimbursementCount} Klaim Nota</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200/60">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Tren Pengeluaran Bulanan (Fiscal Year {fiscalYear})
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Recharts Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi komparasi bulanan antara Uang Muka Biaya (Cost Advance) dan Klaim Reimbursement
          </p>
        </div>

        {/* View & Entity Controls */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Chart Type Toggle: Grouped vs Stacked */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setChartType('grouped')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartType === 'grouped'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kolom Berdampingan (Side by Side)"
            >
              Grouped
            </button>
            <button
              onClick={() => setChartType('stacked')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                chartType === 'stacked'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kolom Bertumpuk (Total Pengeluaran)"
            >
              Stacked
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Total Kasbon (YTD)</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {formatRupiah(totalAdvancesYTD)}
          </div>
          <span className="text-[10px] text-slate-500">
            {chartData.reduce((s, d) => s + d.advanceCount, 0)} permohonan
          </span>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Total Klaim (YTD)</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {formatRupiah(totalReimbYTD)}
          </div>
          <span className="text-[10px] text-slate-500">
            {chartData.reduce((s, d) => s + d.reimbursementCount, 0)} klaim kuitansi
          </span>
        </div>

        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Total Belanja (YTD)</span>
          </div>
          <div className="text-base font-bold font-mono text-indigo-950">
            {formatRupiah(totalCombinedYTD)}
          </div>
          <span className="text-[10px] text-slate-500">
            Tahun Anggaran {fiscalYear}
          </span>
        </div>

        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
          <div className="flex items-center gap-1.5 text-amber-800 font-semibold mb-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Puncak Beban (Peak)</span>
          </div>
          <div className="text-base font-bold font-mono text-slate-900">
            {peakMonth && peakMonth.totalAmount > 0
              ? `${peakMonth.monthFullName} (${formatRupiah(peakMonth.totalAmount)})`
              : '-'}
          </div>
          <span className="text-[10px] text-slate-500">Aktivitas proyek tertinggi</span>
        </div>
      </div>

      {/* Main Bar Chart Container */}
      <div className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxisTick}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={renderCustomTooltip} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                formatter={(value: string) => {
                  if (value === 'advanceAmount') return 'Cost Advance (Kasbon)';
                  if (value === 'reimbursementAmount') return 'Reimbursement (Klaim)';
                  return value;
                }}
              />
              <Bar
                dataKey="advanceAmount"
                name="advanceAmount"
                fill="#2563eb"
                stackId={chartType === 'stacked' ? 'a' : undefined}
                radius={chartType === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="reimbursementAmount"
                name="reimbursementAmount"
                fill="#10b981"
                stackId={chartType === 'stacked' ? 'a' : undefined}
                radius={chartType === 'stacked' ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis Note Footer */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-800">💡 Insight Keuangan:</span>
          <span>
            {peakMonth && peakMonth.totalAmount > 0
              ? `Pengeluaran paling intensif terjadi pada bulan ${peakMonth.monthFullName} didorong oleh kebutuhan proyek operasional.`
              : 'Menampilkan data tren transaksi real-time sepanjang tahun fiskal berjalan.'}
          </span>
        </div>
        <span className="text-slate-400 font-mono shrink-0">
          PT AMS &amp; PT AMI Financial Ledger
        </span>
      </div>
    </div>
  );
};
