'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AuthUser } from '@/contexts/AuthContext';
import { isSuperAdmin, roleLabelFa, type AppRole } from '@/lib/roles';
import { Users, Plus, Trash2, Pencil, AlertCircle } from 'lucide-react';

type ListedUser = {
  id: string;
  email: string;
  role: AppRole;
  createdAt: string;
};

export default function UserManagementSection({ actor }: { actor: AuthUser }) {
  const superAdmin = isSuperAdmin(actor.role);
  const [users, setUsers] = useState<ListedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('VIEWER');
  const [creating, setCreating] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('VIEWER');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'خطا در بارگذاری کاربران');
      }
      const data = (await res.json()) as { users?: ListedUser[] };
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          role: superAdmin ? newRole : 'VIEWER',
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'ایجاد ناموفق');
      setNewEmail('');
      setNewPassword('');
      setNewRole('VIEWER');
      setMessage('کاربر جدید ایجاد شد.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (u: ListedUser) => {
    setEditId(u.id);
    setEditEmail(u.email);
    setEditPassword('');
    setEditRole(u.role);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const body: { email?: string; password?: string; role?: AppRole } = {
        email: editEmail.trim(),
      };
      if (editPassword.length > 0) body.password = editPassword;
      if (superAdmin) body.role = editRole;
      const res = await fetch(`/api/users/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'ذخیره ناموفق');
      setEditId(null);
      setMessage('کاربر بروزرسانی شد.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  const canModifyRow = (u: ListedUser) => {
    if (u.id === actor.id) return true;
    if (superAdmin) return true;
    return u.role === 'VIEWER';
  };

  const canDeleteRow = (u: ListedUser) => {
    if (u.id === actor.id) return false;
    if (superAdmin) return true;
    return u.role === 'VIEWER';
  };

  const handleDelete = async (u: ListedUser) => {
    if (u.id === actor.id) return;
    if (!window.confirm(`حذف کاربر «${u.email}»؟`)) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { error?: string }).error || 'حذف ناموفق');
      setMessage('کاربر حذف شد.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا');
    }
  };

  return (
    <section className="panel-card mb-0 overflow-hidden">
      <div className="panel-card-header">
        <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
          <Users className="h-5 w-5 text-[var(--brand)]" />
          مدیریت کاربران سامانه
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
        {superAdmin
          ? 'ایجاد کاربر با هر نقش (مدیر ارشد، مدیر عملیات، مشاهده‌گر).'
          : 'فقط می‌توانید کاربران «مشاهده‌گر» بسازید یا ویرایش/حذف کنید.'}
        </p>
      </div>

      <div className="panel-card-body space-y-5" aria-busy={loading}>
      {loading && (
        <p className="text-sm text-stone-600" role="status">
          در حال بارگذاری فهرست کاربران…
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</div>
      )}

      <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 rounded-md border border-stone-300/80 bg-stone-200/35 p-4">
        <p className="text-sm font-semibold text-stone-800">ثبت کاربر جدید</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            required
            placeholder="ایمیل"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="panel-input"
            dir="ltr"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="رمز (حداقل ۶ کاراکتر)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="panel-input"
          />
        </div>
        {superAdmin && (
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">نقش</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AppRole)}
              className="panel-select w-full sm:w-64"
            >
              <option value="VIEWER">{roleLabelFa('VIEWER')}</option>
              <option value="MANAGER">{roleLabelFa('MANAGER')}</option>
              <option value="ADMIN">{roleLabelFa('ADMIN')}</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={creating}
          className="panel-btn-primary"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'در حال ایجاد...' : 'ایجاد کاربر'}
        </button>
      </form>

      <div className="panel-table-wrap">
        <table className="w-full text-sm" dir="rtl">
          <thead className="panel-thead">
            <tr>
              <th className="px-3 py-2.5 text-right">ایمیل</th>
              <th className="px-3 py-2.5 text-right">نقش</th>
              <th className="w-28 px-3 py-2.5 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="panel-tbody">
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-sm text-stone-600">
                  هنوز کاربری ثبت نشده است. از فرم بالا می‌توانید اولین کاربر را اضافه کنید.
                </td>
              </tr>
            ) : null}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2.5 font-mono text-xs sm:text-sm text-stone-800" dir="ltr">
                  {u.email}
                </td>
                <td className="px-3 py-2.5 text-stone-700">{roleLabelFa(u.role)}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-center gap-1">
                    {canModifyRow(u) ? (
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="rounded-sm p-2 text-indigo-800 hover:bg-indigo-100 min-h-10 min-w-10 inline-flex items-center justify-center"
                        title="ویرایش"
                        aria-label={`ویرایش کاربر ${u.email}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="px-2 text-xs text-stone-500">—</span>
                    )}
                    {canDeleteRow(u) && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(u)}
                        className="rounded-sm p-2 text-red-800 hover:bg-red-50 min-h-10 min-w-10 inline-flex items-center justify-center"
                        title="حذف"
                        aria-label={`حذف کاربر ${u.email}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {editId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[1px]"
          onClick={() => !saving && setEditId(null)}
        >
          <div
            className="panel-card w-full max-w-md border-stone-300/90 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 border-b border-stone-300/80 pb-3 text-lg font-bold text-stone-900">ویرایش کاربر</h3>
            <form onSubmit={(e) => void handleSaveEdit(e)} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">ایمیل</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="panel-input"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-stone-700">
                  رمز جدید (خالی بگذارید تا تغییر نکند)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="panel-input"
                />
              </div>
              {superAdmin && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-stone-700">نقش</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as AppRole)}
                    className="panel-select w-full"
                  >
                    <option value="VIEWER">{roleLabelFa('VIEWER')}</option>
                    <option value="MANAGER">{roleLabelFa('MANAGER')}</option>
                    <option value="ADMIN">{roleLabelFa('ADMIN')}</option>
                  </select>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="panel-btn-secondary px-4 py-2"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="panel-btn-primary px-4 py-2 disabled:opacity-50"
                >
                  {saving ? '...' : 'ذخیره'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
