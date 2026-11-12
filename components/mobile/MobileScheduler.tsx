"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock,
  MapPin,
  Monitor,
  Moon,
  Share2,
  Sparkles,
  Sun,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import type { ClassInfo, ScheduleItem, Subject } from "@/components/types";
import type { PlanResult } from "@/lib/aiPrompt";
import SubjectSelector from "@/components/ui/search";
import ClassCapacity from "@/components/ClassCapacity";
import { findScheduleConflict } from "@/lib/scheduleConflict";
import BottomSheet from "@/components/mobile/BottomSheet";

/* ---------- Hằng số & kiểu ---------- */

const PERIOD_START = [
  "00:00", "07:00", "07:50", "09:00", "09:50", "10:40",
  "13:00", "13:50", "15:00", "15:50", "16:40",
  "17:40", "18:30", "19:20",
];
const PERIOD_MINUTES = 50;
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const DAYS = [
  { key: "Thứ 2", short: "T2" },
  { key: "Thứ 3", short: "T3" },
  { key: "Thứ 4", short: "T4" },
  { key: "Thứ 5", short: "T5" },
  { key: "Thứ 6", short: "T6" },
  { key: "Thứ 7", short: "T7" },
  { key: "Chủ nhật", short: "CN" },
];

const norm = (s: string) => s.trim().toLowerCase();
const sameDay = (a: string, b: string) => norm(a) === norm(b);
const shortDay = (day: string) => DAYS.find((d) => sameDay(d.key, day))?.short ?? day;

