import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { HISTORICAL_ADVANCES_2026, HISTORICAL_REIMBURSEMENTS_2026 } from './src/data/historicalFinancialData';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-Memory Database for backend
interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string; // Plaintext for demo simplicity
  role: 'STAFF' | 'MANAGER' | 'FINANCE' | 'DIRECTOR';
  roleLabel: string;
  department: string;
  companyId: 'AMS' | 'AMI';
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
}

const USERS: UserRecord[] = [
  {
    id: 'usr-1',
    name: 'Rian Pratama',
    email: 'rian@ams.co.id',
    password: 'password123',
    role: 'STAFF',
    roleLabel: 'Staff Operasional',
    department: 'Operasional Lapangan',
    companyId: 'AMS',
    bankAccount: {
      bankName: 'BCA',
      accountNumber: '522-192-8821',
      accountHolder: 'RIAN PRATAMA',
    },
  },
  {
    id: 'usr-2',
    name: 'Dewi Lestari',
    email: 'dewi@ams.co.id',
    password: 'password123',
    role: 'MANAGER',
    roleLabel: 'Manager Proyek & Lapangan',
    department: 'Engineering & Proyek',
    companyId: 'AMS',
    bankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '118-00-982173-4',
      accountHolder: 'DEWI LESTARI',
    },
  },
  {
    id: 'usr-3',
    name: 'Budi Santoso',
    email: 'budi@holding.co.id',
    password: 'password123',
    role: 'FINANCE',
    roleLabel: 'Finance & Accounting Lead',
    department: 'Finance & Accounting',
    companyId: 'AMS',
    bankAccount: {
      bankName: 'BCA',
      accountNumber: '731-002-9988',
      accountHolder: 'BUDI SANTOSO',
    },
  },
  {
    id: 'usr-4',
    name: 'Ir. Hendra Kusuma',
    email: 'hendra@holding.co.id',
    password: 'password123',
    role: 'DIRECTOR',
    roleLabel: 'Direktur Utama',
    department: 'Direksi',
    companyId: 'AMS',
    bankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '102-00-881239-0',
      accountHolder: 'HENDRA KUSUMA',
    },
  },
  {
    id: 'usr-5',
    name: 'Siti Nurhaliza',
    email: 'siti@ami.co.id',
    password: 'password123',
    role: 'STAFF',
    roleLabel: 'Staff Pengadaan & Logistik',
    department: 'Logistik & Pengadaan',
    companyId: 'AMI',
    bankAccount: {
      bankName: 'BNI',
      accountNumber: '083-918-2741',
      accountHolder: 'SITI NURHALIZA',
    },
  },
  {
    id: 'usr-6',
    name: 'Agus Wijaya',
    email: 'agus@ami.co.id',
    password: 'password123',
    role: 'MANAGER',
    roleLabel: 'Manager Pabrik & Operasional AMI',
    department: 'Manufaktur & Pabrik',
    companyId: 'AMI',
    bankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '132-00-551928-1',
      accountHolder: 'AGUS WIJAYA',
    },
  },
  {
    id: 'usr-7',
    name: 'Maya Anggraini',
    email: 'maya@ami.co.id',
    password: 'password123',
    role: 'FINANCE',
    roleLabel: 'Finance & Accounting AMI',
    department: 'Finance & Accounting',
    companyId: 'AMI',
    bankAccount: {
      bankName: 'BCA',
      accountNumber: '827-019-3344',
      accountHolder: 'MAYA ANGGRAINI',
    },
  },
];

