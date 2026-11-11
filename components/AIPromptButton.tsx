"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Sparkles, X, Copy, Check, Loader2 } from "lucide-react";
import { buildAiPrompt, parsePlans, PlanResult, CAMPUS_OPTIONS } from "@/lib/aiPrompt";
import type { Campus } from "@/lib/scheduler";

interface Props {
  /** Mã các môn đang có trong danh sách môn học của trang (ma_mon). */
  subjectIds: string[];
  /** Nhận danh sách phương án đã kiểm tra để trang hiển thị và cho người dùng chuyển qua lại. */
  onPlans: (plans: PlanResult[]) => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function Check_({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 py-2 sm:py-0 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 sm:w-4 sm:h-4 rounded"
      />
      {label}
    </label>
  );
}

/** Nút "Prompt AI": tạo prompt từ các môn trong trang, rồi xem/chuyển qua lại giữa các phương án chatbot trả về. */
export default function AIPromptButton({ subjectIds, onPlans }: Props) {
  const [open, setOpen] = useState(false);
  const [avoidMondayMorning, setAvoidMondayMorning] = useState(true);
  const [minimizeDays, setMinimizeDays] = useState(true);
  const [avoidWeekend, setAvoidWeekend] = useState(true);
  const [avoidMorning, setAvoidMorning] = useState(false);
  const [avoidAfternoon, setAvoidAfternoon] = useState(false);
  const [note, setNote] = useState("");
  const [planCount, setPlanCount] = useState(5);
  const [campus, setCampus] = useState<Campus | "">("");
  const [copied, setCopied] = useState(false);

  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCopy = async () => {
    if (subjectIds.length === 0) {
      toast.error("Chưa có môn nào trong danh sách môn học.");
      return;
    }
    const prompt = buildAiPrompt(
      subjectIds,
      {
        avoidMondayMorning,
        minimizeDays,
        avoidWeekend,
        avoidMorning,
        avoidAfternoon,
        campus: campus || undefined,
        customNote: note.trim() || undefined,
      },
      planCount
    );
    if (await copyText(prompt)) {
      setCopied(true);
      toast.success("Đã sao chép prompt! Dán vào chatbot, rồi dán câu trả lời vào ô bên dưới.");
      setTimeout(() => setCopied(false), 3000);
    } else {
      toast.error("Không thể sao chép prompt. Hãy cấp quyền clipboard và thử lại.");
    }
  };

  const handleCheck = () => {
    setError(null);
    if (!reply.trim()) {
      setError("Hãy dán câu trả lời của chatbot vào ô bên trên.");
      return;
    }
    setChecking(true);
    try {
      const res = parsePlans(reply, subjectIds);
      if (res.length === 0) {
        setError('Không tìm thấy phương án nào (cần JSON có trường "plans" hoặc "i").');
        return;
      }
      onPlans(res);
      const ok = res.filter((p) => p.payload).length;
      if (ok === 0) toast.warning("Không phương án nào hợp lệ. Xem lý do ở thanh phương án.");
      else toast.success(`${ok}/${res.length} phương án hợp lệ. Chọn phương án ở thanh phía trên thời khóa biểu.`);
      setOpen(false);
    } catch (e) {
      setError("Có lỗi khi kiểm tra: " + (e instanceof Error ? e.message : "không xác định"));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm font-medium hover:opacity-90"
        title="Nhờ chatbot đề xuất nhiều phương án xếp lịch cho các môn đang chọn"
      >
        <Sparkles className="w-4 h-4" />
        Prompt AI
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" /> Xếp lịch bằng AI (nhiều phương án)
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="-mr-2 flex size-11 items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-5">
              {/* Bước 1 */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">
                  1. Chọn ưu tiên và sao chép prompt ({subjectIds.length} môn đang có)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Check_ checked={avoidMondayMorning} onChange={setAvoidMondayMorning} label="Tránh sáng thứ Hai" />
                  <Check_ checked={minimizeDays} onChange={setMinimizeDays} label="Gom ít ngày nhất (nhiều môn/ngày)" />
                  <Check_ checked={avoidWeekend} onChange={setAvoidWeekend} label="Tránh Thứ 7, Chủ nhật" />
                  <Check_
                    checked={avoidMorning}
                    onChange={(v) => {
                      setAvoidMorning(v);
                      if (v) setAvoidAfternoon(false);
                    }}
                    label="Tránh ca sáng (tiết 1-5)"
                  />
                  <Check_
                    checked={avoidAfternoon}
                    onChange={(v) => {
                      setAvoidAfternoon(v);
                      if (v) setAvoidMorning(false);
                    }}
                    label="Tránh ca chiều (tiết 6-10)"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  Ưu tiên cơ sở
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value as Campus | "")}
                    className="flex-1 min-h-11 sm:min-h-0 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base sm:text-sm"
                  >
                    <option value="">Không ưu tiên</option>
                    {CAMPUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Yêu cầu cụ thể, ưu tiên cao nhất (VD: ưu tiên thầy Đạt, môn Giải tích học sáng...)"
                  className="w-full min-h-11 px-3 py-2 text-base sm:text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Thứ tự ưu tiên: ô ghi chú (giảng viên...) được xếp trước, sau đó mới đến các ô tick, cơ sở và gom ít ngày. Nếu mâu thuẫn, chatbot giữ yêu cầu cụ thể và hy sinh các mục sau (ví dụ chấp nhận học thứ 7 để có đúng giảng viên).
                </p>
                <div className="flex items-center gap-3">
                  <label className="text-sm flex items-center gap-2">
                    Số phương án
                    <select
                      value={planCount}
                      onChange={(e) => setPlanCount(Number(e.target.value))}
                      className="min-h-11 sm:min-h-0 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-base sm:text-sm"
                    >
                      {[3, 5, 8, 10].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={subjectIds.length === 0}
                    onClick={handleCopy}
                    className="flex-1 min-h-11 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Đã sao chép" : "Sao chép prompt"}
                  </button>
                </div>
              </section>

              {/* Bước 2 */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">2. Dán câu trả lời của chatbot</h3>
                <textarea
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value);
                    setError(null);
                  }}
                  rows={4}
                  placeholder='{"plans": [{"name": "Phương án 1", "note": "...", "i": ["841476-01", "..."]}]}'
                  className="w-full px-3 py-2 text-base sm:text-xs font-mono rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={checking || !reply.trim()}
                  onClick={handleCheck}
                  className="flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Kiểm tra và xem thử trên thời khóa biểu
                </button>
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300">
                    {error}
                  </div>
                )}
              </section>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