function endTime(period: number): string {
  const start = PERIOD_START[period];
  if (!start) return "";
  const [h, m] = start.split(":").map(Number);
  const t = h * 60 + m + PERIOD_MINUTES;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** Màu theo tên (class đầy đủ để Tailwind quét được). */
const COLORS: Record<string, { bar: string; soft: string; text: string; solid: string }> = {
  blue: { bar: "border-blue-500", soft: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", solid: "bg-blue-500" },
  green: { bar: "border-green-500", soft: "bg-green-50 dark:bg-green-950/40", text: "text-green-700 dark:text-green-300", solid: "bg-green-500" },
  purple: { bar: "border-purple-500", soft: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", solid: "bg-purple-500" },
  red: { bar: "border-red-500", soft: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", solid: "bg-red-500" },
  orange: { bar: "border-orange-500", soft: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", solid: "bg-orange-500" },
  pink: { bar: "border-pink-500", soft: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300", solid: "bg-pink-500" },
  teal: { bar: "border-teal-500", soft: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", solid: "bg-teal-500" },
  indigo: { bar: "border-indigo-500", soft: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", solid: "bg-indigo-500" },
};
const colorOf = (name: string) => COLORS[name] ?? COLORS.blue;

/** Một buổi học đã gộp (khớp với mergedSchedule của trang). */
export interface MobileBlock {
  classId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  color: string;
  day: string;
  startPeriod: number;
  endPeriod: number;
  teacher: string;
  room: string;
}

export interface MobileSchedulerProps {
  subjects: Subject[];
  schedule: { [key: string]: ScheduleItem };
  blocks: MobileBlock[];
  credits: number;
  onSelectClass: (subject: Subject, cls: ClassInfo) => void;
  onRemoveClass: (classId: string) => void;
  onRemoveSubject: (subject: Subject) => void;
  plans: PlanResult[] | null;
  activePlan: number | null;
  currentPlan: PlanResult | null;
  previewing: boolean;
  onPickPlan: (index: number) => void;
  onApplyPlan: () => void;
  onStopPreview: () => void;
  onSharePlans: () => void;
  onDeletePlans: () => void;
  /** Nút công cụ dựng sẵn của trang (Prompt AI, Google Calendar). */
  aiButton: ReactNode;
  calendarButton: ReactNode;
}

type Tab = "lich" | "mon" | "cong-cu";

/* ---------- Thành phần chính ---------- */

export default function MobileScheduler(props: MobileSchedulerProps) {
  const { subjects, schedule, blocks, credits, currentPlan, previewing } = props;

  const [tab, setTab] = useState<Tab>("lich");
  const [dayIndex, setDayIndex] = useState(0);
  const [openSubject, setOpenSubject] = useState<string | null>(null);
  const [sessionSheet, setSessionSheet] = useState<MobileBlock | null>(null);
  const [deleteSheet, setDeleteSheet] = useState<Subject | null>(null);
  const previousSubjectIds = useRef<string[]>([]);

  useEffect(() => {
    const previous = previousSubjectIds.current;
    const added = subjects.find((subject) => !previous.includes(subject.id));
    if (tab === "mon" && added) setOpenSubject(added.id);
    previousSubjectIds.current = subjects.map((subject) => subject.id);
  }, [subjects, tab]);

  // Mở đúng ngày hôm nay sau khi hydrate (tránh lệch SSR/CSR).
  useEffect(() => {
    setDayIndex((new Date().getDay() + 6) % 7);
  }, []);

  const byDay = useMemo(() => {
    const map = DAYS.map(() => [] as MobileBlock[]);
    for (const b of blocks) {
      const i = DAYS.findIndex((d) => sameDay(d.key, b.day));
      if (i >= 0) map[i].push(b);
    }
    map.forEach((list) => list.sort((a, b) => a.startPeriod - b.startPeriod));
    return map;
  }, [blocks]);

  const scheduledSubjectIds = useMemo(
    () => new Set(Object.values(schedule).map((s) => s.subjectId)),
    [schedule]
  );

  const goToSubject = (subjectId: string) => {
    setSessionSheet(null);
    setTab("mon");
    setOpenSubject(subjectId);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Thanh trên cùng */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-center justify-between px-4">
          <h1 className="text-lg font-bold">Thời khóa biểu</h1>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">{subjects.length} môn</span>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 px-2.5 py-1">
              {credits} tín chỉ
            </span>
          </div>
        </div>
        {previewing && currentPlan && (
          <div className="border-t border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/50 px-4 py-2 text-xs text-indigo-800 dark:text-indigo-200">
            Đang xem thử <b>{currentPlan.name}</b>, chưa áp dụng vào lịch.
          </div>
        )}
      </header>

      {/* Nội dung theo tab */}
      <main className="flex-1 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+9.5rem)]">
        {tab === "lich" && (
          <ScheduleTab
            {...props}
            dayIndex={dayIndex}
            setDayIndex={setDayIndex}
            byDay={byDay}
            onOpenSession={setSessionSheet}
            onGoSubjects={() => setTab("mon")}
          />
        )}
        {tab === "mon" && (
          <SubjectsTab
            subjects={subjects}
            schedule={schedule}
            scheduledSubjectIds={scheduledSubjectIds}
            openSubject={openSubject}
            setOpenSubject={setOpenSubject}
            onSelectClass={props.onSelectClass}
            onAskDelete={setDeleteSheet}
            onGoSchedule={() => setTab("lich")}
          />
        )}
        {tab === "cong-cu" && <ToolsTab {...props} />}
      </main>

      {/* Thanh hành động khi xem thử phương án */}
      {previewing && currentPlan?.payload && (
        <div className="fixed inset-x-0 z-40 bottom-[calc(env(safe-area-inset-bottom)+4rem)] px-3 pb-2">
          <div className="mx-auto flex max-w-lg gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-lg">
            <button
              type="button"
              onClick={props.onStopPreview}
              className="min-h-12 flex-1 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium active:bg-gray-100 dark:active:bg-gray-800"
            >
              Bỏ xem thử
            </button>
            <button
              type="button"
              onClick={props.onApplyPlan}
              className="min-h-12 flex-1 rounded-xl bg-emerald-600 text-sm font-semibold text-white active:bg-emerald-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Thanh điều hướng dưới */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
        aria-label="Điều hướng chính"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3">
          <TabButton active={tab === "lich"} onClick={() => setTab("lich")} icon={<CalendarDays className="size-6" />} label="Lịch" />
          <TabButton
            active={tab === "mon"}
            onClick={() => setTab("mon")}
            icon={<BookOpen className="size-6" />}
            label="Môn học"
            badge={subjects.length - scheduledSubjectIds.size > 0 ? subjects.length - scheduledSubjectIds.size : undefined}
          />
          <TabButton active={tab === "cong-cu"} onClick={() => setTab("cong-cu")} icon={<Wrench className="size-6" />} label="Công cụ" />
        </div>
      </nav>

      {/* Chi tiết buổi học */}
      <BottomSheet open={!!sessionSheet} onClose={() => setSessionSheet(null)} title={sessionSheet?.subjectName ?? ""}>
        {sessionSheet && (
          <SessionDetail
            block={sessionSheet}
            siblings={blocks.filter((b) => b.classId === sessionSheet.classId)}
            onChangeClass={() => goToSubject(sessionSheet.subjectId)}
            onRemove={() => {
              props.onRemoveClass(sessionSheet.classId);
              setSessionSheet(null);
              toast.success("Đã bỏ lớp khỏi lịch.");
            }}
          />
        )}
      </BottomSheet>

      {/* Xác nhận xoá môn */}
      <BottomSheet open={!!deleteSheet} onClose={() => setDeleteSheet(null)} title="Xóa môn học?">
        {deleteSheet && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Xóa <b className="text-red-600 dark:text-red-400">{deleteSheet.name}</b> khỏi danh sách môn và khỏi thời khóa biểu.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDeleteSheet(null)}
                className="min-h-12 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  props.onRemoveSubject(deleteSheet);
                  setDeleteSheet(null);
                }}
                className="min-h-12 rounded-xl bg-red-600 text-sm font-semibold text-white active:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

/* ---------- Thành phần con ---------- */

function TabButton({
  active, onClick, icon, label, badge,
}: { active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex min-h-16 touch-manipulation flex-col items-center justify-center gap-0.5 text-xs font-medium ${
        active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      <span className="relative">
        {icon}
        {badge !== undefined && (
          <span className="absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-4 text-white">
            {badge}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}

function ScheduleTab(
  props: MobileSchedulerProps & {
    dayIndex: number;
    setDayIndex: (i: number) => void;
    byDay: MobileBlock[][];
    onOpenSession: (b: MobileBlock) => void;
    onGoSubjects: () => void;
  }
) {
  const { dayIndex, setDayIndex, byDay, onOpenSession, plans, activePlan, currentPlan, subjects, blocks } = props;
  const list = byDay[dayIndex];
  const hasMorning = list.some((b) => b.startPeriod <= 5);
  const hasAfternoon = list.some((b) => b.startPeriod >= 6);
  const [weekOpen, setWeekOpen] = useState(false);

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="Chưa có môn nào"
        text="Thêm môn học để bắt đầu xếp thời khóa biểu."
        action="Thêm môn học"
        onAction={props.onGoSubjects}
      />
    );
  }

  return (
    <div className="space-y-3">
      {plans && (
        <section aria-label="Phương án đã lưu" className="-mx-4 px-4">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="size-4" /> Phương án đã lưu
          </div>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] snap-x">
            {plans.map((p, k) => (
              <button
                key={k}
                type="button"
                onClick={() => props.onPickPlan(k)}
                aria-pressed={k === activePlan}
                className={`min-h-11 shrink-0 snap-start touch-manipulation rounded-full border px-4 text-sm font-medium ${
                  k === activePlan
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                {p.name} {p.payload ? "✓" : "✗"}
              </button>
            ))}
          </div>
          {currentPlan?.note && (
            <p className="mt-1.5 text-xs italic text-gray-600 dark:text-gray-400">AI: {currentPlan.note}</p>
          )}
          {currentPlan && !currentPlan.payload && (
            <ul className="mt-1.5 list-inside list-disc text-xs text-amber-800 dark:text-amber-300">
              {currentPlan.problems.map((m, k) => <li key={k}>{m}</li>)}
              {currentPlan.validation.unscheduledSubjects.map((u) => (
                <li key={u.ma_mon}>Chưa xếp: {u.ten_mon} ({u.ma_mon})</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Chọn ngày */}
      <div role="tablist" aria-label="Chọn ngày" className="grid grid-cols-7 gap-1">
        {DAYS.map((d, i) => {
          const count = byDay[i].length;
          const selected = i === dayIndex;
          return (
            <button
              key={d.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setDayIndex(i)}
              className={`flex min-h-14 touch-manipulation flex-col items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                selected
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {d.short}
              <span className={`mt-0.5 text-[10px] font-medium ${selected ? "text-blue-100" : "text-gray-400"}`}>
                {count ? `${count} buổi` : "·"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Buổi học trong ngày */}
      <section aria-label={`Các buổi học ${DAYS[dayIndex].key}`} className="space-y-2">
        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            Không có tiết học nào vào {DAYS[dayIndex].key}.
          </div>
        ) : (
          list.map((b, idx) => {
            const c = colorOf(b.color);
            const prev = list[idx - 1];
            const showBreak = hasMorning && hasAfternoon && b.startPeriod >= 6 && (!prev || prev.startPeriod <= 5);
            return (
              <div key={`${b.classId}-${b.startPeriod}`}>
                {showBreak && (
                  <div className="my-2 flex items-center gap-2 text-[11px] font-medium text-gray-400">
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" /> Nghỉ trưa
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onOpenSession(b)}
                  className={`flex w-full touch-manipulation gap-3 rounded-2xl border-l-4 p-3 text-left active:opacity-80 ${c.bar} ${c.soft}`}
                >
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-sm font-bold tabular-nums">{PERIOD_START[b.startPeriod]}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums">{endTime(b.endPeriod)}</div>
                    <div className="mt-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      Tiết {b.startPeriod}-{b.endPeriod}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold leading-snug ${c.text}`}>{b.subjectName}</div>
                    <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{b.classId}</div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                      {b.teacher && (
                        <span className="flex items-center gap-1"><User className="size-3.5" />{b.teacher.replace(/^GV\s+/i, "")}</span>
                      )}
                      {b.room && (
                        <span className="flex items-center gap-1"><MapPin className="size-3.5" />{b.room}</span>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* Tổng quan tuần */}
      <WeekOverview
        open={weekOpen}
        onToggle={() => setWeekOpen((v) => !v)}
        blocks={blocks}
        selectedDay={dayIndex}
        onPickDay={setDayIndex}
      />
    </div>
  );
}

function WeekOverview({
  open, onToggle, blocks, selectedDay, onPickDay,
}: { open: boolean; onToggle: () => void; blocks: MobileBlock[]; selectedDay: number; onPickDay: (i: number) => void }) {
  const captureRef = useRef<HTMLDivElement>(null);

  // cell[dayIndex][period] = block | undefined
  const cells = useMemo(() => {
    const grid: (MobileBlock | undefined)[][] = DAYS.map(() => []);
    for (const b of blocks) {
      const i = DAYS.findIndex((d) => sameDay(d.key, b.day));
      if (i < 0) continue;
      for (let p = b.startPeriod; p <= b.endPeriod; p++) grid[i][p] = b;
    }
    return grid;
  }, [blocks]);

  const legend = useMemo(() => {
    const seen = new Map<string, MobileBlock>();
    blocks.forEach((b) => !seen.has(b.classId) && seen.set(b.classId, b));
    return Array.from(seen.values());
  }, [blocks]);

  const saveImage = async () => {
    const node = captureRef.current;
    if (!node) return;
    try {
      const { toPng } = await import("html-to-image");
      const isDark = document.documentElement.classList.contains("dark");
      const dataUrl = await toPng(node, { pixelRatio: 3, backgroundColor: isDark ? "#0a0a0a" : "#ffffff" });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "thoi-khoa-bieu.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Thời khóa biểu" });
        return;
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "thoi-khoa-bieu.png";
      a.click();
      toast.success("Đã lưu ảnh thời khóa biểu.");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") toast.error("Không thể tạo ảnh thời khóa biểu.");
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between px-4 text-sm font-semibold"
      >
        Tổng quan cả tuần
        <ChevronDown className={`size-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div ref={captureRef} className="bg-white dark:bg-gray-950 p-2 rounded-lg">
            <div className="grid grid-cols-[1.5rem_repeat(7,minmax(0,1fr))] gap-px text-center">
              <div />
              {DAYS.map((d, i) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => onPickDay(i)}
                  className={`min-h-8 text-[11px] font-semibold ${i === selectedDay ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}`}
                >
                  {d.short}
                </button>
              ))}
              {PERIODS.map((p) => (
                <WeekRow key={p} period={p} cells={cells} />
              ))}
            </div>
            {legend.length > 0 && (
              <ul className="mt-3 space-y-1">
                {legend.map((b) => (
                  <li key={b.classId} className="flex items-start gap-2 text-[11px] leading-snug text-gray-700 dark:text-gray-300">
                    <span className={`mt-1 size-2.5 shrink-0 rounded-sm ${colorOf(b.color).solid}`} />
                    <span><b>{b.classId}</b> {b.subjectName}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={saveImage}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium active:bg-gray-100 dark:active:bg-gray-800"
          >
            <Camera className="size-4" /> Lưu / chia sẻ ảnh
          </button>
        </div>
      )}
    </section>
  );
}

function WeekRow({ period, cells }: { period: number; cells: (MobileBlock | undefined)[][] }) {
  return (
    <>
      <div className="flex h-5 items-center justify-center text-[10px] text-gray-400">{period}</div>
      {DAYS.map((d, i) => {
        const b = cells[i][period];
        const first = b && b.startPeriod === period;
        return (
          <div
            key={d.key}
            className={`flex h-5 items-center justify-center overflow-hidden text-[8px] font-semibold text-white ${
              b ? colorOf(b.color).solid : "bg-gray-100 dark:bg-gray-800/60"
            } ${period === 5 ? "mb-1" : ""}`}
          >
            {first ? b.subjectCode : ""}
          </div>
        );
      })}
    </>
  );
}

function SessionDetail({
  block, siblings, onChangeClass, onRemove,
}: { block: MobileBlock; siblings: MobileBlock[]; onChangeClass: () => void; onRemove: () => void }) {
  const c = colorOf(block.color);
  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-l-4 p-3 ${c.bar} ${c.soft}`}>
        <div className={`text-sm font-semibold ${c.text}`}>{block.classId}</div>
        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">Mã môn {block.subjectCode}</div>
      </div>
      <ul className="space-y-2">
        {siblings
          .slice()
          .sort((a, b) => DAYS.findIndex((d) => sameDay(d.key, a.day)) - DAYS.findIndex((d) => sameDay(d.key, b.day)) || a.startPeriod - b.startPeriod)
          .map((s) => (
            <li key={`${s.day}-${s.startPeriod}`} className="rounded-xl border border-gray-200 dark:border-gray-800 p-3 text-sm">
              <div className="flex items-center gap-2 font-medium">
                <Clock className="size-4 text-gray-400" />
                {s.day} · tiết {s.startPeriod}-{s.endPeriod} · {PERIOD_START[s.startPeriod]}-{endTime(s.endPeriod)}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
                {s.teacher && <span className="flex items-center gap-1"><User className="size-3.5" />{s.teacher.replace(/^GV\s+/i, "")}</span>}
                {s.room && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{s.room}</span>}
              </div>
            </li>
          ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onChangeClass}
          className="min-h-12 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-medium active:bg-gray-100 dark:active:bg-gray-800"
        >
          Đổi lớp khác
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="min-h-12 rounded-xl bg-red-600 text-sm font-semibold text-white active:bg-red-700"
        >
          Bỏ lớp này
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action, onAction }: { title: string; text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300">
        <CalendarDays className="size-7" />
      </div>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      {action && onAction && (
        <button type="button" onClick={onAction} className="mt-4 min-h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white active:bg-blue-700">
          {action}
        </button>
      )}
    </div>
  );
}

function SubjectsTab({
  subjects, schedule, scheduledSubjectIds, openSubject, setOpenSubject, onSelectClass, onAskDelete, onGoSchedule,
}: {
  subjects: Subject[];
  schedule: { [key: string]: ScheduleItem };
  scheduledSubjectIds: Set<string>;
  openSubject: string | null;
  setOpenSubject: (id: string | null) => void;
  onSelectClass: (subject: Subject, cls: ClassInfo) => void;
  onAskDelete: (s: Subject) => void;
  onGoSchedule: () => void;
}) {
  const chosenClass = (subjectId: string) =>
    Object.values(schedule).find((i) => i.subjectId === subjectId)?.classId;

  /** Tên môn khác đang chiếm tiết của lớp này (nếu trùng). */
  const conflictOf = (subject: Subject, cls: ClassInfo): string | null => {
    const conflict = findScheduleConflict(cls, subject.id, schedule);
    return conflict ? `${conflict.subjectName} · ${conflict.day}, tiết ${conflict.period}` : null;
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-blue-600 p-4 text-white shadow-sm dark:bg-blue-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-blue-100">XẾP THỜI KHÓA BIỂU</p>
            <h2 className="mt-1 text-lg font-bold">Chọn lớp cho từng môn</h2>
            <p className="mt-1 text-sm text-blue-100">Thêm môn, xem lịch và chạm vào nhóm phù hợp.</p>
          </div>
          <span className="shrink-0 rounded-xl bg-white/15 px-3 py-2 text-center text-xs"><strong className="block text-lg">{scheduledSubjectIds.size}/{subjects.length}</strong>đã xếp</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-label="Tiến độ xếp môn" aria-valuemin={0} aria-valuemax={subjects.length || 1} aria-valuenow={scheduledSubjectIds.size}>
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${subjects.length ? (scheduledSubjectIds.size / subjects.length) * 100 : 0}%` }} />
        </div>
      </section>
      <section aria-label="Thêm môn học">
        <div className="mb-2 text-sm font-semibold">Thêm môn học</div>
        <SubjectSelector />
      </section>
      {subjects.length === 0 ? (
        <EmptyState title="Chưa có môn nào" text="Gõ tên hoặc mã môn ở ô tìm kiếm để thêm." />
      ) : (
        <>
        <div className="flex items-center justify-between gap-2">
          <div><h2 className="font-bold">Danh sách môn</h2><p className="text-xs text-gray-500 dark:text-gray-400">{subjects.length - scheduledSubjectIds.size} môn chưa chọn lớp</p></div>
          <button type="button" onClick={onGoSchedule} className="min-h-11 rounded-xl bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-gray-200 dark:bg-gray-900 dark:text-blue-300 dark:ring-gray-700">Xem lịch →</button>
        </div>
        <ul className="space-y-2">
          {[...subjects].reverse().map((subject) => {
            const open = openSubject === subject.id;
            const chosen = chosenClass(subject.id);
            return (
              <li key={subject.id} className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setOpenSubject(open ? null : subject.id)}
                  aria-expanded={open}
                  className="flex min-h-16 w-full touch-manipulation items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-snug">{subject.name}</div>
                    <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {subject.code} · {subject.credit} tín chỉ · {subject.classes.length} lớp
                    </div>
                    <div className="mt-1.5">
                      {scheduledSubjectIds.has(subject.id) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <Check className="size-3" /> Đã xếp {chosen}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          Chưa chọn lớp
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`size-5 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 p-3">
                    <p className="px-1 pb-1 text-xs text-gray-500 dark:text-gray-400">Chạm vào một nhóm để xếp hoặc đổi lớp. Lớp trùng lịch được đánh dấu bên dưới.</p>
                    {[...subject.classes].sort((a, b) => Number(!!conflictOf(subject, a)) - Number(!!conflictOf(subject, b))).map((cls) => {
                      const selected = chosen === cls.id;
                      const conflict = selected ? null : conflictOf(subject, cls);
                      const teachers = Array.from(new Set(cls.schedules.map((s) => s.teacher).filter(Boolean)))
                        .map((t) => t.replace(/^GV\s+/i, ""))
                        .join(", ");
                      const c = colorOf(cls.color);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => onSelectClass(subject, cls)}
                          aria-pressed={selected}
                          className={`flex min-h-16 w-full touch-manipulation items-center gap-3 rounded-xl border-l-4 p-3 text-left ${c.bar} ${c.soft} ${
                            conflict ? "opacity-60" : ""
                          } ${selected ? "ring-2 ring-blue-500" : "ring-1 ring-inset ring-gray-200 dark:ring-gray-700"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">Nhóm {cls.id.split("-")[1]}</span><span className={`text-xs font-semibold ${selected ? "text-blue-700 dark:text-blue-300" : "text-gray-600 dark:text-gray-300"}`}>{selected ? "Đã chọn" : "Chọn nhóm +"}</span></div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {cls.schedules.length ? cls.schedules.map((s, i) => <span key={i} className="rounded-md bg-white/70 px-2 py-1 text-xs font-semibold dark:bg-gray-950/40">{shortDay(s.day)} · Tiết {s.startPeriod}–{s.endPeriod}</span>) : <span className="text-xs text-gray-500">Chưa có lịch</span>}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                              {teachers || "Chưa có GV"}
                              {cls.schedules[0]?.room ? ` · ${cls.schedules[0].room}` : ""}
                            </div>
                            <ClassCapacity id={cls.id} />
                            {conflict && <div className="mt-1 text-[11px] font-semibold text-red-600 dark:text-red-400">Trùng với {conflict}</div>}
                          </div>
                          {selected && <Check className="size-6 shrink-0 text-blue-600" />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => onAskDelete(subject)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-950/30"
                    >
                      <Trash2 className="size-4" /> Xóa môn này
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </>
      )}
    </div>
  );
}

function ToolsTab(props: MobileSchedulerProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themes = [
    { key: "light", label: "Sáng", icon: <Sun className="size-4" /> },
    { key: "dark", label: "Tối", icon: <Moon className="size-4" /> },
    { key: "system", label: "Hệ thống", icon: <Monitor className="size-4" /> },
  ];
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Xếp lịch bằng AI</h2>
        <div className="[&>button]:min-h-12 [&>button]:w-full [&>button]:justify-center [&>button]:rounded-xl [&>button]:text-base">
          {props.aiButton}
        </div>
        {props.plans && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={props.onSharePlans}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium"
            >
              <Share2 className="size-4" /> Chia sẻ
            </button>
            <button
              type="button"
              onClick={props.onDeletePlans}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-gray-900 text-sm font-medium text-red-600 dark:text-red-400"
            >
              <Trash2 className="size-4" /> Xóa phương án
            </button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Xuất lịch</h2>
        <div className="[&>button]:min-h-12 [&>button]:w-full [&>button]:rounded-xl [&>button]:bg-white dark:[&>button]:bg-gray-900">
          {props.calendarButton}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Lưu ảnh thời khóa biểu: mở tab Lịch, chọn “Tổng quan cả tuần”.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Giao diện</h2>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-200/70 dark:bg-gray-800 p-1">
          {themes.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(t.key)}
              aria-pressed={mounted && theme === t.key}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-sm font-medium ${
                mounted && theme === t.key ? "bg-white dark:bg-gray-950 shadow-sm" : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
