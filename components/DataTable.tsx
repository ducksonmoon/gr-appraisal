"use client";

import React from "react";
import { Evaluation } from "@/types";
import {
  Trophy,
  Award,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ACTIVITY_LABELS } from "@/lib/activities";
import { normLabel } from "@/lib/normalize";
import { useEffect, useMemo, useState } from "react";

interface DataTableProps {
  evaluations: Evaluation[];
}

type SortField =
  | "facultyName"
  | "faculty"
  | "educationalScore"
  | "researchScore"
  | "executiveScore"
  | "totalScore";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 10;

export default function DataTable({ evaluations }: DataTableProps) {
  const [sortField, setSortField] = useState<SortField>("totalScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const topScores = useMemo(() => {
    if (evaluations.length === 0)
      return { total: 0, educational: 0, research: 0, executive: 0 };

    return {
      total: Math.max(...evaluations.map((e) => e.totalScore)),
      educational: Math.max(...evaluations.map((e) => e.educationalScore)),
      research: Math.max(...evaluations.map((e) => e.researchScore)),
      executive: Math.max(...evaluations.map((e) => e.executiveScore)),
    };
  }, [evaluations]);

  // Filter by search term
  const filteredEvaluations = useMemo(() => {
    if (!searchTerm) return evaluations;

    const term = normLabel(searchTerm).toLowerCase();
    return evaluations.filter(
      (e) =>
        normLabel(e.facultyName).toLowerCase().includes(term) ||
        normLabel(e.faculty).toLowerCase().includes(term) ||
        (e.nationalId ?? "").includes(searchTerm.trim())
    );
  }, [evaluations, searchTerm]);

  // Sort evaluations
  const sortedEvaluations = useMemo(() => {
    const sorted = [...filteredEvaluations].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "facultyName":
          aValue = a.facultyName;
          bValue = b.facultyName;
          break;
        case "faculty":
          aValue = a.faculty;
          bValue = b.faculty;
          break;
        case "educationalScore":
          aValue = a.educationalScore;
          bValue = b.educationalScore;
          break;
        case "researchScore":
          aValue = a.researchScore;
          bValue = b.researchScore;
          break;
        case "executiveScore":
          aValue = a.executiveScore;
          bValue = b.executiveScore;
          break;
        case "totalScore":
        default:
          aValue = a.totalScore;
          bValue = b.totalScore;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue, "fa")
          : bValue.localeCompare(aValue, "fa");
      }

      return sortDirection === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [filteredEvaluations, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedEvaluations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEvaluations = sortedEvaluations.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const isTopScore = (
    score: number,
    category: "total" | "educational" | "research" | "executive"
  ) => {
    return score === topScores[category];
  };

  const getScorePercentage = (score: number, maxScore: number) => {
    return Math.min((score / maxScore) * 100, 100);
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="-mx-1 flex min-h-10 items-center gap-1 rounded-sm px-2 py-1.5 text-[var(--text)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--brand)]"
    >
      {children}
      <ArrowUpDown
        className={`w-3 h-3 ${
          sortField === field
            ? "text-[var(--brand)]"
            : "text-stone-400"
        }`}
      />
    </button>
  );

  if (evaluations.length === 0) {
    return (
      <div className="dash-card p-12 text-center">
        <p className="text-lg text-stone-600">
          داده‌ای برای نمایش وجود ندارد
        </p>
      </div>
    );
  }

  return (
    <div className="dash-card p-5 sm:p-6">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-base font-bold text-[var(--text)]">جدول ارزیابی‌ها</h3>
          <p className="mt-0.5 text-xs text-stone-600">مرتب‌سازی، جستجو و جزئیات فعالیت</p>
        </div>
        <div className="flex w-full items-center gap-4 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-64">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input
              type="search"
              placeholder="جستجو در نام یا دانشکده…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dash-input pr-10 pl-3"
              dir="rtl"
            />
          </div>
          <span className="whitespace-nowrap text-sm text-stone-600">
            {filteredEvaluations.length} از {evaluations.length} مورد
          </span>
        </div>
      </div>

      {filteredEvaluations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-stone-600">
            نتیجه‌ای برای "{searchTerm}" یافت نشد
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border border-stone-300/80 bg-stone-50">
            <table className="w-full" dir="rtl">
              <thead className="bg-stone-300/45 text-xs font-semibold text-stone-900">
                <tr className="border-b border-stone-300/80">
                  <th className="w-10 px-2 py-2.5 text-right text-sm">
                    رتبه
                  </th>
                  <th className="w-10 px-2 py-2.5 text-center text-sm">
                    فعالیت‌ها
                  </th>
                  <th className="sticky right-0 z-10 bg-stone-300/45 px-4 py-2.5 text-right text-sm shadow-[inset_-1px_0_0_0_rgba(168,162,158,0.35)]">
                    <SortButton field="facultyName">نام هیئت علمی</SortButton>
                  </th>
                  <th className="px-4 py-2.5 text-right text-sm">
                    <SortButton field="faculty">دانشکده</SortButton>
                  </th>
                  <th className="px-4 py-2.5 text-right text-sm">
                    <SortButton field="educationalScore">
                      امتیاز آموزشی
                    </SortButton>
                  </th>
                  <th className="px-4 py-2.5 text-right text-sm">
                    <SortButton field="researchScore">امتیاز پژوهشی</SortButton>
                  </th>
                  <th className="px-4 py-2.5 text-right text-sm">
                    <SortButton field="executiveScore">
                      امتیاز اجرایی
                    </SortButton>
                  </th>
                  <th className="sticky left-0 z-10 bg-stone-300/45 px-4 py-2.5 text-right text-sm shadow-[inset_1px_0_0_0_rgba(168,162,158,0.35)]">
                    <SortButton field="totalScore">جمع کل امتیاز</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/90">
                {paginatedEvaluations.map((evaluation, index) => {
                  const globalIndex = startIndex + index;
                  const rank = globalIndex + 1;

                  return (
                  <React.Fragment key={evaluation.id || globalIndex}>
                    <tr
                      className={`transition-colors ${
                        globalIndex % 2 === 0 ? 'bg-stone-50' : 'bg-stone-100/70'
                      } hover:bg-indigo-50/80 ${
                        isTopScore(evaluation.totalScore, 'total') ? 'ring-2 ring-amber-400/90' : ''
                      }`}
                    >
                      <td className="px-2 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            rank <= 3
                              ? 'bg-indigo-100 text-indigo-900'
                              : 'bg-stone-200/80 text-stone-700'
                          }`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        {evaluation.activities && evaluation.activities.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(
                                expandedId === (evaluation.id ?? String(globalIndex))
                                  ? null
                                  : evaluation.id ?? String(globalIndex)
                              )
                            }
                            className="rounded p-1.5 text-stone-600 transition hover:bg-stone-200/80"
                            title="فعالیت‌های سالانه"
                          >
                            {expandedId === (evaluation.id ?? String(globalIndex)) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        ) : null}
                      </td>
                      <td className="sticky right-0 z-10 bg-inherit px-4 py-3 font-medium text-stone-900">
                        <div>
                          <div>{evaluation.facultyName}</div>
                          {evaluation.nationalId ? (
                            <div className="mt-0.5 text-xs tabular-nums text-stone-500" dir="ltr">
                              {evaluation.nationalId}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {evaluation.faculty}
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          isTopScore(evaluation.educationalScore, 'educational') ? 'bg-sky-50/90' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-lg font-semibold ${
                                isTopScore(
                                  evaluation.educationalScore,
                                  "educational"
                                )
                                  ? 'text-sky-900'
                                  : 'text-stone-700'
                              }`}
                            >
                              {evaluation.educationalScore}
                            </span>
                            {isTopScore(
                              evaluation.educationalScore,
                              "educational"
                            ) && (
                              <Trophy className="h-4 w-4 shrink-0 text-sky-800" />
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-stone-200">
                            <div
                              className="h-1.5 rounded-full bg-sky-700 transition-all"
                              style={{
                                width: `${getScorePercentage(
                                  evaluation.educationalScore,
                                  topScores.educational
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          isTopScore(evaluation.researchScore, 'research') ? 'bg-teal-50/90' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-lg font-semibold ${
                                isTopScore(evaluation.researchScore, "research")
                                  ? 'text-teal-900'
                                  : 'text-stone-700'
                              }`}
                            >
                              {evaluation.researchScore}
                            </span>
                            {isTopScore(
                              evaluation.researchScore,
                              "research"
                            ) && (
                              <Trophy className="h-4 w-4 shrink-0 text-teal-800" />
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-stone-200">
                            <div
                              className="h-1.5 rounded-full bg-teal-700 transition-all"
                              style={{
                                width: `${getScorePercentage(
                                  evaluation.researchScore,
                                  topScores.research
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`px-4 py-3 ${
                          isTopScore(evaluation.executiveScore, 'executive') ? 'bg-amber-50/90' : ''
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-lg font-semibold ${
                                isTopScore(
                                  evaluation.executiveScore,
                                  "executive"
                                )
                                  ? 'text-amber-950'
                                  : 'text-stone-700'
                              }`}
                            >
                              {evaluation.executiveScore}
                            </span>
                            {isTopScore(
                              evaluation.executiveScore,
                              "executive"
                            ) && (
                              <Trophy className="h-4 w-4 shrink-0 text-amber-900" />
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-stone-200">
                            <div
                              className="h-1.5 rounded-full bg-amber-700 transition-all"
                              style={{
                                width: `${getScorePercentage(
                                  evaluation.executiveScore,
                                  topScores.executive
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td
                        className={`sticky left-0 z-10 bg-inherit px-4 py-3 text-lg font-bold shadow-[inset_1px_0_0_0_rgba(168,162,158,0.25)] ${
                          isTopScore(evaluation.totalScore, 'total')
                            ? 'bg-amber-50/90 text-amber-950'
                            : 'text-stone-900'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span>{evaluation.totalScore}</span>
                          {isTopScore(evaluation.totalScore, "total") && (
                            <Award className="h-5 w-5 shrink-0 text-amber-800" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {evaluation.activities &&
                      evaluation.activities.length > 0 &&
                      expandedId === (evaluation.id ?? String(globalIndex)) && (
                        <tr
                          className="bg-stone-200/35"
                          key={`${evaluation.id ?? globalIndex}-detail`}
                        >
                          <td
                            colSpan={8}
                            className="border-y border-stone-300/80 px-4 py-3"
                          >
                            <div className="text-sm text-stone-700">
                              <p className="font-semibold mb-2">
                                تعداد فعالیت‌ها به تفکیک سال
                              </p>
                              <div className="overflow-x-auto">
                                <table className="min-w-full rounded-md border border-stone-300/80" dir="rtl">
                                  <thead className="bg-stone-200/70">
                                    <tr>
                                      <th className="px-3 py-2 text-right text-xs font-medium">سال</th>
                                      {ACTIVITY_LABELS.map(({ label }) => (
                                        <th key={label} className="whitespace-nowrap px-2 py-2 text-right text-xs font-medium">
                                          {label}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-200/90 bg-stone-50">
                                    {evaluation.activities.map((a) => (
                                      <tr key={a.year}>
                                        <td className="px-3 py-2">{a.year}</td>
                                        {ACTIVITY_LABELS.map(({ key }) => (
                                          <td key={key} className="px-2 py-2">
                                            {a[key] ?? 0}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-stone-300/80 pt-4">
              <div className="text-sm text-stone-600">
                نمایش {startIndex + 1} تا{" "}
                {Math.min(endIndex, sortedEvaluations.length)} از{" "}
                {sortedEvaluations.length} مورد
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md border border-stone-300 bg-stone-50 p-2 transition hover:bg-stone-200/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                          currentPage === pageNum
                            ? 'bg-indigo-800 text-white shadow-sm'
                            : 'border border-stone-300/80 bg-stone-100 text-stone-800 hover:bg-stone-200/70'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md border border-stone-300 bg-stone-50 p-2 transition hover:bg-stone-200/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