// Seeded In-Memory State
let advances: any[] = [
  {
    id: 'ca-1',
    code: 'CA-AMS-2026-0021',
    companyId: 'AMS',
    applicantId: 'usr-1',
    applicantName: 'Rian Pratama',
    applicantDepartment: 'Operasional Lapangan',
    jobTitle: 'Field Site Supervisor',
    requestDate: '2026-09-28',
    requiredDate: '2026-10-02',
    purpose: 'Perjalanan Dinas & Supervisi Kalibrasi Turbin PLTU Labuan Batu',
    costCenter: 'CC-AMS-ENG-04',
    status: 'PENDING_SETTLEMENT',
    totalAmount: 6500000,
    paymentMethod: 'TRANSFER',
    settlementDeadlineDate: '2026-10-09',
    applicantBankAccount: {
      bankName: 'BCA',
      accountNumber: '522-192-8821',
      accountHolder: 'RIAN PRATAMA',
    },
    disbursementDetails: {
      disbursedDate: '2026-10-01',
      disbursedBy: 'Budi Santoso (Finance)',
      sourceBank: 'Bank Mandiri AMS (137-00-1982736-1)',
      referenceNumber: 'TRF-AMS-20261001-9812',
    },
    items: [
      {
        id: 'it-1',
        date: '2026-10-02',
        category: 'TRANSPORT',
        description: 'BBM & Tol Mobil Operasional Jakarta - Labuan Batu (PP)',
        quantity: 1,
        unitPrice: 1600000,
        total: 1600000,
      },
      {
        id: 'it-2',
        date: '2026-10-02',
        category: 'ACCOMMODATION',
        description: 'Hotel Tim Teknisi 3 Orang x 3 Malam',
        quantity: 3,
        unitPrice: 900000,
        total: 2700000,
      },
      {
        id: 'it-3',
        date: '2026-10-02',
        category: 'MEALS',
        description: 'Uang Makan Tim Lapangan 3 Orang x 4 Hari',
        quantity: 12,
        unitPrice: 125000,
        total: 1500000,
      },
      {
        id: 'it-4',
        date: '2026-10-03',
        category: 'TOOLS_EQUIPMENT',
        description: 'Sewa Alat Crane Mobile & Sling Khusus (1 Hari)',
        quantity: 1,
        unitPrice: 700000,
        total: 700000,
      },
    ],
    approvalHistory: [
      {
        id: 'ah-1',
        timestamp: '2026-09-28 09:30',
        actorName: 'Rian Pratama',
        actorRole: 'STAFF',
        actorRoleLabel: 'Staff Lapangan',
        action: 'SUBMITTED',
        notes: 'Pengajuan kasbon tugas site kalibrasi turbin 3 hari.',
      },
      {
        id: 'ah-2',
        timestamp: '2026-09-29 11:15',
        actorName: 'Dewi Lestari',
        actorRole: 'MANAGER',
        actorRoleLabel: 'Manager Proyek',
        action: 'APPROVED',
        notes: 'Disetujui, sesuai rencana anggaran proyek SPK #782.',
      },
      {
        id: 'ah-3',
        timestamp: '2026-09-30 14:00',
        actorName: 'Budi Santoso',
        actorRole: 'FINANCE',
        actorRoleLabel: 'Finance & Accounting',
        action: 'APPROVED',
        notes: 'Verifikasi berkas lengkap, alokasi akun Beban Proyek.',
      },
      {
        id: 'ah-4',
        timestamp: '2026-10-01 10:20',
        actorName: 'Budi Santoso',
        actorRole: 'FINANCE',
        actorRoleLabel: 'Kasir Bank',
        action: 'DISBURSED',
        notes: 'Dana telah ditransfer via Mandiri Corporate ref #TRF-9812.',
      },
    ],
  },
  {
    id: 'ca-2',
    code: 'CA-AMI-2026-0018',
    companyId: 'AMI',
    applicantId: 'usr-5',
    applicantName: 'Siti Nurhaliza',
    applicantDepartment: 'Logistik & Pengadaan',
    jobTitle: 'Procurement Specialist',
    requestDate: '2026-10-03',
    requiredDate: '2026-10-08',
    purpose: 'Uang Muka Pembelian Sparepart Conveyor Belt Emergency Pabrik Cikarang',
    costCenter: 'CC-AMI-MFG-02',
    status: 'PENDING_MANAGER',
    totalAmount: 4800000,
    paymentMethod: 'TRANSFER',
    settlementDeadlineDate: '2026-10-15',
    applicantBankAccount: {
      bankName: 'BNI',
      accountNumber: '083-918-2741',
      accountHolder: 'SITI NURHALIZA',
    },
    items: [
      {
        id: 'it-5',
        date: '2026-10-08',
        category: 'TOOLS_EQUIPMENT',
        description: 'V-Belt Bando Seri C-145 (10 Pcs)',
        quantity: 10,
        unitPrice: 280000,
        total: 2800000,
      },
      {
        id: 'it-6',
        date: '2026-10-08',
        category: 'TOOLS_EQUIPMENT',
        description: 'Roller Idler Diameter 89mm (5 Unit)',
        quantity: 5,
        unitPrice: 320000,
        total: 1600000,
      },
      {
        id: 'it-7',
        date: '2026-10-08',
        category: 'TRANSPORT',
        description: 'Ongkos Jemput Pick-Up Toko Teknik Glodok ke Cikarang',
        quantity: 1,
        unitPrice: 400000,
        total: 400000,
      },
    ],
    approvalHistory: [
      {
        id: 'ah-5',
        timestamp: '2026-10-03 16:45',
        actorName: 'Siti Nurhaliza',
        actorRole: 'STAFF',
        actorRoleLabel: 'Procurement Specialist',
        action: 'SUBMITTED',
        notes: 'Supplier meminta cash on delivery di Glodok.',
      },
    ],
  },
  {
    id: 'ca-3',
    code: 'CA-AMS-2026-0019',
    companyId: 'AMS',
    applicantId: 'usr-2',
    applicantName: 'Dewi Lestari',
    applicantDepartment: 'Engineering & Proyek',
    jobTitle: 'Manager Proyek',
    requestDate: '2026-10-04',
    requiredDate: '2026-10-10',
    purpose: 'Kick-Off Meeting & Tender Presentation Konsorsium BUMN Surabaya',
    costCenter: 'CC-AMS-MKT-01',
    status: 'PENDING_FINANCE',
    totalAmount: 18500000,
    paymentMethod: 'TRANSFER',
    settlementDeadlineDate: '2026-10-17',
    applicantBankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '118-00-982173-4',
      accountHolder: 'DEWI LESTARI',
    },
    items: [
      {
        id: 'it-8',
        date: '2026-10-10',
        category: 'TRANSPORT',
        description: 'Tiket Pesawat Garuda CGK - SUB (PP 2 Orang Tim)',
        quantity: 2,
        unitPrice: 3200000,
        total: 6400000,
      },
      {
        id: 'it-9',
        date: '2026-10-10',
        category: 'ACCOMMODATION',
        description: 'Hotel JW Marriott Surabaya 2 Malam x 2 Kamar',
        quantity: 4,
        unitPrice: 1550000,
        total: 6200000,
      },
    ],
    approvalHistory: [
      {
        id: 'ah-6',
        timestamp: '2026-10-04 10:00',
        actorName: 'Dewi Lestari',
        actorRole: 'MANAGER',
        actorRoleLabel: 'Manager Proyek',
        action: 'SUBMITTED',
      },
      {
        id: 'ah-7',
        timestamp: '2026-10-04 14:10',
        actorName: 'Dewi Lestari',
        actorRole: 'MANAGER',
        actorRoleLabel: 'Manager Proyek',
        action: 'APPROVED',
      },
    ],
  },
  {
    id: 'ca-4',
    code: 'CA-AMI-2026-0015',
    companyId: 'AMI',
    applicantId: 'usr-5',
    applicantName: 'Siti Nurhaliza',
    applicantDepartment: 'Logistik & Pengadaan',
    jobTitle: 'Procurement Specialist',
    requestDate: '2026-09-15',
    requiredDate: '2026-09-18',
    purpose: 'Sewa Forklift Tambahan Bongkar Muat Bahan Baku Coil Baja',
    costCenter: 'CC-AMI-LOG-01',
    status: 'SETTLED',
    totalAmount: 3200000,
    paymentMethod: 'TRANSFER',
    settlementDeadlineDate: '2026-09-25',
    applicantBankAccount: {
      bankName: 'BNI',
      accountNumber: '083-918-2741',
      accountHolder: 'SITI NURHALIZA',
    },
    disbursementDetails: {
      disbursedDate: '2026-09-17',
      disbursedBy: 'Maya Anggraini (Finance AMI)',
      sourceBank: 'BCA AMI (827-019-3344)',
      referenceNumber: 'TRF-AMI-20260917-4401',
    },
    settlementId: 'st-1',
    items: [
      {
        id: 'it-12',
        date: '2026-09-18',
        category: 'FIELD_OPERATIONS',
        description: 'Sewa Forklift Kapasitas 7 Ton (2 Shift)',
        quantity: 2,
        unitPrice: 1600000,
        total: 3200000,
      },
    ],
    approvalHistory: [
      {
        id: 'ah-8',
        timestamp: '2026-09-15 08:30',
        actorName: 'Siti Nurhaliza',
        actorRole: 'STAFF',
        actorRoleLabel: 'Staff Pengadaan',
        action: 'SUBMITTED',
      },
      {
        id: 'ah-11',
        timestamp: '2026-09-22 15:40',
        actorName: 'Maya Anggraini',
        actorRole: 'FINANCE',
        actorRoleLabel: 'Finance AMI',
        action: 'SETTLED',
        notes: 'Pertanggungjawaban kuitansi cocok penuh Rp 3.000.000, sisa Rp 200.000 telah disetor kembali.',
      },
    ],
  },
  ...HISTORICAL_ADVANCES_2026,
];

