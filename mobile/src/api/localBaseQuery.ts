/**
 * When using local DB, this handles API-shaped requests and runs local SQLite operations.
 */
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import {
  getSales,
  createSale,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getVouchers,
  generateVouchers,
  sellVouchers,
  getAllSettings,
} from '../localDb/operations';

const LOCAL_USER = {
  id: 1,
  name: 'Local User',
  role: 'attendant',
  permissions: 'all',
  id_number: null as string | null,
  phone: null as string | null,
  created_at: new Date().toISOString(),
};

export async function runLocalQuery(
  url: string,
  method: string,
  body?: unknown,
  params?: Record<string, string | number | undefined>
): Promise<{ data?: unknown; error?: { status: number; data?: { error?: string } } }> {
  try {
    // Sales
    if (url === 'sales') {
      if (method === 'GET') {
        const limit = params?.limit ? Number(params.limit) : 500;
        return { data: await getSales(limit) };
      }
      if (method === 'POST') return { data: await createSale((body as any) || {}) };
    }
    if (url.startsWith('sales/') && method === 'GET') {
      const id = parseInt(url.replace('sales/', ''), 10);
      const { sales } = await getSales(500);
      const sale = (sales as any[]).find((s) => s.id === id);
      if (!sale) return { error: { status: 404, data: { error: 'Sale not found' } } };
      return { data: { sale } };
    }

    // Expenses
    if (url === 'expenses') {
      if (method === 'GET') return { data: await getExpenses(params as any) };
      if (method === 'POST') return { data: await createExpense((body as any) || {}) };
    }
    if (url.startsWith('expenses/')) {
      const id = parseInt(url.replace('expenses/', ''), 10);
      if (method === 'PUT') return { data: await updateExpense(id, (body as any) || {}) };
      if (method === 'DELETE') return { data: await deleteExpense(id) };
    }

    // Assets
    if (url === 'assets') {
      if (method === 'GET') return { data: await getAssets() };
      if (method === 'POST') return { data: await createAsset((body as any) || {}) };
    }
    if (url.startsWith('assets/')) {
      const id = parseInt(url.replace('assets/', ''), 10);
      if (method === 'PUT') return { data: await updateAsset(id, (body as any) || {}) };
      if (method === 'DELETE') return { data: await deleteAsset(id) };
    }

    // Vouchers
    if (url === 'vouchers') {
      if (method === 'GET') return { data: await getVouchers() };
    }
    if (url === 'vouchers/batch' && method === 'POST') {
      const b = (body as any) || {};
      return { data: await generateVouchers({ count: b.count ?? 10, package_name: b.package_name, price: b.price, duration_minutes: b.duration_minutes }) };
    }
    if (url === 'vouchers/sell' && method === 'POST') {
      const b = (body as any) || {};
      return { data: await sellVouchers({ codes: b.codes }) };
    }

    // Settings
    if (url === 'settings' && method === 'GET') {
      return { data: await getAllSettings() };
    }

    // Auth (local: no real auth, single user)
    if (url === 'auth/first-run' && method === 'GET') {
      return { data: { firstRun: false } };
    }
    if (url === 'auth/users' && method === 'GET') {
      return { data: { users: [{ id: 1, name: 'Local User', role: 'attendant', active: true }] } };
    }
    if (url === 'auth/me' && method === 'GET') {
      return { data: { user: LOCAL_USER } };
    }
    if (url === 'auth/login' && method === 'POST') {
      return { data: { token: 'local', user: LOCAL_USER } };
    }
    if (url === 'auth/register' && method === 'POST') {
      const b = (body as { name?: string }) || {};
      return { data: { token: 'local', user: { ...LOCAL_USER, name: b.name || 'Local User' } } };
    }

    return { error: { status: 404, data: { error: 'Not found in local DB' } } };
  } catch (err: any) {
    const message = err?.message ?? (typeof err === 'string' ? err : 'Local DB error');
    return {
      error: {
        status: 500,
        data: { error: `Database: ${message}` },
      },
    };
  }
}
