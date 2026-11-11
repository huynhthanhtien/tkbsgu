"use client";

import React, { useState, useMemo } from "react";
import rawData from "@/public/data.json";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  Search,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  Calendar,
  BookOpen,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Compressor } from "@/utils/compressor";
import { buildAiPrompt, validateAiReply } from "@/lib/aiPrompt";
import type { ScheduleValidationResult } from "@/lib/scheduler";

interface RawSubjectItem {
  ma_mon: string;
  ten_mon: string;
  so_tc: string | number;
  lop: Array<{
    nhom_to: string;
    tkb: Array<{
      thu: string;
      tbd: number;
      tkt: number;
      phong?: string;
      giang_vien?: string;
      thoi_gian?: string;
    }>;
  }>;
}

interface AIScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIScheduleModal({ isOpen, onClose }: AIScheduleModalProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<RawSubjectItem[]>([]);

  // Preferences
  const [avoidMondayMorning, setAvoidMondayMorning] = useState(true);
  const [avoidMorning, setAvoidMorning] = useState(false);
  const [avoidAfternoon, setAvoidAfternoon] = useState(false);
  const [minimizeDays, setMinimizeDays] = useState(true);
  const [avoidWeekend, setAvoidWeekend] = useState(true);
  const [customNote, setCustomNote] = useState("");

  // Prompt / reply state
  const [promptCopied, setPromptCopied] = useState(false);
  const [reply, setReply] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ScheduleValidationResult | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetResult = () => {
    setParseError(null);
    setValidation(null);
    setProblems([]);
    setShareUrl(null);
    setCopied(false);
  };

  // Search filtered subjects
  const searchResults = useMemo(() => {
    const trimmed = searchText.trim().toLowerCase();
    if (trimmed.length < 2) return [];

    const selectedCodes = new Set(selectedSubjects.map((s) => s.ma_mon));
    const all = rawData as unknown as RawSubjectItem[];

    return all
      .filter(
        (item) =>
          !selectedCodes.has(item.ma_mon) &&
          (item.ten_mon.toLowerCase().includes(trimmed) ||
            item.ma_mon.toLowerCase().includes(trimmed))
      )
      .slice(0, 10);
  }, [searchText, selectedSubjects]);

  const handleAddSubject = (subject: RawSubjectItem) => {
    setSelectedSubjects((prev) => [...prev, subject]);
    setSearchText("");
    resetResult();
  };

  const handleRemoveSubject = (maMon: string) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.ma_mon !== maMon));
    resetResult();
  };

  const totalCredits = useMemo(() => {
    return selectedSubjects.reduce(
      (sum, s) => sum + (Number(s.so_tc) || 0),
      0
    );
  }, [selectedSubjects]);

  const preferences = {
    avoidMondayMorning,
    avoidMorning,
    avoidAfternoon,
    minimizeDays,
    avoidWeekend,
    customNote: customNote.trim() || undefined,
  };

  const copyText = async (text: string): Promise<boolean> => {
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
  };

  const handleCopyPrompt = async () => {
    if (selectedSubjects.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 môn học.");
      return;
    }
    const prompt = buildAiPrompt(
      selectedSubjects.map((s) => s.ma_mon),
      preferences,
      window.location.origin
    );
    if (await copyText(prompt)) {
      setPromptCopied(true);
      toast.success("Đã sao chép prompt! Hãy dán vào chatbot (ChatGPT, Claude, Gemini...).");
      setTimeout(() => setPromptCopied(false), 3000);
    } else {
      toast.error("Không thể sao chép tự động. Hãy thử lại hoặc cấp quyền clipboard.");
    }
  };

  const handleCheckReply = () => {
    resetResult();
    if (selectedSubjects.length === 0) {
      setParseError("Hãy chọn môn học ở bước 1 trước.");
      return;
    }
    if (!reply.trim()) {
      setParseError("Hãy dán câu trả lời JSON của chatbot vào ô bên trên.");
      return;
    }
    setIsChecking(true);
    try {
      const codes = selectedSubjects.map((s) => s.ma_mon);
      const res = validateAiReply(reply, codes);
      if (!res.ok) {
        setParseError(res.error);
        return;
      }
      setValidation(res.validation);
      setProblems(res.problems);
      if (!res.payload) {
        toast.warning("Lịch chưa hợp lệ hoặc chưa đủ môn — không tạo link.");
        return;
      }
      const code = Compressor.encode(res.payload);
      setShareUrl(Compressor.buildShareUrl(code));
      toast.success("Lịch hợp lệ! Đã tạo link chia sẻ.");
    } catch (err) {
      console.error(err);
      setParseError(
        "Có lỗi khi kiểm tra: " + (err instanceof Error ? err.message : "không xác định")
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    if (await copyText(shareUrl)) {
      setCopied(true);
      toast.success("Đã sao chép link thời khóa biểu!");
      setTimeout(() => setCopied(false), 3000);
    } else {
      toast.error("Không thể sao chép link.");
    }
  };

  const handleOpenLink = () => {
    if (shareUrl) window.location.href = shareUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-md">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                AI Xếp Thời Khóa Biểu
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Chọn môn & ưu tiên, sao chép prompt dán vào chatbot của bạn, rồi dán kết quả lại để tạo link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Chọn môn học */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                1. Chọn các môn học muốn đăng ký
              </span>
              <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">
                Đã chọn: {selectedSubjects.length} môn ({totalCredits} tín chỉ)
              </span>
            </label>

            {/* Search Input with dropdown */}
            <div className="relative">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Gõ tên môn hoặc mã môn (VD: Đại số, 801022, Triết học...)"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              {/* Dropdown search results */}
              {searchResults.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                  {searchResults.map((item) => (
                    <button
                      key={item.ma_mon}
                      type="button"
                      onClick={() => handleAddSubject(item)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {item.ten_mon}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Mã: <span className="font-mono">{item.ma_mon}</span> • {item.so_tc} tín chỉ • {item.lop.length} nhóm lớp
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 rounded-md font-medium">
                        + Thêm
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Subjects Badges */}
            <div className="mt-3">
              {selectedSubjects.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
                  Chưa chọn môn nào. Hãy tìm kiếm môn học phía trên để thêm vào danh sách.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map((sub) => (
                    <div
                      key={sub.ma_mon}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-indigo-900 dark:text-indigo-200"
                    >
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {sub.ma_mon}
                      </span>
                      <span>{sub.ten_mon}</span>
                      <span className="text-xs text-indigo-500">
                        ({sub.so_tc} TC)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub.ma_mon)}
                        className="p-1 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-md transition text-gray-500 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Tiêu chí & Ưu tiên */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              2. Tiêu chí & Ưu tiên xếp lịch
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidMondayMorning}
                  onChange={(e) => setAvoidMondayMorning(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tránh học sáng thứ Hai (tiết 1-5)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={minimizeDays}
                  onChange={(e) => setMinimizeDays(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Ưu tiên ít ngày học nhất (gom lịch)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidWeekend}
                  onChange={(e) => setAvoidWeekend(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tránh học cuối tuần (Thứ 7 & CN)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidMorning}
                  onChange={(e) => {
                    setAvoidMorning(e.target.checked);
                    if (e.target.checked) setAvoidAfternoon(false);
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tránh học ca sáng (tiết 1-5)</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs sm:text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={avoidAfternoon}
                  onChange={(e) => {
                    setAvoidAfternoon(e.target.checked);
                    if (e.target.checked) setAvoidMorning(false);
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Tránh học ca chiều (tiết 6-10)</span>
              </label>
            </div>

            {/* Custom Notes */}
            <div className="mt-3">
              <input
                type="text"
                placeholder="Ghi chú thêm cho AI (Ví dụ: ưu tiên giảng viên Phạm Sỹ Nam, nghỉ thứ Sáu...)"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Sao chép prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Copy className="w-4 h-4 text-pink-500" />
              3. Sao chép prompt và dán vào chatbot
            </label>
            <button
              type="button"
              disabled={selectedSubjects.length === 0}
              onClick={handleCopyPrompt}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
            >
              {promptCopied ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              {promptCopied ? "Đã sao chép prompt" : "Sao chép prompt"}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Prompt chứa dữ liệu lớp thật từ hệ thống, không cần API key. Chatbot sẽ trả về một link: bấm thẳng vào link đó là nhập được lịch, hoặc dán câu trả lời vào ô bên dưới.
            </p>
          </div>

          {/* Section 4: Dán kết quả */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              4. (Tuỳ chọn) Dán câu trả lời của chatbot
            </label>
            <textarea
              value={reply}
              onChange={(e) => {
                setReply(e.target.value);
                resetResult();
              }}
              rows={4}
              placeholder='Dán link hoặc JSON chatbot trả về (VD: {"s": ["801022"], "i": ["801022-01"]})'
              className="w-full px-3 py-2 text-xs font-mono border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={isChecking || !reply.trim()}
              onClick={handleCheckReply}
              className="mt-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isChecking ? "Đang kiểm tra..." : "Kiểm tra & tạo link"}
            </button>
          </div>

          {parseError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {validation && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-800">
              {shareUrl ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <Check className="w-5 h-5" /> Thời khóa biểu hợp lệ ({validation.scheduledClasses.length} môn, {validation.totalCredits} tín chỉ)
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      className="flex-1 font-mono text-xs px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                    >
                      {copied ? <><Check className="w-4 h-4" /> Đã chép</> : <><Copy className="w-4 h-4" /> Sao chép</>}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenLink}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium"
                      title="Mở link để nhập thời khóa biểu vào danh sách đã lưu"
                    >
                      <ExternalLink className="w-4 h-4" /> Mở ngay
                    </button>
                  </div>
                  <div className="divide-y divide-emerald-200/60 dark:divide-emerald-800/60 text-xs">
                    {validation.scheduledClasses.map((cls) => (
                      <div key={cls.class_id} className="py-2 flex flex-col sm:flex-row justify-between gap-1">
                        <div>
                          <span className="font-semibold">{cls.ten_mon}</span>{" "}
                          <span className="font-mono text-gray-500">({cls.ma_mon})</span>{" "}
                          <span className="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-800 font-mono text-[11px]">Nhóm {cls.nhom_to}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {cls.schedules.map((t, idx) => (
                            <span key={idx} className="bg-white/80 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              {t.thu} (tiết {t.tbd}-{t.tkt})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-3">
                  <h3 className="font-semibold text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Lịch chưa hợp lệ — không tạo link
                  </h3>
                  {problems.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {problems.map((p, idx) => <li key={idx}>{p}</li>)}
                    </ul>
                  )}
                  {validation.unscheduledSubjects.length > 0 && (
                    <div className="space-y-1">
                      <span className="block text-xs font-semibold">Các môn chưa xếp được:</span>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        {validation.unscheduledSubjects.map((sub) => (
                          <li key={sub.ma_mon}><strong>{sub.ten_mon}</strong> ({sub.ma_mon}): {sub.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[11px] italic">Hãy nhờ chatbot xếp lại (hoặc bỏ bớt môn xung đột) rồi dán kết quả mới.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