let reimbursements: any[] = [
  {
    id: 'rb-1',
    code: 'RB-AMS-2026-0042',
    companyId: 'AMS',
    applicantId: 'usr-1',
    applicantName: 'Rian Pratama',
    applicantDepartment: 'Operasional Lapangan',
    jobTitle: 'Field Site Supervisor',
    requestDate: '2026-10-04',
    purpose: 'Klaim Penggantian Bensin & E-Toll Mobil Operasional Kunjungan Client Cilegon',
    costCenter: 'CC-AMS-ENG-02',
    status: 'PENDING_MANAGER',
    totalAmount: 890000,
    applicantBankAccount: {
      bankName: 'BCA',
      accountNumber: '522-192-8821',
      accountHolder: 'RIAN PRATAMA',
    },
    items: [
      {
        id: 'rit-1',
        date: '2026-10-03',
        category: 'TRANSPORT',
        description: 'Pertamax Green 95 SPBU Pertamina 34-152 (45 Liter)',
        quantity: 1,
        unitPrice: 625000,
        total: 625000,
        receiptNumber: 'SPBU-20261003-88',
        notes: 'Struk asli terlampir lengkap',
      },
      {
        id: 'rit-2',
        date: '2026-10-03',
        category: 'TRANSPORT',
        description: 'Top-Up E-Toll Mandiri Gerbang Tol Cikupa - Merak',
        quantity: 1,
        unitPrice: 265000,
        total: 265000,
        receiptNumber: 'INDOMARET-09817',
      },
    ],
    approvalHistory: [
      {
        id: 'rah-1',
        timestamp: '2026-10-04 14:15',
        actorName: 'Rian Pratama',
        actorRole: 'STAFF',
        actorRoleLabel: 'Staff Lapangan',
        action: 'SUBMITTED',
        notes: 'Kunjungan mendadak troubleshooting sensor mesin client PT Krakatau.',
      },
    ],
  },
  {
    id: 'rb-2',
    code: 'RB-AMI-2026-0039',
    companyId: 'AMI',
    applicantId: 'usr-5',
    applicantName: 'Siti Nurhaliza',
    applicantDepartment: 'Logistik & Pengadaan',
    jobTitle: 'Procurement Specialist',
    requestDate: '2026-10-02',
    purpose: 'Penggantian Konsumsi Lembur Tim Gudang Bongkar Kontainer Impor',
    costCenter: 'CC-AMI-LOG-03',
    status: 'PENDING_FINANCE',
    totalAmount: 1450000,
    applicantBankAccount: {
      bankName: 'BNI',
      accountNumber: '083-918-2741',
      accountHolder: 'SITI NURHALIZA',
    },
    items: [
      {
        id: 'rit-3',
        date: '2026-10-01',
        category: 'MEALS',
        description: 'Nasi Box & Minum Lembur 25 Orang x Rp 45.000',
        quantity: 25,
        unitPrice: 45000,
        total: 1125000,
        receiptNumber: 'RM-PADANG-1001-3',
      },
      {
        id: 'rit-4',
        date: '2026-10-01',
        category: 'MEALS',
        description: 'Air Mineral Galon Aqua & Kopi Sachet Shift Malam',
        quantity: 1,
        unitPrice: 325000,
        total: 325000,
        receiptNumber: 'NOTA-WARUNG-992',
      },
    ],
    approvalHistory: [
      {
        id: 'rah-2',
        timestamp: '2026-10-02 09:10',
        actorName: 'Siti Nurhaliza',
        actorRole: 'STAFF',
        actorRoleLabel: 'Procurement',
        action: 'SUBMITTED',
      },
      {
        id: 'rah-3',
        timestamp: '2026-10-03 10:00',
        actorName: 'Dewi Lestari',
        actorRole: 'MANAGER',
        actorRoleLabel: 'Manager',
        action: 'APPROVED',
      },
    ],
  },
  {
    id: 'rb-3',
    code: 'RB-AMS-2026-0038',
    companyId: 'AMS',
    applicantId: 'usr-2',
    applicantName: 'Dewi Lestari',
    applicantDepartment: 'Engineering & Proyek',
    jobTitle: 'Manager Proyek',
    requestDate: '2026-09-25',
    purpose: 'Klaim Medical Rawat Jalan & Kacamata Kerja Sesuai Plafon Tahunan',
    costCenter: 'CC-AMS-HR-01',
    status: 'PAID',
    totalAmount: 2350000,
    applicantBankAccount: {
      bankName: 'Bank Mandiri',
      accountNumber: '118-00-982173-4',
      accountHolder: 'DEWI LESTARI',
    },
    paymentDetails: {
      paidDate: '2026-09-29',
      paidBy: 'Budi Santoso (Finance)',
      sourceBank: 'Bank Mandiri AMS (137-00-1982736-1)',
      referenceNumber: 'TRF-PAY-20260929-1029',
    },
    items: [
      {
        id: 'rit-5',
        date: '2026-09-24',
        category: 'MEDICAL',
        description: 'Pemeriksaan Dokter Spesialis Mata & Resep Obat di RS Siloam',
        quantity: 1,
        unitPrice: 850000,
        total: 850000,
        receiptNumber: 'RS-SLM-KW-202609-12',
      },
      {
        id: 'rit-6',
        date: '2026-09-24',
        category: 'MEDICAL',
        description: 'Lensa Kacamata Anti-Radiasi Blue Ray Optik Melawai',
        quantity: 1,
        unitPrice: 1500000,
        total: 1500000,
        receiptNumber: 'OPTIK-MLW-99120',
      },
    ],
    approvalHistory: [
      {
        id: 'rah-6',
        timestamp: '2026-09-29 16:30',
        actorName: 'Budi Santoso',
        actorRole: 'FINANCE',
        actorRoleLabel: 'Finance',
        action: 'PAID',
        notes: 'Ditransfer lunas ke rekening Bank Mandiri pemohon.',
      },
    ],
  },
  ...HISTORICAL_REIMBURSEMENTS_2026,
];

