import {
  Campus,
  RawClass,
  RawSubject,
  UserPreferences,
  getAllSubjects,
  validateSchedule,
  classesOverlap,
  ScheduleValidationResult,
} from "@/lib/scheduler";

export const CAMPUS_OPTIONS: { value: Campus; label: string }[] = [
  { value: "cs1", label: "Cơ sở 1 (CS1, phòng 1.x)" },
  { value: "cs2", label: "Cơ sở 2 (CS2, phòng 2.x)" },
  { value: "main", label: "Cơ sở chính (phòng C.x)" },
];

const CAMPUS_SHORT: Record<Campus, string> = { cs1: "CS1", cs2: "CS2", main: "CS chính" };

/** Suy cơ sở từ tên phòng: "Ph 1.C202" -> cs1, "Ph 2.B301" -> cs2, "Ph C.A201" -> main. Khác -> undefined. */
export function campusOfRoom(room?: string): Campus | undefined {
  const m = (room ?? "").match(/^\s*Ph\s+([^.\s]+)\./i);
  if (!m) return undefined;
  const k = m[1].toUpperCase();
  return k === "1" ? "cs1" : k === "2" ? "cs2" : k === "C" ? "main" : undefined;
}

/** Mô tả ưu tiên bằng tiếng Việt để đưa vào prompt (đã sắp theo thứ tự quan trọng). */
function describePreferences(p: UserPreferences): string[] {
  const out: string[] = [];
  if (p.avoidMondayMorning) out.push("Tránh học sáng thứ Hai (Thứ 2, tiết 1-5).");
  if (p.avoidMorning) out.push("Tránh học ca sáng (tiết 1-5).");
  if (p.avoidAfternoon) out.push("Tránh học ca chiều (tiết 6-10).");
  if (p.avoidWeekend) out.push("Tránh học cuối tuần (Thứ 7, Chủ nhật).");
  if (p.campus) {
    out.push(
      `Ưu tiên học tại ${CAMPUS_SHORT[p.campus]}: chọn lớp có phòng ở ${CAMPUS_SHORT[p.campus]} càng nhiều càng tốt (cột "CS" trong dữ liệu cho biết cơ sở của từng buổi).`
    );
  }
  if (p.minimizeDays) {
    out.push(
      "Gom lịch vào ÍT NGÀY HỌC NHẤT: dồn càng nhiều môn vào cùng một ngày càng tốt (ví dụ 4 môn học trong 2 ngày tốt hơn 4 môn rải trong 4 ngày). Dùng số ngày học khác nhau làm thước đo."
    );
  }
  return out;
}

