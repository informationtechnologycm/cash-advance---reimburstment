import { UserProfile, CostAdvanceRequest, ReimbursementRequest, AdvanceSettlement, CompanyId } from '../types/finance';

const BASE_URL = '/api';

export async function apiLogin(email: string, password?: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gagal melakukan login' }));
    throw new Error(err.error || 'Autentikasi gagal');
  }

  return res.json();
}

export async function apiGetMe(token: string): Promise<{ user: UserProfile }> {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error('Sesi otentikasi tidak valid');
  }

  return res.json();
}

export async function apiGetUsers(): Promise<UserProfile[]> {
  const res = await fetch(`${BASE_URL}/auth/users`);
  if (!res.ok) throw new Error('Gagal memuat daftar pengguna');
  return res.json();
}

export async function apiGetAdvances(companyId?: 'ALL' | CompanyId): Promise<CostAdvanceRequest[]> {
  const url = companyId && companyId !== 'ALL' ? `${BASE_URL}/advances?companyId=${companyId}` : `${BASE_URL}/advances`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat kasbon');
  return res.json();
}

export async function apiCreateAdvance(payload: any): Promise<CostAdvanceRequest> {
  const res = await fetch(`${BASE_URL}/advances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal membuat kasbon');
  return res.json();
}

export async function apiApproveAdvance(id: string, actor: UserProfile, notes?: string): Promise<CostAdvanceRequest> {
  const res = await fetch(`${BASE_URL}/advances/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes }),
  });
  if (!res.ok) throw new Error('Gagal menyetujui kasbon');
  return res.json();
}

export async function apiRejectAdvance(id: string, actor: UserProfile, reason: string): Promise<CostAdvanceRequest> {
  const res = await fetch(`${BASE_URL}/advances/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, reason }),
  });
  if (!res.ok) throw new Error('Gagal menolak kasbon');
  return res.json();
}

export async function apiDisburseAdvance(
  id: string,
  payload: { actor: UserProfile; sourceBank: string; referenceNumber: string; notes?: string }
): Promise<CostAdvanceRequest> {
  const res = await fetch(`${BASE_URL}/advances/${id}/disburse`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal mencairkan kasbon');
  return res.json();
}

export async function apiGetReimbursements(companyId?: 'ALL' | CompanyId): Promise<ReimbursementRequest[]> {
  const url = companyId && companyId !== 'ALL' ? `${BASE_URL}/reimbursements?companyId=${companyId}` : `${BASE_URL}/reimbursements`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat reimbursement');
  return res.json();
}

export async function apiCreateReimbursement(payload: any): Promise<ReimbursementRequest> {
  const res = await fetch(`${BASE_URL}/reimbursements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal membuat reimbursement');
  return res.json();
}

export async function apiApproveReimbursement(id: string, actor: UserProfile, notes?: string): Promise<ReimbursementRequest> {
  const res = await fetch(`${BASE_URL}/reimbursements/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes }),
  });
  if (!res.ok) throw new Error('Gagal menyetujui reimbursement');
  return res.json();
}

export async function apiRejectReimbursement(id: string, actor: UserProfile, reason: string): Promise<ReimbursementRequest> {
  const res = await fetch(`${BASE_URL}/reimbursements/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, reason }),
  });
  if (!res.ok) throw new Error('Gagal menolak reimbursement');
  return res.json();
}

export async function apiPayReimbursement(
  id: string,
  payload: { actor: UserProfile; sourceBank: string; referenceNumber: string; notes?: string }
): Promise<ReimbursementRequest> {
  const res = await fetch(`${BASE_URL}/reimbursements/${id}/pay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal membayar reimbursement');
  return res.json();
}

export async function apiGetSettlements(companyId?: 'ALL' | CompanyId): Promise<AdvanceSettlement[]> {
  const url = companyId && companyId !== 'ALL' ? `${BASE_URL}/settlements?companyId=${companyId}` : `${BASE_URL}/settlements`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat settlements');
  return res.json();
}

export async function apiCreateSettlement(payload: any): Promise<AdvanceSettlement> {
  const res = await fetch(`${BASE_URL}/settlements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Gagal membuat settlement');
  return res.json();
}

export async function apiVerifySettlement(id: string, actor: UserProfile, notes?: string): Promise<AdvanceSettlement> {
  const res = await fetch(`${BASE_URL}/settlements/${id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actor, notes }),
  });
  if (!res.ok) throw new Error('Gagal memverifikasi settlement');
  return res.json();
}