let settlements: any[] = [
  {
    id: 'st-1',
    code: 'ST-AMI-2026-0008',
    advanceId: 'ca-4',
    advanceCode: 'CA-AMI-2026-0015',
    companyId: 'AMI',
    applicantId: 'usr-5',
    applicantName: 'Siti Nurhaliza',
    applicantDepartment: 'Logistik & Pengadaan',
    settlementDate: '2026-09-22',
    advanceAmount: 3200000,
    actualItems: [
      {
        id: 'st-it-1',
        date: '2026-09-18',
        category: 'FIELD_OPERATIONS',
        description: 'Sewa Forklift 7 Ton (2 Shift dengan Operator)',
        quantity: 2,
        unitPrice: 1500000,
        total: 3000000,
        receiptNumber: 'INV-FORK-CV-MITRA-881',
      },
    ],
    totalActualAmount: 3000000,
    difference: -200000,
    varianceType: 'REFUND_TO_COMPANY',
    refundProofUrl: 'TRF-REFUND-BNI-20260921-9921',
    status: 'VERIFIED',
    notes: 'Kelebihan dana Rp 200.000 sudah ditransfer balik ke rekening BCA PT AMI pada tanggal 21 Sept 2026.',
    approvalHistory: [
      {
        id: 'sah-1',
        timestamp: '2026-09-21 16:00',
        actorName: 'Siti Nurhaliza',
        actorRole: 'STAFF',
        actorRoleLabel: 'Staff Pengadaan',
        action: 'SUBMITTED',
      },
      {
        id: 'sah-2',
        timestamp: '2026-09-22 15:30',
        actorName: 'Maya Anggraini',
        actorRole: 'FINANCE',
        actorRoleLabel: 'Finance AMI',
        action: 'SETTLED',
      },
    ],
  },
];

