'use client';

import React, { Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import UserManagementSection from '@/components/UserManagementSection';
import DataChangeLogSection from '@/components/DataChangeLogSection';
import { isDataEditor, isSuperAdmin } from '@/lib/roles';
import type { ActivityFieldKey, Evaluation, YearlyActivity } from '@/types';
import {
  ACTIVITY_LABELS,
  emptyYearlyActivity,
  isValidNationalId,
  normalizeNationalId,
} from '@/lib/activities';
import { normLabel } from '@/lib/normalize';
import { parseExcelRowsToEvaluations } from '@/lib/excelParser';
import AppShell from '@/components/AppShell';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Upload,
  RotateCcw,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Download,
  CheckSquare,
  Square,
  Info,
  ChevronDown,
  ChevronUp,
  LayoutList,
  BookOpen,
  X,
  Users,
  ScrollText,
} from 'lucide-react';

const FACULTY_OPTIONS = [
  'دانشکده علوم',
  'دانشکده مهندسی کامپیوتر',
  'دانشکده مهندسی برق',
  'دانشکده ریاضی',
  'دانشکده فیزیک',
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 25, 50] as const;
type SortKey = 'facultyName' | 'faculty' | 'educationalScore' | 'researchScore' | 'executiveScore' | 'totalScore';

const DEFAULT_START_YEAR = 1400;
const DEFAULT_NUM_YEARS = 5;

function defaultActivities(): YearlyActivity[] {
  return Array.from({ length: DEFAULT_NUM_YEARS }, (_, i) =>
    emptyYearlyActivity(DEFAULT_START_YEAR + i)
  );
}

