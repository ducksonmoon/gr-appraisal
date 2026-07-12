'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { isDataEditor, roleLabelFa } from '@/lib/roles';
import { PRODUCT_NAME, UNIVERSITY_NAME } from '@/lib/brand';
import { LogOut } from 'lucide-react';

type AppShellProps = {
  children: React.ReactNode;
  /** Optional page title shown under the product name in the header band */
  pageTitle?: string;
};

export default function AppShell({ children, pageTitle }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const onDashboard = pathname === '/';
  const onPanel = pathname?.startsWith('/panel');

  return (
    <div className="app-shell" dir="rtl">
      <a href="#main-content" className="app-skip-link">
        پرش به محتوای اصلی
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <div className="min-w-0 flex-1">
            <p className="app-eyebrow">{UNIVERSITY_NAME}</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Link href="/" className="app-brand-title" prefetch={false}>
                {PRODUCT_NAME}
              </Link>
              {pageTitle ? (
                <span className="text-sm font-medium text-[var(--text-muted)]">{pageTitle}</span>
              ) : null}
            </div>
          </div>

          <nav className="app-nav" aria-label="ناوبری اصلی">
            <Link
              href="/"
              prefetch={false}
              className={onDashboard ? 'app-nav-link app-nav-link-active' : 'app-nav-link'}
              aria-current={onDashboard ? 'page' : undefined}
            >
              گزارش ارزیابی
            </Link>
            <Link
              href="/panel"
              prefetch={false}
              className={onPanel ? 'app-nav-link app-nav-link-active' : 'app-nav-link'}
              aria-current={onPanel ? 'page' : undefined}
            >
              {user && isDataEditor(user.role) ? 'مدیریت داده' : 'مشاهده داده'}
            </Link>
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {user && (
              <div
                className="hidden items-center gap-2 rounded-sm border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-xs text-[var(--text-muted)] sm:inline-flex"
                title="نقش دسترسی شما در سامانه"
              >
                <span dir="ltr" className="font-mono text-[var(--text)]">
                  {user.email}
                </span>
                <span className="text-[var(--border)]">|</span>
                <span className="font-medium text-[var(--brand)]">{roleLabelFa(user.role)}</span>
              </div>
            )}
            <button type="button" onClick={() => void logout()} className="app-btn-ghost">
              <LogOut className="h-4 w-4" aria-hidden />
              خروج
            </button>
          </div>
        </div>
      </header>
      <div id="main-content" className="app-main">
        {children}
      </div>
    </div>
  );
}