// Helper: current timestamp
function getTimestamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ========================
// AUTHENTICATION API
// ========================
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi' });
  }

  const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Akun dengan email ini tidak ditemukan' });
  }

  if (password && password !== user.password && password !== 'password123') {
    return res.status(401).json({ error: 'Kata sandi tidak sesuai' });
  }

  // Return user without sensitive fields + mock token
  const { password: _, ...userSafe } = user;
  const token = `bearer-token-${user.id}-${Date.now()}`;

  return res.json({
    token,
    user: userSafe,
    message: 'Login berhasil',
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Tidak ada token otentikasi' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.split('-')[2];
  const user = USERS.find(u => u.id === userId);

  if (!user) {
    // Fallback to default user
    const defaultUser = USERS[0];
    const { password: _, ...userSafe } = defaultUser;
    return res.json({ user: userSafe });
  }

  const { password: _, ...userSafe } = user;
  return res.json({ user: userSafe });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const safeUsers = USERS.map(({ password: _, ...u }) => u);
  return res.json(safeUsers);
});

// ========================
// COST ADVANCES API
// ========================
app.get('/api/advances', (req: Request, res: Response) => {
  const { companyId } = req.query;
  let result = advances;
  if (companyId && companyId !== 'ALL') {
    result = result.filter(a => a.companyId === companyId);
  }
  return res.json(result);
});

