import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  File,
  X,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  Paperclip,
  Download,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Camera,
} from 'lucide-react';
import { AttachmentFile, CompanyId } from '../../types/finance';

interface SimulatedAttachmentAreaProps {
  attachments: AttachmentFile[];
  onChange: (attachments: AttachmentFile[]) => void;
  mode: 'advance' | 'reimbursement';
  title?: string;
  description?: string;
  companyId?: CompanyId;
}

export const SimulatedAttachmentArea: React.FC<SimulatedAttachmentAreaProps> = ({
  attachments,
  onChange,
  mode,
  title,
  description,
  companyId = 'AMS',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewingFile, setPreviewingFile] = useState<AttachmentFile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suggested preset simulated receipts and supporting documents
  const ADVANCE_PRESETS: Array<{
    name: string;
    size: string;
    type: 'pdf' | 'image';
    simulatedPreviewType: AttachmentFile['simulatedPreviewType'];
    label: string;
  }> = [
    {
      name: `Surat_Tugas_Dinas_${companyId}_2026.pdf`,
      size: '1.4 MB',
      type: 'pdf',
      simulatedPreviewType: 'surat_tugas',
      label: 'Surat Tugas Dinas Resmi',
    },
    {
      name: 'Estimasi_Penawaran_Vendor_Sewa.pdf',
      size: '820 KB',
      type: 'pdf',
      simulatedPreviewType: 'invoice',
      label: 'Penawaran Vendor / Proforma',
    },
    {
      name: 'Reservasi_Tiket_Perjalanan_Dinas.jpg',
      size: '410 KB',
      type: 'image',
      simulatedPreviewType: 'tiket',
      label: 'Bukti Reservasi Tiket',
    },
  ];

  const REIMBURSEMENT_PRESETS: Array<{
    name: string;
    size: string;
    type: 'image' | 'pdf';
    simulatedPreviewType: AttachmentFile['simulatedPreviewType'];
    label: string;
  }> = [
    {
      name: 'Struk_SPBU_Pertamina_Dex_01.jpg',
      size: '480 KB',
      type: 'image',
      simulatedPreviewType: 'struk_bbm',
      label: 'Struk Asli BBM SPBU',
    },
    {
      name: 'Kuitansi_Konsumsi_Meeting_Client.jpg',
      size: '620 KB',
      type: 'image',
      simulatedPreviewType: 'kuitansi',
      label: 'Kuitansi Konsumsi Restoran',
    },
    {
      name: 'Faktur_Pajak_Toko_Material_Alat.pdf',
      size: '790 KB',
      type: 'pdf',
      simulatedPreviewType: 'invoice',
      label: 'Faktur Resmi Toko / Alat',
    },
    {
      name: 'Tiket_Kereta_Api_Whoosh_Eksekutif.pdf',
      size: '1.1 MB',
      type: 'pdf',
      simulatedPreviewType: 'tiket',
      label: 'Tiket Kereta Api / Tol',
    },
  ];

  const currentPresets = mode === 'advance' ? ADVANCE_PRESETS : REIMBURSEMENT_PRESETS;

  // Handle actual files dragged or selected
  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: AttachmentFile[] = Array.from(files).map((f, idx) => {
      const isImg = f.type.startsWith('image/');
      const isPdf = f.type.includes('pdf') || f.name.toLowerCase().endsWith('.pdf');
      const sizeStr =
        f.size > 1024 * 1024
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(f.size / 1024)} KB`;

      let previewUrl: string | undefined;
      try {
        previewUrl = URL.createObjectURL(f);
      } catch (e) {
        // fallback
      }

      return {
        id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        name: f.name,
        size: sizeStr,
        type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
        previewUrl,
        uploadedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        simulatedPreviewType: isImg ? (mode === 'reimbursement' ? 'struk_bbm' : 'tiket') : 'generic',
      };
    });

    onChange([...attachments, ...newAttachments]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAddPreset = (preset: (typeof currentPresets)[0]) => {
    // Check if already added
    if (attachments.some(a => a.name === preset.name)) {
      alert(`Berkas "${preset.name}" sudah ditambahkan.`);
      return;
    }

    const newFile: AttachmentFile = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: preset.name,
      size: preset.size,
      type: preset.type,
      uploadedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      simulatedPreviewType: preset.simulatedPreviewType,
    };

    onChange([...attachments, newFile]);
  };

  const handleAddAllPresets = () => {
    const toAdd = currentPresets
      .filter(p => !attachments.some(a => a.name === p.name))
      .map((p, idx) => ({
        id: `att-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        name: p.name,
        size: p.size,
        type: p.type,
        uploadedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        simulatedPreviewType: p.simulatedPreviewType,
      }));

    if (toAdd.length === 0) {
      alert('Semua berkas rekomendasi simulasi sudah terlampir.');
      return;
    }

    onChange([...attachments, ...toAdd]);
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Title & Badge */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {title ||
                (mode === 'advance'
                  ? 'Dokumen Pendukung / Estimasi Kasbon'
                  : 'Lampiran Foto Struk & Kuitansi Asli')}
            </span>
            <span className="text-[11px] font-normal text-slate-500">
              ({attachments.length} berkas)
            </span>
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {description ||
              (mode === 'advance'
                ? 'Lampirkan Surat Tugas, Penawaran Vendor, Rencana Itinerary, atau Memo Internal.'
                : 'Unggah foto struk kasir, nota pembayaran bensin/tol, kuitansi bermaterai, atau faktur.')}
          </p>
        </div>

        {/* Quick simulation helper button */}
        <button
          type="button"
          onClick={handleAddAllPresets}
          className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 transition-colors"
          title="Lampirkan contoh berkas bukti simulasi secara instan"
        >
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span>Simulasikan Berkas</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
            : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-1.5">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700">
            <span className="font-semibold text-blue-600 hover:underline">Pilih berkas</span> atau
            tarik dan letakkan di sini
          </div>
          <p className="text-[10px] text-slate-400">
            Mendukung file foto struk (JPG, PNG, HEIC) atau dokumen (PDF, DOC) maks. 10MB
          </p>
        </div>
      </div>

      {/* Preset Suggestions Quick Bar */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Contoh cepat:
        </span>
        {currentPresets.map((preset, idx) => {
          const isAdded = attachments.some(a => a.name === preset.name);
          return (
            <button
              key={idx}
              type="button"
              disabled={isAdded}
              onClick={() => handleAddPreset(preset)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors flex items-center gap-1 ${
                isAdded
                  ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'border-blue-200 bg-blue-50/60 text-blue-800 hover:bg-blue-100 cursor-pointer'
              }`}
            >
              <span>+ {preset.label}</span>
              {isAdded && <span className="text-[9px] text-emerald-600">✓</span>}
            </button>
          );
        })}
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-medium text-slate-600 flex items-center justify-between">
            <span>Daftar Berkas Terlampir</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ {attachments.length} Berkas Siap Diunggah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map(file => {
              const isPdf = file.type === 'pdf' || file.name.endsWith('.pdf');
              const isImage = file.type === 'image' || file.previewUrl || file.name.match(/\.(jpg|jpeg|png|heic)$/i);

              return (
                <div
                  key={file.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs hover:border-blue-300 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Thumbnail / Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                        isPdf
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isImage
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {file.previewUrl ? (
                        <img
                          src={file.previewUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : isPdf ? (
                        <FileText className="w-5 h-5 text-rose-600" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-xs font-semibold text-slate-800 truncate"
                        title={file.name}
                      >
                        {file.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono">{file.size}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 inline" /> Valid
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewingFile(file)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Lihat Pratinjau Bukti"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compliance / SOP notice */}
      <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-snug">
          <span className="font-semibold">Standar Operasional Bukti Finance:</span> Pastikan foto kuitansi/struk terbaca jelas (tertera tanggal, nominal, stempel/cap toko). Dokumen fisik asli wajib diserahkan ke bagian Keuangan maksimal 7 hari setelah penyelesaian kegiatan.
        </div>
      </div>

      {/* Lightbox / Preview Modal */}
      {previewingFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 truncate max-w-xs">
                    {previewingFile.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Ukuran: {previewingFile.size} • Diunggah: {previewingFile.uploadedAt}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                  title="Perbesar"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200"
                  title="Perkecil"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewingFile(null);
                    setZoomLevel(1);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Document/Receipt Viewer */}
            <div className="p-6 bg-slate-100 max-h-[65vh] overflow-auto flex items-center justify-center">
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="transition-transform duration-150"
              >
                {previewingFile.previewUrl ? (
                  <div className="bg-white p-2 rounded-xl shadow-md border border-slate-200 max-w-md">
                    <img
                      src={previewingFile.previewUrl}
                      alt={previewingFile.name}
                      className="max-h-[50vh] w-auto object-contain rounded"
                    />
                  </div>
                ) : (
                  <SimulatedDocumentView
                    file={previewingFile}
                    companyId={companyId}
                    mode={mode}
                  />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between bg-white text-xs">
              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Bukti Terverifikasi oleh Sistem Keuangan
              </span>
              <button
                type="button"
                onClick={() => {
                  setPreviewingFile(null);
                  setZoomLevel(1);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: High-fidelity Indonesian document/receipt visual simulation
const SimulatedDocumentView: React.FC<{
  file: AttachmentFile;
  companyId: CompanyId;
  mode: 'advance' | 'reimbursement';
}> = ({ file, companyId, mode }) => {
  const isStrukBBM = file.simulatedPreviewType === 'struk_bbm';
  const isKuitansi = file.simulatedPreviewType === 'kuitansi';
  const isSuratTugas = file.simulatedPreviewType === 'surat_tugas';
  const isTiket = file.simulatedPreviewType === 'tiket';

  if (isStrukBBM) {
    return (
      <div className="w-72 bg-white p-5 rounded-lg shadow-lg border border-slate-300 font-mono text-[11px] text-slate-800 leading-tight space-y-3">
        <div className="text-center border-b border-dashed border-slate-300 pb-3">
          <div className="font-bold text-xs">SPBU PERTAMINA 34.12802</div>
          <div className="text-[10px] text-slate-600">JL. TB SIMATUPANG KAV. 18</div>
          <div className="text-[10px] text-slate-600">JAKARTA SELATAN</div>
          <div className="text-[10px] mt-1 text-slate-500">NPWP: 01.345.678.9-012.000</div>
        </div>

        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>NO. STRUK:</span>
            <span className="font-bold">STRUK-BBM-99214</span>
          </div>
          <div className="flex justify-between">
            <span>TANGGAL:</span>
            <span>{new Date().toISOString().split('T')[0]} 08:42</span>
          </div>
          <div className="flex justify-between">
            <span>NO. POLISI:</span>
            <span>B 1984 AMS (Operasional)</span>
          </div>
          <div className="flex justify-between">
            <span>POMPA / NOZZLE:</span>
            <span>04 / DEX-02</span>
          </div>
        </div>

        <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
          <div className="flex justify-between font-bold">
            <span>PERTAMINA DEX</span>
            <span>Rp 350.000</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>VOLUME: 22.43 LTR</span>
            <span>@ Rp 15.600 / Ltr</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL BAYAR:</span>
            <span>Rp 350.000</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>METODE:</span>
            <span>MANDIRI DEBIT / E-MONEY</span>
          </div>
        </div>

        <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500">
          *** TERIMA KASIH & SELAMAT JALAN ***
          <br />
          PASTIKAN PINTU TANGKI TERTUTUP RAPAT
        </div>
      </div>
    );
  }

  if (isKuitansi) {
    return (
      <div className="w-80 bg-amber-50/60 p-5 rounded-lg shadow-lg border-2 border-amber-300 text-[11px] text-slate-800 space-y-3">
        <div className="flex justify-between items-center border-b border-amber-300 pb-2">
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-amber-950">
              KUITANSI PEMBAYARAN
            </span>
            <div className="text-[10px] text-slate-600 font-mono">NO: RM-SEDAP/2026/041</div>
          </div>
          <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
            LUNAS
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div>
            <span className="text-slate-500 block text-[10px]">Telah Diterima Dari:</span>
            <span className="font-semibold text-slate-900">
              PT {companyId === 'AMS' ? 'Artha Mandiri Sejahtera' : 'Anugerah Mitra Industri'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Uang Sejumlah:</span>
            <span className="font-semibold italic text-slate-900 bg-white p-1 rounded border border-amber-200 block text-[10px]">
              Enam Ratus Dua Puluh Ribu Rupiah
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px]">Untuk Pembayaran:</span>
            <span className="font-medium text-slate-800">
              Konsumsi & Jamuan Meeting Koordinasi Lapangan Bersama Klien
            </span>
          </div>
        </div>

        <div className="flex justify-between items-end pt-3 border-t border-amber-300">
          <div className="bg-white px-2 py-1.5 rounded border border-amber-300 font-mono font-bold text-xs text-slate-900">
            Rp 620.000,-
          </div>
          <div className="text-right text-[10px]">
            <div className="text-slate-500">Jakarta, {new Date().toISOString().split('T')[0]}</div>
            <div className="font-bold text-slate-800 mt-4 underline">Resto Sedap Rasa & Co.</div>
            <div className="text-[9px] text-slate-400 font-mono">(Stempel & Tanda Tangan Kasir)</div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuratTugas) {
    return (
      <div className="w-80 bg-white p-5 rounded-lg shadow-lg border border-slate-300 text-[11px] text-slate-800 space-y-3">
        <div className="text-center border-b-2 border-slate-900 pb-2">
          <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
            PT {companyId === 'AMS' ? 'ARTHA MANDIRI SEJAHTERA' : 'ANUGERAH MITRA INDUSTRI'}
          </div>
          <div className="text-[10px] text-slate-500">
            INTERNAL CORPORATE OPERATIONAL TRAVEL ASSIGNMENT
          </div>
          <div className="font-mono text-[10px] text-blue-700 font-semibold mt-1">
            SURAT TUGAS NO: ST/{companyId}/OPS/{new Date().getFullYear()}/089
          </div>
        </div>

        <div className="space-y-2 text-[10px]">
          <p>Direksi & Manajemen memberikan penugasan kepada karyawan terlampir untuk melaksanakan:</p>
          <div className="p-2 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-900 block">Uraian Tugas / Proyek:</span>
            <span className="text-slate-700">
              Supervisi Perawatan & Kalibrasi Turbin Lapangan Unit Cikarang / Pelabuhan Tanjung Priok
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="block font-semibold text-slate-800">Tanggal Berangkat:</span>
              <span>{new Date().toISOString().split('T')[0]}</span>
            </div>
            <div>
              <span className="block font-semibold text-slate-800">Alokasi Biaya:</span>
              <span className="font-mono text-emerald-700 font-bold">Cost Center Operasional</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px]">
          <div>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px]">
              APPROVED & SIGNED
            </span>
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-900">General Manager Operasional</div>
            <div className="text-slate-400 text-[9px] mt-4 font-mono">[Digital Verified Signature]</div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for Tickets / Invoices / General
  return (
    <div className="w-80 bg-white p-5 rounded-lg shadow-lg border border-slate-300 text-[11px] text-slate-800 space-y-3">
      <div className="flex justify-between items-start border-b border-slate-200 pb-2">
        <div>
          <div className="font-bold text-xs text-slate-900">{file.name}</div>
          <div className="text-[10px] text-slate-500">Berkas Terlampir Resmi</div>
        </div>
        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[9px]">
          VERIFIED
        </span>
      </div>

      <div className="space-y-1.5 text-[10px] text-slate-600">
        <div className="flex justify-between">
          <span>Tipe Dokumen:</span>
          <span className="font-mono font-medium text-slate-900">{file.type.toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Ukuran File:</span>
          <span className="font-mono font-medium text-slate-900">{file.size}</span>
        </div>
        <div className="flex justify-between">
          <span>Waktu Unggah:</span>
          <span className="font-mono font-medium text-slate-900">{file.uploadedAt}</span>
        </div>
        <div className="flex justify-between">
          <span>Status Audit:</span>
          <span className="text-emerald-700 font-semibold">Tervalidasi & Siap Diaudit</span>
        </div>
      </div>

      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-center">
        <FileText className="w-8 h-8 text-blue-600 mx-auto mb-1" />
        <div className="text-[10px] font-semibold text-slate-800">
          Dokumen Digital Terproteksi
        </div>
        <div className="text-[9px] text-slate-500">
          Ref ID: {file.id} • SHA-256 Validated
        </div>
      </div>
    </div>
  );
};
