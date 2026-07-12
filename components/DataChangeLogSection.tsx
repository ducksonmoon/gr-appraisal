'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { ScrollText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export type DataLogEntry = {
  id: string;
  actorEmail: string;
  action: string;
  entityId: string | null;
  summary: string | null;
  details: unknown;
  createdAt: string;
};

const ACTION_FA: Record<string, string> = {
  EVALUATION_BULK_CREATE: 'افزودن ارزیابی (یک یا چند رکورد)',
  EVALUATION_UPDATE: 'ویرایش ارزیابی',
  EVALUATION_DELETE: 'حذف ارزیابی',
  EVALUATIONS_RESET: 'بازگردانی داده نمونه',
  USER_CREATE: 'ایجاد کاربر',
  USER_UPDATE: 'ویرایش کاربر',
  USER_DELETE: 'حذف کاربر',
};

function actionLabel(action: string): string {
  return ACTION_FA[action] ?? action;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('fa-IR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

export default function DataChangeLogSection() {
  const [logs, setLogs] = useState<DataLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/data-logs', { credentials: 'include' });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'خطا در بارگذاری لاگ‌ها');
      }
      const data = (await res.json()) as { logs?: DataLogEntry[] };
      setLogs(data.logs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="panel-card mb-0 overflow-hidden">
      <div className="panel-card-header flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
            <ScrollText className="h-5 w-5 text-[var(--brand)]" />
            گزارش فعالیت و تغییرات
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
            آخرین {logs.length} رویداد ثبت‌شده در سامانه (ارزیابی‌ها، بازنشانی داده، مدیریت کاربران).
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="panel-btn-secondary shrink-0 px-3 py-2 text-xs sm:text-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          بروزرسانی فهرست
        </button>
      </div>

      <div className="panel-card-body space-y-3" aria-busy={loading && !logs.length}>
        {error && (
          <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </p>
        )}
        {loading && !logs.length ? (
          <div className="rounded-md border border-dashed border-stone-300/90 bg-stone-200/30 px-4 py-8 text-center" role="status">
            <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-stone-500 motion-reduce:animate-none" aria-hidden />
            <p className="text-sm font-medium text-stone-700">در حال بارگذاری گزارش…</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-md border border-stone-300/80 bg-stone-200/25 px-4 py-8 text-center text-sm text-stone-600">
            <ScrollText className="mx-auto mb-2 h-8 w-8 text-stone-400" aria-hidden />
            هنوز رویدادی در این سامانه ثبت نشده است. پس از ویرایش داده یا کاربران، ردیف‌ها اینجا نمایش داده می‌شوند.
          </div>
        ) : (
          <div className="panel-table-wrap max-h-[min(28rem,55vh)] overflow-y-auto">
            <table className="w-full text-sm" dir="rtl">
              <thead className="panel-thead sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2.5 text-right">زمان</th>
                  <th className="px-3 py-2.5 text-right">کاربر</th>
                  <th className="px-3 py-2.5 text-right">نوع اقدام</th>
                  <th className="px-3 py-2.5 text-right">شرح</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="panel-tbody">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr className="align-top">
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-stone-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-stone-800" dir="ltr">
                        {log.actorEmail}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-stone-800">{actionLabel(log.action)}</td>
                      <td
                        className="max-w-[14rem] truncate px-3 py-2.5 text-sm text-stone-700"
                        title={log.summary ?? ''}
                      >
                        {log.summary ?? '—'}
                      </td>
                      <td className="px-2 py-2">
                        {log.details != null && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((id) => (id === log.id ? null : log.id))
                            }
                            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-sm p-2 text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
                            aria-label={expandedId === log.id ? 'پنهان کردن جزئیات' : 'نمایش جزئیات'}
                            aria-expanded={expandedId === log.id}
                          >
                            {expandedId === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === log.id && log.details != null && (
                      <tr className="bg-stone-200/35">
                        <td colSpan={5} className="border-b border-stone-300/80 px-4 py-3">
                          <pre
                            className="max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-stone-700 dir-ltr text-left"
                            dir="ltr"
                          >
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
