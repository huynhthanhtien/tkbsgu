import {
  RawSubject,
  UserPreferences,
  getAllSubjects,
  RawClass,
  validateSchedule,
  classesOverlap,
  ScheduleValidationResult,
} from "@/lib/scheduler";

/** Mô tả ưu tiên bằng tiếng Việt để đưa vào prompt. */
function describePreferences(p: UserPreferences): string[] {
  const out: string[] = [];
  if (p.avoidMondayMorning) out.push("Tránh học sáng thứ Hai (Thứ 2, tiết 1-5).");
  if (p.avoidMorning) out.push("Tránh học ca sáng (tiết 1-5).");
  if (p.avoidAfternoon) out.push("Tránh học ca chiều (tiết 6-10).");
  if (p.avoidWeekend) out.push("Tránh học cuối tuần (Thứ 7, Chủ nhật).");
  if (p.minimizeDays) out.push("Ưu tiên ít ngày/buổi học nhất (gom lịch).");
  if (p.customNote?.trim()) out.push(`Ghi chú thêm: ${p.customNote.trim()}`);
  return out;
}

/** Gộp các buổi liền nhau/trùng nhau cùng thứ, trả về "Thứ 5: tiết 1,2,3,4,5". */
function describeSlots(cls: RawClass): string {
  const byDay = new Map<string, Set<number>>();
  for (const t of cls.tkb) {
    const set = byDay.get(t.thu) ?? new Set<number>();
    for (let p = t.tbd; p <= t.tkt; p++) set.add(p);
    byDay.set(t.thu, set);
  }
  return (
    Array.from(byDay.entries())
      .map(([day, set]) => `${day}: tiết ${Array.from(set).sort((x, y) => x - y).join(",")}`)
      .join(" | ") || "(chưa có lịch)"
  );
}

/** Mô tả từng môn; mỗi lớp kèm danh sách lớp (của môn khác) bị trùng tiết. */
function describeSubject(s: RawSubject, all: RawSubject[]): string {
  const lines = s.lop.map((l) => {
    const teachers = Array.from(new Set(l.tkb.map((t) => t.giang_vien).filter(Boolean)));
    const clashes: string[] = [];
    for (const o of all) {
      if (o.ma_mon === s.ma_mon) continue;
      for (const ol of o.lop) {
        if (classesOverlap(l, ol).overlap) clashes.push(`${o.ma_mon}-${ol.nhom_to}`);
      }
    }
    return `  - ${s.ma_mon}-${l.nhom_to} | ${describeSlots(l)}${
      teachers.length ? ` | ${teachers.join(", ")}` : ""
    } | TRÙNG VỚI: ${clashes.length ? clashes.join(", ") : "(không)"}`;
  });
  return `* Môn ${s.ma_mon} - ${s.ten_mon} (${s.so_tc} tín chỉ)\n${lines.join("\n")}`;
}

/** Tạo prompt để người dùng dán vào chatbot bất kỳ. Dữ liệu lấy từ data.json thật. */
export function buildAiPrompt(
  subjectCodes: string[],
  preferences: UserPreferences,
  origin = "http://localhost:3000"
): string {
  const map = new Map(getAllSubjects().map((s) => [s.ma_mon, s]));
  const subjects = subjectCodes.map((c) => map.get(c)).filter((s): s is RawSubject => !!s);
  const prefs = describePreferences(preferences);
  const first = subjects[0];
  const example = first
    ? `{"s": ["${first.ma_mon}"], "i": ["${first.ma_mon}-${first.lop[0]?.nhom_to ?? "01"}"]}`
    : '{"s": ["801022"], "i": ["801022-01"]}';

  return `Bạn là trợ lý xếp thời khóa biểu đại học. Chọn đúng MỘT lớp cho MỖI môn trong ${subjects.length} môn dưới đây.

RÀNG BUỘC CỨNG (bắt buộc, ưu tiên cao hơn mọi ưu tiên khác):
1. Chỉ dùng mã môn và ID lớp có trong dữ liệu. Không tự bịa mã.
2. Mỗi môn chọn đúng 1 lớp, tức là đủ ${subjects.length} ID.
3. Hai lớp đã chọn KHÔNG được trùng tiết: cùng thứ và có ít nhất một số tiết chung. Mỗi lớp đã liệt kê sẵn danh sách "TRÙNG VỚI" gồm các lớp của môn khác mà nó xung đột. Nếu lớp A có B trong "TRÙNG VỚI" thì không được chọn cả A và B.

ƯU TIÊN MỀM (cố gắng đạt được, nhưng không được vi phạm ràng buộc cứng):
${prefs.length ? prefs.map((p) => `- ${p}`).join("\n") : "- (không có)"}

CÁCH LÀM:
- Bước 1: chọn lớp lần lượt, bắt đầu từ môn có ít lớp nhất. Sau mỗi lần chọn, loại các lớp nằm trong "TRÙNG VỚI" của lớp vừa chọn.
- Bước 2: nếu một môn không còn lớp nào, quay lui và đổi lớp đã chọn trước đó.
- Bước 3: trong các phương án hợp lệ, chọn phương án thỏa nhiều ưu tiên mềm nhất.
- Bước 4: kiểm tra lại từng cặp lớp đã chọn: không có lớp nào xuất hiện trong "TRÙNG VỚI" của lớp khác.

DỮ LIỆU (định dạng: ID | thứ: các tiết | giảng viên | TRÙNG VỚI):
${subjects.map((s) => describeSubject(s, subjects)).join("\n")}

ĐỊNH DẠNG TRẢ LỜI:
Bạn có thể tính toán ngắn gọn, nhưng KẾT THÚC bằng đúng hai dòng, không viết gì sau chúng:
1. Một link theo mẫu, thay phần danh sách bằng kết quả của bạn (dấu phẩy, không có khoảng trắng, không mã hóa gì thêm):
${buildPlainLink(origin, subjects.map((x) => x.ma_mon), subjects.map((x) => `${x.ma_mon}-${x.lop[0]?.nhom_to ?? "01"}`))}
   Tham số "s" là danh sách mã môn, "i" là danh sách ID lớp đã chọn (mỗi môn một ID). Giữ nguyên phần địa chỉ ${origin}/?.
2. Cùng nội dung ở dạng JSON: ${example}
Nếu thật sự không thể xếp đủ các môn mà không trùng tiết, chỉ đưa các môn xếp được và nói rõ môn nào bị bỏ.`;
}