app.post('/api/advances', (req: Request, res: Response) => {
  const {
    companyId,
    purpose,
    requiredDate,
    costCenter,
    paymentMethod,
    items,
    bankAccount,
    applicant,
    attachments,
  } = req.body;

  const count = advances.filter(a => a.companyId === companyId).length + 1;
  const code = `CA-${companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const reqD = new Date(requiredDate || today);
  reqD.setDate(reqD.getDate() + 7);
  const deadline = reqD.toISOString().split('T')[0];

  const processedItems = (items || []).map((it: any, idx: number) => ({
    ...it,
    id: `it-${Date.now()}-${idx}`,
    total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
  }));

  const totalAmount = processedItems.reduce((acc: number, it: any) => acc + it.total, 0);

  const newAdv = {
    id: `ca-${Date.now()}`,
    code,
    companyId,
    applicantId: applicant?.id || 'usr-1',
    applicantName: applicant?.name || 'Staff Pemohon',
    applicantDepartment: req.body.applicantDepartment || applicant?.department || 'Operasional Lapangan',
    jobTitle: applicant?.roleLabel || 'Staff',
    requestDate: today,
    requiredDate: requiredDate || today,
    purpose,
    costCenter,
    status: 'PENDING_MANAGER',
    items: processedItems,
    totalAmount,
    paymentMethod: paymentMethod || 'TRANSFER',
    applicantBankAccount: bankAccount,
    settlementDeadlineDate: deadline,
    attachments: attachments || [],
    approvalHistory: [
      {
        id: `ah-${Date.now()}`,
        timestamp: getTimestamp(),
        actorName: applicant?.name || 'Staff',
        actorRole: applicant?.role || 'STAFF',
        actorRoleLabel: applicant?.roleLabel || 'Staff',
        action: 'SUBMITTED',
        notes: 'Pengajuan dibuat via backend API.',
      },
    ],
  };

  advances.unshift(newAdv);
  return res.status(201).json(newAdv);
});

app.patch('/api/advances/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, notes } = req.body;
  const adv = advances.find(a => a.id === id);

  if (!adv) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });

  if (actor?.role === 'STAFF') {
    return res.status(403).json({
      error: 'Akses ditolak: Pemohon hanya berwenang mengajukan dan memantau status alur, tidak berhak menyetujui pengajuan.',
    });
  }

  let nextStatus = adv.status;
  if (actor?.role === 'MANAGER' || (actor?.role === 'DIRECTOR' && adv.status === 'PENDING_MANAGER')) {
    nextStatus = 'PENDING_FINANCE';
  } else if (actor?.role === 'FINANCE') {
    if (adv.totalAmount > 15000000) {
      nextStatus = 'PENDING_DIRECTOR';
    } else {
      nextStatus = 'APPROVED';
    }
  } else if (actor?.role === 'DIRECTOR') {
    nextStatus = 'APPROVED';
  }

  adv.status = nextStatus;
  adv.approvalHistory.push({
    id: `ah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Approver',
    actorRole: actor?.role || 'MANAGER',
    actorRoleLabel: actor?.roleLabel || 'Approver',
    action: 'APPROVED',
    notes: notes || 'Disetujui.',
  });

  return res.json(adv);
});

app.patch('/api/advances/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, reason } = req.body;
  const adv = advances.find(a => a.id === id);

  if (!adv) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });

  if (actor?.role === 'STAFF') {
    return res.status(403).json({
      error: 'Akses ditolak: Pemohon tidak berhak menolak permohonan.',
    });
  }

  adv.status = 'REJECTED';
  adv.rejectionReason = reason;
  adv.approvalHistory.push({
    id: `ah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Approver',
    actorRole: actor?.role || 'MANAGER',
    actorRoleLabel: actor?.roleLabel || 'Approver',
    action: 'REJECTED',
    notes: reason || 'Ditolak.',
  });

  return res.json(adv);
});

app.patch('/api/advances/:id/disburse', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, sourceBank, referenceNumber, notes } = req.body;
  const adv = advances.find(a => a.id === id);

  if (!adv) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });

  if (actor?.role !== 'FINANCE' && actor?.role !== 'DIRECTOR') {
    return res.status(403).json({
      error: 'Akses ditolak: Hanya tim Finance yang berwenang mencairkan dana kasbon.',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  adv.status = 'PENDING_SETTLEMENT';
  adv.disbursementDetails = {
    disbursedDate: today,
    disbursedBy: `${actor?.name || 'Finance'} (${actor?.roleLabel || 'Finance'})`,
    sourceBank,
    referenceNumber,
  };
  adv.approvalHistory.push({
    id: `ah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Finance',
    actorRole: actor?.role || 'FINANCE',
    actorRoleLabel: actor?.roleLabel || 'Finance',
    action: 'DISBURSED',
    notes: notes || `Dana dicairkan via ${sourceBank} (Ref: ${referenceNumber})`,
  });

  return res.json(adv);
});

// ========================
// REIMBURSEMENTS API
// ========================
app.get('/api/reimbursements', (req: Request, res: Response) => {
  const { companyId } = req.query;
  let result = reimbursements;
  if (companyId && companyId !== 'ALL') {
    result = result.filter(r => r.companyId === companyId);
  }
  return res.json(result);
});