/** Gộp các buổi cùng thứ, trả về "Thứ 5: tiết 1,2,3 (CS1)". */
function describeSlots(cls: RawClass): string {
  const byDay = new Map<string, { periods: Set<number>; campuses: Set<string> }>();
  for (const t of cls.tkb) {
    const e = byDay.get(t.thu) ?? { periods: new Set<number>(), campuses: new Set<string>() };
    for (let p = t.tbd; p <= t.tkt; p++) e.periods.add(p);
    const c = campusOfRoom(t.phong);
    e.campuses.add(c ? CAMPUS_SHORT[c] : (t.phong || "?").replace(/^Ph\s+/i, ""));
    byDay.set(t.thu, e);
  }
  return (
    Array.from(byDay.entries())
      .map(
        ([day, e]) =>
          `${day}: tiết ${Array.from(e.periods).sort((x, y) => x - y).join(",")} (${Array.from(e.campuses).join("/")})`
      )
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
  planCount = 5
): string {
  const map = new Map(getAllSubjects().map((s) => [s.ma_mon, s]));
  const subjects = subjectCodes.map((c) => map.get(c)).filter((s): s is RawSubject => !!s);
  const note = preferences.customNote?.trim();
  const generic = describePreferences({ ...preferences, customNote: undefined });
  const exampleIds = JSON.stringify(
    subjects.slice(0, 2).map((x) => `${x.ma_mon}-${x.lop[0]?.nhom_to ?? "01"}`)
  );

  return `Bạn là trợ lý xếp thời khóa biểu đại học. Hãy đề xuất ${planCount} phương án KHÁC NHAU, mỗi phương án chọn đúng MỘT lớp cho MỖI môn trong ${subjects.length} môn dưới đây.

RÀNG BUỘC CỨNG (bắt buộc cho mọi phương án, luôn cao hơn mọi ưu tiên):
1. Chỉ dùng mã môn và ID lớp có trong dữ liệu. Không tự bịa mã.
2. Mỗi môn chọn đúng 1 lớp, tức là đủ ${subjects.length} ID.
3. Hai lớp đã chọn KHÔNG được trùng tiết: cùng thứ và có ít nhất một số tiết chung. Mỗi lớp đã liệt kê sẵn danh sách "TRÙNG VỚI" gồm các lớp của môn khác mà nó xung đột. Nếu lớp A có B trong "TRÙNG VỚI" thì không được chọn cả A và B.
4. Các phương án phải khác nhau (khác ít nhất một lớp), xếp từ tốt nhất đến kém hơn.

THỨ TỰ ƯU TIÊN MỀM (từ quan trọng nhất đến ít quan trọng nhất; khi mâu thuẫn thì mục trên thắng mục dưới):
${note ? `1. YÊU CẦU CỤ THỂ CỦA TÔI (giảng viên, môn, ngày... ): ${note}\n   Đây là ưu tiên cao nhất trong nhóm mềm: hãy thỏa mãn nó trước, kể cả phải hy sinh các mục bên dưới.` : "1. (không có yêu cầu cụ thể về giảng viên/môn)"}
2. Các mong muốn chung, cố gắng đạt được sau khi đã thỏa mục 1:
${generic.length ? generic.map((p) => `   - ${p}`).join("\n") : "   - (không có)"}
Ví dụ: nếu tôi ưu tiên một giảng viên mà lớp của giảng viên đó buộc phải học thứ 7, hãy chọn lớp đó và chấp nhận học thứ 7, không bỏ giảng viên chỉ để tránh thứ 7. Trường "note" của mỗi phương án phải nói ngắn gọn ưu tiên nào đã đạt, ưu tiên nào phải hy sinh.

CÁCH LÀM:
- Chọn lớp lần lượt, bắt đầu từ môn có ít lớp nhất. Sau mỗi lần chọn, loại các lớp nằm trong "TRÙNG VỚI" của lớp vừa chọn. Nếu một môn không còn lớp nào thì quay lui.
- Với mỗi phương án, kiểm tra lại từng cặp lớp đã chọn: không có lớp nào xuất hiện trong "TRÙNG VỚI" của lớp khác.

DỮ LIỆU (định dạng: ID | thứ: các tiết (cơ sở CS) | giảng viên | TRÙNG VỚI):
${subjects.map((s) => describeSubject(s, subjects)).join("\n")}

ĐỊNH DẠNG TRẢ LỜI:
Bạn có thể tính toán ngắn gọn, nhưng KẾT THÚC bằng đúng một khối JSON ở cuối câu trả lời, không viết gì sau nó:
{"plans": [{"name": "Phương án 1", "note": "<ưu tiên đạt/hy sinh>", "i": ${exampleIds}}, ...]}
"i" là danh sách ID lớp đã chọn (mỗi môn đúng một ID). Cần đủ ${planCount} phương án nếu có thể; nếu không đủ phương án hợp lệ thì trả ít hơn và nói rõ lý do.`;
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

/** Tìm link trong văn bản: dạng nhiều phương án ?s=..&p=..&p=.. hoặc dạng một phương án ?s=..&i=..; trả null nếu không có. */
function extractPlainLink(text: string): { s: string[]; plans: string[][] } | null {
  const m = text.match(/https?:\/\/[^\s)>\]"']+/g) ?? [];
  for (const raw of m.reverse()) {
    try {
      const u = new URL(raw);
      const ps = u.searchParams.getAll("p");
      if (ps.length > 0) {
        return { s: splitList(u.searchParams.get("s")), plans: ps.map(splitList) };
      }
      if (u.searchParams.has("i")) {
        return { s: splitList(u.searchParams.get("s")), plans: [splitList(u.searchParams.get("i"))] };
      }
    } catch {
      /* bỏ qua */
    }
  }
  return null;
}

/** Lấy mọi object JSON cấp cao nhất trong văn bản (chịu được ```json fences, lời giải thích, dấu {} thừa). */
function extractJsonObjects(text: string): unknown[] {
  const t = text.trim();
  const out: unknown[] = [];
  let start = t.indexOf("{");
  while (start !== -1) {
    let depth = 0;
    let inStr = false;
    let end = -1;
    for (let k = start; k < t.length; k++) {
      const ch = t[k];
      if (inStr) {
        if (ch === "\\") k++;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}" && --depth === 0) {
        end = k;
        break;
      }
    }
    if (end === -1) break;
    try {
      out.push(JSON.parse(t.slice(start, end + 1)));
      start = t.indexOf("{", end + 1);
    } catch {
      start = t.indexOf("{", start + 1); // khối không phải JSON: thử từ dấu { tiếp theo
    }
  }
  return out;
}

export interface PlanResult {
  name: string;
  note?: string;
  validation: ScheduleValidationResult;
  problems: string[];
  /** Chỉ có khi lịch hợp lệ và đủ môn. */
  payload?: { s: string[]; i: string[] };
}

const isStrArr = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");

/** Đọc câu trả lời của chatbot thành danh sách phương án đã được kiểm tra bằng dữ liệu thật. */
export function parsePlans(reply: string, requestedCodes: string[]): PlanResult[] {
  const raw: { name?: string; note?: string; i: string[] }[] = [];
  const pushPlan = (o: unknown, fallbackName: string) => {
    const p = o as { name?: unknown; note?: unknown; i?: unknown };
    if (p && typeof p === "object" && isStrArr(p.i)) {
      raw.push({
        name: typeof p.name === "string" && p.name.trim() ? p.name.trim() : fallbackName,
        note: typeof p.note === "string" ? p.note : undefined,
        i: p.i.map((x) => x.trim()),
      });
    }
  };

  for (const obj of extractJsonObjects(reply)) {
    const o = obj as { plans?: unknown };
    if (o && Array.isArray(o.plans)) {
      o.plans.forEach((p) => pushPlan(p, `Phương án ${raw.length + 1}`));
    } else {
      pushPlan(obj, `Phương án ${raw.length + 1}`);
    }
  }
  if (raw.length === 0) {
    const link = extractPlainLink(reply);
    if (link) link.plans.forEach((i, k) => raw.push({ name: `Phương án ${k + 1}`, i }));
  }

  return raw.map((p) => ({ name: p.name!, note: p.note, ...validateSelection(requestedCodes, p.i) }));
}

export type ParseReplyResult =
  | { ok: false; error: string }
  | {
      ok: true;
      validation: ScheduleValidationResult;
      payload?: { s: string[]; i: string[] };
      problems: string[];
    };

/** Kiểm tra câu trả lời: lấy phương án hợp lệ đầu tiên (hoặc phương án đầu tiên nếu không có cái nào hợp lệ). */
export function validateAiReply(reply: string, requestedCodes: string[]): ParseReplyResult {
  const plans = parsePlans(reply, requestedCodes);
  if (plans.length === 0) {
    return { ok: false, error: 'Không tìm thấy JSON có trường "i" (hoặc link ?s=...&p=...) trong câu trả lời.' };
  }
  const best = plans.find((p) => p.payload) ?? plans[0];
  return { ok: true, validation: best.validation, problems: best.problems, payload: best.payload };
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