/** Tách danh sách phân cách bằng dấu phẩy: "a,b, c" -> ["a","b","c"]. */
export function splitList(v: string | null): string[] {
  return (v ?? "").split(",").map((x) => x.trim()).filter(Boolean);
}

/** Dựng link không nén (chatbot tự viết được): /?s=a,b&i=a-01,b-02 */
export function buildPlainLink(origin: string, s: string[], i: string[]): string {
  const url = new URL("/", origin);
  url.searchParams.set("s", s.join(","));
  url.searchParams.set("i", i.join(","));
  return url.toString();
}

/** Tìm link dạng ?s=...&i=... trong văn bản; trả null nếu không có. */
function extractPlainLink(text: string): { s: string[]; i: string[] } | null {
  const m = text.match(/https?:\/\/[^\s)>\]"']+/g) ?? [];
  for (const raw of m.reverse()) {
    try {
      const u = new URL(raw);
      if (u.searchParams.has("i")) {
        return { s: splitList(u.searchParams.get("s")), i: splitList(u.searchParams.get("i")) };
      }
    } catch {
      /* bỏ qua */
    }
  }
  return null;
}

export type ParseReplyResult =
  | { ok: false; error: string }
  | {
      ok: true;
      validation: ScheduleValidationResult;
      /** Dữ liệu {s, i} chỉ có giá trị khi lịch hợp lệ và đủ môn. */
      payload?: { s: string[]; i: string[] };
      problems: string[];
    };

/** Lấy object JSON có trường "i" cuối cùng trong câu trả lời (chấp nhận ```json fences / chữ thừa / lời giải thích có dấu {}). */
function extractJson(text: string): unknown {
  const t = text.trim();
  try {
    return JSON.parse(t);
  } catch {
    /* thử tách khối */
  }
  const found: unknown[] = [];
  for (let start = t.indexOf("{"); start !== -1; start = t.indexOf("{", start + 1)) {
    let depth = 0;
    let inStr = false;
    for (let k = start; k < t.length; k++) {
      const ch = t[k];
      if (inStr) {
        if (ch === "\\") k++;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        try {
          const o = JSON.parse(t.slice(start, k + 1));
          if (o && typeof o === "object" && "i" in o) found.push(o);
        } catch {
          /* bỏ qua khối không phải JSON */
        }
        break;
      }
    }
  }
  if (found.length === 0) throw new Error("Không tìm thấy JSON có trường \"i\" trong câu trả lời.");
  return found[found.length - 1];
}

/** Kiểm tra câu trả lời của chatbot dựa trên dữ liệu thật và các môn đã yêu cầu. */
export function validateAiReply(
  reply: string,
  requestedCodes: string[]
): ParseReplyResult {
  let raw: unknown;
  try {
    raw = extractJson(reply);
  } catch (e) {
    raw = extractPlainLink(reply);
    if (!raw) {
      return { ok: false, error: e instanceof Error ? e.message : "JSON không hợp lệ." };
    }
  }
  const obj = raw as { s?: unknown; i?: unknown };
  const isStrArr = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");
  if (!isStrArr(obj?.i)) {
    return { ok: false, error: 'JSON phải có trường "i" là mảng ID lớp (chuỗi).' };
  }
  const ids = obj.i.map((x) => x.trim());
  const extra: string[] = [];
  if (isStrArr(obj.s)) {
    const requested = new Set(requestedCodes);
    for (const c of obj.s) {
      if (!requested.has(c.trim())) extra.push(`Mã môn '${c}' không nằm trong danh sách đã chọn.`);
    }
  }
  const res = validateSelection(requestedCodes, ids);
  res.problems.unshift(...extra);
  if (extra.length) res.payload = undefined;
  return { ok: true, ...res };
}

/** Kiểm tra danh sách ID lớp so với các môn yêu cầu; chỉ có payload khi lịch hợp lệ và đủ môn. */
export function validateSelection(
  requestedCodes: string[],
  ids: string[]
): {
  validation: ScheduleValidationResult;
  payload?: { s: string[]; i: string[] };
  problems: string[];
} {
  const problems: string[] = [];
  const requested = new Set(requestedCodes);
  for (const id of ids) {
    const code = id.split("-")[0];
    if (!requested.has(code)) {
      problems.push(`ID '${id}' thuộc môn không nằm trong danh sách đã chọn.`);
    }
  }
  const validation = validateSchedule(ids, requestedCodes);
  problems.push(...validation.conflicts);
  const valid = validation.valid && problems.length === 0;
  return {
    validation,
    problems,
    payload: valid
      ? { s: [...requestedCodes], i: validation.scheduledClasses.map((c) => c.class_id) }
      : undefined,
  };
}
