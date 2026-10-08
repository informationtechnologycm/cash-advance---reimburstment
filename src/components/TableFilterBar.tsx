import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import {
  Search,
  Calendar,
  User,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';

export interface StatusOption {
  value: string;
  label: string;
  count?: number;
  badgeClass?: string;
}

export interface TableFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;

  // Requestor filter
  requestorQuery: string;
  onRequestorChange: (val: string) => void;
  availableRequestors: string[];

  // Status filter
  status: string;
  onStatusChange: (status: string) => void;
  statusOptions: StatusOption[];

  // Date range filter
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;

  // Only mine toggle
  onlyMine?: boolean;
  onToggleOnlyMine?: () => void;
  showOnlyMine?: boolean;

  // Reset
  onResetFilters: () => void;
  hasActiveFilters: boolean;

  // Results metadata
  totalCount: number;
  filteredCount: number;
  totalAmount?: number;
  itemName?: string;

  // Optional export actions slot
  exportActions?: React.ReactNode;
}

export const TableFilterBar: React.FC<TableFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Cari kode, keperluan, cost center...',
  requestorQuery,
  onRequestorChange,
  availableRequestors,
  status,
  onStatusChange,
  statusOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onlyMine = false,
  onToggleOnlyMine,
  showOnlyMine = true,
  onResetFilters,
  hasActiveFilters,
  totalCount,
  filteredCount,
  totalAmount,
  itemName = 'pengajuan',
  exportActions,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Quick Date Range Presets
  const applyDatePreset = (preset: 'THIS_MONTH' | 'LAST_MONTH' | 'ALL_TIME') => {
    if (preset === 'ALL_TIME') {
      onStartDateChange('');
      onEndDateChange('');
    } else if (preset === 'THIS_MONTH') {
      // 2026-10
      onStartDateChange('2026-10-01');
      onEndDateChange('2026-10-31');
    } else if (preset === 'LAST_MONTH') {
      // 2026-09
      onStartDateChange('2026-09-01');
      onEndDateChange('2026-09-30');
    }
  };

  const isThisMonth = startDate === '2026-10-01' && endDate === '2026-10-31';
  const isLastMonth = startDate === '2026-09-01' && endDate === '2026-09-30';
  const isAllTime = !startDate && !endDate;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
      {/* Row 1: Primary Search Input & Quick Status Scrollable Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Main Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl transition-all focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              title="Hapus pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-colors shrink-0 font-medium ${
            showAdvancedFilters || startDate || endDate || requestorQuery
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filter Lanjutan</span>
          {(startDate || endDate || requestorQuery) && (
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              showAdvancedFilters ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Only Mine Toggle (if applicable) */}
        {showOnlyMine && onToggleOnlyMine && (
          <button
            onClick={onToggleOnlyMine}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-xl border transition-colors shrink-0 font-medium ${
              onlyMine
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{onlyMine ? '✓ Berkas Saya Saja' : 'Berkas Saya Saja'}</span>
          </button>
        )}

        {/* Reset All Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl transition-colors shrink-0"
            title="Reset semua filter kembali ke awal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        )}
      </div>

      {/* Row 2: Status Selector Segmented Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Status:</span>
        </span>

        {statusOptions.map(opt => {
          const isActive = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onStatusChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-medium shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <span>{opt.label}</span>
              {typeof opt.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Row 3: Advanced Filter Panel (Date Range & Requestor Filter) */}
      {showAdvancedFilters && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          {/* Requestor / Pemohon Filter */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Filter Nama Pemohon (Requestor)</span>
            </label>
            <div className="flex items-center gap-1.5">
              <select
                value={requestorQuery}
                onChange={e => onRequestorChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="">Semua Pemohon ({availableRequestors.length} Karyawan)</option>
                {availableRequestors.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {requestorQuery && (
                <button
                  onClick={() => onRequestorChange('')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg"
                  title="Hapus filter pemohon"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Date Range: Dari Tanggal */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Dari Tanggal</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => onStartDateChange(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Date Range: Sampai Tanggal */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Sampai Tanggal</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={endDate}
                onChange={e => onEndDateChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    onStartDateChange('');
                    onEndDateChange('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg shrink-0"
                  title="Hapus rentang tanggal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Date Range Preset Buttons */}
          <div className="md:col-span-12 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              Pintasan Periode:
            </span>
            <button
              onClick={() => applyDatePreset('THIS_MONTH')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isThisMonth
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Bulan Berjalan (Okt 2026)
            </button>
            <button
              onClick={() => applyDatePreset('LAST_MONTH')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isLastMonth
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Bulan Lalu (Sep 2026)
            </button>
            <button
              onClick={() => applyDatePreset('ALL_TIME')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                isAllTime
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Semua Waktu
            </button>
          </div>
        </div>
      )}

      {/* Row 4: Active Filter Indicators & Results Stats Summary Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-700">
            Menampilkan <strong className="text-slate-900 font-mono">{filteredCount}</strong> dari{' '}
            <span className="font-mono">{totalCount}</span> {itemName}
          </span>

          {/* Unboxed Metadata Indicators (strict anti-slop) */}
          {searchQuery && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600">
                Pencarian: &ldquo;{searchQuery}&rdquo;
              </span>
            </>
          )}

          {requestorQuery && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-blue-700 font-medium">
                Pemohon: {requestorQuery}
              </span>
            </>
          )}

          {(startDate || endDate) && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600">
                Periode: {startDate || 'Awal'} s/d {endDate || 'Sekarang'}
              </span>
            </>
          )}

          {status !== 'ALL' && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-700 font-medium">
                Status: {statusOptions.find(o => o.value === status)?.label || status}
              </span>
            </>
          )}
        </div>

        {/* Right side: Total Amount and Export Actions */}
        <div className="flex items-center gap-3">
          {typeof totalAmount === 'number' && (
            <div className="font-mono text-xs">
              <span className="text-slate-400 mr-1.5">Total Nilai:</span>
              <strong className="text-slate-900 font-bold">{formatRupiah(totalAmount)}</strong>
            </div>
          )}
          {exportActions && <div className="shrink-0">{exportActions}</div>}
        </div>
      </div>
    </div>
  );
};