app.post('/api/reimbursements', (req: Request, res: Response) => {
  const { companyId, purpose, costCenter, items, bankAccount, applicant, attachments } = req.body;
  const count = reimbursements.filter(r => r.companyId === companyId).length + 1;
  const code = `RB-${companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const processedItems = (items || []).map((it: any, idx: number) => ({
    ...it,
    id: `rit-${Date.now()}-${idx}`,
    total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
  }));

  const totalAmount = processedItems.reduce((acc: number, it: any) => acc + it.total, 0);

  const newReimb = {
    id: `rb-${Date.now()}`,
    code,
    companyId,
    applicantId: applicant?.id || 'usr-1',
    applicantName: applicant?.name || 'Staff',
    applicantDepartment: applicant?.department || 'Operasional',
    jobTitle: applicant?.roleLabel || 'Staff',
    requestDate: today,
    purpose,
    costCenter,
    status: 'PENDING_MANAGER',
    items: processedItems,
    totalAmount,
    applicantBankAccount: bankAccount,
    attachments: attachments || [],
    approvalHistory: [
      {
        id: `rah-${Date.now()}`,
        timestamp: getTimestamp(),
        actorName: applicant?.name || 'Staff',
        actorRole: applicant?.role || 'STAFF',
        actorRoleLabel: applicant?.roleLabel || 'Staff',
        action: 'SUBMITTED',
        notes: 'Klaim diajukan via backend API.',
      },
    ],
  };

  reimbursements.unshift(newReimb);
  return res.status(201).json(newReimb);
});

app.patch('/api/reimbursements/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, notes } = req.body;
  const rb = reimbursements.find(r => r.id === id);

  if (!rb) return res.status(404).json({ error: 'Klaim tidak ditemukan' });

  if (actor?.role === 'STAFF') {
    return res.status(403).json({
      error: 'Akses ditolak: Pemohon hanya berwenang mengajukan dan memantau status alur, tidak berhak menyetujui klaim.',
    });
  }

  let nextStatus = rb.status;
  if (actor?.role === 'MANAGER' || (actor?.role === 'DIRECTOR' && rb.status === 'PENDING_MANAGER')) {
    nextStatus = 'PENDING_FINANCE';
  } else if (actor?.role === 'FINANCE' || actor?.role === 'DIRECTOR') {
    nextStatus = 'APPROVED';
  }

  rb.status = nextStatus;
  rb.approvalHistory.push({
    id: `rah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Approver',
    actorRole: actor?.role || 'MANAGER',
    actorRoleLabel: actor?.roleLabel || 'Approver',
    action: 'APPROVED',
    notes: notes || 'Disetujui.',
  });

  return res.json(rb);
});

app.patch('/api/reimbursements/:id/reject', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, reason } = req.body;
  const rb = reimbursements.find(r => r.id === id);

  if (!rb) return res.status(404).json({ error: 'Klaim tidak ditemukan' });

  if (actor?.role === 'STAFF') {
    return res.status(403).json({
      error: 'Akses ditolak: Pemohon tidak berhak menolak klaim.',
    });
  }

  rb.status = 'REJECTED';
  rb.rejectionReason = reason;
  rb.approvalHistory.push({
    id: `rah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Approver',
    actorRole: actor?.role || 'MANAGER',
    actorRoleLabel: actor?.roleLabel || 'Approver',
    action: 'REJECTED',
    notes: reason || 'Ditolak.',
  });

  return res.json(rb);
});

app.patch('/api/reimbursements/:id/pay', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, sourceBank, referenceNumber, notes } = req.body;
  const rb = reimbursements.find(r => r.id === id);

  if (!rb) return res.status(404).json({ error: 'Klaim tidak ditemukan' });

  if (actor?.role !== 'FINANCE' && actor?.role !== 'DIRECTOR') {
    return res.status(403).json({
      error: 'Akses ditolak: Pembayaran klaim reimbursement hanya dapat diproses oleh Finance.',
    });
  }

  const today = new Date().toISOString().split('T')[0];
  rb.status = 'PAID';
  rb.paymentDetails = {
    paidDate: today,
    paidBy: `${actor?.name || 'Finance'} (${actor?.roleLabel || 'Finance'})`,
    sourceBank,
    referenceNumber,
  };
  rb.approvalHistory.push({
    id: `rah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Finance',
    actorRole: actor?.role || 'FINANCE',
    actorRoleLabel: actor?.roleLabel || 'Finance',
    action: 'PAID',
    notes: notes || `Dibayar melalui ${sourceBank} (Ref: ${referenceNumber})`,
  });

  return res.json(rb);
});

// ========================
// SETTLEMENTS API
// ========================
app.get('/api/settlements', (req: Request, res: Response) => {
  const { companyId } = req.query;
  let result = settlements;
  if (companyId && companyId !== 'ALL') {
    result = result.filter(s => s.companyId === companyId);
  }
  return res.json(result);
});