function EvaluationForm({
  initial,
  facultyOptions,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initial?: Partial<Evaluation>;
  facultyOptions: string[];
  onSubmit: (e: Omit<Evaluation, 'id'>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [facultyName, setFacultyName] = useState(initial?.facultyName ?? '');
  const [nationalId, setNationalId] = useState(initial?.nationalId ?? '');
  const [faculty, setFaculty] = useState(initial?.faculty ?? facultyOptions[0]);
  const [customFaculty, setCustomFaculty] = useState(
    facultyOptions.includes(initial?.faculty ?? '') ? '' : (initial?.faculty ?? '')
  );
  const [educationalScore, setEducationalScore] = useState(
    String(initial?.educationalScore ?? 0)
  );
  const [researchScore, setResearchScore] = useState(
    String(initial?.researchScore ?? 0)
  );
  const [executiveScore, setExecutiveScore] = useState(
    String(initial?.executiveScore ?? 0)
  );
  const [activities, setActivities] = useState<YearlyActivity[]>(() => {
    if (initial?.activities && initial.activities.length > 0) {
      const sorted = [...initial.activities].sort((a, b) => a.year - b.year);
      return sorted.map((a) => ({
        ...emptyYearlyActivity(a.year),
        ...a,
      }));
    }
    return defaultActivities();
  });
  const [showActivities, setShowActivities] = useState(!!initial?.activities?.length);
  const [formError, setFormError] = useState<string | null>(null);

  const addYear = useCallback(() => {
    const maxYear = activities.length ? Math.max(...activities.map((a) => a.year)) : DEFAULT_START_YEAR - 1;
    setActivities((prev) => [...prev, emptyYearlyActivity(maxYear + 1)]);
  }, [activities]);

  const removeYear = useCallback((index: number) => {
    if (activities.length <= 1) return;
    setActivities(activities.filter((_, i) => i !== index));
  }, [activities]);

  const ed = Number(educationalScore) || 0;
  const re = Number(researchScore) || 0;
  const ex = Number(executiveScore) || 0;
  const total = ed + re + ex;

  const setActivityValue = useCallback((yearIndex: number, key: ActivityFieldKey, value: number) => {
    setActivities((prev) =>
      prev.map((a, i) => (i === yearIndex ? { ...a, [key]: value } : a))
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const facultyNameTrim = facultyName.trim();
    if (!facultyNameTrim) return;
    const nid = normalizeNationalId(nationalId);
    if (!isValidNationalId(nid)) {
      setFormError('کد ملی معتبر (۸ تا ۱۰ رقم) الزامی است.');
      return;
    }
    const fac = customFaculty.trim() || faculty;
    const hasAnyActivity = activities.some((a) =>
      ACTIVITY_LABELS.some(({ key }) => (a[key] ?? 0) > 0)
    );
    onSubmit({
      nationalId: nid,
      facultyName: facultyNameTrim,
      faculty: fac,
      educationalScore: ed,
      researchScore: re,
      executiveScore: ex,
      totalScore: total,
      activities: hasAnyActivity ? activities : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {formError}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          نام عضو هیئت علمی *
        </label>
        <input
          type="text"
          value={facultyName}
          onChange={(e) => setFacultyName(e.target.value)}
          className="panel-input"
          required
          dir="rtl"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          کد ملی *
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          className="panel-input tabular-nums"
          required
          dir="ltr"
          placeholder="مثلاً 0012345678"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          دانشکده
        </label>
        <select
          value={faculty}
          onChange={(e) => setFaculty(e.target.value)}
          className="panel-select w-full"
        >
          {facultyOptions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="یا نام دانشکده را وارد کنید"
          value={customFaculty}
          onChange={(e) => setCustomFaculty(e.target.value)}
          className="panel-input mt-2 placeholder:text-stone-500"
          dir="rtl"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            امتیاز آموزشی
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={educationalScore}
            onChange={(e) => setEducationalScore(e.target.value)}
            className="panel-input tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            امتیاز پژوهشی
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={researchScore}
            onChange={(e) => setResearchScore(e.target.value)}
            className="panel-input tabular-nums"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            امتیاز اجرایی
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={executiveScore}
            onChange={(e) => setExecutiveScore(e.target.value)}
            className="panel-input tabular-nums"
          />
        </div>
      </div>
      <p className="text-sm text-stone-600">
        جمع کل: <strong className="tabular-nums text-stone-900">{total}</strong>
        {' '}(مجموع سه امتیاز واردشده)
      </p>

      <div className="border-t border-stone-300/80 pt-4">
        <button
          type="button"
          onClick={() => setShowActivities((v) => !v)}
          className="text-sm font-medium text-indigo-900 hover:underline"
        >
          {showActivities ? 'پنهان کردن' : 'نمایش'} فعالیت‌ها به تفکیک سال
        </button>
        {showActivities && (
          <div className="mt-3 overflow-x-auto">
            <p className="mb-2 text-xs text-stone-600">
              امتیازها از فیلدهای بالا خوانده می‌شوند و از روی فعالیت‌ها محاسبه نمی‌شوند. تعداد سال‌ها دلخواه است.
            </p>
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={addYear}
                className="inline-flex items-center gap-1 text-sm font-medium text-indigo-900 hover:underline"
              >
                <Plus className="w-4 h-4" />
                افزودن سال
              </button>
            </div>
            <table className="w-full rounded-md border border-stone-300/80 text-sm" dir="rtl">
              <thead className="bg-stone-200/80">
                <tr>
                  <th className="w-14 px-2 py-1.5 text-right font-medium text-stone-800">سال</th>
                  {ACTIVITY_LABELS.map(({ label }) => (
                    <th key={label} className="whitespace-nowrap px-2 py-1.5 text-right font-medium text-stone-800">
                      {label}
                    </th>
                  ))}
                  <th className="w-12 px-2 py-1.5 text-center font-medium text-stone-800">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/90 bg-stone-50">
                {activities.map((a, yi) => (
                  <tr key={a.year}>
                    <td className="px-2 py-1 font-medium">{a.year}</td>
                    {ACTIVITY_LABELS.map(({ key }) => (
                      <td key={key} className="px-1 py-0.5">
                        <input
                          type="number"
                          min={0}
                          value={a[key] ?? 0}
                          onChange={(e) => setActivityValue(yi, key, Number(e.target.value) || 0)}
                          className="w-12 rounded-sm border border-stone-300 bg-stone-100 px-1 py-0.5 text-center text-stone-900 tabular-nums outline-none focus:border-indigo-800 focus:bg-white"
                        />
                      </td>
                    ))}
                    <td className="px-1 py-0.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeYear(yi)}
                        disabled={activities.length <= 1}
                        className="rounded p-1 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                        title="حذف این سال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="panel-btn-secondary px-4 py-2"
        >
          انصراف
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="panel-btn-primary px-4 py-2 disabled:opacity-50"
        >
          {isSubmitting ? 'در حال ذخیره...' : 'ذخیره'}
        </button>
      </div>
    </form>
  );
}

type PanelNavId = 'records' | 'help' | 'import' | 'users' | 'logs' | 'maintenance';

const PANEL_TABS: PanelNavId[] = ['records', 'help', 'import', 'users', 'logs', 'maintenance'];

function parsePanelTab(raw: string | null): PanelNavId {
  if (raw && PANEL_TABS.includes(raw as PanelNavId)) return raw as PanelNavId;
  return 'records';
}

function ScoreHintPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();
  return (
    <div className="panel-card overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-right text-sm font-semibold text-stone-800 transition hover:bg-stone-200/40 motion-reduce:transition-none"
      >
        <span className="flex items-center gap-2">
          <Info className="h-5 w-5 shrink-0 text-indigo-900" />
          راهنمای محاسبهٔ امتیازها و منبع داده‌ها
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-stone-500" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500" />
        )}
      </button>
      {open && (
        <div
          id={contentId}
          className="space-y-3 border-t border-stone-300/80 bg-stone-100/50 px-5 py-4 text-sm leading-relaxed text-stone-700"
          dir="rtl"
        >
          <p className="font-semibold text-stone-900">هنگام استفاده از فایل اکسل:</p>
          <ul className="list-inside list-disc space-y-1.5 pr-1 text-stone-600">
            <li>
              پس از نام، ستون <strong>کد ملی</strong> الزامی است تا افراد هم‌نام متمایز شوند.
            </li>
            <li>
              برای هر سال ۱۱ ستون فعالیت: کتاب، تالیف، ترجمه، پژوهشگر برتر، دفاع ارشد، طرح خارج، طرح داخل، ISC، ISI، مقاله کنفرانس ملی، مقاله کنفرانس بین‌المللی.
            </li>
            <li>
              در انتهای ردیف سه ستون <strong>امتیاز آموزشی، پژوهشی و اجرایی</strong> از فایل خوانده می‌شوند (نه محاسبه مصنوعی).
            </li>
            <li>
              <strong>جمع کل</strong> = آموزشی + پژوهشی + اجرایی.
            </li>
          </ul>
          <p className="font-semibold text-stone-900">هنگام ثبت دستی رکورد:</p>
          <p className="text-stone-600">
            کد ملی، نام و سه امتیاز را وارد می‌کنید؛ جمع کل به‌صورت خودکار محاسبه می‌شود. فعالیت‌های سالانه اختیاری‌اند.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PanelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--text-muted)]" dir="rtl">
          بارگذاری پنل…
        </div>
      }
    >
      <PanelPageInner />
    </Suspense>
  );
}

function PanelPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const canEditData = user ? isDataEditor(user.role) : false;
  const isAdmin = user ? isSuperAdmin(user.role) : false;
  const {
    evaluations,
    addFromExcelRows,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    resetToSample,
  } = useData();
  const [faculty, setFaculty] = useState(FACULTY_OPTIONS[0]);
  const [customFaculty, setCustomFaculty] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [duplicateInitial, setDuplicateInitial] = useState<Partial<Evaluation> | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('totalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [bulkFaculty, setBulkFaculty] = useState(FACULTY_OPTIONS[0]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [panelNav, setPanelNavState] = useState<PanelNavId>(() =>
    parsePanelTab(searchParams.get('tab'))
  );
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{
    rows: (string | number)[][];
    parsed: Evaluation[];
    fileName: string;
  } | null>(null);
  const [confirmState, setConfirmState] = useState<
    | { type: 'delete'; id: string; name: string }
    | { type: 'bulkDelete' }
    | { type: 'bulkFaculty' }
    | { type: 'reset' }
    | null
  >(null);
  const [resetTyped, setResetTyped] = useState('');
  const [confirmBusy, setConfirmBusy] = useState(false);

  const setPanelNav = useCallback(
    (id: PanelNavId) => {
      setPanelNavState(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', id);
      router.replace(`/panel?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const fromUrl = parsePanelTab(searchParams.get('tab'));
    setPanelNavState(fromUrl);
  }, [searchParams]);

  const panelNavItems = useMemo(() => {
    const items: {
      id: PanelNavId;
      label: string;
      description: string;
      icon: React.ComponentType<{ className?: string }>;
      danger?: boolean;
    }[] = [
      {
        id: 'records',
        label: 'فهرست ارزیابی‌ها',
        description: 'جستجو، ویرایش و خروجی',
        icon: LayoutList,
      },
      {
        id: 'help',
        label: 'راهنما و ضوابط',
        description: 'قالب اکسل و امتیازها',
        icon: BookOpen,
      },
    ];
    if (canEditData) {
      items.push(
        {
          id: 'import',
          label: 'بارگذاری اکسل',
          description: 'پیش‌نمایش و ورود گروهی',
          icon: FileSpreadsheet,
        },
        {
          id: 'users',
          label: 'کاربران',
          description: 'مدیریت دسترسی',
          icon: Users,
        },
        {
          id: 'logs',
          label: 'گزارش تغییرات',
          description: 'رد پای عملیات',
          icon: ScrollText,
        }
      );
      if (isAdmin) {
        items.push({
          id: 'maintenance',
          label: 'بازنشانی داده',
          description: 'عملیات حساس',
          icon: RotateCcw,
          danger: true,
        });
      }
    }
    return items;
  }, [canEditData, isAdmin]);

  useEffect(() => {
    const editorOnly: PanelNavId[] = ['import', 'users', 'logs', 'maintenance'];
    if (!canEditData && editorOnly.includes(panelNav)) {
      setPanelNav('records');
    }
    if (!isAdmin && panelNav === 'maintenance') {
      setPanelNav('records');
    }
  }, [canEditData, isAdmin, panelNav, setPanelNav]);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const modalHeadingRef = useRef<HTMLHeadingElement>(null);
  const modalTitleId = useId();
  const prevPanelNav = useRef<PanelNavId | null>(null);

  const activeSectionLabel = useMemo(
    () => panelNavItems.find((i) => i.id === panelNav)?.label ?? 'پنل',
    [panelNavItems, panelNav]
  );

  const closeModal = useCallback(() => {
    if (formSubmitting) return;
    setModalMode(null);
    setEditingId(null);
    setDuplicateInitial(null);
  }, [formSubmitting]);

  useEffect(() => {
    if (prevPanelNav.current !== null && prevPanelNav.current !== panelNav) {
      const el = workspaceRef.current;
      if (el) {
        el.scrollTop = 0;
        el.focus();
      }
    }
    prevPanelNav.current = panelNav;
  }, [panelNav]);

  useEffect(() => {
    if (!modalMode) return;
    const frame = requestAnimationFrame(() => {
      modalHeadingRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
    };
  }, [modalMode, closeModal]);

  const filtered = evaluations.filter((e) => {
    if (!searchTerm) return true;
    const q = normLabel(searchTerm).toLowerCase();
    return (
      normLabel(e.facultyName).toLowerCase().includes(q) ||
      normLabel(e.faculty).toLowerCase().includes(q) ||
      (e.nationalId ?? '').includes(searchTerm.trim())
    );
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    let aVal: string | number = a[sortBy] ?? '';
    let bVal: string | number = b[sortBy] ?? '';
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const cmp = aVal.localeCompare(bVal, 'fa');
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const cmp = (aVal as number) - (bVal as number);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = sortedFiltered.slice(start, start + itemsPerPage);

  const toggleSort = useCallback((key: SortKey) => {
    setSortBy(key);
    setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  }, []);

  const toggleSelectAll = useCallback(() => {
    const pageIds = new Set(pageItems.map((e) => e.id).filter(Boolean) as string[]);
    setSelectedIds((prev) => {
      const allSelected = pageIds.size > 0 && [...pageIds].every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pageItems]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectedOnPage = pageItems.filter((e) => e.id && selectedIds.has(e.id));
  const allSelectedOnPage = pageItems.length > 0 && selectedOnPage.length === pageItems.length;

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setStatus('loading');
      setMessage('');
      setImportPreview(null);
      try {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        }) as (string | number)[][];
        const facultyName = customFaculty.trim() || faculty;
        const parsed = parseExcelRowsToEvaluations(rows, facultyName, 1);
        setImportPreview({ rows, parsed, fileName: file.name });
        if (parsed.length > 0) {
          setStatus('success');
          setMessage(
            `${parsed.length} رکورد آمادهٔ ورود است. پیش‌نمایش را بررسی و تأیید کنید.`
          );
        } else {
          setStatus('error');
          setMessage('هیچ رکورد معتبری در فایل یافت نشد.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'خطا در خواندن فایل اکسل');
      }
      e.target.value = '';
    },
    [faculty, customFaculty]
  );

  const confirmImport = useCallback(async () => {
    if (!importPreview?.parsed.length) return;
    setStatus('loading');
    try {
      const facultyName = customFaculty.trim() || faculty;
      const added = await addFromExcelRows(importPreview.rows, facultyName);
      setImportPreview(null);
      setStatus('success');
      setMessage(`${added} رکورد از فایل اضافه شد.`);
      setPanelNav('records');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  }, [importPreview, addFromExcelRows, faculty, customFaculty, setPanelNav]);

  const handleReset = useCallback(() => {
    setConfirmState({ type: 'reset' });
    setResetTyped('');
  }, []);

  const handleAddSubmit = useCallback(
    async (e: Omit<Evaluation, 'id'>) => {
      setFormSubmitting(true);
      try {
        await addEvaluation(e);
        setModalMode(null);
        setDuplicateInitial(null);
        setMessage('رکورد اضافه شد.');
        setStatus('success');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'خطا در افزودن');
        setStatus('error');
      } finally {
        setFormSubmitting(false);
      }
    },
    [addEvaluation]
  );

  const handleEditSubmit = useCallback(
    async (e: Omit<Evaluation, 'id'>) => {
      if (!editingId) return;
      setFormSubmitting(true);
      try {
        await updateEvaluation(editingId, e);
        setModalMode(null);
        setEditingId(null);
        setMessage('رکورد بروزرسانی شد.');
        setStatus('success');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'خطا در بروزرسانی');
        setStatus('error');
      } finally {
        setFormSubmitting(false);
      }
    },
    [updateEvaluation, editingId]
  );

  const handleDelete = useCallback((id: string, name: string) => {
    setConfirmState({ type: 'delete', id, name });
  }, []);

  const openEdit = useCallback((ev: Evaluation) => {
    setEditingId(ev.id ?? null);
    setModalMode('edit');
  }, []);

  const openDuplicate = useCallback((ev: Evaluation) => {
    setEditingId(null);
    setModalMode('add');
    setDuplicateInitial({
      nationalId: '',
      facultyName: ev.facultyName + ' (کپی)',
      faculty: ev.faculty,
      educationalScore: ev.educationalScore,
      researchScore: ev.researchScore,
      executiveScore: ev.executiveScore,
      totalScore: ev.totalScore,
      activities: ev.activities,
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmState({ type: 'bulkDelete' });
  }, [selectedIds]);

  const handleBulkFacultyClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    setConfirmState({ type: 'bulkFaculty' });
  }, [selectedIds]);

  const runConfirm = useCallback(async () => {
    if (!confirmState) return;
    setConfirmBusy(true);
    try {
      if (confirmState.type === 'delete') {
        await deleteEvaluation(confirmState.id);
        setMessage(`«${confirmState.name}» حذف شد.`);
        setStatus('success');
      } else if (confirmState.type === 'bulkDelete') {
        const ids = [...selectedIds];
        for (const id of ids) await deleteEvaluation(id);
        setSelectedIds(new Set());
        setMessage(`${ids.length} رکورد حذف شد.`);
        setStatus('success');
      } else if (confirmState.type === 'bulkFaculty') {
        const ids = [...selectedIds];
        for (const id of ids) await updateEvaluation(id, { faculty: bulkFaculty });
        setSelectedIds(new Set());
        setMessage(`دانشکده ${ids.length} رکورد به «${bulkFaculty}» تغییر کرد.`);
        setStatus('success');
      } else if (confirmState.type === 'reset') {
        await resetToSample();
        setMessage('داده‌ها به حالت پیش‌فرض بازگردانده شد.');
        setStatus('success');
      }
      setConfirmState(null);
      setResetTyped('');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'خطا در انجام عملیات');
      setStatus('error');
    } finally {
      setConfirmBusy(false);
    }
  }, [
    confirmState,
    deleteEvaluation,
    selectedIds,
    updateEvaluation,
    bulkFaculty,
    resetToSample,
  ]);
  const handleExportCsv = useCallback(() => {
    const headers = [
      'کد ملی',
      'نام',
      'دانشکده',
      'امتیاز آموزشی',
      'امتیاز پژوهشی',
      'امتیاز اجرایی',
      'جمع کل',
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const rows = sortedFiltered.map((e) =>
      [
        e.nationalId,
        e.facultyName,
        e.faculty,
        e.educationalScore,
        e.researchScore,
        e.executiveScore,
        e.totalScore,
      ]
        .map(escape)
        .join(',')
    );
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('فایل CSV دانلود شد.');
    setStatus('success');
  }, [sortedFiltered]);

  const handleExportExcel = useCallback(async () => {
    const XLSX = await import('xlsx');
    const summaryRows = sortedFiltered.map((e) => ({
      'کد ملی': e.nationalId,
      نام: e.facultyName,
      دانشکده: e.faculty,
      'امتیاز آموزشی': e.educationalScore,
      'امتیاز پژوهشی': e.researchScore,
      'امتیاز اجرایی': e.executiveScore,
      'جمع کل': e.totalScore,
    }));
    const activityRows: Record<string, string | number>[] = [];
    for (const e of sortedFiltered) {
      for (const a of e.activities ?? []) {
        const row: Record<string, string | number> = {
          'کد ملی': e.nationalId,
          نام: e.facultyName,
          دانشکده: e.faculty,
          سال: a.year,
        };
        for (const { key, label } of ACTIVITY_LABELS) {
          row[label] = a[key] ?? 0;
        }
        activityRows.push(row);
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'ارزیابی‌ها');
    if (activityRows.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(activityRows), 'فعالیت‌ها');
    }
    XLSX.writeFile(wb, `evaluations-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setMessage('فایل اکسل دانلود شد.');
    setStatus('success');
  }, [sortedFiltered]);

  return (
    <AppShell pageTitle={canEditData ? 'مدیریت داده' : 'مشاهده داده'}>
    <div className="panel-app !h-auto min-h-0 flex-1" dir="rtl">
      <div className="border-b border-[var(--border)] bg-[var(--surface-card)] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-xl font-bold tracking-tight text-[var(--brand)] sm:text-2xl">
            {canEditData ? 'مدیریت دادهٔ ارزیابی' : 'مشاهدهٔ دادهٔ ارزیابی'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
            {canEditData
              ? 'ثبت، ویرایش، بارگذاری و خروجی پرونده‌های ارزیابی اعضای هیئت علمی.'
              : 'در این نقش فقط امکان مشاهدهٔ فهرست و جزئیات رکوردها وجود دارد.'}
          </p>
        </div>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div className="shrink-0 space-y-3 sm:space-y-4">
          {!canEditData && (
            <div
              role="status"
              className="rounded-sm border-r-4 border-amber-500 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm"
            >
              <span className="font-semibold">حالت فقط‌خواندنی.</span>{' '}
              افزودن، ویرایش، حذف یا بازگردانی داده برای نقش شما فعال نیست.
            </div>
          )}

          {(status === 'success' || status === 'error') && message && (
            <div
              role="alert"
              className={`relative flex items-start gap-3 rounded-sm border py-3 ps-4 pe-11 text-sm shadow-sm ${
                status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              {status === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span className="min-w-0 flex-1">{message}</span>
              <button
                type="button"
                className="absolute top-2.5 end-2 rounded-md p-1.5 text-current opacity-70 transition hover:bg-black/5 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700/40"
                onClick={() => {
                  setMessage('');
                  setStatus('idle');
                }}
                aria-label="بستن پیام"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col gap-6 sm:mt-6 lg:mt-8 lg:flex-row lg:gap-8">
          <nav
            className="panel-nav flex shrink-0 flex-row gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:w-56 lg:flex-col lg:gap-2 lg:self-start lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
            aria-label="بخش‌های پنل"
          >
            {panelNavItems.map((item) => {
              const Icon = item.icon;
              const active = panelNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setPanelNav(item.id)}
                  className={[
                    'flex min-w-[11rem] shrink-0 flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-right motion-safe:transition lg:min-w-0 max-lg:min-h-12 max-lg:justify-center',
                    active
                      ? item.danger
                        ? 'border-amber-500/70 bg-amber-200/90 text-amber-950 shadow-sm'
                        : 'border-[var(--brand)] bg-[var(--brand)] text-white shadow-sm'
                      : item.danger
                        ? 'border-amber-200/80 bg-amber-50/50 text-amber-950 hover:bg-amber-100/70'
                        : 'border-[var(--border)] bg-[var(--surface-card)] text-[var(--text)] hover:bg-[var(--surface-raised)]',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={
                        'h-5 w-5 shrink-0 ' +
                        (active
                          ? item.danger
                            ? 'text-amber-900'
                            : 'text-white'
                          : item.danger
                            ? 'text-amber-700'
                            : 'text-stone-500')
                      }
                    />
                    <span className="text-sm font-semibold leading-tight">{item.label}</span>
                  </span>
                  <span
                    className={
                      'hidden pr-7 text-[11px] font-normal leading-snug lg:block ' +
                      (active
                        ? item.danger
                          ? 'text-amber-900/85'
                          : 'text-white/80'
                        : 'text-[var(--text-muted)]')
                    }
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </nav>

          <div
            ref={workspaceRef}
            id="panel-workspace"
            tabIndex={-1}
            role="region"
            aria-label={activeSectionLabel}
            className="panel-workspace min-w-0 space-y-6 scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600/35 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-200 sm:space-y-8"
          >
            {panelNav === 'records' && (
              <>
        {/* فهرست ارزیابی‌ها */}
        <section className="panel-card overflow-hidden">
          <div className="panel-card-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900">فهرست ارزیابی‌ها</h2>
              <p className="mt-0.5 text-xs text-stone-500">
                مجموع <span className="font-semibold tabular-nums text-stone-700">{evaluations.length}</span> رکورد
                در پایگاه داده
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                <input
                  type="search"
                  placeholder="جستجو در نام یا دانشکده..."
                  aria-label="جستجو در نام یا دانشکده"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="panel-input pr-10"
                  dir="rtl"
                  autoComplete="off"
                />
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="panel-select w-auto min-w-[7.5rem]"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} در صفحه
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportCsv}
                className="panel-btn-secondary"
                title="دانلود CSV"
              >
                <Download className="h-4 w-4 text-stone-600" />
                خروجی CSV ({sortedFiltered.length})
              </button>
              <button
                type="button"
                onClick={() => void handleExportExcel()}
                className="panel-btn-secondary"
                title="دانلود اکسل فیلترشده"
              >
                <FileSpreadsheet className="h-4 w-4 text-stone-600" />
                خروجی اکسل ({sortedFiltered.length})
              </button>
              {canEditData && (
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateInitial(null);
                    setModalMode('add');
                  }}
                  className="panel-btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  افزودن رکورد
                </button>
              )}
            </div>
          </div>

          {canEditData && selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-b border-stone-300/80 bg-stone-200/50 px-5 py-3.5 sm:px-6">
              <span className="text-sm font-semibold text-stone-800">
                {selectedIds.size} مورد انتخاب شده
              </span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkSubmitting}
                className="panel-btn-danger disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف گروهی
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={bulkFaculty}
                  onChange={(e) => setBulkFaculty(e.target.value)}
                  className="panel-select py-1.5 text-sm"
                >
                  {FACULTY_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleBulkFacultyClick}
                  disabled={bulkSubmitting}
                  className="rounded-sm border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-200/50 disabled:opacity-50"
                >
                  تغییر دانشکده
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-sm font-medium text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
              >
                لغو انتخاب
              </button>
            </div>
          )}

          <div className="panel-table-wrap">
            <table className="min-w-[700px] w-full text-sm" dir="rtl">
              <thead className="panel-thead">
                <tr>
                  {canEditData && (
                    <th className="w-10 shrink-0 px-2 py-2.5 align-middle">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="inline-flex rounded-sm p-1 text-stone-600 hover:bg-stone-300/50 hover:text-indigo-900"
                        title={allSelectedOnPage ? 'لغو انتخاب همه' : 'انتخاب همه این صفحه'}
                      >
                        {allSelectedOnPage ? (
                          <CheckSquare className="h-4 w-4 text-indigo-700" />
                        ) : (
                          <Square className="h-4 w-4 text-stone-500" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="min-w-[120px] whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('facultyName')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      نام
                      {sortBy === 'facultyName' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="min-w-[100px] whitespace-nowrap px-3 py-2.5 text-right font-medium text-stone-800">
                    کد ملی
                  </th>
                  <th className="min-w-[100px] whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('faculty')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      دانشکده
                      {sortBy === 'faculty' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="w-16 whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('educationalScore')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      آموزشی
                      {sortBy === 'educationalScore' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="w-16 whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('researchScore')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      پژوهشی
                      {sortBy === 'researchScore' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="w-16 whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('executiveScore')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      اجرایی
                      {sortBy === 'executiveScore' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="w-16 whitespace-nowrap px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => toggleSort('totalScore')}
                      className="inline-flex items-center justify-end gap-1 font-medium text-stone-800 hover:text-indigo-900"
                    >
                      جمع
                      {sortBy === 'totalScore' ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3 shrink-0 text-indigo-700" /> : <ArrowDown className="h-3 w-3 shrink-0 text-indigo-700" />) : <ArrowUpDown className="h-3 w-3 shrink-0 text-stone-500" />}
                    </button>
                  </th>
                  <th className="w-28 shrink-0 px-3 py-2.5 text-center font-medium text-stone-800">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="panel-tbody">
                {pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEditData ? 9 : 8}
                      className="px-3 py-12 text-center text-sm text-stone-500"
                    >
                      {evaluations.length === 0
                        ? 'هنوز رکوردی وجود ندارد. افزودن رکورد یا آپلود اکسل.'
                        : 'نتیجه‌ای برای جستجو یافت نشد.'}
                    </td>
                  </tr>
                ) : (
                  pageItems.map((ev) => (
                    <React.Fragment key={ev.id}>
                      <tr
                        className={`transition-colors ${ev.id && selectedIds.has(ev.id) ? 'bg-indigo-50' : ''}`}
                      >
                        {canEditData && (
                          <td className="px-2 py-2 w-10 shrink-0 align-middle">
                            {ev.id && (
                              <button
                                type="button"
                                onClick={() => toggleSelect(ev.id!)}
                                className="inline-flex rounded-sm p-1 text-stone-500 hover:bg-stone-200/80 hover:text-indigo-900"
                              >
                                {selectedIds.has(ev.id) ? (
                                  <CheckSquare className="h-4 w-4 text-indigo-800" />
                                ) : (
                                  <Square className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                        )}
                        <td className="max-w-[180px] px-3 py-2 font-medium text-stone-900">
                          <span className="block truncate" title={ev.facultyName}>
                            {ev.facultyName}
                          </span>
                        </td>
                        <td className="max-w-[110px] px-3 py-2 tabular-nums text-stone-700" dir="ltr">
                          <span className="block truncate" title={ev.nationalId}>
                            {ev.nationalId || '—'}
                          </span>
                        </td>
                        <td className="max-w-[140px] px-3 py-2 text-stone-700">
                          <span className="block truncate" title={ev.faculty}>
                            {ev.faculty}
                          </span>
                        </td>
                        <td className="w-16 px-3 py-2 text-center tabular-nums text-stone-700">
                          {ev.educationalScore}
                        </td>
                        <td className="w-16 px-3 py-2 text-center tabular-nums text-stone-700">
                          {ev.researchScore}
                        </td>
                        <td className="w-16 px-3 py-2 text-center tabular-nums text-stone-700">
                          {ev.executiveScore}
                        </td>
                        <td className="w-16 px-3 py-2 text-center text-sm font-semibold tabular-nums text-stone-900">
                          {ev.totalScore}
                        </td>
                        <td className="px-3 py-2 w-28 shrink-0 align-middle">
                          <div className="flex items-center justify-center gap-0.5 whitespace-nowrap">
                            {ev.activities && ev.activities.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedActivityId(expandedActivityId === ev.id ? null : ev.id ?? null)}
                                className="rounded-sm p-1.5 text-stone-500 hover:bg-stone-200/80 hover:text-stone-800"
                                title="فعالیت‌ها"
                              >
                                {expandedActivityId === ev.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                            {canEditData && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEdit(ev)}
                                  className="rounded-sm p-1.5 text-indigo-800 hover:bg-indigo-100"
                                  title="ویرایش"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDuplicate(ev)}
                                  className="rounded-sm p-1.5 text-stone-600 hover:bg-stone-200/80"
                                  title="تکثیر رکورد"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(ev.id!, ev.facultyName)}
                                  className="rounded-sm p-1.5 text-red-800 hover:bg-red-50"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {ev.activities && ev.activities.length > 0 && expandedActivityId === ev.id && (
                        <tr key={`${ev.id}-act`} className="bg-stone-200/40">
                          <td
                            colSpan={canEditData ? 9 : 8}
                            className="border-y border-stone-300/80 px-4 py-3"
                          >
                            <p className="mb-2 text-xs font-semibold text-stone-600">جزئیات فعالیت به تفکیک سال</p>
                            <div className="overflow-x-auto">
                              <table className="min-w-full rounded-sm border border-stone-300/80 text-sm" dir="rtl">
                                <thead className="bg-stone-200/80">
                                  <tr>
                                    <th className="px-2 py-1.5 text-right text-xs font-medium">سال</th>
                                    {ACTIVITY_LABELS.map(({ label }) => (
                                      <th key={label} className="px-2 py-1.5 text-right text-xs font-medium whitespace-nowrap">{label}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-200/90 bg-stone-50">
                                  {ev.activities.map((a) => (
                                    <tr key={a.year}>
                                      <td className="px-2 py-1">{a.year}</td>
                                      {ACTIVITY_LABELS.map(({ key }) => (
                                        <td key={key} className="px-2 py-1">
                                          {a[key] ?? 0}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-stone-300/80 px-5 py-4 sm:px-6">
              <span className="text-xs font-medium text-stone-600">
                صفحه <span className="tabular-nums text-stone-900">{currentPage}</span> از{' '}
                <span className="tabular-nums">{totalPages}</span>
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-sm border border-stone-300 bg-stone-50 p-2 text-stone-700 shadow-sm hover:bg-stone-200/50 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-sm border border-stone-300 bg-stone-50 p-2 text-stone-700 shadow-sm hover:bg-stone-200/50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>
              </>
            )}

            {panelNav === 'import' && canEditData && (
        <section className="panel-card overflow-hidden">
          <div className="panel-card-header">
            <h2 className="flex items-center gap-2 text-base font-bold text-stone-900">
              <FileSpreadsheet className="h-5 w-5 text-indigo-900" />
              بارگذاری پروندهٔ اکسل
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-stone-600">
              فرمت: دو سطر هدر؛ از ردیف سوم: نام (ستون ۳)، کد ملی (ستون ۴)، سپس برای هر سال ۱۱ ستون فعالیت، و در انتها سه ستون امتیاز آموزشی/پژوهشی/اجرایی.
            </p>
          </div>
          <div className="panel-card-body space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                دانشکدهٔ پیش‌فرض برای رکوردهای این فایل
              </label>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="panel-select w-full max-w-xl"
              >
                {FACULTY_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="در صورت نیاز، نام دانشکده را دستی وارد کنید"
                value={customFaculty}
                onChange={(e) => setCustomFaculty(e.target.value)}
                className="panel-input mt-2 max-w-xl"
              />
            </div>
            <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-stone-300 bg-stone-200/30 transition hover:border-indigo-800/45 hover:bg-stone-200/50">
              <Upload className="mb-2 h-8 w-8 text-stone-500" />
              <span className="text-sm text-stone-600">انتخاب یا رها کردن فایل (.xlsx، .xls)</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                className="hidden"
              />
            </label>
            {status === 'loading' && (
              <p className="text-sm font-medium text-indigo-900">در حال پردازش پرونده...</p>
            )}
            {importPreview && importPreview.parsed.length > 0 && (
              <div className="space-y-3 rounded-sm border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text)]">
                    پیش‌نمایش «{importPreview.fileName}» — {importPreview.parsed.length} رکورد
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="panel-btn-secondary"
                      onClick={() => setImportPreview(null)}
                    >
                      انصراف
                    </button>
                    <button type="button" className="panel-btn-primary" onClick={() => void confirmImport()}>
                      تأیید و افزودن
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm" dir="rtl">
                    <thead className="panel-thead">
                      <tr>
                        <th className="px-2 py-1.5 text-right">کد ملی</th>
                        <th className="px-2 py-1.5 text-right">نام</th>
                        <th className="px-2 py-1.5 text-right">آموزشی</th>
                        <th className="px-2 py-1.5 text-right">پژوهشی</th>
                        <th className="px-2 py-1.5 text-right">اجرایی</th>
                        <th className="px-2 py-1.5 text-right">جمع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {importPreview.parsed.slice(0, 10).map((e) => (
                        <tr key={e.nationalId}>
                          <td className="px-2 py-1 tabular-nums" dir="ltr">{e.nationalId}</td>
                          <td className="px-2 py-1">{e.facultyName}</td>
                          <td className="px-2 py-1 tabular-nums">{e.educationalScore}</td>
                          <td className="px-2 py-1 tabular-nums">{e.researchScore}</td>
                          <td className="px-2 py-1 tabular-nums">{e.executiveScore}</td>
                          <td className="px-2 py-1 font-semibold tabular-nums">{e.totalScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importPreview.parsed.length > 10 && (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      نمایش ۱۰ ردیف اول از {importPreview.parsed.length} رکورد
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
            )}

            {panelNav === 'maintenance' && canEditData && isAdmin && (
        <section className="panel-card overflow-hidden border-amber-200/80">
          <div className="panel-card-header border-amber-100 bg-amber-50/40">
            <h2 className="flex items-center gap-2 text-base font-bold text-amber-950">
              <RotateCcw className="h-5 w-5" />
              بازنشانی به دادهٔ نمونه
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-amber-900/90">
              تمام رکوردهای فعلی حذف و با مجموعهٔ نمونه جایگزین می‌شود. این عمل برای محیط آزمایشی یا اصلاح خطای بارگذاری در نظر گرفته شده است.
            </p>
          </div>
          <div className="panel-card-body border-t border-amber-200/60 bg-amber-50/25">
            <button
              type="button"
              onClick={handleReset}
              className="panel-btn-danger inline-flex items-center gap-2 px-4 py-2.5"
            >
              <RotateCcw className="h-4 w-4" />
              اجرای بازنشانی
            </button>
          </div>
        </section>
            )}

            {panelNav === 'users' && canEditData && user && (
              <UserManagementSection actor={user} />
            )}

            {panelNav === 'logs' && canEditData && (
              <DataChangeLogSection />
            )}

            {panelNav === 'help' && <ScoreHintPanel defaultOpen />}
          </div>
        </div>
      </main>

      {/* Add / Edit modal */}
      {canEditData && modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--brand)]/40 p-4"
          role="presentation"
          onClick={() => closeModal()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            className="panel-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 border-b border-[var(--border)] pb-3">
              <h3
                ref={modalHeadingRef}
                id={modalTitleId}
                tabIndex={-1}
                className="text-lg font-bold text-[var(--text)] outline-none"
              >
                {modalMode === 'add' ? 'افزودن رکورد جدید' : 'ویرایش رکورد'}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                اطلاعات را مطابق مستندات آموزشی وارد کنید؛ پس از ذخیره، رکورد در فهرست اصلی قابل مشاهده است.
              </p>
            </div>
            {modalMode === 'add' && (
              <EvaluationForm
                initial={duplicateInitial ?? undefined}
                facultyOptions={FACULTY_OPTIONS}
                onSubmit={handleAddSubmit}
                onCancel={() => {
                  setModalMode(null);
                  setDuplicateInitial(null);
                }}
                isSubmitting={formSubmitting}
              />
            )}
            {modalMode === 'edit' && editingId && (
              <EvaluationForm
                initial={evaluations.find((e) => e.id === editingId)}
                facultyOptions={FACULTY_OPTIONS}
                onSubmit={handleEditSubmit}
                onCancel={() => {
                  setModalMode(null);
                  setEditingId(null);
                }}
                isSubmitting={formSubmitting}
              />
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmState?.type === 'delete'}
        title="حذف رکورد"
        message={
          confirmState?.type === 'delete'
            ? `آیا از حذف «${confirmState.name}» مطمئن هستید؟ این عمل قابل بازگشت نیست.`
            : ''
        }
        confirmLabel="حذف"
        danger
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onCancel={() => setConfirmState(null)}
      />
      <ConfirmDialog
        open={confirmState?.type === 'bulkDelete'}
        title="حذف گروهی"
        message={`آیا از حذف ${selectedIds.size} رکورد انتخاب‌شده مطمئن هستید؟`}
        confirmLabel="حذف همه"
        danger
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onCancel={() => setConfirmState(null)}
      />
      <ConfirmDialog
        open={confirmState?.type === 'bulkFaculty'}
        title="تغییر دانشکده"
        message={`دانشکده ${selectedIds.size} رکورد به «${bulkFaculty}» تغییر کند؟`}
        confirmLabel="اعمال تغییر"
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onCancel={() => setConfirmState(null)}
      />
      <ConfirmDialog
        open={confirmState?.type === 'reset'}
        title="بازنشانی داده"
        message="تمام رکوردهای فعلی حذف و با دادهٔ نمونه جایگزین می‌شود. برای تأیید، عبارت بازنشانی را وارد کنید."
        confirmLabel="بازنشانی"
        danger
        requireTypedText="بازنشانی"
        typedValue={resetTyped}
        onTypedValueChange={setResetTyped}
        busy={confirmBusy}
        onConfirm={() => void runConfirm()}
        onCancel={() => {
          setConfirmState(null);
          setResetTyped('');
        }}
      />
    </div>
    </AppShell>
  );
}