app.post('/api/settlements', (req: Request, res: Response) => {
  const { advanceId, actualItems, notes, refundProofUrl, actor } = req.body;
  const targetAdv = advances.find(a => a.id === advanceId);

  if (!targetAdv) return res.status(404).json({ error: 'Kasbon tidak ditemukan' });

  const count = settlements.filter(s => s.companyId === targetAdv.companyId).length + 1;
  const code = `ST-${targetAdv.companyId}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
  const today = new Date().toISOString().split('T')[0];

  const processed = (actualItems || []).map((it: any, idx: number) => ({
    ...it,
    id: `stit-${Date.now()}-${idx}`,
    total: (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0),
  }));

  const totalActual = processed.reduce((acc: number, it: any) => acc + it.total, 0);
  const diff = totalActual - targetAdv.totalAmount;

  let varianceType = 'EXACT_MATCH';
  if (diff < 0) varianceType = 'REFUND_TO_COMPANY';
  else if (diff > 0) varianceType = 'REIMBURSE_TO_EMPLOYEE';

  const newSet = {
    id: `st-${Date.now()}`,
    code,
    advanceId: targetAdv.id,
    advanceCode: targetAdv.code,
    companyId: targetAdv.companyId,
    applicantId: targetAdv.applicantId,
    applicantName: targetAdv.applicantName,
    applicantDepartment: targetAdv.applicantDepartment,
    settlementDate: today,
    advanceAmount: targetAdv.totalAmount,
    actualItems: processed,
    totalActualAmount: totalActual,
    difference: diff,
    varianceType,
    refundProofUrl,
    status: 'PENDING_FINANCE',
    notes,
    approvalHistory: [
      {
        id: `sah-${Date.now()}`,
        timestamp: getTimestamp(),
        actorName: actor?.name || 'Staff',
        actorRole: actor?.role || 'STAFF',
        actorRoleLabel: actor?.roleLabel || 'Staff',
        action: 'SUBMITTED',
        notes: 'Pertanggungjawaban diserahkan ke Finance.',
      },
    ],
  };

  settlements.unshift(newSet);
  targetAdv.settlementId = newSet.id;

  return res.status(201).json(newSet);
});

app.patch('/api/settlements/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor, notes } = req.body;
  const targetSet = settlements.find(s => s.id === id);

  if (!targetSet) return res.status(404).json({ error: 'Settlement tidak ditemukan' });

  if (actor?.role !== 'FINANCE' && actor?.role !== 'DIRECTOR') {
    return res.status(403).json({
      error: 'Akses ditolak: Verifikasi LPJ dan penutupan kasbon lunas hanya berhak diproses oleh Finance.',
    });
  }

  targetSet.status = 'VERIFIED';
  targetSet.approvalHistory.push({
    id: `sah-${Date.now()}`,
    timestamp: getTimestamp(),
    actorName: actor?.name || 'Finance',
    actorRole: actor?.role || 'FINANCE',
    actorRoleLabel: actor?.roleLabel || 'Finance',
    action: 'SETTLED',
    notes: notes || 'Pertanggungjawaban terverifikasi dan ditutup.',
  });

  const adv = advances.find(a => a.id === targetSet.advanceId);
  if (adv) {
    adv.status = 'SETTLED';
    adv.approvalHistory.push({
      id: `ah-${Date.now()}`,
      timestamp: getTimestamp(),
      actorName: actor?.name || 'Finance',
      actorRole: actor?.role || 'FINANCE',
      actorRoleLabel: actor?.roleLabel || 'Finance',
      action: 'SETTLED',
      notes: `Kasbon ditutup lunas melalui LPJ ${targetSet.code}.`,
    });
  }

  return res.json(targetSet);
});

// System Status endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    companies: ['AMS', 'AMI'],
    advancesCount: advances.length,
    reimbursementsCount: reimbursements.length,
    settlementsCount: settlements.length,
  });
});

// ========================
// VITE / STATIC HANDLING
// ========================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const portArgIndex = process.argv.indexOf('--port');
  const portFromArg = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
  let PORT = portFromArg || Number(process.env.APP_PORT);
  
  // If no CLI port or APP_PORT, check PORT environment variable
  if (!PORT && process.env.PORT) {
    const envPort = Number(process.env.PORT);
    // In this container environment, 8080 is reserved for nginx reverse proxy.
    // The dev server must always bind to port 3000.
    if (envPort !== 8080) {
      PORT = envPort;
    }
  }

  // Default to port 3000
  PORT = PORT || 3000;

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server AMS & AMI berjalan pada port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[dev-server] Port ${PORT} sedang digunakan, mencoba port fallback 3000...`);
      if (PORT !== 3000) {
        app.listen(3000, '0.0.0.0', () => {
          console.log(`Server AMS & AMI berjalan pada fallback port 3000`);
        });
      }
    } else {
      console.error('[dev-server] Error server:', err);
    }
  });
}

startServer();
